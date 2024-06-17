use std::{path::PathBuf, sync::Arc};

use axum::{error_handling::HandleErrorLayer, response::IntoResponse, BoxError, Router};
use clap::Parser;
use gdata::IrohGStore;
use headers::{authorization::Bearer, Authorization, Header};
use http::StatusCode;
use iroh::docs::{AuthorId, NamespaceId};
use once_cell::sync::Lazy;
use reqwest::Url;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::auth::AuthenticationError;

mod auth;
mod routes;
mod utils;

#[derive(clap::Parser)]
pub struct Args {
    #[arg(default_value = "temporarydevelopmentkey", env)]
    pub api_key: String,
    #[arg(default_value = "data", env)]
    pub data_dir: PathBuf,
    #[arg(default_value = "http://localhost:8921", env)]
    pub rauthy_url: Url,
    #[arg(default_value = "7431", env)]
    pub port: u16,
}

pub static ARGS: Lazy<Args> = Lazy::new(Args::parse);
pub static CLIENT: Lazy<reqwest::Client> =
    Lazy::new(|| reqwest::ClientBuilder::new().build().unwrap());

pub type IrohNode = iroh::node::FsNode;
pub type IrohClient = iroh::client::MemIroh;

pub type AppState = Arc<AppStateInner>;
pub struct AppStateInner {
    pub node: IrohNode,
    pub node_author: AuthorId,
    pub graph: IrohGStore,
    pub ns: NamespaceId,
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
                "backend=debug,tower_http=debug,axum::rejection=trace".into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Parse CLI args.
    let args = &*ARGS;

    let node = iroh::node::FsNode::persistent(&args.data_dir)
        .await?
        .node_discovery(iroh::node::DiscoveryConfig::None)
        .relay_mode(iroh::net::relay::RelayMode::Disabled)
        .spawn()
        .await?;
    let node_author = node.authors.default().await?;
    let graph = IrohGStore::new(node.client().clone(), node_author);
    let profile_namespace_path = args.data_dir.join("weird-profile-namespace");
    let ns = if profile_namespace_path.exists() {
        let bytes = std::fs::read(profile_namespace_path)?;
        let bytes: [u8; 32] = bytes.try_into().map_err(|_| {
            anyhow::format_err!("weird-profile-namespace length not equal to 32 bytes")
        })?;
        NamespaceId::from(bytes)
    } else {
        let profiles = node.docs.create().await?;
        std::fs::write(profile_namespace_path, profiles.id())?;
        profiles.id()
    };

    // Construct router
    let router = routes::install(Router::new())
        .layer(
            tower::ServiceBuilder::new()
                .layer(HandleErrorLayer::new(AuthenticationError::handle))
                // Add authentication middleware
                .filter(move |r: http::Request<axum::body::Body>| {
                    let authorization_header = Authorization::<Bearer>::decode(
                        &mut r.headers().get_all(http::header::AUTHORIZATION).into_iter(),
                    );
                    match authorization_header {
                        Ok(header) if header.token() == ARGS.api_key => Ok::<_, BoxError>(r),
                        _ => Err(AuthenticationError.into()),
                    }
                }),
        )
        // `TraceLayer` is provided by tower-http so you have to add that as a dependency.
        // It provides good defaults but is also very customizable.
        //
        // See https://docs.rs/tower-http/0.1.1/tower_http/trace/index.html for more details.
        //
        // If you want to customize the behavior using closures here is how.
        .layer(TraceLayer::new_for_http())
        .with_state(Arc::new(AppStateInner {
            node,
            node_author,
            graph,
            ns,
        }));

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", args.port)).await?;
    tracing::info!("Starting server");
    axum::serve(listener, router).await?;

    Ok(())
}
