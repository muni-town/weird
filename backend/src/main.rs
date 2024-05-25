use std::{path::PathBuf, sync::Arc};

use axum::{error_handling::HandleErrorLayer, BoxError, Router};
use clap::Parser;
use futures_lite::StreamExt;
use headers::{authorization::Bearer, Authorization, Header};
use iroh::docs::AuthorId;
use once_cell::sync::Lazy;
use reqwest::Url;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::auth::AuthenticationError;

mod auth;
mod routes;

#[derive(clap::Parser)]
pub struct Args {
    #[arg(default_value = "temporarydevelopmentkey", env)]
    pub api_key: String,
    #[arg(default_value = "data", env)]
    pub data_dir: PathBuf,
    #[arg(default_value = "http://localhost:8921", env)]
    pub rauthy_url: Url,
}

pub static ARGS: Lazy<Args> = Lazy::new(Args::parse);
pub static CLIENT: Lazy<reqwest::Client> =
    Lazy::new(|| reqwest::ClientBuilder::new().build().unwrap());

pub type IrohNode = iroh::node::FsNode;
pub type IrohClient = iroh::client::MemIroh;

pub type AppState = Arc<AppStateInner>;
pub struct AppStateInner {
    pub server_author: AuthorId,
    pub node: IrohNode,
    pub client: IrohClient,
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
    let client = node.client().clone();

    // Get the first author key that we have, and use that as the default server key. For now we expect to only
    // have one key.
    let server_author = if let Some(first_author) = client.authors.list().await?.next().await {
        first_author?
    } else {
        client.authors.create().await?
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
            client,
            node,
            server_author,
        }));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("Starting server");
    axum::serve(listener, router).await?;

    Ok(())
}
