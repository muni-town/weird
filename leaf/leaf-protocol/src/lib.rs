//! Rust implementation of the [Leaf Protocol draft][lp].
//!
//! [lp]: https://github.com/muni-town/agentic-fediverse/blob/49791e6b3ec1df5e0a8604476417e88eed1f9497/leaf-protocol-draft.md

pub mod components;
pub mod store;
pub use leaf_protocol_types as types;
use leaf_protocol_types::Digest;

use anyhow::Result;
use borsh::{BorshDeserialize, BorshSerialize};

pub use borsh;

use futures::stream::Stream;
pub use leaf_protocol_macros::*;
use store::LeafStore;
use types::{
    ComponentData, ComponentEntry, ComponentKind, Entity, ExactLink, NamespaceId,
    NamespaceSecretKey, SubspaceId, SubspaceSecretKey,
};

#[cfg(feature = "backend_iroh")]
pub use iroh;

pub mod prelude {
    pub use crate::components::*;
    #[cfg(feature = "backend_iroh")]
    pub use crate::store::iroh::*;
    pub use crate::store::{EncryptionAlgorithmImpl, KeyResolverImpl, LeafStore};
    pub use crate::types::*;
    pub use crate::*;
    pub use borsh::{BorshDeserialize, BorshSerialize};
}

/// Trait implemented by `Component`s in the Leaf data model.
///
/// Implementers should usually derive this using the [`Component`][leaf_protocol_macros::Component]
/// macro.
pub trait Component: types::HasBorshSchema + BorshDeserialize + BorshSerialize {
    /// Returns the digest of the schema for this component.
    fn schema_id() -> Digest;
    fn make_data(&self) -> std::io::Result<ComponentData> {
        let mut data = Vec::new();
        self.serialize(&mut data)?;
        Ok(ComponentData {
            schema: Self::schema_id(),
            data,
        })
    }
}

/// The leaf store, the entrypoint to the leaf API.
#[derive(Clone, Debug)]
pub struct Leaf<Store: LeafStore> {
    /// The backend store.
    pub store: Store,
}

pub enum EntityEntry<S: LeafStore> {
    Entity(LoadedEntity<S>),
    Empty { link: ExactLink, store: S },
}

impl<S: LeafStore> EntityEntry<S> {
    /// Get the entity at this entry.
    pub fn entity(self) -> Result<LoadedEntity<S>> {
        match self {
            EntityEntry::Entity(e) => Ok(e),
            EntityEntry::Empty { link, .. } => {
                Err(anyhow::format_err!("Entity does not exist at: {link:?}"))
            }
        }
    }

    /// Get the retrieved entity or initialize an empty one at this link.
    pub fn get_or_init(self) -> LoadedEntity<S> {
        match self {
            EntityEntry::Entity(e) => e,
            EntityEntry::Empty { link, store } => LoadedEntity {
                store,
                link,
                entity: Entity::default(),
                digest: Digest::from_bytes([0; 32]),
                pending_components: Default::default(),
            },
        }
    }
}

#[derive(Debug)]
pub struct LoadedEntity<S: LeafStore> {
    pub store: S,
    pub link: ExactLink,
    pub entity: Entity,
    /// The digest of the entity. This may be a null digest if you have just called
    /// [`get_or_init()`][EntityEntry::get_or_init], and the digest has not computed yet.
    ///
    /// It will also not be updated until [`save()`][LoadedEntity::save] is called when making
    /// changes to the entity.
    pub digest: Digest,
    /// The list of components that have been added to the entity, but haven't been written to
    /// storage yet.
    pub pending_components: Vec<ComponentKind>,
}

impl<S: LeafStore> LoadedEntity<S> {
    /// Delete all components of the given type.
    ///
    /// The changes will not be persisted until [`save()`][Self::save] is called.
    pub fn del_components<C: Component>(&mut self) {
        self.del_components_by_schema(C::schema_id());
    }

    pub fn del_components_by_schema(&mut self, schema: Digest) {
        self.entity
            .components
            .retain(|entry| entry.schema_id != Some(schema));
        self.pending_components.retain(|kind| {
            kind.unencrypted()
                .map(|x| x.schema != schema)
                .unwrap_or(true)
        });
    }

