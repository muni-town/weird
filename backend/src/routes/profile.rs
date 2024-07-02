use std::{collections::HashMap, str::FromStr};

use axum::{
    extract::{DefaultBodyLimit, Multipart},
    response::Response,
    routing::delete,
};
use futures::{pin_mut, StreamExt};
use weird::{
    db::StringSerde, iroh::docs::AuthorId, profile::{Profile, Username}
};

use crate::ARGS;

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/usernames", get(get_usernames))
        .route("/profiles", get(get_profiles))
        .route("/profile/username/:username", get(get_profile_by_name))
        .route(
            "/profile/username/:username/avatar",
            get(get_profile_avatar_by_name),
        )
        .route("/profile/:user_id/avatar", get(get_profile_avatar))
        .route(
            "/profile/:user_id/avatar",
            post(post_profile_avatar).layer(DefaultBodyLimit::max(10 * 1024 * 1024)),
        )
        .route("/profile/:user_id", get(get_profile))
        .route("/profile/:user_id", post(post_profile))
        .route("/profile/:user_id", delete(delete_profile))
}

async fn get_usernames(state: State<AppState>) -> AppResult<Json<HashMap<String, StringSerde<AuthorId>>>> {
    let mut usernames = HashMap::default();
    let stream = state.weird.get_usernames().await?;
    pin_mut!(stream);
    while let Some(result) = stream.next().await {
        let (username, author_id) = result?;
        usernames.insert(username, author_id.into());
    }
    Ok(Json(usernames))
}

async fn get_profiles(state: State<AppState>) -> AppResult<Json<Vec<Profile>>> {
    let mut profiles = Vec::new();
    let stream = state.weird.profiles().await?;
    pin_mut!(stream);
    while let Some(profile) = stream.next().await {
        let profile = profile?;
        if profile.username.is_some() {
            profiles.push(profile);
        }
    }
    Ok(Json(profiles))
}

async fn get_profile_by_name(
    state: State<AppState>,
    Path(username): Path<String>,
) -> AppResult<Json<Profile>> {
    let username = Username::from_str(&username).unwrap_or_else(|_| Username {
        name: username,
        domain: ARGS.domain.clone(),
    });
    Ok(Json(state.weird.get_profile_by_name(&username).await?))
}

async fn delete_profile(state: State<AppState>, Path(user_id): Path<String>) -> AppResult<()> {
    Ok(state.weird.delete_profile(&user_id).await?)
}

async fn get_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
) -> AppResult<Json<Profile>> {
    let author = state.weird.get_or_init_author(user_id).await?;
    Ok(Json(state.weird.get_profile(author).await?))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    let author = state.weird.get_or_init_author(user_id).await?;
    state.weird.set_profile(author, new_profile.0).await?;
    Ok(())
}

async fn get_profile_avatar(
    state: State<AppState>,
    Path(user_id): Path<String>,
) -> AppResult<Response> {
    let author = state.weird.get_or_init_author(user_id).await?;
    let avatar = state.weird.get_profile_avatar(author).await?;
    if let Some(avatar) = avatar {
        Ok(Response::builder()
            .header("content-type", avatar.content_type)
            .body(avatar.data.into())
            .unwrap())
    } else {
        Ok(Response::builder()
            .status(404)
            .body("No avatar found".into())
            .unwrap())
    }
}

async fn get_profile_avatar_by_name(
    state: State<AppState>,
    Path(username): Path<Username>,
) -> AppResult<Response> {
    let avatar = state.weird.get_avatar_by_name(&username).await?;
    if let Some(avatar) = avatar {
        Ok(Response::builder()
            .header("content-type", avatar.content_type)
            .body(avatar.data.into())
            .unwrap())
    } else {
        Ok(Response::builder()
            .status(404)
            .body("No avatar found".into())
            .unwrap())
    }
}

async fn post_profile_avatar(
    state: State<AppState>,
    Path(user_id): Path<String>,
    mut data: Multipart,
) -> AppResult<()> {
    let author = state.weird.get_or_init_author(user_id).await?;

    let mut avatar = None;
    while let Some(field) = data.next_field().await? {
        if field.name() == Some("avatar") {
            avatar = Some(field.bytes().await?.to_vec());
        }
    }

    if let Some(avatar) = avatar {
        state.weird.set_profile_avatar(author, avatar).await?;
        Ok(())
    } else {
        Err(anyhow::format_err!("`avatar` field not found").into())
    }
}
