use axum::BoxError;
use http::StatusCode;

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