    /// Get the first component of a given type on the entity, or [`None`] if there is no component
    /// of that type.
    pub async fn get_component<C: Component>(&self) -> Result<Option<C>> {
        for comp in &self.pending_components {
            if let Some(comp) = comp.unencrypted() {
                if comp.schema == C::schema_id() {
                    return Ok(Some(C::deserialize(&mut &comp.data[..])?));
                }
            }
        }
        for entry in &self.entity.components {
            if entry.schema_id == Some(C::schema_id()) {
                let data = self.store.get_blob(entry.component_id).await?;
                return Ok(Some(C::deserialize(&mut &data[..])?));
            }
        }
        Ok(None)
    }

    /// Get all components of the given type on the entity.
    pub async fn get_components<C: Component>(&self) -> Result<Vec<C>> {
        let mut res = Vec::new();
        for comp in &self.pending_components {
            if let Some(comp) = comp.unencrypted() {
                if comp.schema == C::schema_id() {
                    res.push(C::deserialize(&mut &comp.data[..])?);
                }
            }
        }
        for entry in &self.entity.components {
            if entry.schema_id == Some(C::schema_id()) {
                let data = self.store.get_blob(entry.component_id).await?;
                res.push(C::deserialize(&mut &data[..])?);
            }
        }
        Ok(res)
    }

    pub async fn get_components_by_schema(&self, schema: Digest) -> Result<Vec<Vec<u8>>> {
        let mut res = Vec::new();
        for comp in &self.pending_components {
            if let Some(comp) = comp.unencrypted() {
                if comp.schema == schema {
                    res.push(comp.data.clone());
                }
            }
        }
        for entry in &self.entity.components {
            if entry.schema_id == Some(schema) {
                let data = self.store.get_blob(entry.component_id).await?;
                let component_kind = ComponentKind::deserialize(&mut &data[..])?;
                if let ComponentKind::Unencrypted(data) = component_kind {
                    if schema == data.schema {
                        res.push(data.data);
                    }
                }
            }
        }
        Ok(res)
    }

    /// Remove all components of the same type that are already on the entity, and then add the
    /// component to the entity.
    ///
    /// This is similar to [`add_component()`][Self::add_component], but it makes sure that after
    /// it's done there is only one component of the given type on the entity.
    ///
    /// The change will not be persisted until [`save()`][Self::save] is called.
    pub fn set_component<C: Component>(&mut self, data: C) -> Result<()> {
        self.del_components::<C>();
        self.add_component(data)?;
        Ok(())
    }

    /// Add a component to the entity.
    ///
    /// The component will not be persisted until [`save()`][Self::save] is called.
    pub fn add_component<C: Component>(&mut self, data: C) -> Result<()> {
        self.pending_components
            .push(ComponentKind::Unencrypted(ComponentData {
                schema: C::schema_id(),
                data: {
                    let mut buf = Vec::new();
                    data.serialize(&mut buf)?;
                    buf
                },
            }));
        Ok(())
    }

    pub fn add_component_data(&mut self, data: ComponentKind) {
        self.pending_components.push(data);
    }

    /// Persist updates made to this entity's components, writing updated entity and components to
    /// the store.
    pub async fn save(&mut self) -> anyhow::Result<()> {
        // Clean up old blob pins if there was a previous version of this entity.
        if let Some(old_snapshot_id) = self.store.get_entity(&self.link).await? {
            self.store.del_blobs(&self.link, old_snapshot_id).await?;
        }

        struct PendingComponent {
            schema: Option<Digest>,
            data_hash: Digest,
            data: Vec<u8>,
        }
        let mut pending_components =
            Vec::with_capacity(self.pending_components.len() + self.entity.components.len());

        for component in &self.pending_components {
            let mut buf = Vec::new();
            component.serialize(&mut buf)?;
            let digest = Digest::new(&buf);
            pending_components.push(PendingComponent {
                schema: component.unencrypted().map(|x| x.schema),
                data: buf,
                data_hash: digest,
            });
        }

        let mut new_entity_snapshot = Entity::default();
        new_entity_snapshot
            .components
            .extend(self.entity.components.iter().cloned());
        new_entity_snapshot
            .components
            .extend(pending_components.iter().map(|x| ComponentEntry {
                schema_id: x.schema,
                component_id: x.data_hash,
            }));
        new_entity_snapshot.components.sort();
        new_entity_snapshot.components.dedup();
        let mut new_entity_snapshot_buf = Vec::new();
        new_entity_snapshot.serialize(&mut new_entity_snapshot_buf)?;

        let new_entity_snapshot_id = Digest::new(&new_entity_snapshot_buf);

        for comp in pending_components {
            // TODO: Make sure that snapshots and link snapshots are added to the blob store pins.
            //
            // The component may contain a `Snapshot` or a `Link` with a snapshot that should be
            // persisted. As it stands, nothing will make sure that the snapshot's blob is
            // persisted. We need to add another `store_blob` call for each snapshot.
            //
            // We can tell when a component contains a snapashot by combing it's `BorshSchema`, but
            // we must also walk through the component bytes as we recurse through the schema so
            // that when we find a link we can load it's bytes.
            let dig = self
                .store
                .store_blob(&comp.data, &self.link, new_entity_snapshot_id)
                .await?;
            assert_eq!(dig, comp.data_hash);
        }
        let verification_digest = self
            .store
            .store_entity(&self.link, new_entity_snapshot_buf)
            .await?;
        assert_eq!(
            verification_digest, new_entity_snapshot_id,
            "Entity snapshot digest incorrect"
        );
        self.pending_components.clear();
        self.entity = new_entity_snapshot;
        self.digest = new_entity_snapshot_id;

        Ok(())
    }

