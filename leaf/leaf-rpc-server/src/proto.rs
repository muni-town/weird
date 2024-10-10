use std::{collections::HashMap, sync::Arc};

use axum::{extract::State, response::IntoResponse};
use fastwebsockets::{Frame, OpCode, Payload, WebSocketError};
use futures::{pin_mut, StreamExt};
use leaf_protocol::prelude::*;
use leaf_rpc_proto::*;

use crate::{AppState, ARGS, SECRET_TABLE};

pub async fn ws_handler(
    state: State<AppState>,
    ws: fastwebsockets::upgrade::IncomingUpgrade,
) -> impl IntoResponse {
    let (response, fut) = ws.upgrade().unwrap();

    tokio::task::spawn(async move {
        if let Err(e) = handle_client(state, fut).await {
            eprintln!("Error in websocket connection: {}", e);
        }
    });

    response
}

async fn handle_client(
    state: State<AppState>,
    fut: fastwebsockets::upgrade::UpgradeFut,
) -> Result<(), WebSocketError> {
    let leaf = &state.leaf;
    let secretdb = state.secretdb.clone();
    let mut ws = fastwebsockets::FragmentCollector::new(fut.await?);
    let mut authenticated = false;

    loop {
        let frame = ws.read_frame().await?;
        let result: anyhow::Result<bool> = async {
            match frame.opcode {
                OpCode::Close => {
                    return Ok(true);
                }
                OpCode::Text => {
                    ws.write_frame(Frame::text(Payload::Borrowed(
                        b"Text transport not supported",
                    )))
                    .await?;
                }
                OpCode::Binary => {
                    let req = Req::deserialize(&mut &*frame.payload)?;

                    if authenticated {
                        let resp = handle_req(leaf, secretdb.clone(), req).await;
                        let mut buf = Vec::new();
                        resp.serialize(&mut buf)?;
                        ws.write_frame(Frame::binary(Payload::Owned(buf))).await?;

                    // If we aren't authenticated yet
                    } else {
                        if let ReqKind::Authenticate(token) = req.kind {
                            if token == ARGS.api_key {
                                authenticated = true;
                                let mut buf = Vec::new();
                                Resp {
                                    id: req.id,
                                    result: Ok(RespKind::Authenticated),
                                }
                                .serialize(&mut buf)?;
                                ws.write_frame(Frame::binary(Payload::Owned(buf))).await?;
                                return Ok(false);
                            }
                        }

                        let mut buf = Vec::new();
                        Resp {
                            id: req.id,
                            result: Err("Unauthenticated".into()),
                        }
                        .serialize(&mut buf)?;
                        ws.write_frame(Frame::binary(Payload::Owned(buf))).await?;
                        anyhow::bail!("Unauthenticated");
                    }
                }
                _ => (),
            }
            Ok(false)
        }
        .await;

        match result {
            Ok(should_close) => {
                if should_close {
                    break;
                }
            }
            Err(err) => {
                ws.write_frame(Frame::text(Payload::Owned(err.to_string().into())))
                    .await?;
                tracing::error!("Error in websocket handler: {err}");
                break;
            }
        }
    }

    Ok(())
}

