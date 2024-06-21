use axum::routing::delete;
use futures::{pin_mut, StreamExt};
use weird::profile::Profile;

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/profiles", get(get_profiles))
        .route("/profile/username/:username", get(get_profile_by_name))
        .route("/profile/:user_id", get(get_profile))
        .route("/profile/:user_id", post(post_profile))
        .route("/profile/:user_id", delete(delete_profile))
}

async fn get_profiles(state: State<AppState>) -> AppResult<Json<Vec<Profile>>> {
    let mut profiles = Vec::new();
    let stream = state.weird.profiles().await?;
    pin_mut!(stream);
    while let Some(profile) = stream.next().await {
        profiles.push(profile?);
    }
    Ok(Json(profiles))
}

async fn get_profile_by_name(
    state: State<AppState>,
    Path(username): Path<String>,
) -> AppResult<Json<Profile>> {
    Ok(Json(state.weird.get_profile_by_name(&username).await?))
}

async fn delete_profile(state: State<AppState>, Path(user_id): Path<String>) -> AppResult<()> {
    Ok(state.weird.delete_profile(&user_id).await?)
}

async fn get_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
) -> AppResult<Json<Profile>> {
    Ok(Json(state.weird.get_profile(&user_id).await?))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    state.weird.set_profile(&user_id, new_profile.0).await?;

    Ok(())
}
