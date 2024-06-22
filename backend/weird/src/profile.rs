//! User profile operations for [`Weird`].

use std::{fmt::Debug, str::FromStr};

use anyhow::Result;
use futures::{Stream, StreamExt};
use gdata::{GStoreBackend, GStoreValue, Key, KeySegment, Value};
use iroh::docs::{AuthorId, NamespaceId};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

use crate::{Weird, INSTANCE_DATA_KEY};

/// The key that the user profiles are stored under in the instance namespace.
pub static PROFILES_KEY: Lazy<Key> = Lazy::new(|| INSTANCE_DATA_KEY.join("profiles"));
/// The key to the username map in the instance namespace.
pub static USERNAMES_KEY: Lazy<Key> = Lazy::new(|| INSTANCE_DATA_KEY.join("usernames"));
/// The key to the user_ids map in the instance namespace.
pub static USER_IDS_KEY: Lazy<Key> = Lazy::new(|| INSTANCE_DATA_KEY.join("user_ids"));

/// A user's username.
#[derive(Clone, Debug, Eq, PartialEq, Hash)]
pub struct Username {
    pub name: String,
    pub domain: String,
}

/// The data associated to a user profile.
#[derive(Serialize, Deserialize, Debug, Default, Clone)]
#[serde(deny_unknown_fields)]
pub struct Profile {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<Username>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact_info: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar_seed: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub location: Option<String>,
    #[serde(default)]
    #[serde(skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub work_capacity: Option<WorkCapacity>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub work_compensation: Option<WorkCompensation>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bio: Option<String>,
}

#[derive(Debug)]
pub struct ParseUsernameError;
impl std::fmt::Display for ParseUsernameError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Could not parse username. Must be in the format `username@domain`."
        )
    }
}
impl std::error::Error for ParseUsernameError {}

impl FromStr for Username {
    type Err = ParseUsernameError;
    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
        let (username, domain) = s.split_once('@').ok_or(ParseUsernameError)?;
        Ok(Self {
            name: username.to_owned(),
            domain: domain.to_owned(),
        })
    }
}
impl std::fmt::Display for Username {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}@{}", self.name, self.domain)
    }
}
impl serde::Serialize for Username {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&format!("{self}"))
    }
}
impl<'de> serde::Deserialize<'de> for Username {
    fn deserialize<D>(deserializer: D) -> std::result::Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        use serde::de::Error;
        let string = String::deserialize(deserializer)?;
        let username = Username::from_str(&string).map_err(|e| Error::custom(format!("{e}")))?;
        Ok(username)
    }
}

impl Profile {
    /// Load a profile from a [`GStoreValue`].
    pub async fn from_value<T: GStoreBackend + 'static>(
        profile: &GStoreValue<T>,
    ) -> Result<Profile> {
        let username = profile
            .get_key("username")
            .await?
            .as_str()
            .ok()
            .map(|x| x.parse())
            .transpose()?;
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
            .get_or_init_map("tags".to_string())
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

    /// Stores the profile in the provided [`GStoreValue`].
    pub async fn write_to_value<T: GStoreBackend + 'static>(
        &self,
        value: &GStoreValue<T>,
    ) -> Result<()> {
        value
            .set_key(
                "username",
                self.username
                    .clone()
                    .map(|x| x.to_string().into())
                    .unwrap_or(Value::Null),
            )
            .await?;
        value
            .set_key(
                "display_name",
                self.display_name
                    .clone()
                    .map(|x| x.into())
                    .unwrap_or(Value::Null),
            )
            .await?;
        value
            .set_key(
                "avatar_seed",
                self.avatar_seed
                    .clone()
                    .or_else(|| self.username.clone().map(|x| x.to_string()))
                    .map(|x| x.into())
                    .unwrap_or_else(|| Value::Null),
            )
            .await?;
        value
            .set_key(
                "location",
                self.location
                    .clone()
                    .map(|x| x.into())
                    .unwrap_or(Value::Null),
            )
            .await?;
        value
            .set_key(
                "contact_info",
                self.contact_info
                    .clone()
                    .map(|x| x.into())
                    .unwrap_or(Value::Null),
            )
            .await?;
        value
            .set_key(
                "work_capacity",
                self.work_capacity
                    .clone()
                    .map(|x| match x {
                        WorkCapacity::FullTime => "full_time".into(),
                        WorkCapacity::PartTime => "part_time".into(),
                    })
                    .unwrap_or(Value::Null),
            )
            .await?;
        value
            .set_key(
                "work_compensation",
                self.work_compensation
                    .clone()
                    .map(|x| match x {
                        WorkCompensation::Paid => "paid".into(),
                        WorkCompensation::Volunteer => "volunteer".into(),
                    })
                    .unwrap_or(Value::Null),
            )
            .await?;
        value
            .set_key(
                "bio",
                self.bio.clone().map(|x| x.into()).unwrap_or(Value::Null),
            )
            .await?;
        let tags = value.get_or_init_map("tags").await?;
        // Clear existing tags
        tags.del_all_keys().await?;
        // Set tags from request
        for tag in &self.tags {
            tags.set_key(tag.clone(), ()).await?;
        }

        Ok(())
    }
}

/// A capacity that a user has for work.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum WorkCapacity {
    FullTime,
    PartTime,
}

/// How the user expect to be compensated for their work.
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum WorkCompensation {
    Paid,
    Volunteer,
}

