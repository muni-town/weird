use axum::{extract::State, routing::get, Json, Router};
use iroh::docs::AuthorId;
use serde::{Serialize, Serializer};

use crate::AppState;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router.route(
        "/server-info",
        get(|state: State<AppState>| async move {
            #[derive(Serialize)]
            struct InfoResponse {
                #[serde(serialize_with = "display")]
                author_id: AuthorId,
            }
            fn display<S: Serializer>(id: &AuthorId, s: S) -> Result<S::Ok, S::Error> {
                s.serialize_str(&id.to_string())
            }
            Json(InfoResponse {
                author_id: state.server_author,
            })
        }),
    )
}