async fn handle_req(leaf: &LeafIroh, secretdb: Arc<Option<redb::Database>>, req: Req) -> Resp {
    let kind = match req.kind {
        ReqKind::Authenticate(_) => {
            // TODO: we can hit this somehow when restarting the RPC server while Weird tries to
            // reconnect to it and send it messages.
            panic!("authenticate request should be handled outside this function")
        }
        ReqKind::ReadEntity(link) => read_entity(leaf, link).await,
        ReqKind::DelEntity(link) => del_entity(leaf, link).await,
        ReqKind::GetComponentsBySchema { link, schemas } => {
            get_components_by_schema(leaf, link, schemas).await
        }
        ReqKind::DelComponentsBySchema { link, schemas } => {
            del_components_by_schema(leaf, link, schemas).await
        }
        ReqKind::AddComponents {
            link,
            components,
            replace_existing,
        } => add_components(leaf, link, components, replace_existing).await,
        ReqKind::ListEntities(link) => list_entities(leaf, link).await,
        ReqKind::CreateNamespace => create_namespace(leaf).await,
        ReqKind::ImportNamespaceSecret(secret) => import_namespace_secret(leaf, secret).await,
        ReqKind::GetNamespaceSecret(namespace) => get_namespace_secret(leaf, namespace).await,
        ReqKind::CreateSubspace => create_subspace(leaf).await,
        ReqKind::ImportSubspaceSecret(secret) => import_subspace_secret(leaf, secret).await,
        ReqKind::GetSubspaceSecret(subspace) => get_subspace_secret(leaf, subspace).await,
        ReqKind::GetLocalSecret(key) => get_local_secret(secretdb, key).await,
        ReqKind::SetLocalSecret(key, value) => set_local_secret(secretdb, key, value).await,
        ReqKind::ListLocalSecrets => list_local_secrets(secretdb).await,
        ReqKind::CreateDatabaseDump => create_database_dump(leaf).await,
        ReqKind::RestoreDatabaseDump(dump) => restore_database_dump(leaf, dump).await,
    };
    Resp {
        id: req.id,
        result: kind.map_err(|e| format!("{e}")),
    }
}

async fn read_entity(leaf: &LeafIroh, link: ExactLink) -> anyhow::Result<RespKind> {
    let entry = leaf.entity(link).await?;
    let entity = entry
        .entity()
        .ok()
        .map(|loaded| (loaded.digest, loaded.entity));
    Ok(RespKind::ReadEntity(entity))
}
async fn del_entity(
    leaf: &Leaf<LeafIrohStore>,
    link: ExactLink,
) -> std::result::Result<RespKind, anyhow::Error> {
    leaf.del_entity(link).await?;
    Ok(RespKind::DelEntity)
}
async fn get_components_by_schema(
    leaf: &LeafIroh,
    link: ExactLink,
    schemas: Vec<Digest>,
) -> anyhow::Result<RespKind> {
    let mut map = HashMap::<Digest, Vec<Vec<u8>>>::default();
    let Ok(entity) = leaf.entity(link).await?.entity() else {
        return Ok(RespKind::GetComponentBySchema(None));
    };
    for schema in schemas {
        let components = entity.get_components_by_schema(schema).await?;
        map.entry(schema).or_default().extend(components)
    }
    Ok(RespKind::GetComponentBySchema(Some(GetComponentsInner {
        entity_digest: entity.digest,
        components: map,
    })))
}
async fn del_components_by_schema(
    leaf: &LeafIroh,
    link: ExactLink,
    schemas: Vec<Digest>,
) -> anyhow::Result<RespKind> {
    let resp = 'resp: {
        let Ok(mut entity) = leaf.entity(link).await?.entity() else {
            break 'resp None;
        };
        for schema in schemas {
            entity.del_components_by_schema(schema);
        }
        entity.save().await?;
        Some(entity.digest)
    };
    Ok(RespKind::DelComponentBySchema(resp))
}
async fn add_components(
    leaf: &LeafIroh,
    link: ExactLink,
    components: Vec<ComponentData>,
    replace_existing: bool,
) -> anyhow::Result<RespKind> {
    let mut entity = leaf.entity(link).await?.get_or_init();
    for comp in components {
        if replace_existing {
            entity.del_components_by_schema(comp.schema);
        }
        entity.add_component_data(ComponentKind::Unencrypted(comp));
    }
    entity.save().await?;
    Ok(RespKind::AddComponents(entity.digest))
}
async fn list_entities(leaf: &LeafIroh, link: ExactLink) -> anyhow::Result<RespKind> {
    let entities = leaf
        .list(link)
        .await?
        .collect::<Vec<_>>()
        .await
        .into_iter()
        .collect::<Result<Vec<_>, _>>()?;
    Ok(RespKind::ListEntities(entities))
}
async fn create_namespace(
    leaf: &Leaf<LeafIrohStore>,
) -> std::result::Result<RespKind, anyhow::Error> {
    Ok(RespKind::CreateNamespace(leaf.create_namespace().await?))
}
async fn import_namespace_secret(
    leaf: &Leaf<LeafIrohStore>,
    secret: [u8; 32],
) -> std::result::Result<RespKind, anyhow::Error> {
    Ok(RespKind::ImportNamespaceSecret(
        leaf.import_namespace_secret(secret).await?,
    ))
}
async fn get_namespace_secret(
    leaf: &Leaf<LeafIrohStore>,
    namespace: [u8; 32],
) -> std::result::Result<RespKind, anyhow::Error> {
    Ok(RespKind::GetNamespaceSecret(
        leaf.get_namespace_secret(namespace).await?,
    ))
}
async fn create_subspace(
    leaf: &Leaf<LeafIrohStore>,
) -> std::result::Result<RespKind, anyhow::Error> {
    Ok(RespKind::CreateSubspace(leaf.create_subspace().await?))
}
async fn import_subspace_secret(
    leaf: &Leaf<LeafIrohStore>,
    secret: [u8; 32],
) -> std::result::Result<RespKind, anyhow::Error> {
    Ok(RespKind::ImportSubspaceSecret(
        leaf.import_subspace_secret(secret).await?,
    ))
}
async fn get_subspace_secret(
    leaf: &Leaf<LeafIrohStore>,
    subspace: [u8; 32],
) -> std::result::Result<RespKind, anyhow::Error> {
    Ok(RespKind::GetSubspaceSecret(
        leaf.get_subspace_secret(subspace).await?,
    ))
}