impl<S> Weird<S> {
    /// Gets or creates a new author that is associated to the provided `user_id``.
    ///
    /// The user ID can be anything that makes sense for your application, such as a UUID, ULID, or
    /// monotonic user identifier. You can use whatever comes from your authentication
    /// implementation.
    ///
    /// If your app uses decentralized [`AuthorId`]s directly, you may not need user IDs at all.
    #[tracing::instrument(skip(self))]
    pub async fn get_or_init_author<K: Into<KeySegment> + Debug>(
        &self,
        user_id: K,
    ) -> anyhow::Result<AuthorId> {
        let user_ids = self
            .graph
            .get_or_init_map((self.ns, &*USER_IDS_KEY))
            .await?;
        let mut author_entry = user_ids.get_key(user_id).await?;

        // If this user ID doesn't have an author yet.
        let author_id;
        if author_entry.is_null() {
            author_id = self.node.authors().create().await?;
            author_entry.set(&author_id.as_bytes()[..]).await?;
        } else {
            let author_bytes: [u8; 32] = author_entry.as_bytes()?[..].try_into()?;
            author_id = AuthorId::from(author_bytes);
        }

        Ok(author_id)
    }

    /// Iterate over all user profiles.
    #[tracing::instrument(skip(self))]
    pub async fn profiles(&self) -> Result<impl Stream<Item = anyhow::Result<Profile>>> {
        let profiles = self
            .graph
            .get_or_init_map((self.ns, &*PROFILES_KEY))
            .await?;

        Ok(profiles.list_items().await?.then(|item| async {
            match item {
                Ok(profile) => Ok(Profile::from_value(&profile).await?),
                Err(e) => Err(e),
            }
        }))
    }

    /// Get a user profile.
    #[tracing::instrument(skip(self))]
    pub async fn get_profile(&self, author: AuthorId) -> Result<Profile> {
        let profiles = self
            .graph
            .get_or_init_map((self.ns, &*PROFILES_KEY))
            .await?;
        let profile = profiles.get_or_init_map(&author.as_bytes()[..]).await?;
        let profile = Profile::from_value(&profile).await?;
        Ok(profile)
    }

    /// Get profile by name.
    #[tracing::instrument(skip(self))]
    pub async fn get_profile_by_name(&self, username: &Username) -> Result<Profile> {
        // Resolve the namespace associated to the username
        let ns = if username.domain == self.domain {
            // Use our own namespace
            self.ns
        } else {
            // Lookup the `instance.weird.domain` TXT record to find the namespace of the weird
            // instance.
            let lookup_err = || {
                anyhow::format_err!(
                    "Failed to query/parse DNS query `TXT instance.weird.{}.` \
                    when looking up username `{}`. \
                    Expected public weird Instance ID.",
                    username.domain,
                    username
                )
            };
            let txt_lookup = self
                .resolver
                .txt_lookup(format!("instance.weird.{}.", username.domain))
                .await?;
            let lookup = txt_lookup
                .iter()
                .next()
                .ok_or_else(lookup_err)?
                .txt_data()
                .first()
                .ok_or_else(lookup_err)?;
            let lookup = std::str::from_utf8(&lookup[..])?;
            NamespaceId::from_str(lookup)?
        };

        let profiles = self.graph.get_or_init_map((ns, &*PROFILES_KEY)).await?;
        let usernames = self.graph.get_or_init_map((ns, &*USERNAMES_KEY)).await?;

        let author = usernames.get_key(&username.to_string()).await?;
        let author_bytes: [u8; 32] = author.as_bytes()?[..].try_into()?;

        let profile = profiles.get_key(&author_bytes[..]).await?;
        Profile::from_value(&profile).await
    }

    /// Set a user profile.
    #[tracing::instrument(skip(self))]
    pub async fn set_profile(&self, author: AuthorId, new_profile: Profile) -> Result<()> {
        let profiles = self
            .graph
            .get_or_init_map((self.ns, &*PROFILES_KEY))
            .await?;
        let usernames = self
            .graph
            .get_or_init_map((self.ns, &*USERNAMES_KEY))
            .await?;

        // If there is a username set
        if let Some(new_username) = &new_profile.username {
            if new_username.domain != self.domain {
                anyhow::bail!("Username domain does not match this instance's domain.");
            }
            let new_username_string = new_username.to_string();

            // Check if there is already an author set for that username
            let existing_author = &usernames.get_key(&new_username_string).await?;
            if !existing_author.is_null() {
                let existing_author_key: AuthorId =
                    <[u8; 32]>::try_from(&existing_author.as_bytes()?[..])?.into();
                // Don't allow replacing existing author in username
                if existing_author_key != author {
                    anyhow::bail!("Username already taken")
                }

            // If this username is available
            } else {
                // Claim the username
                usernames
                    .set_key(&new_username_string, &author.as_bytes()[..])
                    .await?;
            }
        } else {
            // See if there was a previous username
            let previous_username = profiles.get_key(&author.as_bytes()[..]).await?;
            if let Ok(previous_username) = previous_username.as_str() {
                // Delete the username reservation
                usernames.del_key(previous_username).await?;
            }
        }

        // If the username claim goes fine

        // Write the author profile
        let profile = profiles
            .with_author(author)
            .get_or_init_map(&author.as_bytes()[..])
            .await?;
        new_profile.write_to_value(&profile).await?;

        Ok(())
    }

    /// Delete a user profile.
    #[tracing::instrument(skip(self))]
    pub async fn delete_profile(&self, user_id: &str) -> Result<()> {
        let profiles = self
            .graph
            .get_or_init_map((self.ns, &*PROFILES_KEY))
            .await?;
        let profile = profiles.get_or_init_map(user_id).await?;
        profile.del_all_keys().await?;
        Ok(())
    }
}
