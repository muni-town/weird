//! Graph database on top of Iroh.

use anyhow::Result;
use futures::{Stream, StreamExt};
use quic_rpc::transport::flume::FlumeConnection;
use quick_cache::sync::Cache;
use smallstr::SmallString;
use smallvec::SmallVec;
use std::{future::Future, sync::Arc};

use iroh::{
    client::RpcService,
    docs::{store::Query, AuthorId, NamespaceId},
};

type Doc = iroh::client::docs::Doc<FlumeConnection<RpcService>>;

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Link {
    pub namespace: NamespaceId,
    pub key: Key,
}

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash, Default)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct Key(pub SmallVec<[KeySegment; 8]>);

#[derive(Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum KeySegment {
    Bool(bool),
    Uint(u64),
    Int(i64),
    String(SmallString<[u8; 32]>),
    Bytes(SmallVec<[u8; 32]>),
}

#[derive(Clone, PartialEq, PartialOrd, Debug)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum Value {
    Null,
    Bool(bool),
    Uint(u64),
    Int(i64),
    Float(f64),
    String(SmallString<[u8; 32]>),
    Bytes(SmallVec<[u8; 32]>),
    Link(Box<Link>),
    Map,
}

impl std::fmt::Display for Key {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_list().entries(self.0.iter()).finish()
    }
}
impl std::fmt::Debug for Key {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self}")
    }
}
impl std::fmt::Display for KeySegment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            KeySegment::Bool(b) => write!(f, "{b}"),
            KeySegment::Uint(i) => write!(f, "{i}"),
            KeySegment::Int(i) => write!(f, "{i}"),
            KeySegment::String(s) => write!(f, "{s:?}"),
            KeySegment::Bytes(b) => {
                write!(f, "0x")?;
                for byte in b.iter() {
                    write!(f, "{byte:X}")?;
                }
                Ok(())
            }
        }
    }
}
impl std::fmt::Debug for KeySegment {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{self}")
    }
}
impl std::ops::Deref for Key {
    type Target = SmallVec<[KeySegment; 8]>;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl std::ops::DerefMut for Key {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}

macro_rules! impl_from_for_value {
    ($from:ty, $e:expr) => {
        impl From<$from> for Value {
            fn from(value: $from) -> Self {
                $e(value)
            }
        }
    };
}
impl_from_for_value!((), |_| Value::Null);
impl_from_for_value!(String, |x| Value::String(SmallString::from(x)));
impl_from_for_value!(&str, |x| Value::String(SmallString::from(x)));
impl_from_for_value!(Vec<u8>, |x| Value::Bytes(SmallVec::from(x)));
impl_from_for_value!(u64, Value::Uint);
impl_from_for_value!(i64, Value::Int);
impl_from_for_value!(f64, Value::Float);
impl<T: Into<Link>> From<T> for Value {
    fn from(value: T) -> Self {
        Self::Link(Box::new(value.into()))
    }
}
macro_rules! impl_from_for_key_segment {
    ($from:ty, $e:expr) => {
        impl From<$from> for KeySegment {
            fn from(value: $from) -> Self {
                $e(value)
            }
        }
    };
}
impl_from_for_key_segment!(&str, |x| KeySegment::String(SmallString::from(x)));
impl_from_for_key_segment!(String, |x| KeySegment::String(SmallString::from(x)));
impl_from_for_key_segment!(&[u8], |x| KeySegment::Bytes(SmallVec::from(x)));
impl_from_for_key_segment!(bool, KeySegment::Bool);
impl_from_for_key_segment!(u64, KeySegment::Uint);
impl_from_for_key_segment!(i64, KeySegment::Int);
impl KeySegment {
    pub fn as_str(&self) -> Option<&str> {
        if let Self::String(s) = self {
            Some(s.as_str())
        } else {
            None
        }
    }
}
impl From<()> for Key {
    fn from(_: ()) -> Self {
        Default::default()
    }
}
impl<T: Into<KeySegment>> From<T> for Key {
    fn from(value: T) -> Self {
        [value].into()
    }
}
impl<T: Into<KeySegment>, const N: usize> From<[T; N]> for Key {
    fn from(value: [T; N]) -> Self {
        Key(value.into_iter().map(|x| x.into()).collect())
    }
}

#[derive(Clone, Debug)]
pub struct IrohGStore {
    pub iroh: iroh::client::MemIroh,
    pub default_author: AuthorId,
    pub docs: Arc<Cache<NamespaceId, Doc>>,
}
impl IrohGStore {
    /// Open a document.
    ///
    /// This is a temporary workaround for <https://github.com/n0-computer/iroh/issues/2381>.
    pub async fn open(&self, ns: NamespaceId) -> anyhow::Result<Doc> {
        self.docs
            .get_or_insert_async(&ns, async {
                self.iroh
                    .docs()
                    .open(ns)
                    .await?
                    .ok_or_else(|| anyhow::format_err!("doc does not exist"))
            })
            .await
    }
}
impl IrohGStore {
    /// Create a new [`IrohGStore`] that wraps an iroh client.
    /// 
    /// The `default_author` is used when writing entries if another author is not specified.
    pub fn new(iroh: iroh::client::MemIroh, default_author: AuthorId) -> Self {
        Self {
            iroh,
            default_author,
            docs: Arc::new(Cache::new(5)),
        }
    }
    pub fn key_segment_byte_discriminant(seg: &KeySegment) -> u8 {
        match seg {
            KeySegment::Bool(_) => 0,
            KeySegment::Uint(_) => 1,
            KeySegment::Int(_) => 2,
            KeySegment::String(_) => 3,
            KeySegment::Bytes(_) => 4,
        }
    }
    pub fn key_segment_to_bytes(seg: &KeySegment) -> SmallVec<[u8; 32]> {
        let mut buf = SmallVec::<[u8; 32]>::new();
        buf.push(Self::key_segment_byte_discriminant(seg));
        match seg {
            KeySegment::Bool(b) => buf.push(if *b { 1 } else { 0 }),
            KeySegment::Uint(i) => buf.extend_from_slice(&i.to_le_bytes()),
            KeySegment::Int(i) => buf.extend_from_slice(&i.to_le_bytes()),
            KeySegment::String(s) => buf.extend_from_slice(s.as_bytes()),
            KeySegment::Bytes(b) => buf.extend_from_slice(b),
        }
        let out_max_len = cobs::max_encoding_length(buf.len());
        let mut out = SmallVec::from_elem(0, out_max_len);
        let len = cobs::encode(&buf, &mut out);
        out.truncate(len);
        out
    }
    pub fn key_segment_from_bytes(bytes: &mut [u8]) -> Result<KeySegment, InvalidFormatError> {
        let len = cobs::decode_in_place(bytes).map_err(|_| InvalidFormatError)?;
        let bytes = &bytes[0..len];
        let discriminant = bytes.first().ok_or(InvalidFormatError)?;
        const INTSIZE: usize = std::mem::size_of::<u64>();
        let seg = match discriminant {
            0 if bytes.len() == 2 => KeySegment::Bool(bytes[1] != 0),
            1 if bytes.len() == 1 + INTSIZE => {
                KeySegment::Uint(u64::from_le_bytes(bytes[1..].try_into().unwrap()))
            }
            2 if bytes.len() == 1 + INTSIZE => {
                KeySegment::Int(i64::from_le_bytes(bytes[1..].try_into().unwrap()))
            }
            3 => KeySegment::String(
                std::str::from_utf8(&bytes[1..])
                    .map_err(|_| InvalidFormatError)
                    .map(SmallString::from)?,
            ),
            4 => KeySegment::Bytes(SmallVec::from(&bytes[1..])),
            _ => return Err(InvalidFormatError),
        };
        Ok(seg)
    }
    pub fn key_to_bytes(key: &Key) -> SmallVec<[u8; 128]> {
        let mut buf = SmallVec::<[u8; 128]>::new();
        for seg in key.iter() {
            let seg_bytes = Self::key_segment_to_bytes(seg);
            let len: u16 = seg_bytes.len().try_into().expect("Key too long");
            assert_ne!(len, 0, "Zero length key segment!?");
            buf.extend_from_slice(&len.to_le_bytes());
            buf.extend_from_slice(&seg_bytes);
        }
        buf.push(0); // Add null terminator
        buf
    }
    pub fn key_from_bytes(bytes: &[u8]) -> Result<Key, InvalidFormatError> {
        // Remove null terminator
        let len = bytes.len() - 1;
        if bytes[len] != 0 {
            return Err(InvalidFormatError);
        }
        let mut bytes = &bytes[0..len];
        if bytes.is_empty() {
            return Ok(Key::default());
        }

        let mut segments = SmallVec::new();
        loop {
            match bytes {
                [b0, b1, rest @ ..] => {
                    let len = [*b0, *b1];
                    let len = u16::from_le_bytes(len) as usize;
                    if rest.len() < len {
                        return Err(InvalidFormatError);
                    }
                    let seg_bytes = &rest[0..len];
                    let seg =
                        Self::key_segment_from_bytes(&mut SmallVec::<[u8; 32]>::from(seg_bytes))?;
                    segments.push(seg);

                    if rest.len() > len {
                        bytes = &rest[len..];
                    } else {
                        break;
                    }
                }
                _ => return Err(InvalidFormatError),
            }
        }
        Ok(Key(segments))
    }
    pub fn link_from_bytes(bytes: &[u8]) -> Result<Link, InvalidFormatError> {
        if bytes.len() < NAMESPACE_SIZE {
            return Err(InvalidFormatError);
        }
        let (namespace, key) = bytes.split_at(NAMESPACE_SIZE);
        let namespace: [u8; NAMESPACE_SIZE] = namespace[..].try_into().unwrap();
        let namespace = NamespaceId::from(namespace);
        Ok(Link {
            namespace,
            key: Self::key_from_bytes(key)?,
        })
    }
    pub fn link_to_bytes(link: &Link) -> Vec<u8> {
        let key_bytes = Self::key_to_bytes(&link.key);
        let mut buf = Vec::with_capacity(32 + key_bytes.len());
        buf.extend_from_slice(link.namespace.as_bytes());
        buf.extend_from_slice(&key_bytes);
        buf
    }
    pub fn value_byte_discriminant(value: &Value) -> u8 {
        match value {
            Value::Null => 0,
            Value::Bool(_) => 1,
            Value::Uint(_) => 2,
            Value::Int(_) => 3,
            Value::Float(_) => 4,
            Value::String(_) => 5,
            Value::Bytes(_) => 6,
            Value::Link(_) => 7,
            Value::Map => 8,
        }
    }
    pub fn value_to_bytes(value: &Value) -> SmallVec<[u8; 64]> {
        let mut buf = SmallVec::new();
        buf.push(Self::value_byte_discriminant(value));
        match value {
            Value::Null => (),
            Value::Bool(b) => buf.push(if *b { 1 } else { 0 }),
            Value::Uint(i) => buf.extend_from_slice(&i.to_le_bytes()),
            Value::Int(i) => buf.extend_from_slice(&i.to_le_bytes()),
            Value::Float(f) => buf.extend_from_slice(&f.to_le_bytes()),
            Value::String(s) => buf.extend_from_slice(s.as_bytes()),
            Value::Bytes(b) => buf.extend_from_slice(b),
            Value::Link(l) => buf.extend_from_slice(&Self::link_to_bytes(l)),
            Value::Map => (),
        }
        buf
    }
    pub fn value_from_bytes(bytes: &[u8]) -> Result<Value, InvalidFormatError> {
        Ok(match bytes {
            [0] => Value::Null,
            [1, 0] => Value::Bool(false),
            [1, 1] => Value::Bool(true),
            [2, b0, b1, b2, b3, b4, b5, b6, b7] => {
                Value::Uint(u64::from_le_bytes([*b0, *b1, *b2, *b3, *b4, *b5, *b6, *b7]))
            }
            [3, b0, b1, b2, b3, b4, b5, b6, b7] => {
                Value::Int(i64::from_le_bytes([*b0, *b1, *b2, *b3, *b4, *b5, *b6, *b7]))
            }
            [4, b0, b1, b2, b3, b4, b5, b6, b7] => {
                Value::Float(f64::from_le_bytes([*b0, *b1, *b2, *b3, *b4, *b5, *b6, *b7]))
            }
            [5, rest @ ..] => Value::String(SmallString::from_str(
                std::str::from_utf8(rest).map_err(|_| InvalidFormatError)?,
            )),
            [6, rest @ ..] => Value::Bytes(SmallVec::from(rest)),
            [7, rest @ ..] => Value::Link(Box::new(Self::link_from_bytes(rest)?)),
            [8] => Value::Map,
            _ => return Err(InvalidFormatError),
        })
    }
}

impl GStoreBackend for IrohGStore {
    fn default_author(&self) -> AuthorId {
        self.default_author
    }
    async fn get(&self, link: impl Into<Link>) -> Result<GStoreValue<Self>> {
        let link = link.into();
        let doc = self.open(link.namespace).await?;
        let entry = doc
            .get_one(Query::single_latest_per_key().key_exact(&Self::key_to_bytes(&link.key)))
            .await?;
        if let Some(entry) = entry {
            let value = entry.content_bytes(&self.iroh).await?;
            let value = Self::value_from_bytes(&value)?;
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value,
                current_author: None,
            })
        } else {
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value: Value::Null,
                current_author: None,
            })
        }
    }

    async fn get_idx(&self, link: impl Into<Link>, idx: u64) -> Result<GStoreValue<Self>> {
        let link = link.into();
        let doc = self.open(link.namespace).await?;
        let entry = doc
            .get_one(
                Query::single_latest_per_key()
                    .key_exact(&Self::key_to_bytes(&link.key))
                    .offset(idx)
                    .limit(1),
            )
            .await?;
        if let Some(entry) = entry {
            let value = entry.content_bytes(&self.iroh).await?;
            let value = Self::value_from_bytes(&value)?;
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value,
                current_author: None,
            })
        } else {
            Ok(GStoreValue {
                link,
                store: self.clone(),
                value: Value::Null,
                current_author: None,
            })
        }
    }

    async fn set_with_author(
        &self,
        link: impl Into<Link>,
        value: impl Into<Value>,
        author: AuthorId,
    ) -> Result<GStoreValue<Self>> {
        let link = link.into();
        let doc = self.open(link.namespace).await?;
        let key_bytes = Self::key_to_bytes(&link.key);
        let value = value.into();
        doc.set_bytes(
            author,
            key_bytes.to_vec(),
            Self::value_to_bytes(&value).to_vec(),
        )
        .await?;
        Ok(GStoreValue {
            link,
            store: self.clone(),
            value,
            current_author: None,
        })
    }

    async fn list(
        self,
        link: impl Into<Link>,
        recursive: bool,
    ) -> Result<impl Stream<Item = anyhow::Result<GStoreValue<Self>>>> {
        let link = link.into();
        let doc = self.open(link.namespace).await?;
        let mut key_bytes = Self::key_to_bytes(&link.key);
        assert_eq!(
            key_bytes.pop().unwrap(),
            0,
            "missing null terminator for key"
        );

        let stream = doc
            .get_many(Query::single_latest_per_key().key_prefix(&key_bytes))
            .await?
            .filter_map(move |entry_result| {
                let store = self.clone();
                let link = link.clone();
                Box::pin(async move {
                    let result = async move {
                        match entry_result {
                            Ok(entry) => {
                                let key =
                                    Self::key_from_bytes(&SmallVec::<[u8; 32]>::from(entry.key()))?;
                                // Ignore keys that are not a direct child, i.e. grandchildren
                                if !recursive && key.len() != link.key.len() + 1 {
                                    return Ok(None);
                                }
                                let bytes = entry.content_bytes(&store.iroh).await?;
                                let value = Self::value_from_bytes(&bytes)?;
                                Ok(Some(GStoreValue {
                                    link: (link.namespace, key).into(),
                                    store: store.clone(),
                                    value,
                                    current_author: None,
                                }))
                            }
                            Err(e) => Err(e),
                        }
                    }
                    .await;

                    result.transpose()
                })
            });

        Ok(stream)
    }

    async fn del_with_author(&self, link: impl Into<Link>, author: AuthorId) -> Result<()> {
        let link = link.into();
        let doc = self.open(link.namespace).await?;
        doc.del(author, Self::key_to_bytes(&link.key).to_vec())
            .await?;
        Ok(())
    }
}

