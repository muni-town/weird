//! Graph database on top of Iroh.

use bytes::Bytes;
use std::future::Future;

use iroh::docs::{store::Query, AuthorId, NamespaceId};

#[derive(Clone, Debug)]
pub struct IrohGStore {
    pub iroh: iroh::client::MemIroh,
    pub author: AuthorId,
}
impl IrohGStore {
    pub fn new(iroh: iroh::client::MemIroh, author: AuthorId) -> Self {
        Self { iroh, author }
    }
}
impl GStoreBackend for IrohGStore {
    async fn get(&self, link: Link) -> anyhow::Result<GStoreValue<Self>> {
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        let entry = doc.get_one(Query::key_exact(&link.key)).await?;
        if let Some(entry) = entry {
            let value = entry.content_bytes(&self.iroh).await?;
            let value = Value::from_bytes(value)?;
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value,
            })
        } else {
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value: Value::Null,
            })
        }
    }

    async fn get_list_idx(&self, link: Link, idx: u64) -> anyhow::Result<GStoreValue<Self>> {
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        let entry = doc
            .get_one(Query::key_exact(&link.key).offset(idx).limit(1))
            .await?;
        if let Some(entry) = entry {
            let value = entry.content_bytes(&self.iroh).await?;
            let value = Value::from_bytes(value)?;
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value,
            })
        } else {
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value: Value::Null,
            })
        }
    }

    async fn get_map_key(
        &self,
        link: Link,
        idx: impl Into<Bytes>,
    ) -> anyhow::Result<GStoreValue<Self>> {
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        // TODO: use smallvec to avoid allocations for reasonable key lengths.
        let key = [link.key.clone(), idx.into()].concat();
        let entry = doc.get_one(Query::key_exact(&key)).await?;
        if let Some(entry) = entry {
            let value = entry.content_bytes(&self.iroh).await?;
            let value = Value::from_bytes(value)?;
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value,
            })
        } else {
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value: Value::Null,
            })
        }
    }

    async fn put(&self, link: Link, value: impl Into<Value>) -> anyhow::Result<()> {
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        doc.set_bytes(self.author, link.key, value.into().to_bytes())
            .await?;
        Ok(())
    }

    async fn put_list_idx(
        &self,
        link: Link,
        idx: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> anyhow::Result<()> {
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        // TODO: use smallvec to avoid allocations for reasonable key lengths.
        let key = [link.key.clone(), idx.into()].concat();
        doc.set_bytes(self.author, key, value.into().to_bytes())
            .await?;

        Ok(())
    }

    async fn put_map_key(
        &self,
        link: Link,
        key: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> anyhow::Result<()> {
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        // TODO: use smallvec to avoid allocations for reasonable key lengths.
        let key = [link.key.clone(), key.into()].concat();
        doc.set_bytes(self.author, key, value.into().to_bytes())
            .await?;

        Ok(())
    }
}

pub trait GStoreBackend: Sized {
    fn get(&self, link: Link) -> impl Future<Output = Result<GStoreValue<Self>, anyhow::Error>>;
    fn get_list_idx(
        &self,
        link: Link,
        idx: u64,
    ) -> impl Future<Output = Result<GStoreValue<Self>, anyhow::Error>>;
    fn get_map_key(
        &self,
        link: Link,
        idx: impl Into<Bytes>,
    ) -> impl Future<Output = Result<GStoreValue<Self>, anyhow::Error>>;
    fn put(
        &self,
        link: Link,
        value: impl Into<Value>,
    ) -> impl Future<Output = Result<(), anyhow::Error>>;
    fn put_list_idx(
        &self,
        link: Link,
        idx: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> impl Future<Output = Result<(), anyhow::Error>>;
    fn put_map_key(
        &self,
        link: Link,
        key: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> impl Future<Output = Result<(), anyhow::Error>>;
}

pub struct GStoreValue<G: GStoreBackend> {
    pub link: Link,
    pub store: G,
    pub value: Value,
}
impl<G: GStoreBackend + Sync + Send> GStoreValue<G> {
    pub async fn get_idx(&self, idx: u64) -> anyhow::Result<Self> {
        if matches!(self.value, Value::List(_)) {
            Ok(self.store.get_list_idx(self.link.clone(), idx).await?)
        } else {
            Err(anyhow::format_err!("item is not a list"))
        }
    }
    pub async fn get_key(&self, key: impl Into<Bytes>) -> anyhow::Result<Self> {
        if matches!(self.value, Value::Map(_)) {
            Ok(self.store.get_map_key(self.link.clone(), key).await?)
        } else {
            Err(anyhow::format_err!("item is not a map"))
        }
    }
    pub fn as_bytes(&self) -> anyhow::Result<&Bytes> {
        match &self.value {
            Value::Bytes(b) => Ok(b),
            _ => Err(anyhow::format_err!("item is not Bytes")),
        }
    }
    pub fn as_str(&self) -> anyhow::Result<&str> {
        match &self.value {
            Value::String(s) => Ok(s),
            _ => Err(anyhow::format_err!("item is not a string")),
        }
    }
    pub async fn follow_link(&self) -> anyhow::Result<GStoreValue<G>> {
        match &self.value {
            Value::Link(link) => self.store.get(link.clone()).await,
            _ => Err(anyhow::format_err!("item is not a link")),
        }
    }
    pub fn is_null(&self) -> bool {
        matches!(self.value, Value::Null)
    }
}
impl<G: GStoreBackend> AsRef<Value> for GStoreValue<G> {
    fn as_ref(&self) -> &Value {
        &self.value
    }
}
impl<G: GStoreBackend> std::ops::Deref for GStoreValue<G> {
    type Target = Value;
    fn deref(&self) -> &Self::Target {
        &self.value
    }
}
impl<G: GStoreBackend> std::ops::DerefMut for GStoreValue<G> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.value
    }
}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Link {
    pub namespace: NamespaceId,
    pub key: Bytes,
}
const NAMESPACE_SIZE: usize = std::mem::size_of::<NamespaceId>();
impl Link {
    pub fn new(namespace: NamespaceId, key: impl Into<Bytes>) -> Self {
        Self {
            namespace,
            key: key.into(),
        }
    }
    pub fn from_bytes(bytes: impl Into<Bytes>) -> Result<Self, ParseLinkError> {
        let bytes = bytes.into();
        if bytes.len() < NAMESPACE_SIZE {
            return Err(ParseLinkError::TooShort);
        }
        let mut namespace = bytes;
        let key = namespace.split_off(NAMESPACE_SIZE);
        let namespace: [u8; NAMESPACE_SIZE] = namespace[..].try_into().unwrap();
        let namespace = NamespaceId::from(namespace);
        Ok(Self { namespace, key })
    }
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut buf = Vec::with_capacity(32 + self.key.len());
        buf.extend_from_slice(self.namespace.as_bytes());
        buf.extend_from_slice(&self.key);
        buf
    }
}

