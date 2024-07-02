use std::str::FromStr;

use crate::profile::{Profile, Username, PROFILES_KEY, USERNAMES_KEY, USER_IDS_KEY};
use crate::{Weird, INSTANCE_DATA_KEY};
use futures::StreamExt;
use gdata::{GStoreBackend, IrohGStore};
use gdata::{Key, Value};
use iroh::base::node_addr::AddrInfoOptions;
use iroh::client::docs::ShareMode;
use iroh::docs::store::Query;
use iroh::docs::AuthorId;
use iroh::docs::Capability;
use iroh::docs::{Author, CapabilityKind};
use serde::{Deserialize, Serialize};

impl<S> Weird<S> {
    /// Export database to the semi-stable [`ImportExportFormat`].
    pub async fn export_db(&self) -> anyhow::Result<ImportExportFormat> {
        let instance_author_id = self.node.authors().default().await?;
        let mut export = ImportExportFormat::new(
            self.node
                .authors()
                .export(instance_author_id)
                .await?
                .expect("Has default author"),
        );

        let mut stream = self.node.authors().list().await?;
        while let Some(result) = stream.next().await {
            let author_id = result?;
            let author = self.node.authors().export(author_id).await?;
            if let Some(author) = author {
                export.authors.push(StringSerde(author));
            }
        }

        let user_ids = self
            .graph
            .get_or_init_map((self.ns, &*USER_IDS_KEY))
            .await?;
        let mut stream = user_ids.list_items().await?;
        while let Some(result) = stream.next().await {
            let value = result?;
            let user_id = value.link.key.last().unwrap().clone();
            let author_id_bytes: [u8; 32] = value.as_bytes()?[..].try_into()?;
            let author_id = AuthorId::from(author_id_bytes);
            export.user_ids.insert(user_id, StringSerde(author_id));
        }

        let usernames = self
            .graph
            .get_or_init_map((self.ns, &*USERNAMES_KEY))
            .await?;
        let mut stream = usernames.list_items().await?;
        while let Some(result) = stream.next().await {
            let value = result?;
            let username = value.link.key.last().unwrap().as_str()?;
            let username = Username::from_str(username)?;

            let author_id_bytes: [u8; 32] = value.as_bytes()?[..].try_into()?;
            let author_id = AuthorId::from(author_id_bytes);

            export.usernames.insert(username, StringSerde(author_id));
        }

        let profiles = self
            .graph
            .get_or_init_map((self.ns, &*PROFILES_KEY))
            .await?;
        let mut stream = profiles.list_items().await?;
        while let Some(profile) = stream.next().await {
            let value = profile?;
            let profile = Profile::from_value(&value).await?;
            let author_id_bytes: [u8; 32] = value
                .link
                .key
                .clone()
                .last()
                .unwrap()
                .as_bytes()?
                .try_into()?;
            export
                .profiles
                .insert(StringSerde(AuthorId::from(author_id_bytes)), profile);
        }

        Ok(export)
    }

    /// Import database from the semi-stable [`ImportExportFormat`].
    pub async fn import_db(&self, import: ImportExportFormat) -> anyhow::Result<()> {
        if import.version != IMPORT_EXPORT_FORMAT_VERSION {
            anyhow::bail!(
                "Unsupported import/export format version {}, expected {}",
                import.version,
                IMPORT_EXPORT_FORMAT_VERSION
            );
        }

        // Clear instance data
        {
            let instance_data = self
                .graph
                .get_or_init_map((self.ns, &*INSTANCE_DATA_KEY))
                .await?;
            instance_data.del_all_keys().await?;
        }

        let user_ids = self
            .graph
            .get_or_init_map((self.ns, &*USER_IDS_KEY))
            .await?;
        let usernames = self
            .graph
            .get_or_init_map((self.ns, &*USERNAMES_KEY))
            .await?;

        for author in import.authors {
            self.node.authors().import(author.0).await?;
        }

        for (user_id, author_id) in import.user_ids {
            user_ids
                .set_key(user_id, &author_id.0.as_bytes()[..])
                .await?;
        }
        for (username, author_id) in import.usernames {
            usernames
                .set_key(username.to_string(), &author_id.0.as_bytes()[..])
                .await?;
        }
        for (author_id, profile) in import.profiles {
            self.set_profile(author_id.0, profile).await?;
        }

        Ok(())
    }

