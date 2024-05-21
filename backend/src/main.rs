use axum::{error_handling::HandleErrorLayer, routing::get, BoxError, Router};
use clap::Parser;
use headers::{authorization::Bearer, Authorization, Header};
use once_cell::sync::Lazy;

use crate::auth::AuthenticationError;

mod auth;

#[derive(clap::Parser)]
pub struct Args {
    #[arg(default_value = "temporarydevelopmentkey", env)]
    pub api_key: String,
}

pub static ARGS: Lazy<Args> = Lazy::new(Args::parse);

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Init logger
    tracing_subscriber::fmt().init();

    // Parse CLI args.
    let _ = &*ARGS;

    // Construct router
    let router = Router::new()
        .route("/", get(|| async { "Hello world" }))
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
        );

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await?;
    tracing::info!("Starting server");
    axum::serve(listener, router).await?;

    Ok(())
}
