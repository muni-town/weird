# Leaf Protocol

This is a Rust crate implementing the draft [Leaf Protocol specification][lp].
In short, every "thing" is considered an Entity, which exists in a namespace at a certain path, kind of like a filesystem.
The entity may have any number of Components added to it, which are pieces of data that match a specific Schema.
The idea is to make a bunch of small Components that describe different aspect of the Entities, so that different apps can simultaneously understand and add only partial data about the entity.
For example, no matter whether an Entity is a blog post, a web page, or a user profile, they would all have a NameDescription component, and maybe an Image component, which means that any app can create a link preview for it, even if it doesn't understand any other components on the entity.
That also lets other apps add app-specific data to the Entity for incremental enhancement/customization.

In the case of chats, each chat message, as well as chat spaces, and rooms, would all be Entities.
A chat room might have a `ChatRoom` component on it, which probably would be simply a marker component and not have any data.
It would also have a `NameDescription` component, and maybe a `Slug` component that is used for it's hashtag.
Each chat message would have an `Author` component that would contain a link to another Entity that has the info describing the author of the chat. The author, for example, would have an Image component that would be used for their avatar, as well as a `NameDescription`, and a `Slug` ( we should discuss a standard component for `Slug` or `MachineName` or something eventually ).
In Rust, each component will be a Rust struct or Enum that derives `BorshSerialize` and `BorshDeserialize`, as well as custom `HasBorshSchema`, and `Component` traits.

[lp]: https://github.com/muni-town/agentic-fediverse/blob/main/leaf-protocol-draft.md
