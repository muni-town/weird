use std::{
    io::{Cursor, Read, Write},
    sync::Arc,
};

use borsh::{BorshDeserialize, BorshSerialize};
use futures::TryStreamExt;
use iroh::{
    base::node_addr::AddrInfoOptions,
    docs::{store::Query, Author, AuthorId, Capability, NamespaceSecret},
};
use once_cell::sync::Lazy;

use crate::{
    store::LeafStore,
    types::{EntityPath, NamespaceSecretKey, PathSegment, SubspaceId},
    Digest, ExactLink,
};

pub type LeafIroh = crate::Leaf<LeafIrohStore>;

pub const LEAF_GC_PREFIX_STR: &str = "_leaf_gc_";
pub static LEAF_GC_PREFIX: Lazy<PathSegment> =
    Lazy::new(|| PathSegment::String(LEAF_GC_PREFIX_STR.into()));

#[derive(borsh::BorshSerialize, borsh::BorshDeserialize)]
pub struct LeafGcPathPrefix {
    pub leaf_gc_prefix_str: String,
    pub subspace: [u8; 32],
    pub entity_path: Vec<PathSegment>,
    pub entity_snapshot_id: Digest,
}

impl LeafGcPathPrefix {
    pub fn new(link: &ExactLink, entity_snapshot_id: Digest) -> Self {
        LeafGcPathPrefix {
            leaf_gc_prefix_str: LEAF_GC_PREFIX_STR.into(),
            subspace: link.subspace,
            entity_path: link.path.0.clone(),
            entity_snapshot_id,
        }
    }
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.serialize(&mut buf).unwrap();
        buf
    }
}

#[derive(borsh::BorshSerialize, borsh::BorshDeserialize)]
pub struct LeafGcPath {
    pub prefix: LeafGcPathPrefix,
    pub entity_snapshot_id_plus_blob_hash: Digest,
}

impl std::fmt::Debug for LeafGcPath {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "LeafGCPath(")?;
        f.debug_list()
            .entry(&self.prefix.leaf_gc_prefix_str)
            .entry(&iroh::base::base32::fmt(self.prefix.subspace))
            .entries(&self.prefix.entity_path)
            .entry(&self.prefix.entity_snapshot_id)
            .entry(&self.entity_snapshot_id_plus_blob_hash)
            .finish()?;
        write!(f, ")")
    }
}

impl LeafGcPath {
    pub fn new(link: &ExactLink, entity_snapshot_id: Digest, blob_hash: Digest) -> Self {
        let entity_snapshot_id_plus_blob_hash =
            Digest::new(&[*entity_snapshot_id.as_bytes(), *blob_hash.as_bytes()].concat());
        Self {
            prefix: LeafGcPathPrefix::new(link, entity_snapshot_id),
            entity_snapshot_id_plus_blob_hash,
        }
    }
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        self.serialize(&mut buf).unwrap();
        buf
    }
    pub fn from_bytes(mut bytes: &[u8]) -> std::io::Result<Self> {
        Self::deserialize(&mut bytes)
    }
}

#[derive(Debug, Clone)]
pub struct LeafIrohStore {
    pub client: iroh::client::Iroh,
    pub docs: Arc<quick_cache::sync::Cache<iroh::docs::NamespaceId, iroh::client::Doc>>,
}
pub struct IrohDocumentKeyFormat {
    pub path: Vec<PathSegment>,
}
impl IrohDocumentKeyFormat {
    pub fn new(path: Vec<PathSegment>) -> Self {
        Self { path }
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::new();
        let mut segment_bytes = Vec::new();
        for segment in &self.path {
            segment.serialize(&mut segment_bytes).unwrap();
            let len: u32 = segment_bytes.len().try_into().unwrap();
            buf.write_all(&len.to_le_bytes()[..]).unwrap();
            buf.write_all(&segment_bytes).unwrap();
            segment_bytes.clear();
        }
        buf
    }

