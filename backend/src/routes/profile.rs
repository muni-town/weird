use axum::routing::delete;
use futures::StreamExt;
use gdata::{GStoreBackend, GStoreValue, Value};

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/profiles", get(get_profiles))
        .route("/profile/username/:username", get(get_profile_by_name))
        .route("/profile/:user_id", get(get_profile))
        .route("/profile/:user_id", post(post_profile))
        .route("/profile/:user_id", delete(delete_profile))
}

#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(deny_unknown_fields)]
pub struct Profile {
    pub username: Option<String>,
    pub display_name: Option<String>,
    pub contact_info: Option<String>,
    pub avatar_seed: Option<String>,
    pub location: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub work_capacity: Option<WorkCapacity>,
    pub work_compensation: Option<WorkCompensation>,
    pub bio: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum WorkCapacity {
    FullTime,
    PartTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum WorkCompensation {
    Paid,
    Volunteer,
}

async fn get_profile_from_value<T: GStoreBackend + 'static>(
    profile: GStoreValue<T>,
) -> anyhow::Result<Profile> {
    let username = profile
        .get_key("username")
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    let display_name = profile
        .get_key("display_name")
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    let avatar_seed = profile
        .get_key("avatar_seed")
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    let location = profile
        .get_key("location")
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    let contact_info = profile
        .get_key("contact_info")
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    let work_capacity = profile
        .get_key("work_capacity")
        .await?
        .as_str()
        .ok()
        .and_then(|s| match s {
            "full_time" => Some(WorkCapacity::FullTime),
            "part_time" => Some(WorkCapacity::PartTime),
            _ => None,
        });
    let work_compensation = profile
        .get_key("work_compensation")
        .await?
        .as_str()
        .ok()
        .and_then(|s| match s {
            "paid" => Some(WorkCompensation::Paid),
            "volunteer" => Some(WorkCompensation::Volunteer),
            _ => None,
        });
    let bio = profile
        .get_key("bio")
        .await?
        .as_str()
        .ok()
        .map(|x| x.to_owned());
    let tags_stream = profile
        .get_key_or_init_map("tags".to_string())
        .await?
        .list_items()
        .await?
        .then(|result| async {
            let value = result?;
            let key = value.link.key.last().unwrap();
            let key = key
                .as_str()
                .ok_or_else(|| anyhow::format_err!("Tag not a string"))?
                .to_string();
            Ok::<_, anyhow::Error>(key)
        });
    futures::pin_mut!(tags_stream);
    let mut tags = Vec::new();
    while let Some(tag) = tags_stream.next().await {
        let tag = tag?;
        tags.push(tag);
    }
    Ok(Profile {
        username,
        display_name,
        avatar_seed,
        location,
        contact_info,
        tags,
        work_capacity,
        work_compensation,
        bio,
    })
}

async fn get_profiles(state: State<AppState>) -> AppResult<Json<Vec<Profile>>> {
    let profiles = state.graph.get_or_init_map((state.ns, "profiles")).await?;
    let mut profiles_resp = Vec::new();

    let mut profile_stream = profiles.list_items().await?;
    while let Some(result) = profile_stream.next().await {
        let profile = result?;
        let profile = get_profile_from_value(profile).await?;
        if profile.username.is_some() {
            profiles_resp.push(profile);
        }
    }

    Ok(Json(profiles_resp))
}

async fn get_profile_by_name(
    state: State<AppState>,
    Path(username): Path<String>,
) -> AppResult<Json<Profile>> {
    let profiles = state.graph.get_or_init_map((state.ns, "profiles")).await?;

    let mut profile_stream = profiles.list_items().await?;
    while let Some(result) = profile_stream.next().await {
        let profile = result?;
        let u = profile.get_key("username").await?;
        let u = u.as_str().ok();
        if Some(username.as_str()) == u {
            let profile = get_profile_from_value(profile).await?;
            return Ok(Json(profile));
        }
    }

    Err(anyhow::format_err!("User not found").into())
}

async fn delete_profile(state: State<AppState>, Path(user_id): Path<String>) -> AppResult<()> {
    let profiles = state.graph.get_or_init_map((state.ns, "profiles")).await?;
    let _profile = profiles.get_key_or_init_map(user_id).await?;
    Err(anyhow::format_err!("TODO: profile deletion not implemented").into())
}

async fn get_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
) -> AppResult<Json<Profile>> {
    let profiles = state.graph.get_or_init_map((state.ns, "profiles")).await?;
    let profile = profiles.get_key_or_init_map(user_id).await?;
    let profile = get_profile_from_value(profile).await?;
    Ok(Json(profile))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    let profiles = state.graph.get_or_init_map((state.ns, "profiles")).await?;

    // Usernames must be unique ( this is _really_ naïve, but just loop through every user for now
    // and make sure it's not taken )
    let mut stream = profiles.list_items().await?;
    while let Some(profile) = stream.next().await {
        let profile = profile?;
        let key = profile.link.key.last().unwrap();

        // The user's username can conflict with it's own username
        if key
            .as_str()
            .ok_or_else(|| anyhow::format_err!("username is not a string"))?
            == user_id
        {
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

    let profile = profiles.get_key_or_init_map(user_id).await?;

    profile
        .set_key(
            "username",
            new_profile
                .username
                .clone()
                .map(|x| x.into())
                .unwrap_or(Value::Null),
        )
        .await?;
    profile
        .set_key(
            "display_name",
            new_profile
                .display_name
                .clone()
                .map(|x| x.into())
                .unwrap_or(Value::Null),
        )
        .await?;
    profile
        .set_key(
            "avatar_seed",
            new_profile
                .avatar_seed
                .clone()
                .or_else(|| new_profile.username.clone())
                .map(|x| x.into())
                .unwrap_or_else(|| Value::Null),
        )
        .await?;
    profile
        .set_key(
            "location",
            new_profile
                .location
                .clone()
                .map(|x| x.into())
                .unwrap_or(Value::Null),
        )
        .await?;
    profile
        .set_key(
            "contact_info",
            new_profile
                .contact_info
                .clone()
                .map(|x| x.into())
                .unwrap_or(Value::Null),
        )
        .await?;
    profile
        .set_key(
            "work_capacity",
            new_profile
                .work_capacity
                .clone()
                .map(|x| match x {
                    WorkCapacity::FullTime => "full_time".into(),
                    WorkCapacity::PartTime => "part_time".into(),
                })
                .unwrap_or(Value::Null),
        )
        .await?;
    profile
        .set_key(
            "work_compensation",
            new_profile
                .work_compensation
                .clone()
                .map(|x| match x {
                    WorkCompensation::Paid => "paid".into(),
                    WorkCompensation::Volunteer => "volunteer".into(),
                })
                .unwrap_or(Value::Null),
        )
        .await?;
    profile
        .set_key(
            "bio",
            new_profile
                .bio
                .clone()
                .map(|x| x.into())
                .unwrap_or(Value::Null),
        )
        .await?;

        dbg!(&new_profile.tags);
    let tags = profile.get_key_or_init_map("tags").await?;
    dbg!(&tags);
    // Clear existing tags
    tags.del_all_keys().await?;
    dbg!("deleted");
    // Set tags from request
    for tag in &new_profile.tags {
        tags.set_key(tag.clone(), ()).await?;
    }

    Ok(())
}
