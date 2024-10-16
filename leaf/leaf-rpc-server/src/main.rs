use std::{path::PathBuf, sync::Arc};

use axum::{response::IntoResponse, routing::get, Router};
use clap::Parser;
use futures::StreamExt;
use http::StatusCode;
use leaf_protocol::{
    borsh::BorshDeserialize,
    iroh::{client::Iroh, docs::store::Query, node::Node},
    prelude::{IrohDocumentKeyFormat, LeafGcPath, LeafIroh, LeafIrohStore},
    types::Entity,
    Leaf,
};
use once_cell::sync::Lazy;
use tokio::io::AsyncBufReadExt;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod proto;

#[derive(clap::Parser)]
pub struct Args {
    #[arg(default_value = "temporarydevelopmentkey", env)]
    pub api_key: String,
    #[arg(default_value = "data", env)]
    pub data_dir: PathBuf,
    #[arg(default_value = "7431", env)]
    pub port: u16,
    #[arg(long, env)]
    pub enable_local_store: bool,
}

pub static ARGS: Lazy<Args> = Lazy::new(Args::parse);
pub static CLIENT: Lazy<reqwest::Client> =
    Lazy::new(|| reqwest::ClientBuilder::new().build().unwrap());

const SECRET_TABLE: redb::TableDefinition<&str, String> = redb::TableDefinition::new("secrets");

pub type AppState = Arc<AppStateInner>;
pub struct AppStateInner {
    pub leaf: LeafIroh,
    pub secretdb: Arc<Option<redb::Database>>,
}

pub type AppResult<T> = Result<T, AppError>;
pub struct AppError(pub anyhow::Error);
impl<E: Into<anyhow::Error>> From<E> for AppError {
    fn from(value: E) -> Self {
        AppError(value.into())
    }
}
impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        tracing::error!("{:?}", self.0);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!(r#"{{ "error": "{:?}" }}"#, self.0),
        )
            .into_response()
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Init logger
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                // axum logs rejections from built-in extractors with the `axum::rejection`
                // target, at `TRACE` level. `axum::rejection=trace` enables showing those events
                "leaf_rpc_server=debug,backend=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Parse CLI args.
    let args = &*ARGS;

    // Initialize the leaf store and Iroh node
    let node = Node::persistent(&ARGS.data_dir).await?.spawn().await?;
    tracing::info!(id = %node.node_id(), "Started Iroh Node");
    let leaf_store = LeafIrohStore::new(node.client().clone());
    let leaf = Leaf::new(leaf_store);

    let secretdb = if ARGS.enable_local_store {
        tracing::info!(
            "Local store has been enabled. Note that the local store is **not** clusterable."
        );
        let db = redb::Builder::new().create(ARGS.data_dir.join("secrets.redb"))?;
        {
            let tx = db.begin_write()?;
            {
                // Make sure that secrets table exists
                tx.open_table(SECRET_TABLE)?;
            }
            tx.commit()?;
        }
        Arc::new(Some(db))
    } else {
        Arc::new(None)
    };

    // Spawn a task to handle the debug CLI commands
    let iroh = node.client().clone();
    tokio::spawn(handle_cli_prompts(iroh));

    // Construct router
    let router = Router::new()
        .route("/", get(proto::ws_handler))
        .layer(TraceLayer::new_for_http())
        .with_state(Arc::new(AppStateInner { leaf, secretdb }));

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", args.port)).await?;
    tracing::info!("Starting server on port {}", args.port);
    axum::serve(listener, router).await?;

    Ok(())
}

async fn handle_cli_prompts(iroh: Iroh) {
    let buf = tokio::io::BufReader::new(tokio::io::stdin());
    let mut stream = buf.lines();
    while let Ok(Some(line)) = stream.next_line().await {
        async {
            if &line == "dump" {
                use std::fmt::Write;
                let dump = &mut String::new();

                let mut s = iroh.docs().list().await?;
                while let Some(doc) = s.next().await {
                    let (namespace, _cap) = doc?;
                    writeln!(dump, "Doc: {namespace}")?;
                    let doc = iroh
                        .docs()
                        .open(namespace)
                        .await?
                        .ok_or_else(|| anyhow::format_err!("Missing doc"))?;
                    let mut s = doc
                        .get_many(Query::single_latest_per_key().key_prefix(b""))
                        .await?;
                    while let Some(entry) = s.next().await {
                        if let Err(e) = async {
                            let entry = entry?;
                            let key = entry.key();
                            if let Ok(key) = LeafGcPath::from_bytes(key) {
                                writeln!(dump, "    {key:?}")?;
                                writeln!(dump, "        GC: {}", entry.content_hash())?;
                            } else {
                                let key = IrohDocumentKeyFormat::from_bytes(key)?.path;
                                writeln!(dump, "    {key:?}")?;
                                let hash = entry.content_hash();
                                writeln!(dump, "        Hash: {hash}")?;
                                let value = entry.content_bytes(&doc).await?;
                                let value = Entity::deserialize(&mut &value[..])?;
                                writeln!(dump, "        Value: {value:?}")?;
                            }

                            Ok::<_, anyhow::Error>(())
                        }
                        .await
                        {
                            writeln!(dump, "        Error: {e}")?;
                        };
                    }
                }

                tracing::info!("Iroh dump:\n{dump}");
            } else {
                tracing::info!("Available commands: dump.")
            }

            Ok::<_, anyhow::Error>(())
        }
        .await
        .map_err(|x| {
            tracing::error!("Error processing CLI command: {x}");
            x
        })
        .ok();
    }
}
