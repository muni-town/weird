use std::task::{Context, Poll};

use axum::{extract::Request, BoxError};
use http::StatusCode;
use serde::Deserialize;
use tower::{Layer, Service};

#[derive(Clone, Debug)]
struct AuthCtx {
    session: Option<RauthySession>,
}

#[derive(Clone)]
pub struct AuthCtxLayer;
impl<S> Layer<S> for AuthCtxLayer {
    type Service = AddAuthCtx<S>;
    fn layer(&self, inner: S) -> Self::Service {
        AddAuthCtx { inner }
    }
}

#[derive(Clone, Copy, Debug)]
pub struct AddAuthCtx<S> {
    pub(crate) inner: S,
}

impl<ResBody, S> Service<Request<ResBody>> for AddAuthCtx<S>
where
    S: Service<Request<ResBody>>,
{
    type Response = S::Response;
    type Error = S::Error;
    type Future = S::Future;

    #[inline]
    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.inner.poll_ready(cx)
    }

    fn call(&mut self, mut req: Request<ResBody>) -> Self::Future {
        req.extensions_mut().insert(AuthCtx { session: None });
        self.inner.call(req)
    }
}

#[derive(Clone, Debug, Deserialize)]
struct RauthySession {
    info: RauthySessionInfo,
    user: RauthyUserInfo,
}

#[derive(Clone, Debug, Deserialize)]
struct RauthySessionInfo {}
#[derive(Clone, Debug, Deserialize)]
struct RauthyUserInfo {}

#[derive(Debug, Clone)]
pub struct AuthenticationError;
impl std::fmt::Display for AuthenticationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("Authentication error: invalid bearer token / API key.")
    }
}
impl std::error::Error for AuthenticationError {}
impl AuthenticationError {
    pub async fn handle(err: BoxError) -> (StatusCode, String) {
        if err.is::<AuthenticationError>() {
            (StatusCode::UNAUTHORIZED, AuthenticationError.to_string())
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, format!("Error: {err}"))
        }
    }
}