    /// Export database to the unstable [`RawImportExportFormat`].
    pub async fn export_db_raw(&self) -> anyhow::Result<RawImportExportFormat> {
        let mut export = RawImportExportFormat::default();

        let mut authors = self.node.authors().list().await?;
        while let Some(author) = authors.next().await {
            let id = author?;
            tracing::info!("Loading author {id}");
            let author = self
                .node
                .authors()
                .export(id)
                .await?
                .ok_or_else(|| anyhow::format_err!("Author not found"))?;
            export.authors.push(StringSerde(author));
        }

        let mut docs = self.node.docs().list().await?;
        while let Some(doc) = docs.next().await {
            let (ns, capability_kind) = doc?;
            let doc = self.node.docs().open(ns).await?.unwrap();
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

        Ok(export)
    }

    /// Import database from the unstable [`RawImportExportFormat`].
    pub async fn import_db_raw(&self, data: RawImportExportFormat) -> anyhow::Result<()> {
        // Drop all documents
        let mut docs = self.node.docs().list().await?;
        while let Some(doc) = docs.next().await {
            let (ns, _cap) = doc?;
            self.node.docs().drop_doc(ns).await?;
        }
        // Clear the graph's doc cache as all the handles will be invalidated.
        self.graph.docs.clear();

        // Import authors
        for author in data.authors {
            self.node.authors().import(author.0).await?;
        }

        // Import namespaces
        for namespace in data.namespaces {
            let doc = self
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
}

pub use self::format::*;
mod format {
    use std::collections::HashMap;

    use gdata::KeySegment;

    use crate::profile::Username;

    use super::*;

    pub static IMPORT_EXPORT_FORMAT_VERSION: u32 = 1;

    #[derive(Serialize, Deserialize)]
    pub struct ImportExportFormat {
        pub version: u32,
        pub instance_author: StringSerde<Author>,
        pub authors: Vec<StringSerde<Author>>,
        pub profiles: HashMap<StringSerde<AuthorId>, Profile>,
        pub user_ids: HashMap<KeySegment, StringSerde<AuthorId>>,
        pub usernames: HashMap<Username, StringSerde<AuthorId>>,
    }
    impl ImportExportFormat {
        pub fn new(instance_author: Author) -> Self {
            Self {
                version: IMPORT_EXPORT_FORMAT_VERSION,
                instance_author: StringSerde(instance_author),
                authors: Default::default(),
                profiles: Default::default(),
                user_ids: Default::default(),
                usernames: Default::default(),
            }
        }
    }

    #[derive(Serialize, Deserialize)]
    pub struct ProfileWrapper {
        pub author: StringSerde<Author>,
        pub user_id: String,
        pub username: String,
        pub info: Profile,
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
        pub key: Key,
        pub value: Value,
        pub author: StringSerde<AuthorId>,
    }
}

pub use self::ser_de::*;
mod ser_de {
    use std::{fmt::Display, str::FromStr};

    use serde::Serializer;

    use super::*;

    /// String-based serialize/deserialize wrapper.
    #[derive(Debug, Clone, Hash, PartialEq, Eq)]
    pub struct StringSerde<T>(pub T);
    impl<T> From<T> for StringSerde<T> {
        fn from(value: T) -> Self {
            Self(value)
        }
    }
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

    /// Base32 serialize/deserialize wrapper.
    #[derive(Debug, Clone, Hash, PartialEq, Eq)]
    pub struct Base32Serde<T>(pub T);
    impl<T: AsRef<[u8]>> serde::Serialize for Base32Serde<T> {
        fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
        where
            S: Serializer,
        {
            serializer.serialize_str(&iroh::base::base32::fmt(self.0.as_ref()))
        }
    }
    impl<'de, T: for<'a> From<&'a [u8]>> serde::Deserialize<'de> for Base32Serde<T> {
        fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
        where
            D: serde::Deserializer<'de>,
        {
            use serde::de::Error;
            let s = String::deserialize(deserializer)?;
            Ok(Self(T::from(
                &iroh::base::base32::parse_vec(&s).map_err(|e| D::Error::custom(format!("{e}")))?,
            )))
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
                Capability::Read(ns_id) => serializer.serialize_newtype_variant(
                    "Capability",
                    0,
                    "Read",
                    &StringSerde(ns_id),
                ),
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
}