pub trait GStoreBackend: Sync + Send + Sized + Clone + 'static {
    fn default_author(&self) -> AuthorId;
    fn get(&self, link: impl Into<Link>) -> impl Future<Output = Result<GStoreValue<Self>>>;
    fn get_or_init_map(
        &self,
        link: impl Into<Link>,
    ) -> impl Future<Output = Result<GStoreValue<Self>>> {
        self.get_or_init_map_with_author(link, self.default_author())
    }
    fn get_or_init_map_with_author(
        &self,
        link: impl Into<Link>,
        author: AuthorId,
    ) -> impl Future<Output = Result<GStoreValue<Self>>> {
        let link = link.into();
        async move {
            let mut value = self.get(link.clone()).await?;
            if value.is_null() {
                value = self.set_with_author(link, Value::Map, author).await?
            } else if !matches!(value.value, Value::Map) {
                return Err(anyhow::format_err!(
                    "Value is not null or a map, not initing map."
                ));
            };
            Ok(value)
        }
    }
    fn get_idx(
        &self,
        link: impl Into<Link>,
        idx: u64,
    ) -> impl Future<Output = Result<GStoreValue<Self>>>;
    fn list(
        self,
        link: impl Into<Link>,
        recursive: bool,
    ) -> impl Future<Output = Result<impl Stream<Item = Result<GStoreValue<Self>>>>>;
    fn set(
        &self,
        link: impl Into<Link>,
        value: impl Into<Value>,
    ) -> impl Future<Output = Result<GStoreValue<Self>>> {
        self.set_with_author(link, value, self.default_author())
    }
    fn set_with_author(
        &self,
        link: impl Into<Link>,
        value: impl Into<Value>,
        author: AuthorId,
    ) -> impl Future<Output = Result<GStoreValue<Self>>>;
    fn del(&self, link: impl Into<Link>) -> impl Future<Output = Result<()>> {
        self.del_with_author(link, self.default_author())
    }
    fn del_with_author(
        &self,
        link: impl Into<Link>,
        author: AuthorId,
    ) -> impl Future<Output = Result<()>>;
}

