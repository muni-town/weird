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
    let profiles = state
        .graph
        .get_or_init_map((state.ns, "profiles".to_string()))
        .await?;
    let profile = profiles.get_key_or_init_map(user_id).await?;
    let username = profile
        .get_key("username".to_string())
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());

    Ok(Json(Profile { username }))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    let profiles = state
        .graph
        .get_or_init_map((state.ns, "profiles".to_string()))
        .await?;

    // Usernames must be unique ( this is _really_ naïve, but just loop through every user for now
    // and make sure it's not taken )
    let mut stream = profiles.list_items().await?;
    while let Some(profile) = stream.next().await {
        let (key, profile) = profile?;

        // The user's username can conflict with it's own username
        if key == user_id.as_bytes() {
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
