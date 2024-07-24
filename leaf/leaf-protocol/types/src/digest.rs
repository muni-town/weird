//! The [`Digest`] used by Leaf types in this crate.

use std::str::FromStr;

use iroh_base::hash::Hash;

/// Wrapper around an Iroh [`Hash`] that implements [`BorshSerialize`] and [`BorshDeserialize`].
#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Digest(pub Hash);
impl From<Digest> for Hash {
    fn from(val: Digest) -> Self {
        val.0
    }
}
impl Digest {
    pub fn new(bytes: &[u8]) -> Self {
        Self(Hash::new(bytes))
    }
    pub fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(Hash::from_bytes(bytes))
    }
}
impl std::fmt::Debug for Digest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_tuple("Digest")
            .field(&format_args!("{}", self.0))
            .finish()
    }
}
impl FromStr for Digest {
    type Err = <Hash as FromStr>::Err;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Ok(Self(FromStr::from_str(s)?))
    }
}
impl std::fmt::Display for Digest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(f)
    }
}
impl From<Hash> for Digest {
    fn from(value: Hash) -> Self {
        Self(value)
    }
}
impl borsh::BorshSerialize for Digest {
    fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
        <[u8; 32] as borsh::BorshSerialize>::serialize(self.0.as_bytes(), writer)
    }
}
impl borsh::BorshDeserialize for Digest {
    fn deserialize_reader<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
        let bytes = <[u8; 32] as borsh::BorshDeserialize>::deserialize_reader(reader)?;
        Ok(Digest(Hash::from_bytes(bytes)))
    }
}
impl std::ops::Deref for Digest {
    type Target = Hash;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
impl std::ops::DerefMut for Digest {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut self.0
    }
}
