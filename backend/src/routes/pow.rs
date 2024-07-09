use axum::routing::put;
use serde::Deserialize;

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/pow", get(get_challenge))
        .route("/pow", put(validate_challenge))
}

async fn get_challenge() -> AppResult<String> {
    Ok(spow::pow::Pow::with_difficulty(19, 60)?.to_string())
}

#[derive(Deserialize)]
struct PowReq {
    pow: String,
}

async fn validate_challenge(data: Json<PowReq>) -> AppResult<()> {
    spow::pow::Pow::validate(&data.pow)?;
    Ok(())
}
