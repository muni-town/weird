use futures_lite::StreamExt;

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/profile/:user_id", get(get_profile))
        .route("/profile/:user_id", post(post_profile))
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct Profile {
    pub username: Option<String>,
}

async fn get_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
) -> AppResult<Json<Profile>> {
    let profile = state.profiles.get_one(Query::key_exact(&user_id)).await?;
    let profile = if let Some(entry) = profile {
        let content = entry.content_bytes(&state.profiles).await?;
        serde_json::from_slice(&content)?
    } else {
        let profile = Profile::default();
        state
            .profiles
            .set_bytes(state.node_author, user_id, serde_json::to_string(&profile)?)
            .await?;
        profile
    };

    Ok(Json(profile))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    // Usernames must be unique ( this is _really_ naïve, but just loop through every user for now
    // and make sure it's not taken )
    let mut profiles = state.profiles.get_many(Query::key_prefix("")).await?;
    while let Some(profile) = profiles.next().await {
        let profile = profile?;

        // The user's username can conflict with it's own username
        if profile.key() == user_id.as_bytes() {
            continue;
        }

        // Deserialize the profile and compare the username
        let profile = profile.content_bytes(&state.profiles).await?;
        let profile: Profile = serde_json::from_slice(&profile)?;
        match (&profile.username, &new_profile.username) {
            (Some(u1), Some(u2)) if u1 == u2 => {
                return Err(AppError(anyhow::format_err!("Username already taken.")))
            }
            _ => (),
        }
    }

    state
        .profiles
        .set_bytes(
            state.node_author,
            user_id,
            serde_json::to_vec(&*new_profile)?,
        )
        .await?;

    Ok(())
}