async fn get_local_secret(
    secretdb: Arc<Option<redb::Database>>,
    key: String,
) -> std::result::Result<RespKind, anyhow::Error> {
    tokio::task::spawn_blocking(move || {
        let Some(secretdb) = &*secretdb else {
            anyhow::bail!("Local store not enabled on this RPC server.")
        };

        let transaction = secretdb.begin_read()?;
        let value = {
            let table = transaction.open_table(SECRET_TABLE)?;
            let v = table.get(key.as_str())?;
            v.map(|guard| guard.value())
        };

        Ok(RespKind::GetLocalSecret(value))
    })
    .await
    .map_err(|_| anyhow::format_err!("Error executing database operation"))?
}

async fn set_local_secret(
    secretdb: Arc<Option<redb::Database>>,
    key: String,
    value: Option<String>,
) -> std::result::Result<RespKind, anyhow::Error> {
    tokio::task::spawn_blocking(move || {
        let Some(secretdb) = &*secretdb else {
            anyhow::bail!("Local store not enabled on this RPC server.")
        };

        let transaction = secretdb.begin_write()?;
        {
            let mut table = transaction.open_table(SECRET_TABLE)?;
            if let Some(value) = value {
                table.insert(key.as_str(), value)?;
            } else {
                table.remove(key.as_str())?;
            }
        }
        transaction.commit()?;

        Ok(RespKind::SetLocalSecret)
    })
    .await
    .map_err(|_| anyhow::format_err!("Error executing database operation"))?
}

async fn list_local_secrets(
    secretdb: Arc<Option<redb::Database>>,
) -> std::result::Result<RespKind, anyhow::Error> {
    tokio::task::spawn_blocking(move || {
        let Some(secretdb) = &*secretdb else {
            anyhow::bail!("Local store not enabled on this RPC server.")
        };

        let mut map = HashMap::default();
        let transaction = secretdb.begin_read()?;
        {
            let table = transaction.open_table(SECRET_TABLE)?;
            let records = table.range::<&str>(..)?;
            for record in records {
                let (key, value) = record?;
                map.insert(key.value().into(), value.value());
            }
        };

        Ok(RespKind::ListLocalSecrets(map))
    })
    .await
    .map_err(|_| anyhow::format_err!("Error executing database operation"))?
}

