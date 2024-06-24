//! The core engine of a Weird instance.

use std::{path::Path, str::FromStr};

use gdata::{GStoreBackend, IrohGStore, Key};
use hickory_resolver::{
    config::{ResolverConfig, ResolverOpts},
    TokioAsyncResolver,
};
use iroh::{
    docs::{NamespaceId, NamespaceSecret},
    node::Node,
};
use once_cell::sync::Lazy;

pub use gdata;
pub use iroh;

pub mod db;
pub mod profile;

/// This is the namespace that is used to store all globally writable records for this version of
/// weird.
///
/// Every time there are non-backward compatible update to the format of this namespace, as expected
/// by weird, a new namespace will be used for that version.
pub static GLOBAL_NAMESPACE: Lazy<NamespaceSecret> = Lazy::new(|| {
    NamespaceSecret::from_str("q4hiommvh3ttec3x2y7h4le5tkx2tee762s6miu4rer6d2asi4la").unwrap()
});

/// This is a placeholder representing that in future versions we will have the previous global
/// namespace here, and this nodes data will be migrated from the previous global namespace to the
/// current.
pub static PREV_GLOBAL_NAMESPACE: () = ();

/// The is the key into the instance namespace that contains the configuration for this version of
/// Weird.
///
/// When there are breaking changes to this configuration, the key will be updated, and the old one
/// will be migrated when the server starts up.
pub static INSTANCE_DATA_KEY: Lazy<Key> = Lazy::new(|| ["data", "v1"].into());

/// This is a placeholder representing that in future versions we will have the previous instance
/// config key here, and the data will be migrated from the previous key to the current key.
pub static PREV_INSTANCE_DATA_KEY: () = ();

pub struct Weird<Store = iroh::blobs::store::fs::Store> {
    /// The instance namespace used to store this instance's data.
    ///
    /// Note that "instance" is more general than a "node". Multiple nodes may be a part of the same
    /// instance and in that case they will make up a cluster and all the nodes will have the same
    /// instance namespace.
    pub ns: NamespaceId,
    /// The iroh node used for storage and communication.
    pub node: Node<Store>,
    /// The graph store wrapper around the iroh node.
    pub graph: IrohGStore,
    /// The domain that this instance is running under.
    pub domain: String,
    /// DNS resolver used to lookup username tables.
    pub resolver: TokioAsyncResolver,
}

impl Weird<iroh::blobs::store::fs::Store> {
    /// Initialize a new instance of Weird using the provided instance namespace and storage
    /// directory.
    pub async fn new(
        instance_namespace: NamespaceSecret,
        storage_path: impl AsRef<Path>,
        domain: &str,
    ) -> anyhow::Result<Self> {
        // Initialize node
        let node = Node::persistent(storage_path).await?.spawn().await?;
        let ns = instance_namespace.id();
        node.docs()
            .import_namespace(iroh::docs::Capability::Write(instance_namespace))
            .await?;
        let graph = IrohGStore::new(node.client().clone(), node.authors().default().await?);

        // Run instance data migrations ( we don't have any because this is the first version )
        graph
            .get_or_init_map((ns, INSTANCE_DATA_KEY.clone()))
            .await?;

        // Run global namespace migrations ( we don't have any because this is the first version )

        tracing::info!(instance_id = %ns, "Started weird instance");

        Ok(Self {
            ns,
            node,
            graph,
            domain: domain.to_string(),
            resolver: TokioAsyncResolver::tokio(ResolverConfig::default(), ResolverOpts::default()),
        })
    }
}