    /// Delete the entity. Changes are immediately written to the store.
    pub async fn delete(&mut self) -> anyhow::Result<()> {
        if let Some(old_snapshot_id) = self.store.get_entity(&self.link).await? {
            // Clean up old blob pins
            self.store.del_blobs(&self.link, old_snapshot_id).await?;
            // Delete the entity
            self.store.del_entity(&self.link).await?;

            // Clear the components on this entity handle
            self.entity.components.clear();
        }
        Ok(())
    }
}

// TODO: Store schema data in the network somehow, instead of just the schema hashes.

impl<S: store::LeafStore + Clone> Leaf<S> {
    /// Create a new leaf store around the given backend store.
    pub fn new(store: S) -> Self {
        Self { store }
    }

    pub async fn create_subspace(&self) -> Result<SubspaceId> {
        self.store.create_subspace().await
    }
    pub async fn import_subspace_secret(&self, secret: SubspaceSecretKey) -> Result<SubspaceId> {
        self.store.import_subspace_secret(secret).await
    }
    pub async fn get_subspace_secret(
        &self,
        subspace: SubspaceId,
    ) -> Result<Option<SubspaceSecretKey>> {
        self.store.get_subspace_secret(subspace).await
    }
    pub async fn create_namespace(&self) -> Result<NamespaceId> {
        self.store.create_namespace().await
    }
    pub async fn import_namespace_secret(&self, secret: NamespaceSecretKey) -> Result<NamespaceId> {
        self.store.import_namespace_secret(secret).await
    }
    pub async fn get_namespace_secret(
        &self,
        namespace: NamespaceId,
    ) -> Result<Option<NamespaceSecretKey>> {
        self.store.get_namespace_secret(namespace).await
    }

    /// Load an entity entry
    pub async fn entity<L: Into<ExactLink>>(&self, link: L) -> Result<EntityEntry<S>> {
        let link = link.into();
        let Some(digest) = self.store.get_entity(&link).await? else {
            return Ok(EntityEntry::Empty {
                link,
                store: self.store.clone(),
            });
        };
        let bytes = self.store.get_blob(digest).await?;
        let entity = Entity::deserialize(&mut &bytes[..])?;

        Ok(EntityEntry::Entity(LoadedEntity {
            store: self.store.clone(),
            link,
            entity,
            digest,
            pending_components: Default::default(),
        }))
    }

    pub async fn del_entity<L: Into<ExactLink>>(&self, link: L) -> Result<()> {
        let link = link.into();
        if let Some(digest) = self.store.get_entity(&link).await? {
            self.store.del_blobs(&link, digest).await?;
        }
        self.store.del_entity(&link).await?;
        Ok(())
    }

    pub async fn list<L: Into<ExactLink>>(
        &self,
        link: L,
        // TODO: add a recursive option to allow only listing the entities that are direct children
        // of the link.
    ) -> Result<impl Stream<Item = Result<ExactLink>> + '_> {
        let link = link.into();
        let s = self.store.list(link, None, None).await?;
        Ok(s)
    }

    pub async fn list_namespaces(
        &self,
    ) -> anyhow::Result<impl Stream<Item = std::result::Result<NamespaceId, anyhow::Error>> + '_>
    {
        self.store.list_namespaces().await
    }
    pub async fn list_subspaces(
        &self,
    ) -> anyhow::Result<impl Stream<Item = std::result::Result<SubspaceId, anyhow::Error>> + '_>
    {
        self.store.list_subspaces().await
    }
}
