use std::str::FromStr;

use axum::{
    extract::{DefaultBodyLimit, Multipart},
    response::Response,
    routing::delete,
};
use futures::{pin_mut, StreamExt};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use weird::{
    gdata::{GStoreBackend, Key},
    iroh::docs::AuthorId,
    profile::{Profile, Username},
};

use crate::ARGS;

use super::*;

pub fn install(router: Router<AppState>) -> Router<AppState> {
    router
        .route("/domains", get(get_domains))
        .route("/profiles", get(get_profiles))
        .route("/profile/username/:username", get(get_profile_by_name))
        .route("/profile/domain/:domain", get(get_profile_by_domain))
        .route("/profile/domain/:domain", post(set_domain_for_profile))
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
        .route("/token/:user_id/revoke", post(post_revoke_token))
        .route("/token/:user_id/generate", post(post_generate_token))
        .route("/token/:user_id/verify", post(post_verify_token))
        .route("/token/:token", post(post_profile_by_token))
}

async fn get_usernames(
    state: State<AppState>,
) -> AppResult<Json<HashMap<String, StringSerde<AuthorId>>>> {
    let mut usernames = HashMap::default();
    let stream = state.weird.get_usernames().await?;
    pin_mut!(stream);
    while let Some(result) = stream.next().await {
        let (username, author_id) = result?;
        let profile = state.weird.get_profile_value(author_id).await?;
        let custom_domain = profile
            .get_key("custom_domain")
            .await?
            .as_str()
            .map(ToOwned::to_owned)
            .ok();
        let username = Username::from_str(&username)?;
        if username.domain != ARGS.domain {
            return Err(anyhow::format_err!(
                "User name {username} does not match instance domain: {}",
                ARGS.domain
            )
            .into());
        }
        domains.push(custom_domain.unwrap_or_else(|| format!("{}.{}", username.name, ARGS.domain)));
    }
    Ok(Json(domains))
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

async fn get_profile_by_domain(
    state: State<AppState>,
    Path(domain): Path<String>,
) -> AppResult<Json<Profile>> {
    let domains = state
        .weird
        .graph
        .get((state.weird.ns, &*DOMAINS_STORAGE_KEY))
        .await?;
    let author_bytes = domains.get_key(&domain).await?;
    if author_bytes.is_null() {
        return Err(anyhow::format_err!("User not found for domain: {domain}").into());
    }
    let author_bytes: [u8; 32] = author_bytes.as_bytes()?[..].try_into()?;
    let author = AuthorId::from(author_bytes);
    Ok(Json(state.weird.get_profile(author).await?))
}

#[derive(Deserialize)]
struct SetDomainReq {
    domain: Option<String>,
}

async fn set_domain_for_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    Json(data): Json<SetDomainReq>,
) -> AppResult<()> {
    if let Some(domain) = &data.domain {
        if domain.ends_with(&ARGS.domain) {
            return Err(anyhow::format_err!(
                "Cannot set domain to a sub-domain of {}: {}",
                ARGS.domain,
                domain
            )
            .into());
        }
    }

    let domains = state
        .weird
        .graph
        .get_or_init_map((state.weird.ns, &*DOMAINS_STORAGE_KEY))
        .await?;
    let author = state.weird.get_or_init_author(&user_id).await?;
    let profile = state.weird.get_profile_value(author).await?;

    let delete_previous_domain_mapping = || async {
        // See if there was a previous username
        let previous_domain = profile.get_key("custom_domain").await?;
        if let Ok(previous_domain) = previous_domain.as_str() {
            // Delete the username reservation
            domains.del_key(previous_domain).await?;
        }
        Ok::<_, anyhow::Error>(())
    };

    // If there is a username set
    if let Some(new_domain) = &data.domain {
        // Check if there is already an author set for that domain
        let existing_author = &domains.get_key(new_domain).await?;
        if !existing_author.is_null() {
            let existing_author_key: AuthorId =
                <[u8; 32]>::try_from(&existing_author.as_bytes()?[..])?.into();
            // Don't allow replacing existing author in username
            if existing_author_key != author {
                return Err(anyhow::format_err!("domain already taken").into());
            }

        // If this domain is available
        } else {
            // Free the old domain mapping
            delete_previous_domain_mapping().await?;

            // Claim the username
            domains.set_key(new_domain, &author.as_bytes()[..]).await?;
            profile.set_key("custom_domain", new_domain).await?;
        }
    } else {
        // Free the old username mapping
        delete_previous_domain_mapping().await?;
        profile.del_key("custom_domain").await?;
    }

    Ok(())
}

async fn delete_profile(state: State<AppState>, Path(user_id): Path<String>) -> AppResult<()> {
    Ok(state.weird.delete_profile(&user_id).await?)
}

async fn get_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
) -> AppResult<Json<ProfileWithDomain>> {
    let author = state.weird.get_or_init_author(user_id).await?;
    let value = state.weird.get_profile_value(author).await?;
    let profile = Profile::from_value(&value).await?;
    let custom_domain = value
        .get_key("custom_domain")
        .await?
        .as_str()
        .map(ToOwned::to_owned)
        .ok();
    Ok(Json(ProfileWithDomain {
        profile,
        custom_domain,
    }))
}

async fn post_profile(
    state: State<AppState>,
    Path(user_id): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    let author = state.weird.get_or_init_author(user_id).await?;
    // delete `token` field

    state.weird.set_profile(author, new_profile.0).await?;
    Ok(())
}

async fn post_profile_by_token(
    state: State<AppState>,
    Path(token): Path<String>,
    new_profile: Json<Profile>,
) -> AppResult<()> {
    // for the user_tokens hashmap with the token as the value, get the key of user id
    let mut user_id = Default::default();
    let _ = USER_TOKENS.scan(|k, v| {
        if v == &token {
            user_id = k.clone();
        }
    });

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
