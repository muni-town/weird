use std::{
    collections::HashMap,
    convert::Infallible,
    future::Future,
    sync::{
        atomic::{AtomicU64, Ordering::SeqCst},
        Arc,
    },
};

use fastwebsockets::{FragmentCollectorRead, Frame};
use futures::{future::Either, pin_mut, StreamExt};
use hyper::{
    header::{CONNECTION, UPGRADE},
    Request,
};
use leaf_rpc_proto::{Req, ReqKind, Resp, RespKind};
use tokio::{
    net::TcpStream,
    sync::{mpsc, oneshot, Mutex},
};

pub use hyper::Uri;
pub use leaf_protocol;

use leaf_protocol::prelude::*;
use tokio_stream::wrappers::ReceiverStream;

#[derive(Clone)]
pub struct RpcClient {
    index: Arc<AtomicU64>,
    frame_writer: mpsc::Sender<Frame<'static>>,
    pending_reqs: Arc<Mutex<HashMap<u64, oneshot::Sender<Resp>>>>,
}

// TODO: Implement graceful shutdown of RPC client.
impl Drop for RpcClient {
    fn drop(&mut self) {
        tracing::warn!("TODO: implement graceful shutdown of RPC client.");
    }
}

impl RpcClient {
    pub async fn connect(uri: Uri, auth_token: Option<&str>) -> anyhow::Result<Self> {
        let host = uri.host().unwrap();
        let port = uri.port().unwrap();
        let socket = format!("{host}:{port}");
        let stream = TcpStream::connect(socket).await?;

        let req = Request::builder()
            .method("GET")
            .uri(&uri)
            .header("Host", host)
            .header(UPGRADE, "websocket")
            .header(CONNECTION, "upgrade")
            .header(
                "Sec-Websocket-Key",
                fastwebsockets::handshake::generate_key(),
            )
            .header("Sec-Websocket-Version", "13")
            .body(String::new())?;

        let pending_reqs = Arc::new(Mutex::new(HashMap::<u64, oneshot::Sender<Resp>>::default()));
        let pending_reqs_ = pending_reqs.clone();

        let (ws, _) = fastwebsockets::handshake::client(&SpawnExecutor, req, stream).await?;
        let (ws_read, mut ws_write) = ws.split(tokio::io::split);
        let mut ws_read = FragmentCollectorRead::new(ws_read);

        let (client_frame_send, client_frame_recv) = mpsc::channel(10);

        tokio::spawn(async move {
            let read_frame_from_server = async_stream::stream! {
                loop {
                    yield ws_read.read_frame::<_, Infallible>(&mut |_| async { panic!("obligated send not implemented") }).await;
                }
            }
            .map(Either::Left);
            let recv_frame_to_send = ReceiverStream::new(client_frame_recv).map(Either::Right);

            let stream = futures::stream::select(read_frame_from_server, recv_frame_to_send);
            pin_mut!(stream);

            loop {
                let Some(event) = stream.next().await else {
                    break;
                };

                match event {
                    Either::Left(frame_from_server) => match frame_from_server {
                        Ok(frame) => {
                            if frame.opcode == fastwebsockets::OpCode::Binary {
                                let mut data = &frame.payload[..];
                                let resp = Resp::deserialize(&mut data);
                                match resp {
                                    Ok(resp) => {
                                        let mut pending_reqs = pending_reqs_.lock().await;
                                        let Some(sender) = pending_reqs.remove(&resp.id) else {
                                            tracing::warn!(
                                                "Got response for request that is not pending"
                                            );
                                            continue;
                                        };
                                        sender.send(resp).ok();
                                    }
                                    Err(e) => tracing::error!(
                                        "Error deserializing response from server: {e}"
                                    ),
                                }
                            }
                        }
                        Err(e) => tracing::error!("Error reading message from server: {e}"),
                    },
                    Either::Right(frame_to_send) => {
                        if let Err(e) = ws_write.write_frame(frame_to_send).await {
                            tracing::warn!("Could not send request to server: {e}");
                        }
                    }
                }
            }
        });

        let client = RpcClient {
            index: Arc::new(0.into()),
            frame_writer: client_frame_send,
            pending_reqs,
        };

        if let Some(auth_token) = auth_token {
            let resp = client
                .send_req(ReqKind::Authenticate(auth_token.into()))
                .await?;
            match resp.result {
                Ok(RespKind::Authenticated) => (),
                Ok(_) => anyhow::bail!("Unexpected response when authenticating"),
                Err(e) => anyhow::bail!("Authentication error: {e}"),
            }
        }

        Ok(client)
    }

    async fn send_req(&self, kind: ReqKind) -> anyhow::Result<Resp> {
        let id = self.index.fetch_add(1, SeqCst);
        let req = Req { id, kind };

        let mut req_bytes = Vec::new();
        req.serialize(&mut req_bytes)?;

        let (resp_sender, resp_receiver) = oneshot::channel();
        {
            let mut pending_reqs = self.pending_reqs.lock().await;
            pending_reqs.insert(id, resp_sender);
        }

        self.frame_writer
            .send(Frame::binary(fastwebsockets::Payload::Owned(req_bytes)))
            .await?;

        let resp = resp_receiver.await?;
        assert_eq!(resp.id, id, "Invalid RPC ID in response");

        Ok(resp)
    }

    pub async fn read_entity<L: Into<ExactLink>>(
        &self,
        link: L,
    ) -> anyhow::Result<Option<(Digest, Entity)>> {
        let link = link.into();
        let resp = self.send_req(ReqKind::ReadEntity(link)).await?;
        let RespKind::ReadEntity(entity) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(entity)
    }

