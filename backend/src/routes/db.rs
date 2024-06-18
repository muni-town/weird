use std::{fmt::Display, str::FromStr};

use gdata::{IrohGStore, Key, Value};
use iroh::{
    base::node_addr::AddrInfoOptions,
    client::docs::ShareMode,
    docs::{Author, Capability, CapabilityKind},
};

use crate::utils::Yaml;

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/db/export", get(db_export))
        .route("/db/import", post(db_import))
        .route("/db/raw/export", get(db_raw_export))
        .route("/db/raw/import", post(db_raw_import))
}

#[derive(Serialize, Deserialize)]
struct ImportExportFormat {}

pub async fn db_export(state: State<AppState>) -> AppResult<Json<HashMap<String, String>>> {
    let doc = state.node.docs().open(state.ns).await?.unwrap();
    let mut map = HashMap::default();
    let mut stream = doc.get_many(Query::all()).await?;
    while let Some(result) = stream.next().await {
        let entry = result?;
        map.insert(
            String::from_utf8_lossy(entry.key()).into_owned(),
            String::from_utf8_lossy(&entry.content_bytes(&doc).await?).into_owned(),
        );
    }
    Ok(Json(map))
}

pub async fn db_import() -> AppResult<()> {
    Ok(())
}

/// String-based serialize/deserialize wrapper.
#[derive(Debug, Clone)]
pub struct StringSerde<T>(pub T);
impl<T: std::fmt::Display> serde::Serialize for StringSerde<T> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&format!("{}", self.0))
    }
}
impl<'de, E: Display, T: FromStr<Err = E>> serde::Deserialize<'de> for StringSerde<T> {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::de::Error;
        let s = String::deserialize(deserializer)?;
        Ok(Self(
            s.parse().map_err(|e| D::Error::custom(format!("{e}")))?,
        ))
    }
}

#[derive(Debug, Clone)]
pub struct SerdeCapability(pub Capability);
impl serde::Serialize for SerdeCapability {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match &self.0 {
            Capability::Write(ns_secret) => serializer.serialize_newtype_variant(
                "Capability",
                0,
                "Write",
                &StringSerde(ns_secret),
            ),
            Capability::Read(ns_id) => {
                serializer.serialize_newtype_variant("Capability", 0, "Read", &StringSerde(ns_id))
            }
        }
    }
}
impl<'de> serde::Deserialize<'de> for SerdeCapability {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        deserializer.deserialize_enum("Capability", &["Write", "Read"], CapabilityVisitor)
    }
}
struct CapabilityVisitor;
impl<'de> serde::de::Visitor<'de> for CapabilityVisitor {
    type Value = SerdeCapability;
    fn expecting(&self, formatter: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(formatter, "read or write capability")
    }

    fn visit_enum<A>(self, access: A) -> Result<Self::Value, A::Error>
    where
        A: serde::de::EnumAccess<'de>,
    {
        use serde::de::{Error, VariantAccess};
        let (variant_name, variant) = access.variant::<String>()?;
        let variant_data = variant.newtype_variant::<String>()?;
        match variant_name.as_str() {
            "Write" => Ok(SerdeCapability(Capability::Write(
                variant_data
                    .parse()
                    .map_err(|e| A::Error::custom(format!("{e}")))?,
            ))),
            "Read" => Ok(SerdeCapability(Capability::Read(
                variant_data
                    .parse()
                    .map_err(|e| A::Error::custom(format!("{e}")))?,
            ))),
            _ => Err(A::Error::custom(
                "Unrecognized enum variant, expected \"Write\" or \"Read\"",
            )),
        }
    }
}

/// This is a raw key-value export of the database graph.
///
/// This stands in contrast to the [`ImportExportFormat`] which is meant to be a more stable
/// representation of the profile data that we store, that can be used to help facilitate migrations
/// and backups.
///
/// This format is meant more for debugging.
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct RawImportExportFormat {
    pub authors: Vec<StringSerde<Author>>,
    pub namespaces: Vec<RawImportExportNamespace>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RawImportExportNamespace {
    pub capability: SerdeCapability,
    pub records: Vec<RawImportExportRecord>,
}
impl RawImportExportNamespace {
    pub fn new(capability: Capability) -> Self {
        Self {
            capability: SerdeCapability(capability),
            records: Default::default(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RawImportExportRecord {
    key: Key,
    value: Value,
    author: StringSerde<AuthorId>,
}

pub async fn db_raw_import(
    state: State<AppState>,
    data: Yaml<RawImportExportFormat>,
) -> AppResult<()> {
    // Drop all documents
    let mut docs = state.node.docs().list().await?;
    while let Some(doc) = docs.next().await {
        let (ns, _cap) = doc?;
        state.node.docs().drop_doc(ns).await?;
    }
    // Clear the graph's doc cache as all the handles will be invalidated.
    state.graph.docs.clear();

    // Import authors
    for author in data.0.authors {
        state.node.authors().import(author.0).await?;
    }

    // Import namespaces
    for namespace in data.0.namespaces {
        let doc = state
            .node
            .docs()
            .import_namespace(namespace.capability.0)
            .await?;
        for record in namespace.records {
            doc.set_bytes(
                record.author.0,
                IrohGStore::key_to_bytes(&record.key).to_vec(),
                IrohGStore::value_to_bytes(&record.value).to_vec(),
            )
            .await?;
        }
    }

    Ok(())
}
pub async fn db_raw_export(state: State<AppState>) -> AppResult<Yaml<RawImportExportFormat>> {
    let mut export = RawImportExportFormat::default();

    let mut authors = state.node.authors().list().await?;
    while let Some(author) = authors.next().await {
        let id = author?;
        tracing::info!("Loading author {id}");
        let author = state
            .node
            .authors()
            .export(id)
            .await?
            .ok_or_else(|| anyhow::format_err!("Author not found"))?;
        export.authors.push(StringSerde(author));
    }

    let mut docs = state.node.docs().list().await?;
    while let Some(doc) = docs.next().await {
        let (ns, capability_kind) = doc?;
        let doc = state.node.docs().open(ns).await?.unwrap();
        let capability = doc
            .share(
                match capability_kind {
                    CapabilityKind::Write => ShareMode::Write,
                    CapabilityKind::Read => ShareMode::Read,
                },
                AddrInfoOptions::Id,
            )
            .await?
            .capability;
        let mut namespace = RawImportExportNamespace::new(capability);

        let mut stream = doc.get_many(Query::all()).await?;
        while let Some(result) = stream.next().await {
            let entry = result?;
            let key = IrohGStore::key_from_bytes(entry.key())?;
            let value = IrohGStore::value_from_bytes(&entry.content_bytes(&doc).await?)?;
            namespace.records.push(RawImportExportRecord {
                key,
                value,
                author: StringSerde(entry.author()),
            });
        }

        export.namespaces.push(namespace);
    }

    Ok(Yaml(export))
}