#[derive(Clone, Debug)]
pub enum ParseLinkError {
    TooShort,
    Utf8Error,
}
impl std::fmt::Display for ParseLinkError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseLinkError::TooShort => f.write_str("not enough bytes ( 32 )"),
            ParseLinkError::Utf8Error => f.write_str("utf8 error"),
        }
    }
}
impl std::error::Error for ParseLinkError {}

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(u8)]
pub enum Value {
    Null,
    String(String),
    Bytes(Bytes),
    List(Link),
    Map(Link),
    Link(Link),
}
impl From<String> for Value {
    fn from(value: String) -> Self {
        Value::String(value)
    }
}
impl From<Vec<u8>> for Value {
    fn from(value: Vec<u8>) -> Self {
        Value::Bytes(value.into())
    }
}
impl<'a> From<&'a str> for Value {
    fn from(value: &'a str) -> Self {
        Value::String(value.into())
    }
}

#[derive(Clone, Debug)]
pub enum ParseValueError {
    ZeroSizedBuffer,
    InvalidTag(u8),
    Utf8Error,
    ParseLinkError(ParseLinkError),
}
impl std::fmt::Display for ParseValueError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseValueError::ZeroSizedBuffer => f.write_str("zero sized buffer"),
            ParseValueError::InvalidTag(tag) => f.write_fmt(format_args!("invalid tag {tag}")),
            ParseValueError::Utf8Error => f.write_str("utf8 error"),
            ParseValueError::ParseLinkError(err) => {
                f.write_fmt(format_args!("link parse error: {err:?}"))
            }
        }
    }
}
impl std::error::Error for ParseValueError {}

