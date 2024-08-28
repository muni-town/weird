//! Backend stores that may be used with the [`Leaf`] struct.

use std::{fmt::Debug, future::Future};

use anyhow::Result;
use futures::Stream;

use crate::{
    types::{ExactLink, NamespaceId, NamespaceSecretKey, SubspaceId, SubspaceSecretKey},
    Digest,
};

#[cfg(feature = "backend_iroh")]
pub mod iroh;

pub trait KeyResolverImpl<KeyId> {
    /// Returns the `EncryptionAlgorithmId` that this implements.
    fn id(&self) -> KeyId;
    /// Resolve the given data to a key using this algorithm.
    fn resolve(&self, data: &[u8]) -> KeyId;
}

pub trait EncryptionAlgorithmImpl<Digest> {
    /// Returns the `EncryptionAlgorithmId` that this implements.
    fn id(&self) -> Digest;
    /// Encrypts the data using the provided key.
    fn encrypt(&self, key_id: [u8; 32], data: &[u8]) -> Vec<u8>;
    /// Decrypts the data using the provided key.
    fn decrypt(&self, key_id: [u8; 32], data: &[u8]) -> Vec<u8>;
}

// TODO: Find way to avoid leaking blobs in the garbage collector.
//
// Right now the garbage collector cleans up data by the fact that every time you overwrite an
// entity, it will look at the previous components of the entity, and remove all of the GC pins for
// those components.
//
// The problem is that if a sync comes and inserts an update in between the time that I read the
// previous version of the entity, and the time that I overwrite the previous version, I will have
// missed the newly inserted entity, and replace it, without ever having removed it's garbage
// collector pins.
//
// This situation means that live data should never have a problem getting deleted, but some dead
// data might get left in the `_leaf_gc_` table forever.

pub trait LeafStore: Debug {
    /// Get an iterator over key resolver algorithms implemented by this backend.
    // TODO: try avoid allocating while still being object safe.
    fn key_resolvers(&self) -> Box<dyn Iterator<Item = &dyn KeyResolverImpl<Digest>> + '_>;
    /// Get an iterator over encryption algorithms implemented by this backend.
    fn encryption_algorithms(
        &self,
    ) -> Box<dyn Iterator<Item = &dyn EncryptionAlgorithmImpl<Digest>> + '_>;

    fn create_subspace(&self) -> impl Future<Output = Result<SubspaceId>>;
    fn get_subspace_secret(
        &self,
        subspace: SubspaceId,
    ) -> impl Future<Output = Result<Option<SubspaceSecretKey>>>;
    fn import_subspace_secret(
        &self,
        subspace_secret: SubspaceSecretKey,
    ) -> impl Future<Output = Result<SubspaceId>>;

    fn create_namespace(&self) -> impl Future<Output = Result<NamespaceId>>;
    fn get_namespace_secret(
        &self,
        namespace: NamespaceId,
    ) -> impl Future<Output = Result<Option<NamespaceSecretKey>>>;
    fn import_namespace_secret(
        &self,
        secret: [u8; 32],
    ) -> impl Future<Output = Result<NamespaceId>>;

    /// Store a blob for an entity snapshot.
    ///
    /// You must specify a namespace to associate the blob to, an entity path, and an entity
    /// snapshot.
    ///
    /// You can use the same namespace, entity path, and snapshot to delete the blob pins associated
    /// to it with [`LeafStore::del_blobs()`].
    fn store_blob(
        &self,
        data: &[u8],
        link: &ExactLink,
        entity_snapshot_id: Digest,
    ) -> impl Future<Output = Result<Digest>>;
    /// Delete a blob. This doesn't necessarily delete the blob immediately, but it removes the
    /// garbage collector pin for the entity snapshot.
    ///
    /// Returns the number of blobs deleted.
    fn del_blobs(
        &self,
        link: &ExactLink,
        entity_snapshot_id: Digest,
    ) -> impl Future<Output = Result<usize>>;
    /// Get's a blob from the local store.
    fn get_blob(&self, digest: Digest) -> impl Future<Output = Result<Vec<u8>>>;

    fn store_entity(&self, link: &ExactLink, data: Vec<u8>)
        -> impl Future<Output = Result<Digest>>;
    fn del_entity(&self, link: &ExactLink) -> impl Future<Output = Result<()>>;
    fn get_entity(&self, link: &ExactLink) -> impl Future<Output = Result<Option<Digest>>>;

    fn list(
        &self,
        link: ExactLink,
        limit: Option<u64>,
        offset: Option<u64>,
    ) -> impl Future<Output = Result<impl Stream<Item = anyhow::Result<ExactLink>>>>;
}
