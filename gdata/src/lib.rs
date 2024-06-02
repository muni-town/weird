//! Graph database on top of Iroh.

use iroh_docs::NamespaceId;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Link {
    pub namespace: NamespaceId,
    pub key: Vec<u8>,
}

const NAMESPACE_SIZE: usize = std::mem::size_of::<NamespaceId>();
impl Link {
    pub fn new(namespace: NamespaceId, key: impl AsRef<[u8]>) -> Self {
        Self {
            namespace,
            key: key.as_ref().to_vec(),
        }
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self, ParseLinkError> {
        if bytes.len() < NAMESPACE_SIZE {
            return Err(ParseLinkError::TooShort);
        }
        let (namespace, key) = bytes.split_at(NAMESPACE_SIZE);
        let namespace: [u8; NAMESPACE_SIZE] = namespace.try_into().unwrap();
        let namespace = NamespaceId::from(namespace);
        let key = key.to_vec();
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
    Bytes(Vec<u8>),
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
        Value::Bytes(value)
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
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, ParseValueError> {
        if bytes.is_empty() {
            return Err(ParseValueError::ZeroSizedBuffer);
        }
        let (tag, payload) = bytes.split_at(1);
        let tag = tag[0];
        match tag {
            0 => Ok(Value::Null),
            1 => Ok(Value::String(
                String::from_utf8(payload.to_vec()).map_err(|_| ParseValueError::Utf8Error)?,
            )),
            2 => Ok(Value::Bytes(payload.to_vec())),
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
            let v2 = Value::from_bytes(&b).unwrap();
            assert_eq!(v, v2);
        }
        for v in [
            Value::String("Hello world".to_string()),
            Value::Bytes(vec![1, 2, 3, 255, 20, 49, 84]),
            Value::Null,
            Value::Map(Link::new(nsid1, "hello world")),
            Value::List(Link::new(nsid2, "goodbye world")),
            Value::List(Link::new(nsid2, "other document")),
        ] {
            round_trip(v)
        }
    }
}
