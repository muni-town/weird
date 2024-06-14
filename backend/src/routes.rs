use std::collections::HashMap;

use axum::extract::Path;
use axum::{
    extract::State,
    routing::{get, post},
    Json, Router,
};
use futures::StreamExt;
use iroh::docs::store::Query;
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
    profile::install(router)
        .route("/server-info", get(server_info))
        .route("/db-dump", get(db_dump))
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

pub async fn db_dump(state: State<AppState>) -> AppResult<Json<HashMap<String, String>>> {
    let doc = state.node.docs.open(state.ns).await?.unwrap();
    let mut map = HashMap::default();
    let mut stream = doc.get_many(Query::all()).await?;
    while let Some(result) = stream.next().await {
        let entry = result?;
        map.insert(
            String::from_utf8_lossy(entry.key()).into_owned(),
            String::from_utf8_lossy(&entry.content_bytes(&doc).await?).into_owned(),
        );
    }
    Ok(Json(map))
}
