use anyhow::Context;
use axum::{
    extract::{FromRequest, Request},
    BoxError,
};
use http::StatusCode;
use serde::{Deserialize, Serialize};

use crate::{ARGS, CLIENT};

#[derive(Clone, Debug)]
pub struct AuthCtx {
    pub session: Option<RauthySession>,
}

#[async_trait::async_trait]
impl<S> FromRequest<S> for AuthCtx
where
    S: Send + Sync,
{
    type Rejection = ();

    async fn from_request(req: Request, _: &S) -> Result<Self, Self::Rejection> {
        tracing::trace!(request=?req, "Extracting session info from request");
        let session = async move {
            let session_info = CLIENT
                .get(ARGS.rauthy_url.join("/auth/v1/oidc/sessioninfo").unwrap())
                .headers(req.headers().clone())
                .send()
                .await?;
            let session_info = session_info
                .json::<RauthyResponse<RauthySessionInfo>>()
                .await
                .context("Parsing session info")?
                .result()?;
            let user_info = CLIENT
                .get(
                    ARGS.rauthy_url
                        .join("/auth/v1/users/")
                        .unwrap()
                        .join(&session_info.user_id)
                        .unwrap(),
                )
                .headers(req.headers().clone())
                .send()
                .await?;
            let user_info = user_info
                .json::<RauthyResponse<RauthyUserInfo>>()
                .await
                .context("Parsing user info")?
                .result()?;
            Ok::<_, anyhow::Error>(Some(RauthySession {
                info: session_info,
                user: user_info,
            }))
        }
        .await;
        if let Err(e) = &session {
            tracing::warn!("{e:?}");
        }

        tracing::trace!(?session, "Extracted session");
        Ok(AuthCtx {
            session: session.ok().flatten(),
        })
    }
}

#[async_trait::async_trait]
impl<S: Sync + Send> FromRequest<S> for RauthySession {
    type Rejection = (StatusCode, &'static str);
    async fn from_request(req: Request, s: &S) -> Result<Self, Self::Rejection> {
        AuthCtx::from_request(req, s)
            .await
            .and_then(|x| x.session.ok_or(()))
            .map_err(|_| {
                (
                    StatusCode::UNAUTHORIZED,
                    r#"{"error": "valid user session required to access this endpiont."}"#,
                )
            })
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RauthySession {
    pub info: RauthySessionInfo,
    pub user: RauthyUserInfo,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct RauthySessionInfo {
    pub id: String,
    pub user_id: String,
    pub roles: String,
    pub exp: String,
    pub timeout: String,
    pub state: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, Default)]
pub struct RauthyUserInfo {
    pub id: String,
    pub email: String,
    pub given_name: String,
    pub family_name: String,
    pub language: String,
    pub roles: Vec<String>,
    pub enabled: bool,
    pub email_verified: bool,
    pub password_expires: Option<u64>,
    pub created_at: u64,
    pub last_login: u64,
    pub account_type: String,
    pub webauthn_user_id: Option<String>,
    pub user_values: RauthyUserInfoUserValues,
    pub auth_provider_id: Option<String>,
    pub federation_uid: Option<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize, Default)]
pub struct RauthyUserInfoUserValues {
    pub birthdate: Option<String>,
    pub phone: Option<String>,
    pub street: Option<String>,
    pub zip: Option<String>,
    pub city: Option<String>,
    pub country: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(untagged)]
pub enum RauthyResponse<T> {
    Ok(T),
    Err(RauthyError),
}

impl<T> RauthyResponse<T> {
    pub fn result(self) -> Result<T, RauthyError> {
        match self {
            RauthyResponse::Ok(t) => Ok(t),
            RauthyResponse::Err(e) => Err(e),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RauthyError {
    error: String,
    message: String,
    timestamp: u64,
}
impl std::fmt::Display for RauthyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_fmt(format_args!(
            "Error[{}]: {}: {}",
            self.timestamp, self.error, self.message
        ))
    }
}
impl std::error::Error for RauthyError {}

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
