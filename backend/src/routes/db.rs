use gdata::{IrohGStore, Key, Value};
use iroh::docs::NamespaceId;

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
    let doc = state.node.docs.open(state.ns).await?.unwrap();
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

/// String-based serialize/deserialize wrapper for [`NamespaceId`].
#[derive(Debug, Clone)]
pub struct SerdeNamespace(pub NamespaceId);
impl serde::Serialize for SerdeNamespace {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&format!("{}", self.0))
    }
}
impl<'de> serde::Deserialize<'de> for SerdeNamespace {
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

/// String-based serialize/deserialize wrapper for [`AuthorId`].
#[derive(Debug, Clone)]
pub struct SerdeAuthor(pub AuthorId);
impl serde::Serialize for SerdeAuthor {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&format!("{}", self.0))
    }
}
impl<'de> serde::Deserialize<'de> for SerdeAuthor {
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

/// This is a raw key-value export of the database graph.
///
/// This stands in contrast to the [`ImportExportFormat`] which is meant to be a more stable
/// representation of the profile data that we store, that can be used to help facilitate migrations
/// and backups.
///
/// This format is meant more for debugging.
#[derive(Serialize, Deserialize, Debug, Default)]
pub struct RawImportExportFormat {
    pub namespaces: Vec<(SerdeNamespace, RawImportExportNamespace)>,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct RawImportExportNamespace {
    pub records: Vec<(Key, Value, SerdeAuthor)>,
}

pub async fn db_raw_import() -> AppResult<()> {
    Ok(())
}
pub async fn db_raw_export(state: State<AppState>) -> AppResult<Yaml<RawImportExportFormat>> {
    let mut export = RawImportExportFormat::default();

    let mut docs = state.node.docs.list().await?;
    while let Some(doc) = docs.next().await {
        let (ns, _) = doc?;
        let mut records = Vec::new();
        let doc = state.node.docs.open(ns).await?.unwrap();
        let mut stream = doc.get_many(Query::all()).await?;
        while let Some(result) = stream.next().await {
            let entry = result?;
            let key = IrohGStore::key_from_bytes(entry.key())?;
            let value = IrohGStore::value_from_bytes(&entry.content_bytes(&doc).await?)?;
            records.push((key, value, SerdeAuthor(entry.author())));
        }

        export
            .namespaces
            .push((SerdeNamespace(ns), RawImportExportNamespace { records }));
    }

    Ok(Yaml(export))
}