async fn create_database_dump(leaf: &Leaf<LeafIrohStore>) -> anyhow::Result<RespKind> {
    let mut dump = DatabaseDump::default();

    let mut stream = leaf.list_subspaces().await?;
    while let Some(subspace) = stream.next().await {
        let subspace = subspace?;
        let Some(subspace_secret) = leaf.get_subspace_secret(subspace).await? else {
            continue;
        };
        dump.subspace_secrets.insert(subspace, subspace_secret);
    }

    let mut stream = leaf.list_namespaces().await?;
    while let Some(namespace) = stream.next().await {
        let namespace = namespace?;
        let Some(namespace_secret) = leaf.get_namespace_secret(namespace).await? else {
            tracing::warn!(
                "Skipping namespace {namespace:?} in database dump \
                because we do not have it's secret."
            );
            continue;
        };

        let mut doc = DatabaseDumpDocument {
            secret: namespace_secret,
            subspaces: HashMap::default(),
        };

        for &subspace in dump.subspace_secrets.keys() {
            let mut db_dump_subspace = HashMap::default();
            let link = ExactLink {
                namespace,
                subspace,
                path: EntityPath::default(),
            };
            let stream = leaf.list(link).await?;
            pin_mut!(stream);
            while let Some(link) = stream.next().await {
                let link = link?;
                let ent = leaf.entity(link.clone()).await?.entity()?;
                let mut db_dump_entity = DatabaseDumpEntity {
                    digest: ent.digest,
                    components: HashMap::default(),
                };
                for comp in &ent.entity.components {
                    let Some(schema_id) = comp.schema_id else {
                        continue;
                    };
                    let comps_data = ent.get_components_by_schema(schema_id).await?;
                    db_dump_entity.components.insert(schema_id, comps_data);
                }

                db_dump_subspace.insert(link.path, db_dump_entity);
            }

            doc.subspaces.insert(subspace, db_dump_subspace);
        }

        dump.documents.insert(namespace, doc);
    }

    Ok(RespKind::CreateDatabaseDump(dump))
}

async fn restore_database_dump(
    leaf: &Leaf<LeafIrohStore>,
    dump: DatabaseDump,
) -> anyhow::Result<RespKind> {
    for (subspace, secret) in dump.subspace_secrets {
        let s = leaf.import_subspace_secret(secret).await?;
        if s != subspace {
            tracing::warn!(
                "Error while restoring database dump: Subspace ID ( {:?} ) does not \
                match the subspace ID that was found by importing the corresponding \
                secret ( {:?} ). Continuing with restore process.",
                subspace,
                s
            );
        }
    }

    for (namespace, doc) in dump.documents {
        let n = leaf.import_subspace_secret(doc.secret).await?;
        if n != namespace {
            tracing::warn!(
                "Error while restoring database dump: Namespace ID ( {:?} ) does not \
                match the namespace ID that was found by importing the corresponding \
                secret ( {:?} ). Continuing with restore process.",
                namespace,
                n
            );
        }

        for (subspace, dump_subspace) in doc.subspaces {
            for (path, dump_entity) in dump_subspace {
                let link = ExactLink {
                    namespace,
                    subspace,
                    path,
                };
                let mut ent = leaf.entity(link.clone()).await?.get_or_init();
                for (schema, component_datas) in dump_entity.components {
                    for data in component_datas {
                        ent.del_components_by_schema(schema);
                        ent.add_component_data(ComponentKind::Unencrypted(ComponentData {
                            schema,
                            data,
                        }));
                    }
                }
                ent.save().await?;
                if ent.digest != dump_entity.digest {
                    tracing::warn!(
                        "While importing entity at link ( {link:?} ) the resulting \
                        digest ( {} ) does not match the dump digest ( {} ). Continuing \
                        with dump restore.",
                        ent.digest,
                        dump_entity.digest
                    )
                }
            }
        }
    }

    Ok(RespKind::RestoreDatabaseDump)
}
