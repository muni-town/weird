use axum::{extract::State, routing::get, Json, Router};
use iroh::docs::AuthorId;
use serde::{Serialize, Serializer};

use crate::{auth::RauthySession, AppState};

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router.route(
        "/server-info",
        get(
            |state: State<AppState>, session: RauthySession| async move {
                #[derive(Serialize)]
                struct InfoResponse {
                    #[serde(serialize_with = "display")]
                    server_id: AuthorId,
                    session: RauthySession,
                }
                fn display<S: Serializer>(id: &AuthorId, s: S) -> Result<S::Ok, S::Error> {
                    s.serialize_str(&id.to_string())
                }
                Json(InfoResponse {
                    server_id: state.server_author,
                    session,
                })
            },
        ),
    )
}
