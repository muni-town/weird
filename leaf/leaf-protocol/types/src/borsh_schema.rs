use std::collections::{HashMap, HashSet};

use crate::BorshSchema;

pub trait HasBorshSchema {
    fn borsh_schema() -> BorshSchema;
}

macro_rules! impl_primitive {
    ($prim:ty, $var:ident) => {
        impl HasBorshSchema for $prim {
            fn borsh_schema() -> BorshSchema {
                BorshSchema::$var
            }
        }
    };
}
impl_primitive!((), Null);
impl_primitive!(bool, Bool);
impl_primitive!(u8, U8);
impl_primitive!(u16, U16);
impl_primitive!(u32, U32);
impl_primitive!(u64, U64);
impl_primitive!(u128, U128);
impl_primitive!(i8, I8);
impl_primitive!(i16, U16);
impl_primitive!(i32, U32);
impl_primitive!(i64, U64);
impl_primitive!(i128, U128);
impl_primitive!(f32, F32);
impl_primitive!(f64, F64);
impl_primitive!(String, String);

impl<T: HasBorshSchema> HasBorshSchema for Option<T> {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Option {
            schema: Box::new(T::borsh_schema().clone()),
        }
    }
}
impl<T: HasBorshSchema, const N: usize> HasBorshSchema for [T; N] {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Array {
            schema: Box::new(T::borsh_schema().clone()),
            len: N.try_into().unwrap(),
        }
    }
}
impl<T: HasBorshSchema> HasBorshSchema for Vec<T> {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Vector {
            schema: Box::new(T::borsh_schema().clone()),
        }
    }
}
impl<T: HasBorshSchema> HasBorshSchema for HashSet<T> {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Set {
            schema: Box::new(T::borsh_schema().clone()),
        }
    }
}
impl<K: HasBorshSchema, V: HasBorshSchema> HasBorshSchema for HashMap<K, V> {
    fn borsh_schema() -> BorshSchema {
        BorshSchema::Map {
            key: Box::new(K::borsh_schema().clone()),
            value: Box::new(V::borsh_schema().clone()),
        }
    }
}
