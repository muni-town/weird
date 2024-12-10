# Weird

Weird is a _distributed_ (meaning optionally peer-to-peer and federated) Content Management System (CMS), built to increase the agency of internet users.

It can also be described as a social network for collectivized thoughts. Weird's network-system coordinates and connects people around mutual ideas and initiatives; **group projects**.

Due to its p2p underpinnings, Weird is also a very capable sync & storage engine for your _web stuff_.

## Product story

> #### Websites are the atomic matter of the internet
>
> I consider the personal website to be the smallest possible building block of web identity. Once you wanna go past the observer (READ) level to the contributor (WRITE) level as a netizen, you’re gonna need a material web-persona to make yourself known.
>
> Unfortunately we never made personal websites easy enough to build, so centralized Big Tech solutions captured the market and became our mainstream platforms, ruling over our vortual homes like feudalistic landlords.
>
> #### Web pages (re)materialize the internet
>
> It's not too late. The world wide web is a Ship of Theseus, perpetually rebuilding itself; always rematerializing.
>
> How material is the virtual internet-web really? Who knows if we'll ever be able to reach out and touch it. But at least the 'size' of the internet can be reasonably measured in the virtual atomic mass of the websites it's made up of.
>
> With every personal web page we create and connect together we are collectively materializing the internet anew, redistributing web ownership to individual stewards of the web commons.
>
> _https://blog.erlend.sh/weird-web-pages_

### Product Pillars

Our technical foundations are guided by three interconnected product pillars:

Weird CMS 🎨 – Personal web space creator (premised in [Weird web pages](https://blog.erlend.sh/weird-web-pages))
Weird ID 🪪 – Independent social sign-in (premised in [Weird netizens](https://blog.erlend.sh/weird-netizens))
Weird Net 🌐 – An actually-social network of _shared purpose_ (dedicated post forthcoming)

## Development

See [Contributing](./CONTRIBUTING.md#development-setup) for contribution info and guidelines and see
the [Developer](./DEVELOPER.md) doc for local dev environment setup instructions.

### High level architecture

The Weird app stack is written in Rust and TypeScript.

![Weird architecture diagram](https://raw.githubusercontent.com/muni-town/weird/main/docs/services.png)

Essential building blocks:

### Frontend

- [SvelteKit](https://kit.svelte.dev)

### Backend

- SvelteKit
- [Rauthy](https://github.com/sebadob/rauthy) ([OIDC](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc))
- Leaf Server <a href="https://crates.io/crates/leaf-protocol"><img src="https://img.shields.io/crates/v/leaf-protocol" />
  </a>
  - Rust
  - [Iroh](https://n0.computer)
  - [Willow](https://n0.computer)

#### Key Connectors aka _our friends_ 🫂

Not essential for groking Weird app development, but useful for broad-view context of Weird as part of an overarching ‘super app’, composed of several keystone APIs/protocols operating in harmony to make 'agentic websites' possible.

- [TakingNames](https://takingnames.io) (DNS/ICANN)
- [Polyphony](https://github.com/polyphony-chat) (polyproto(discord))
- [Kitsune](https://github.com/kitsune-soc/kitsune) (ActivityPub)
- [rsky](https://github.com/blacksky-algorithms/rsky) (AtProto)
- [Conduit](https://conduit.rs) (Matrix)
- [Stalwart](https://stalw.art) (email)
- _More to come_

## Roadmap

[Tracking Issue](https://github.com/muni-town/weird/issues/1)

1. Personal webpage generator ✔️
2. Auth v1 (OIDC) ✔️
3. Web-stuff imports ✔️
4. Projects & Pages
5. Auth v2 (IndieAuth + FedCM)
6. Websites connector (_net of shared purpose_)
7. Open Social integrations v1 (fediverse)
8. Mutual Peers Grid (p2p net)
9. Auth v3 (Nomadic ID)

If you want to chat about Weird and our vision for it feel free to join our [Discord Server](https://discord.gg/mbQYgFVBQx) or our bridge [Matrix Space](https://matrix.to/#/##muni-town:commune.sh).