impl Value {
    pub fn list(nsid: NamespaceId, key: impl Into<Bytes>) -> Self {
        Value::List(Link::new(nsid, key))
    }
    pub fn map(nsid: NamespaceId, key: impl Into<Bytes>) -> Self {
        Value::Map(Link::new(nsid, key))
    }
    pub fn link(nsid: NamespaceId, key: impl Into<Bytes>) -> Self {
        Value::Link(Link::new(nsid, key))
    }

    pub fn from_bytes(bytes: impl Into<Bytes>) -> Result<Self, ParseValueError> {
        let bytes = bytes.into();
        if bytes.is_empty() {
            return Err(ParseValueError::ZeroSizedBuffer);
        }
        let mut tag = bytes;
        let payload = tag.split_off(1);
        let tag = tag[0];
        match tag {
            0 => Ok(Value::Null),
            1 => Ok(Value::String(
                String::from_utf8(payload.to_vec()).map_err(|_| ParseValueError::Utf8Error)?,
            )),
            2 => Ok(Value::Bytes(payload.to_vec().into())),
            3..=5 => {
                let link = Link::from_bytes(payload).map_err(ParseValueError::ParseLinkError)?;
                Ok(match tag {
                    3 => Value::List(link),
                    4 => Value::Map(link),
                    5 => Value::Link(link),
                    _ => unreachable!(),
                })
            }
            tag => Err(ParseValueError::InvalidTag(tag)),
        }
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        match self {
            Value::Null => vec![0],
            Value::String(s) => {
                let len = 1 + s.as_bytes().len();
                let mut buf = Vec::with_capacity(len);
                buf.push(1);
                buf.extend_from_slice(s.as_bytes());
                buf
            }
            Value::Bytes(bytes) => {
                let len = 1 + bytes.len();
                let mut buf = Vec::with_capacity(len);
                buf.push(2);
                buf.extend_from_slice(bytes);
                buf
            }
            Value::List(l) | Value::Map(l) | Value::Link(l) => {
                let link_data = l.to_bytes();
                let len = link_data.len() + 1;
                let mut buf = Vec::with_capacity(len);
                buf.push(match self {
                    Value::List(_) => 3,
                    Value::Map(_) => 4,
                    Value::Link(_) => 5,
                    _ => unreachable!(),
                });
                buf.extend_from_slice(&link_data);
                buf
            }
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn value_round_trip_ser_de() {
        let nsid1 = NamespaceId::from([
            0u8, 1, 6, 8, 20, 3, 5, 87, 58, 86, 20, 38, 5, 29, 47, 57, 75, 59, 59, 75, 78, 57, 28,
            83, 83, 83, 84, 85, 83, 83, 83, 83,
        ]);
        let nsid2 = NamespaceId::from([
            0u8, 1, 6, 8, 20, 3, 5, 87, 58, 86, 20, 38, 5, 29, 47, 57, 75, 59, 59, 75, 78, 57, 28,
            3, 83, 83, 84, 85, 83, 83, 83, 83,
        ]);
        fn round_trip(v: Value) {
            let b = v.to_bytes();
            let v2 = Value::from_bytes(b).unwrap();
            assert_eq!(v, v2);
        }
        for v in [
            Value::String("Hello world".to_string()),
            Value::Bytes(vec![1, 2, 3, 255, 20, 49, 84].into()),
            Value::Null,
            Value::Map(Link::new(nsid1, "hello world")),
            Value::List(Link::new(nsid2, "goodbye world")),
            Value::List(Link::new(nsid2, "other document")),
        ] {
            round_trip(v)
        }
    }

    #[tokio::test]
    async fn ux() {
        let node = iroh::node::Node::memory().spawn().await.unwrap();
        let ns = node.docs.create().await.unwrap().id();
        let gstore = IrohGStore::new(node.client().clone(), node.authors.default().await.unwrap());

        // Create a string entry
        gstore.put(Link::new(ns, "hello"), "world").await.unwrap();
        assert_eq!(
            "world",
            gstore
                .get(Link::new(ns, "hello"))
                .await
                .unwrap()
                .as_str()
                .unwrap()
        )
    }
}
