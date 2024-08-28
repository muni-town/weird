//! Core types in the Leaf specification

use borsh::{BorshDeserialize, BorshSerialize};

mod borsh_schema;
mod digest;

pub use borsh_schema::*;
pub use digest::*;

pub type NamespaceId = [u8; 32];
pub type SubspaceId = [u8; 32];
pub type SubspaceSecretKey = [u8; 32];
pub type NamespaceSecretKey = [u8; 32];

/// An entity path.
#[derive(
    borsh::BorshDeserialize,
    borsh::BorshSerialize,
    Debug,
    Clone,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    Hash,
)]
pub struct EntityPath(pub Vec<PathSegment>);
impl AsRef<[PathSegment]> for EntityPath {
    fn as_ref(&self) -> &[PathSegment] {
        &self.0
    }
}
impl From<()> for EntityPath {
    fn from(_: ()) -> Self {
        EntityPath(Vec::default())
    }
}
impl<T: Into<PathSegment>, const N: usize> From<[T; N]> for EntityPath {
    fn from(value: [T; N]) -> Self {
        EntityPath(value.into_iter().map(|x| x.into()).collect())
    }
}

#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone, Default)]
pub struct Entity {
    pub components: Vec<ComponentEntry>,
}

impl Entity {
    pub fn sort_components(&mut self) {
        self.components.sort();
    }

    pub fn compute_digest(&self) -> Digest {
        let is_sorted = self.components.windows(2).all(|w| w[0] <= w[1]);
        assert!(is_sorted, "Components must be sorted to compute digest");
        let mut buf = Vec::new();
        self.serialize(&mut buf).unwrap();
        Digest::new(&buf)
    }
}

#[derive(
    borsh::BorshDeserialize,
    borsh::BorshSerialize,
    Debug,
    Clone,
    Copy,
    PartialEq,
    PartialOrd,
    Ord,
    Eq,
)]
pub struct ComponentEntry {
    // The schema ID may not be set if the component is encrypted.
    pub schema_id: Option<Digest>,
    pub component_id: Digest,
}

/// A segment in an entity Path.
#[derive(
    borsh::BorshDeserialize, borsh::BorshSerialize, Clone, PartialEq, Eq, PartialOrd, Ord, Hash,
)]
pub enum PathSegment {
    Null,
    Bool(bool),
    Uint(u64),
    Int(i64),
    String(String),
    Bytes(Vec<u8>),
}
impl std::fmt::Debug for PathSegment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Null => write!(f, "Null"),
            Self::Bool(arg0) => write!(f, "{arg0}"),
            Self::Uint(arg0) => write!(f, "{arg0}_u64"),
            Self::Int(arg0) => write!(f, "{arg0}_i64"),
            Self::String(arg0) => write!(f, "\"{arg0}\""),
            Self::Bytes(arg0) => write!(f, "base32:{}", &iroh_base::base32::fmt(arg0)),
        }
    }
}
impl From<()> for PathSegment {
    fn from(_: ()) -> Self {
        Self::Null
    }
}
impl From<bool> for PathSegment {
    fn from(value: bool) -> Self {
        Self::Bool(value)
    }
}
impl From<u64> for PathSegment {
    fn from(value: u64) -> Self {
        Self::Uint(value)
    }
}
impl From<i64> for PathSegment {
    fn from(value: i64) -> Self {
        Self::Int(value)
    }
}
impl<'a> From<&'a str> for PathSegment {
    fn from(value: &'a str) -> Self {
        Self::String(value.into())
    }
}
impl From<String> for PathSegment {
    fn from(value: String) -> Self {
        Self::String(value)
    }
}
impl From<Vec<u8>> for PathSegment {
    fn from(value: Vec<u8>) -> Self {
        Self::Bytes(value)
    }
}

/// The kind of component data.
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub enum ComponentKind {
    /// Unencrypted data
    Unencrypted(ComponentData),
    /// Encrypted data with an associated key ID and encryption algorithm.
    Encrypted {
        algorithm: EncryptionAlgorithm,
        key_id: [u8; 32],
        encrypted_data: Vec<u8>,
    },
}

impl ComponentKind {
    pub fn unencrypted(&self) -> Option<&ComponentData> {
        match self {
            ComponentKind::Unencrypted(u) => Some(u),
            _ => None,
        }
    }
}

/// The data that makes up a component.
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub struct ComponentData {
    /// The Schema ID of the component data.
    pub schema: Digest,
    /// The data of the component, to be parsed according to it's [`Schema`]'s [`BorshSchema`].
    pub data: Vec<u8>,
}

/// A [`Component`][crate::Component] schema.
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub struct Schema {
    /// The name of the schema.
    pub name: String,
    /// The [`BorshSchema`] describing the component's data.
    pub format: BorshSchema,
    /// The collection ID containing the components that document this schema.
    pub specification: Digest,
}

/// A [`borsh`] schema describing the data format of a [`Component`][crate::Component].
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub enum BorshSchema {
    Null,
    Bool,
    U8,
    U16,
    U32,
    U64,
    U128,
    I8,
    I16,
    I32,
    I64,
    I128,
    F32,
    F64,
    String,
    Option {
        schema: Box<BorshSchema>,
    },
    Array {
        schema: Box<BorshSchema>,
        len: u32,
    },
    Struct {
        fields: Vec<(String, BorshSchema)>,
    },
    Enum {
        variants: Vec<(String, BorshSchema)>,
    },
    Vector {
        schema: Box<BorshSchema>,
    },
    Map {
        key: Box<BorshSchema>,
        value: Box<BorshSchema>,
    },
    Set {
        schema: Box<BorshSchema>,
    },
    Blob,
    Snapshot,
    Link,
}

#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub struct Link {
    namespace: KeyResolverKind,
    subspace: KeyResolverKind,
    path: Vec<PathSegment>,
    snapshot: Option<Digest>,
}
impl HasBorshSchema for Link {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Link
    }
}

/// Similar to a [`types::Link`], but with a resolved namespace and subspace.
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Clone, BorshDeserialize, BorshSerialize)]
pub struct ExactLink {
    pub namespace: NamespaceId,
    pub subspace: SubspaceId,
    pub path: EntityPath,
}

impl<P: Into<EntityPath>> From<(NamespaceId, SubspaceId, P)> for ExactLink {
    fn from((n, s, p): (NamespaceId, SubspaceId, P)) -> Self {
        Self {
            namespace: n,
            subspace: s,
            path: p.into(),
        }
    }
}

#[derive(
    borsh::BorshDeserialize,
    borsh::BorshSerialize,
    Debug,
    Clone,
    Hash,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
)]
pub struct Blob(pub Digest);
impl HasBorshSchema for Blob {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Blob
    }
}

#[derive(
    borsh::BorshDeserialize,
    borsh::BorshSerialize,
    Debug,
    Clone,
    Hash,
    Eq,
    PartialEq,
    Ord,
    PartialOrd,
)]
pub struct Snapshot(pub Digest);
impl HasBorshSchema for Snapshot {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Snapshot
    }
}

/// A key-resolver algorithm.
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub enum KeyResolverKind {
    /// The key is stored inline and may be used directly.
    Inline([u8; 32]),
    /// The key must be resolved using the key resolver with the given digest. The `data` is passed
    /// to the key resolver algorithm.
    Custom { id: Digest, data: Vec<u8> },
}

/// A key-resolver algorithm.
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub struct KeyResolver {
    pub name: String,
    pub specification: Digest,
}

/// An encryption algorithm.
#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug, Clone)]
pub struct EncryptionAlgorithm {
    pub name: String,
    pub specification: Digest,
}
