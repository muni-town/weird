use axum::extract::Path;
use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use iroh::docs::AuthorId;
use serde::{Deserialize, Serialize, Serializer};

use crate::{auth::RauthySession, AppError, AppResult, AppState};

mod profile;

#[derive(Serialize)]
pub struct InfoResponse {
    #[serde(serialize_with = "display")]
    server_author: AuthorId,
    session: RauthySession,
}
fn display<S: Serializer>(id: &AuthorId, s: S) -> Result<S::Ok, S::Error> {
    s.serialize_str(&id.to_string())
}

pub fn install(router: Router<AppState>) -> Router<AppState> {
    profile::install(router).route("/server-info", get(server_info))
}

pub async fn server_info(
    state: State<AppState>,
    session: RauthySession,
) -> AppResult<Json<InfoResponse>> {
    Ok(Json(InfoResponse {
        server_author: state.node.authors.default().await?,
        session,
    }))
}