    pub async fn del_entity<L: Into<ExactLink>>(&self, link: L) -> anyhow::Result<()> {
        let link = link.into();
        let resp = self.send_req(ReqKind::DelEntity(link)).await?;
        let RespKind::DelEntity = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(())
    }

    pub async fn list_entities<L: Into<ExactLink>>(
        &self,
        link: L,
    ) -> anyhow::Result<Vec<ExactLink>> {
        let link = link.into();
        let resp = self.send_req(ReqKind::ListEntities(link)).await?;
        let RespKind::ListEntities(entities) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(entities)
    }

    // TODO: Support Operating on Multiple Components at a Time.
    pub async fn del_components<C: Component, L: Into<ExactLink>>(
        &self,
        link: L,
    ) -> anyhow::Result<Option<Digest>> {
        let link = link.into();

        let resp = self
            .send_req(ReqKind::DelComponentsBySchema {
                link,
                schemas: vec![C::schema_id()],
            })
            .await?;
        let RespKind::DelComponentBySchema(new_digest) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(new_digest)
    }

    // TODO: Support Operating on Multiple Components at a Time.
    pub async fn add_component<C: Component, L: Into<ExactLink>>(
        &self,
        link: L,
        component: C,
        replace_existing: bool,
    ) -> anyhow::Result<Digest> {
        let link = link.into();
        let component_data = component.make_data()?;

        let resp = self
            .send_req(ReqKind::AddComponents {
                link,
                components: vec![component_data],
                replace_existing,
            })
            .await?;
        let RespKind::AddComponents(entity_id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(entity_id)
    }

    // TODO: implement way to get multiple components at a time.
    pub async fn get_components<C: Component, L: Into<ExactLink>>(
        &self,
        _link: L,
    ) -> anyhow::Result<Option<(Digest, Vec<C>)>> {
        unimplemented!("get_components() needs a better way to get multiple components at a time.");
        // let link = link.into();
        // let schema = C::schema_id();

        // let resp = self
        //     .send_req(ReqKind::GetComponentsBySchema {
        //         link,
        //         schemas: vec![schema],
        //     })
        //     .await?;
        // let RespKind::GetComponentBySchema(components) = resp
        //     .result
        //     .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        // else {
        //     anyhow::bail!(INVALID_RPC_RESP_MSG);
        // };
        // let components = components.map(|data| {
        //     let components = data
        //         .components
        //         .into_iter()
        //         .map(|(schema, components_data)| {
        //             let ComponentKind::Unencrypted(comp) =
        //                 ComponentKind::deserialize(&mut &data[..])?
        //             else {
        //                 anyhow::bail!("Encrypted components not supported.");
        //             };
        //             assert_eq!(comp.schema, schema);
        //             let data = C::deserialize(&mut &comp.data[..])?;
        //             Ok::<_, anyhow::Error>(data)
        //         })
        //         .collect::<Result<Vec<C>, _>>();

        //     (digest, components)
        // });
        // match components {
        //     Some((digest, components)) => Ok(Some((digest, components?))),
        //     None => Ok(None),
        // }
    }

    pub async fn create_namespace(&self) -> anyhow::Result<NamespaceId> {
        let resp = self.send_req(ReqKind::CreateNamespace).await?;
        let RespKind::CreateNamespace(id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(id)
    }
    pub async fn import_namespace_secret(
        &self,
        namespace: NamespaceSecretKey,
    ) -> anyhow::Result<NamespaceId> {
        let resp = self
            .send_req(ReqKind::ImportNamespaceSecret(namespace))
            .await?;
        let RespKind::ImportNamespaceSecret(id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(id)
    }
    pub async fn get_namespace_secret(
        &self,
        namespace: NamespaceSecretKey,
    ) -> anyhow::Result<Option<NamespaceSecretKey>> {
        let resp = self
            .send_req(ReqKind::GetNamespaceSecret(namespace))
            .await?;
        let RespKind::GetNamespaceSecret(id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(id)
    }

    pub async fn create_subspace(&self) -> anyhow::Result<SubspaceId> {
        let resp = self.send_req(ReqKind::CreateSubspace).await?;
        let RespKind::CreateSubspace(id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(id)
    }
    pub async fn import_subspace_secret(
        &self,
        subspace: SubspaceSecretKey,
    ) -> anyhow::Result<SubspaceId> {
        let resp = self
            .send_req(ReqKind::ImportSubspaceSecret(subspace))
            .await?;
        let RespKind::ImportSubspaceSecret(id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(id)
    }
    pub async fn get_subspace_secret(
        &self,
        subspace: SubspaceSecretKey,
    ) -> anyhow::Result<Option<SubspaceSecretKey>> {
        let resp = self.send_req(ReqKind::GetSubspaceSecret(subspace)).await?;
        let RespKind::GetSubspaceSecret(id) = resp
            .result
            .map_err(|s| anyhow::format_err!("Error from Leaf RPC endpoint: {s}"))?
        else {
            anyhow::bail!(INVALID_RPC_RESP_MSG);
        };
        Ok(id)
    }
}
const INVALID_RPC_RESP_MSG: &str = "Invalid response kind from RPC endpoint";

struct SpawnExecutor;

impl<Fut> hyper::rt::Executor<Fut> for SpawnExecutor
where
    Fut: Future + Send + 'static,
    Fut::Output: Send + 'static,
{
    fn execute(&self, fut: Fut) {
        tokio::task::spawn(fut);
    }
}