    pub fn from_bytes(bytes: &[u8]) -> anyhow::Result<Self> {
        let len = bytes.len();
        if len == 0 {
            return Ok(Self { path: Vec::new() });
        }
        let mut reader = Cursor::new(bytes);
        let mut path = Vec::new();
        let mut segment_bytes = Vec::new();
        loop {
            if reader.position() as usize == len {
                break;
            }
            let mut segment_len_bytes = [0u8; 4];
            reader.read_exact(&mut segment_len_bytes)?;
            let segment_len = u32::from_le_bytes(segment_len_bytes);

            segment_bytes.extend(std::iter::repeat(0u8).take(segment_len as _));
            reader.read_exact(&mut segment_bytes)?;

            path.push(PathSegment::deserialize(&mut &segment_bytes[..])?);
            segment_bytes.clear();
        }
        Ok(Self { path })
    }
}

impl LeafIrohStore {
    pub fn new(client: iroh::client::Iroh) -> Self {
        Self {
            client,
            docs: Arc::new(quick_cache::sync::Cache::new(10)),
        }
    }

    /// Open a document using the local document cache.
    pub async fn open(&self, ns: iroh::docs::NamespaceId) -> anyhow::Result<iroh::client::Doc> {
        self.docs
            .get_or_insert_async(&ns, async {
                self.client
                    .docs()
                    .import_namespace(iroh::docs::Capability::Read(ns))
                    .await
            })
            .await
    }

    pub fn get_entity_key(subspace: SubspaceId, path: &[PathSegment]) -> Vec<u8> {
        assert_ne!(
            path.first(),
            Some(&*LEAF_GC_PREFIX),
            "Cannot write entities to reserved prefix: {}",
            LEAF_GC_PREFIX_STR
        );
        let mut path = path.to_vec();
        path.insert(0, PathSegment::Bytes(subspace.to_vec()));
        IrohDocumentKeyFormat::new(path).to_bytes()
    }
}

