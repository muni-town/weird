# Architecture

This describes the current architecture in weird. This is probably going to change a lot as we go,
but right now we're starting with what's familiar and easy to get going with.

## Overview

The overall architecture is pictured below:

![image](https://github.com/commune-os/weird/assets/25393315/94e7f25f-a7a5-4712-b2b5-8dc5c6a151e7)

The web app is built with [SvelteKit](https://kit.svelte.dev/), and it's what users hit when they hit the website. The SvelteKit server proxies
auth API requests behind the `/auth/v1` URL path, to the [Rauthy](https://github.com/sebadob/rauthy) server, while overriding the routes related
to displaying things like login pages, so that we can provide a custom, integrated UI.

All core auth functionality, other than UI, is handled by the Rauthy server in the background.

For data storage, we use a custom Rust backend API server. The server-side of the SvelteKit web app will use this as a "database" to store all
persistent data that isn't related directly to the user account and stored in Rauthy. So Rauthy might store, for example, the username of a user,
but their profile bio or any webpage data that they store will be stored in the backend.

The backend will use the [Iroh](https://iroh.computer/) library for storage. This is part of our larger future plans to grow weird and to help
enable things like credible exit, but for now it will serve as an "implementation detail" invisible to the users, and not used to it's full potential.

For now our backend will be nothing more than a glorified JSON store where we will put users' profile data in.

## Interesting Iroh Details

Right now our backend just uses Iroh as a local key-value store. The interesting part is the
graph store that we've built on top of the Iroh document.

When the backend service starts up, it opens an Iroh document to store all the app data. Instead
of storing JSON documents or something similar directly in the key-value store, we wrap the key-value store
in a graph store. The graph store has a backend trait that lets it run on any key-value API and it is implemented in the [`gdata`](./backend/gdata/) crate.

The graph store is used mostly in the [profile.rs](./backend/src/routes/profile.rs) file, for storing
and loading profile data.

### API Overview

Some context on the idea of creating an Iroh graph store is in [this discussion](https://github.com/commune-os/weird/discussions/32). Here we go over some of the ways it currently works at the time of writing.

You start off by creating the `IrohGStore`, wrapping a node client and an author that will be used for modifications ( [source](https://github.com/commune-os/weird/blob/dc75dd24b217b00c7a943e7c2a185549750cc202/backend/src/main.rs#L88) ):

```rust
let graph = IrohGStore::new(node.client().clone(), node_author);
```

The graph is technically allowed to span multiple Iroh documents, so we don't need to provide a document
to open. Internally the store has an cache of the 5 most recently used documents open ( [source](https://github.com/commune-os/weird/blob/dc75dd24b217b00c7a943e7c2a185549750cc202/backend/gdata/src/lib.rs#L22) ).

When we want to get some data, we do so by providing a `Link`, which is a combination of a `NamespaceId` and a key in namespace. For example, when use the document we created to store profiles, and we get the `profiles` key out of it.

> **Note:** `state.ns` is the namespace we store our data in for the weird backend and `state.graph` is the
> `IrohGStore` we created above.

```rust
let profiles = state
        .graph
        .get_or_init_map((state.ns, "profiles".to_string()))
        .await?;
```

Here we ask the graph to get the `profiles` key out of our document, or initialize the key as a new map, if it doesn't
already exist.

In the graph store we have a handful of datatypes ( number types are pending ):

```rust
pub enum Value {
    Null,
    String(String),
    Bytes(Bytes),
    Map(Link),
    Link(Link),
}
```

A `Map` value is a mapping of `Bytes` to another `Value`, so it's kind of similar to a JSON object.

In our backend, the `profiles` map will store a mapping of user ID ( which comes from our auth server ), to a
a profile map, which stores the data for that users profile.

So, for example, if we want to get a user's username, we would then do:

```rust
let profile = profiles.get_key_or_init_map(user_id).await?;
let username: Option<&str> = profile
        .get_key("username".to_string())
        .await?
        .as_str()
        .ok();
```

This says we want to get the `user_id` key from the `profiles` map, creating a new map for the user if it
doesn't exist. We next want to get the `"username"` key from the user profile, and load it as a string
value, or `None` if it, doesn't exist, or isn't a string.

It's also as easy to set the username for a user:

```rust
profile.set_key("username".to_string(), "new_username".to_string()).await?;
```

Finally, the other major operation we want to do is list items in a map. For example if we wanted to
print all user's contact info:

```rust
let profiles = state
    .graph
    .get_or_init_map((state.ns, "profiles".to_string()))
    .await?;
let mut profile_stream = profiles.list_items().await?;
while let Some(result) = profile_stream.next().await {
    let (user_id, profile) = result?;
    let username = profile
        .get_key("contact_info".to_string())
        .await?
        .as_str()
        .ok();
    println!("{contact_info:?}")
}
```

We can also use maps to represent sets, for example, the set of user tags. We do this by making the `tags`
field of the user profile a map, and making the keys the tag names, and the values all `Null`.

Here's how we set the user tags in the graph when we get a `Vec<String>` from our API to update the user tags:

```rust
let profiles = state
    .graph
    .get_or_init_map((state.ns, "profiles".to_string()))
    .await?;
let profile = profiles.get_key_or_init_map(user_id).await?;
let tags = profile.get_key_or_init_map("tags".to_string()).await?;

// Clear existing tags
tags.del_all_keys().await?;

// Set tags from request
for tag in &new_profile.tags {
    tags.set_key(tag.clone(), ()).await?;
}
```

---

The graph system is brand new and will probably undergo a lot of iteration, but it's already serving it's purpose
of making it easier to store and query structured data in an Iroh/Key-Value context.

It'd be great to improve static typing, maybe with some kind of schemas or something, but I think the
self-describing graph is a good start that those things can be built on.