#[derive(Clone)]
pub struct GStoreValue<G: GStoreBackend> {
    pub link: Link,
    pub store: G,
    pub value: Value,
    pub current_author: Option<AuthorId>,
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
    pub fn with_author(mut self, author_id: Option<AuthorId>) -> Self {
        self.current_author = author_id;
        self
    }
    pub async fn get_idx(&self, idx: u64) -> Result<Self> {
        match &self.value {
            Value::Map => Ok(self
                .store
                .get_idx(self.link.clone(), idx)
                .await?
                .with_author(self.current_author)),
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub async fn get_key(&self, key: impl Into<KeySegment>) -> Result<Self> {
        let mut link = self.link.clone();
        link.key.push(key.into());
        match &self.value {
            Value::Map => Ok(self.store.get(link).await?.with_author(self.current_author)),
            v => Err(anyhow::format_err!("item is not a map: {:?}", v)),
        }
    }
    pub async fn get_key_or_init_map(&self, key: impl Into<KeySegment>) -> Result<Self> {
        let mut key_link = self.link.clone();
        key_link.key.push(key.into());
        match &self.value {
            Value::Map => Ok(self
                .store
                .get_or_init_map_with_author(
                    key_link,
                    self.current_author.unwrap_or(self.store.default_author()),
                )
                .await?
                .with_author(self.current_author)),
            v => Err(anyhow::format_err!(
                "value is not a map or null, not initing map: {:?}",
                v
            )),
        }
    }
    pub async fn list_items(&self) -> Result<impl Stream<Item = Result<Self>>> {
        let current_author = self.current_author;
        match &self.value {
            Value::Map => Ok(self
                .store
                .clone()
                .list(self.link.clone(), false)
                .await?
                .map(move |item| item.map(|x| x.with_author(current_author)))),
            v => Err(anyhow::format_err!("item is not a map: {:?}", v)),
        }
    }
    pub async fn list_items_recursive(&self) -> Result<impl Stream<Item = Result<Self>>> {
        let current_author = self.current_author;
        match &self.value {
            Value::Map => Ok(self
                .store
                .clone()
                .list(self.link.clone(), true)
                .await?
                .map(move |item| item.map(|x| x.with_author(current_author)))),
            v => Err(anyhow::format_err!("item is not a map: {:?}", v)),
        }
    }
    pub fn as_bytes(&self) -> Result<&SmallVec<[u8; 32]>> {
        match &self.value {
            Value::Bytes(b) => Ok(b),
            v => Err(anyhow::format_err!("item is not bytes: {:?}", v)),
        }
    }
    pub fn as_str(&self) -> Result<&str> {
        match &self.value {
            Value::String(s) => Ok(s),
            v => Err(anyhow::format_err!("item is not a string: {:?}", v)),
        }
    }
    pub async fn set(&mut self, value: impl Into<Value>) -> Result<()> {
        let value = value.into();
        self.store
            .set_with_author(
                self.link.clone(),
                value.clone(),
                self.current_author.unwrap_or(self.store.default_author()),
            )
            .await?
            .with_author(self.current_author);
        self.value = value;
        Ok(())
    }
    pub async fn set_key(
        &self,
        key: impl Into<KeySegment>,
        value: impl Into<Value>,
    ) -> Result<GStoreValue<G>> {
        let mut key_link = self.link.clone();
        key_link.key.push(key.into());
        match &self.value {
            Value::Map => Ok(self
                .store
                .set_with_author(
                    key_link,
                    value,
                    self.current_author.unwrap_or(self.store.default_author()),
                )
                .await?
                .with_author(self.current_author)),
            v => Err(anyhow::format_err!("item is not a map: {:?}", v)),
        }
    }
    pub async fn del_key(&mut self, key: impl Into<KeySegment>) -> Result<()> {
        let mut key_link = self.link.clone();
        key_link.key.push(key.into());
        match &self.value {
            Value::Map => Ok(self
                .store
                .del_with_author(
                    key_link,
                    self.current_author.unwrap_or(self.store.default_author()),
                )
                .await?),
            _ => Err(anyhow::format_err!("item is not a map: {:?}", self.value)),
        }
    }
    pub async fn del_all_keys(&self) -> Result<()> {
        let stream = self.list_items().await?;
        futures::pin_mut!(stream);
        while let Some(result) = stream.next().await {
            let value = result?;
            if value.is_map() {
                Box::pin(value.del_all_keys()).await?;
            }
            self.store
                .del_with_author(
                    value.link,
                    self.current_author.unwrap_or(self.store.default_author()),
                )
                .await?;
        }

        Ok(())
    }
    pub async fn follow_link(&self) -> Result<GStoreValue<G>> {
        match &self.value {
            Value::Link(link) => Ok(self
                .store
                .get(*link.clone())
                .await?
                .with_author(self.current_author)),
            _ => Err(anyhow::format_err!("item is not a link: {:?}", self.value)),
        }
    }
    pub fn is_null(&self) -> bool {
        matches!(self.value, Value::Null)
    }
    pub fn is_map(&self) -> bool {
        matches!(self.value, Value::Map)
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

impl std::fmt::Debug for Link {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Link")
            .field("namespace", &self.namespace)
            .field("key", &self.key)
            .finish()
    }
}

const NAMESPACE_SIZE: usize = std::mem::size_of::<NamespaceId>();
impl Link {
    pub fn new(namespace: NamespaceId, key: impl Into<Key>) -> Self {
        Self {
            namespace,
            key: key.into(),
        }
    }
}
impl<K: Into<Key>> From<(NamespaceId, K)> for Link {
    fn from((namespace, key): (NamespaceId, K)) -> Self {
        Link::new(namespace, key)
    }
}

#[derive(Clone, Debug)]
pub struct InvalidFormatError;
impl std::fmt::Display for InvalidFormatError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "Invalid format, could not parse bytes.")
    }
}
impl std::error::Error for InvalidFormatError {}

#[cfg(test)]
mod test {
    use super::*;

    #[test]
    fn round_trip_key_segment() {
        macro_rules! roundtrip {
            ($v:expr) => {
                assert_eq!(
                    $v,
                    IrohGStore::key_segment_from_bytes(&mut SmallVec::<[u8; 32]>::from(
                        IrohGStore::key_segment_to_bytes(&$v)
                    ))
                    .unwrap()
                )
            };
        }
        roundtrip!(KeySegment::Bool(true));
    }
}