impl LeafStore for LeafIrohStore {
    fn key_resolvers(&self) -> Box<dyn Iterator<Item = &dyn super::KeyResolverImpl<Digest>> + '_> {
        Box::new([].into_iter())
    }

    fn encryption_algorithms(
        &self,
    ) -> Box<dyn Iterator<Item = &dyn super::EncryptionAlgorithmImpl<Digest>> + '_> {
        Box::new([].into_iter())
    }

    async fn store_blob(
        &self,
        data: &[u8],
        link: &ExactLink,
        entity_snapshot_id: Digest,
    ) -> anyhow::Result<Digest> {
        let doc = self.open(link.namespace.into()).await?;
        let hash = self.client.blobs().add_bytes(data.to_vec()).await?.hash;

        let key = LeafGcPath::new(link, entity_snapshot_id, Digest(hash));
        let doc_key = key.to_bytes();
        let author_id = self.client.authors().default().await?;
        doc.set_hash(author_id, doc_key, hash, data.len() as u64)
            .await?;
        Ok(Digest(hash))
    }

    async fn del_blobs(
        &self,
        link: &ExactLink,
        entity_snapshot_id: Digest,
    ) -> anyhow::Result<usize> {
        let doc = self.open(link.namespace.into()).await?;

        let path_prefix = LeafGcPathPrefix::new(link, entity_snapshot_id).to_bytes();
        let author_id = self.client.authors().default().await?;
        let deleted = doc.del(author_id, path_prefix).await?;

        Ok(deleted)
    }

    async fn get_blob(&self, digest: Digest) -> anyhow::Result<Vec<u8>> {
        Ok(self.client.blobs().read_to_bytes(digest.0).await?.to_vec())
    }

    async fn store_entity(&self, link: &ExactLink, data: Vec<u8>) -> anyhow::Result<Digest> {
        let doc = self.open(link.namespace.into()).await?;
        let key = Self::get_entity_key(link.subspace, &link.path.0);
        let digest = doc.set_bytes(link.subspace.into(), key, data).await?;
        Ok(Digest(digest))
    }
    async fn del_entity(&self, link: &ExactLink) -> anyhow::Result<()> {
        let doc = self.open(link.namespace.into()).await?;
        let key = Self::get_entity_key(link.subspace, &link.path.0);
        doc.del(link.subspace.into(), key).await?;
        Ok(())
    }

    async fn get_entity(&self, link: &ExactLink) -> anyhow::Result<Option<Digest>> {
        let doc = self.open(link.namespace.into()).await?;
        let key = Self::get_entity_key(link.subspace, &link.path.0);
        let entity = doc.get_exact(link.subspace.into(), key, false).await?;
        let entity = entity.map(|entry| Digest(entry.content_hash()));
        Ok(entity)
    }

    async fn list(
        &self,
        link: ExactLink,
        limit: Option<u64>,
        offset: Option<u64>,
    ) -> anyhow::Result<impl futures::Stream<Item = anyhow::Result<ExactLink>>> {
        let link = link.clone();
        let doc = self.open(link.namespace.into()).await?;

        let mut path = vec![PathSegment::Bytes(link.subspace.to_vec())];
        path.extend(link.path.0.iter().cloned());
        let path_bytes = IrohDocumentKeyFormat::new(path).to_bytes();

        let mut query = Query::key_prefix(path_bytes).author(link.subspace.into());
        if let Some(limit) = limit {
            query = query.limit(limit);
        }
        if let Some(offset) = offset {
            query = query.limit(offset);
        }
        let stream = doc.get_many(query).await?;

        let s = stream.and_then(move |x| async move {
            let mut key = IrohDocumentKeyFormat::from_bytes(x.key())?;
            key.path.remove(0); // Remove the subspace path segment

            Ok(ExactLink {
                namespace: link.namespace,
                subspace: link.subspace,
                path: EntityPath(key.path),
            })
        });

        Ok(s)
    }

    async fn create_subspace(&self) -> anyhow::Result<SubspaceId> {
        let author = self.client.authors().create().await?;
        Ok(*author.as_bytes())
    }

    async fn import_subspace_secret(&self, author_secret: [u8; 32]) -> anyhow::Result<SubspaceId> {
        let author = Author::from_bytes(&author_secret);
        let id = *author.public_key().as_bytes();
        self.client.authors().import(author).await?;
        Ok(id)
    }

    async fn get_subspace_secret(
        &self,
        author: SubspaceId,
    ) -> anyhow::Result<Option<crate::prelude::SubspaceSecretKey>> {
        let author = self.client.authors().export(AuthorId::from(author)).await?;
        Ok(author.map(|x| x.to_bytes()))
    }

    async fn create_namespace(&self) -> anyhow::Result<crate::prelude::NamespaceId> {
        let doc = self.client.docs().create().await?;
        Ok(doc.id().to_bytes())
    }

    async fn import_namespace_secret(
        &self,
        namespace_secret: [u8; 32],
    ) -> anyhow::Result<crate::prelude::NamespaceId> {
        let secret = NamespaceSecret::from_bytes(&namespace_secret);
        let id = *secret.id().as_bytes();
        self.client
            .docs()
            .import_namespace(iroh::docs::Capability::Write(secret))
            .await?;
        Ok(id)
    }

    async fn get_namespace_secret(
        &self,
        namespace: crate::prelude::NamespaceId,
    ) -> anyhow::Result<Option<NamespaceSecretKey>> {
        let doc = self.open(namespace.into()).await?;
        let capability = doc
            .share(iroh::client::docs::ShareMode::Write, AddrInfoOptions::Id)
            .await
            .map(|x| x.capability)
            .ok()
            .and_then(|x| {
                if let Capability::Write(secret) = x {
                    Some(secret.to_bytes())
                } else {
                    None
                }
            });
        Ok(capability)
    }
}
