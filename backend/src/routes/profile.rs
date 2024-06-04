use futures::StreamExt;
use gdata::{GStoreBackend, Value};

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
    tracing::info!(?user_id, "Getting profile data");
    let profiles = state
        .graph
        .get_or_init_map((state.ns, "profiles".to_string()))
        .await?;
    tracing::info!(?profiles, "Loaded profiles");
    let profile = profiles.get_key_or_init_map(user_id).await?;
    tracing::info!(?profile, "Loaded profile");
    let username = profile
        .get_key("username".to_string())
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    tracing::info!(?username, "Loaded username");

    Ok(Json(Profile { username }))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    tracing::info!(?new_profile);
    let profiles = state
        .graph
        .get_or_init_map((state.ns, "profiles".to_string()))
        .await?;

    tracing::info!(?profiles.value);

    // Usernames must be unique ( this is _really_ naïve, but just loop through every user for now
    // and make sure it's not taken )
    let mut stream = profiles.list_items().await?;
    tracing::info!("Got stream");
    while let Some(profile) = stream.next().await {
        let (key, profile) = profile?;

        tracing::info!(?profile.value, "found item");

        // The user's username can conflict with it's own username
        if key == user_id.as_bytes() {
            tracing::info!("This is the same user, skipping");
            continue;
        }

        // Deserialize the profile and compare the username
        let username = profile.get_key("username".to_string()).await?;
        let username = username.as_str().ok();
        match (username, new_profile.username.as_deref()) {
            (Some(u1), Some(u2)) if u1 == u2 => {
                return Err(AppError(anyhow::format_err!("Username already taken.")))
            }
            _ => (),
        }
    }

    tracing::info!(?new_profile, "Setting username");

    profiles
        .get_key_or_init_map(user_id)
        .await?
        .set_key(
            "username".to_string(),
            new_profile
                .username
                .clone()
                .map(|x| x.into())
                .unwrap_or(Value::Null),
        )
        .await?;

    Ok(())
}
