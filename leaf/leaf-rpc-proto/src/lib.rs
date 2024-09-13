use std::collections::HashMap;

use leaf_protocol::types::{
    ComponentData, Digest, Entity, ExactLink, NamespaceId, NamespaceSecretKey, SubspaceId,
    SubspaceSecretKey,
};

#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug)]
pub struct Req {
    pub id: u64,
    pub kind: ReqKind,
}

#[derive(borsh::BorshSerialize, borsh::BorshDeserialize, Debug)]
pub struct Resp {
    pub id: u64,
    pub result: Result<RespKind, String>,
}

#[derive(borsh::BorshDeserialize, borsh::BorshSerialize, Debug)]
pub enum ReqKind {
    Authenticate(String),
    ReadEntity(ExactLink),
    DelEntity(ExactLink),
    GetComponentsBySchema {
        link: ExactLink,
        schemas: Vec<Digest>,
    },
    DelComponentsBySchema {
        link: ExactLink,
        schemas: Vec<Digest>,
    },
    // TODO: Support Batch Updating Entities Somehow
    // Such as when you want to delete and replace a number of components. That's mostly the
    // use-case we need I think.
    AddComponents {
        /// The entity to update.
        link: ExactLink,
        /// The components to add.
        components: Vec<ComponentData>,
        /// Causes any components with the same schema as an added component to replace the previous
        /// components.
        replace_existing: bool,
    },
    ListEntities(ExactLink),
    CreateNamespace,
    ImportNamespaceSecret(NamespaceSecretKey),
    GetNamespaceSecret(NamespaceId),
    CreateSubspace,
    ImportSubspaceSecret(SubspaceSecretKey),
    GetSubspaceSecret(SubspaceId),
    GetLocalSecret(String),
    SetLocalSecret(String, Option<String>),
    ListLocalSecrets,
}

#[derive(borsh::BorshSerialize, borsh::BorshDeserialize, Debug)]
pub struct GetComponentsInner {
    pub entity_digest: Digest,
    pub components: HashMap<Digest, Vec<Vec<u8>>>,
}

#[derive(borsh::BorshSerialize, borsh::BorshDeserialize, Debug)]
pub enum RespKind {
    Authenticated,
    ReadEntity(Option<(Digest, Entity)>),
    DelEntity,
    GetComponentBySchema(Option<GetComponentsInner>),
    DelComponentBySchema(Option<Digest>),
    AddComponents(Digest),
    ListEntities(Vec<ExactLink>),
    CreateNamespace(NamespaceId),
    ImportNamespaceSecret(NamespaceId),
    GetNamespaceSecret(Option<NamespaceSecretKey>),
    CreateSubspace(SubspaceId),
    ImportSubspaceSecret(SubspaceId),
    GetSubspaceSecret(Option<SubspaceSecretKey>),
    GetLocalSecret(Option<String>),
    SetLocalSecret,
    ListLocalSecrets(HashMap<String, String>),
}
