//! Graph database on top of Iroh.

use anyhow::Result;
use bytes::Bytes;
use futures::{Stream, StreamExt};
use std::future::Future;
use ulid::Ulid;

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
    async fn get(&self, link: impl Into<Link>) -> Result<GStoreValue<Self>> {
        let link = link.into();
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

    async fn get_map_idx(&self, link: impl Into<Link>, idx: u64) -> Result<GStoreValue<Self>> {
        let link = link.into();
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
        link: impl Into<Link>,
        key: impl Into<Bytes>,
    ) -> Result<GStoreValue<Self>> {
        let link = link.into();
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        // TODO: use smallvec to avoid allocations for reasonable key lengths.
        let key = [link.key.clone(), key.into()].concat();
        let entry = doc.get_one(Query::key_exact(&key)).await?;
        if let Some(entry) = entry {
            let value = entry.content_bytes(&self.iroh).await?;
            let value = Value::from_bytes(value)?;
            Ok(GStoreValue {
                link: (link.namespace, key).into(),
                store: self.clone(),
                value,
            })
        } else {
            Ok(GStoreValue {
                link: (link.namespace, key).into(),
                store: self.clone(),
                value: Value::Null,
            })
        }
    }

    async fn set(&self, link: impl Into<Link>, value: impl Into<Value>) -> Result<()> {
        let link = link.into();
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        doc.set_bytes(self.author, link.key, value.into().to_bytes())
            .await?;
        Ok(())
    }

    async fn set_map_key(
        &self,
        link: impl Into<Link>,
        key: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> Result<Link> {
        let link = link.into();
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        // TODO: use smallvec to avoid allocations for reasonable key lengths.
        let key = Bytes::from([link.key.clone(), key.into()].concat());
        doc.set_bytes(self.author, key.clone(), value.into().to_bytes())
            .await?;

        Ok(Link::new(link.namespace, key))
    }

    async fn list_map_items(
        self,
        link: impl Into<Link>,
    ) -> Result<impl Stream<Item = anyhow::Result<(Bytes, GStoreValue<Self>)>>> {
        let link = link.into();
        let doc =
            self.iroh.docs.open(link.namespace).await?.ok_or_else(|| {
                anyhow::format_err!("Namespace does not exist: {}", link.namespace)
            })?;
        let stream = doc
            .get_many(Query::single_latest_per_key().key_prefix(&link.key))
            .await?
            .then(move |entry_result| {
                let store = self.clone();
                let link = link.clone();
                Box::pin(async move {
                    match entry_result {
                        Ok(entry) => {
                            let key = Bytes::from(entry.key()[link.key.len()..].to_vec());
                            let bytes = entry.content_bytes(&store.iroh).await?;
                            let value = Value::from_bytes(bytes)?;
                            Ok((
                                key,
                                GStoreValue {
                                    link: link.clone(),
                                    store: store.clone(),
                                    value,
                                },
                            ))
                        }
                        Err(e) => Err(e),
                    }
                })
            });

        Ok(stream)
    }
}

pub trait GStoreBackend: Sync + Send + Sized + Clone {
    fn get(&self, link: impl Into<Link>) -> impl Future<Output = Result<GStoreValue<Self>>>;
    fn get_or_init_map(
        &self,
        link: impl Into<Link>,
    ) -> impl Future<Output = Result<GStoreValue<Self>>>
    where
        Self: 'static,
    {
        let link = link.into();
        async move {
            let value = self.get(link.clone()).await?;
            if value.is_null() {
                let new_map_link = Link::new(link.namespace, Ulid::new().to_bytes().to_vec());
                self.set(link.clone(), Value::Map(new_map_link.clone()))
                    .await?;
                Ok(GStoreValue {
                    link,
                    store: self.clone(),
                    value: Value::Map(new_map_link),
                })
            } else {
                Ok(value)
            }
        }
    }
    fn get_map_idx(
        &self,
        link: impl Into<Link>,
        idx: u64,
    ) -> impl Future<Output = Result<GStoreValue<Self>>>;
    fn get_map_key(
        &self,
        link: impl Into<Link>,
        key: impl Into<Bytes>,
    ) -> impl Future<Output = Result<GStoreValue<Self>>>;
    fn get_map_key_or_init_map(
        &self,
        link: impl Into<Link>,
        key: impl Into<Bytes>,
    ) -> impl Future<Output = Result<GStoreValue<Self>>>
    where
        Self: 'static,
    {
        let link = link.into();
        let key = key.into();
        async move {
            let value = self.get_map_key(link.clone(), key.clone()).await?;
            if value.is_null() {
                let new_map_link = Link::new(link.namespace, Ulid::new().to_bytes().to_vec());
                self.set_map_key(link.clone(), key.clone(), Value::Map(new_map_link.clone()))
                    .await?;
                Ok(GStoreValue {
                    link: new_map_link.clone(),
                    store: self.clone(),
                    value: Value::Map(new_map_link),
                })
            } else {
                Ok(value)
            }
        }
    }
    fn list_map_items(
        self,
        link: impl Into<Link>,
    ) -> impl Future<Output = Result<impl Stream<Item = Result<(Bytes, GStoreValue<Self>)>>>>;
    fn set(
        &self,
        link: impl Into<Link>,
        value: impl Into<Value>,
    ) -> impl Future<Output = Result<()>>;
    fn set_map_key(
        &self,
        link: impl Into<Link>,
        key: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> impl Future<Output = Result<Link>>;
}

#[derive(Clone)]
pub struct GStoreValue<G: GStoreBackend> {
    pub link: Link,
    pub store: G,
    pub value: Value,
}
impl<G: GStoreBackend> std::fmt::Debug for GStoreValue<G> {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("GStoreValue")
            .field("link", &self.link)
            .field("value", &self.value)
            .finish_non_exhaustive()
    }
}
impl<G: GStoreBackend + Sync + Send + 'static> GStoreValue<G> {
    pub async fn get_idx(&self, idx: u64) -> Result<Self> {
        match &self.value {
            Value::Map(map_link) => Ok(self.store.get_map_idx(map_link.clone(), idx).await?),
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub async fn get_key(&self, key: impl Into<Bytes>) -> Result<Self> {
        match &self.value {
            Value::Map(map_link) => Ok(self.store.get_map_key(map_link.clone(), key).await?),
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub async fn get_key_or_init_map(&self, key: impl Into<Bytes>) -> Result<Self> {
        match &self.value {
            Value::Map(map_link) => Ok(self
                .store
                .get_map_key_or_init_map(map_link.clone(), key)
                .await?),
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub async fn list_items(&self) -> Result<impl Stream<Item = Result<(Bytes, Self)>>> {
        match &self.value {
            Value::Map(map_link) => Ok(self.store.clone().list_map_items(map_link.clone()).await?),
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub fn as_bytes(&self) -> Result<&Bytes> {
        match &self.value {
            Value::Bytes(b) => Ok(b),
            _ => Err(anyhow::format_err!("item is not bytes: {:?}", self.value)),
        }
    }
    pub fn as_str(&self) -> Result<&str> {
        match &self.value {
            Value::String(s) => Ok(s),
            _ => Err(anyhow::format_err!(
                "item is not a string: {:?}",
                self.value
            )),
        }
    }
    pub async fn set(&mut self, value: impl Into<Value>) -> Result<()> {
        let value = value.into();
        self.store.set(self.link.clone(), value.clone()).await?;
        self.value = value;
        Ok(())
    }
    pub async fn set_key(
        &mut self,
        key: impl Into<Bytes>,
        value: impl Into<Value>,
    ) -> Result<Link> {
        match &self.value {
            Value::Map(map_link) => {
                Ok(self.store.set_map_key(map_link.clone(), key, value).await?)
            }
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub async fn follow_link(&self) -> Result<GStoreValue<G>> {
        match &self.value {
            Value::Link(link) => self.store.get(link.clone()).await,
            _ => Err(anyhow::format_err!("item is not a link: {:?}", self.value)),
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

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Link {
    pub namespace: NamespaceId,
    pub key: Bytes,
}
impl std::fmt::Debug for Link {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Link")
            .field("namespace", &self.namespace)
            .field(
                "key",
                &String::from_utf8(self.key.to_vec())
                    .unwrap_or_else(|_| format!("0x{:X}", self.key)),
            )
            .finish()
    }
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
impl<B: Into<Bytes>> From<(NamespaceId, B)> for Link {
    fn from((namespace, bytes): (NamespaceId, B)) -> Self {
        Link::new(namespace, bytes)
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

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(u8)]
pub enum Value {
    Null,
    String(String),
    Bytes(Bytes),
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
impl std::fmt::Debug for Value {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Null => write!(f, "Null"),
            Self::String(arg0) => f.debug_tuple("String").field(arg0).finish(),
            Self::Bytes(arg0) => f.debug_tuple("Bytes").field(arg0).finish(),
            Self::Map(arg0) => f.debug_tuple("Map").field(arg0).finish(),
            Self::Link(arg0) => f.debug_tuple("Link").field(arg0).finish(),
        }
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
            3..=4 => {
                let link = Link::from_bytes(payload).map_err(ParseValueError::ParseLinkError)?;
                Ok(match tag {
                    3 => Value::Map(link),
                    4 => Value::Link(link),
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
            Value::Map(l) | Value::Link(l) => {
                let link_data = l.to_bytes();
                let len = link_data.len() + 1;
                let mut buf = Vec::with_capacity(len);
                buf.push(match self {
                    Value::Map(_) => 3,
                    Value::Link(_) => 4,
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
        gstore.set(Link::new(ns, "hello"), "world").await.unwrap();
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
