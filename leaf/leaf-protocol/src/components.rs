//! Common Leaf components.

use borsh::{BorshDeserialize, BorshSerialize};
use leaf_protocol_macros::HasBorshSchema;

use crate::{
    types::{BorshSchema, HasBorshSchema},
    Component, Digest,
};

/// The `UTF-8` component. The most fundamental component, which is primarily used for documenting
/// other component specifications.
#[derive(BorshDeserialize, BorshSerialize, Component, HasBorshSchema, Debug)]
#[component(
    name = "UTF-8",
    schema_id = "2q5uytuwznlk6krd7ugl65gq2eokpbo3e5i6wq5ftmzv27opk6pq"
)]
pub struct Utf8(pub String);

#[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
#[component(
    schema_id = "znqyvzghvyafsj6n5wyhgl7mspy3swlofxeh2nattvtql5amtcda",
    no_compute_schema_id
)]
pub struct Name(pub String);

#[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
#[component(
    schema_id = "bt6wzovlhtmwnqk4o4pqpfutjkakfzaglvhg4pd26mmp3sgakg3a",
    no_compute_schema_id
)]
pub struct Description(pub String);

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
// #[component(
//     specification = "leaf-schemas/DateCreated",
//     schema_id = "6qrsqqeso44tmy4y2gpmb7o4x2j3kdzjeuypfnpvmc74zahhsiwa"
// )]
// pub struct DateCreated(pub u64);

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
// #[component(
//     specification = "leaf-schemas/DateUpdated",
//     schema_id = "3qdqzps5y3zu4sc4vc737xkwzl6va2vatcmtxplgruu2fd4joeqq"
// )]
// pub struct DateUpdated(pub u64);

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
// #[component(
//     specification = "leaf-schemas/CommonMark",
//     schema_id = "uy5tkom2uchinxo5pyouwwobj4efhsvw7bws2rjkobl66je7cnbq"
// )]
// pub struct CommonMark(pub u64);

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
// #[component(
//     specification = "leaf-schemas/ReplyTo",
//     schema_id = "wodv3ehssd64ooyl7bgzocbyvznihzranh4b5lgi6e7uh6wvbczq"
// )]
// pub struct ReplyTo(pub Link);

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
// #[component(
//     specification = "leaf-schemas/Embed",
//     schema_id = "wvnxhyf4p3ido3pfvvfjth4g3qt7sjusf3plfrqpo44l7o6cfa4a"
// )]
// pub struct Embed(pub Link);

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Component, Debug)]
// #[component(
//     specification = "leaf-schemas/Image",
//     schema_id = "b7yadsp7e2lt6swf7d6lc6e4244h2xk327k3aekzafcp4jnxi2jq"
// )]
// pub struct Image {
//     mime_type: String,
//     size: ImageSize,
//     data: Blob,
// }

// #[derive(BorshDeserialize, BorshSerialize, HasBorshSchema, Debug)]
// pub struct ImageSize {
//     width: u32,
//     height: u32,
// }
