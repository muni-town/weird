# Weird

*A digital garden for personal web-spaces.*

Weird is a brand new thing, but if prior art helps: Think of it as if [WordPress](https://wordpress.org/) and [Notion](https://www.notion.com/) had a [Linktree](https://linktr.ee/)-shaped baby. That is to say, a WordPress-type website engine with the editing experience of Notion and the simplicity of Linktree.

### Key Features

- **2-minute site creation:** Escape the [content-creation imperative](https://blog.muni.town/p/c69e4984-67d7-4dd7-8f4a-c7d1ef85915b/) by grabbing whatever self-links you’ve got and re-consolidate your digital identity.
- **Reclaim your captured content:** Automated pipelines for [PESOS & POSSE posting strategies](https://blog.muni.town/data-defragmentation/).
- **Grow web gardens:** Forget about chronological web logs, we're doing [digital gardening](https://maggieappleton.com/garden-history/) now. Casually plop your tiny blurb-seeds down and cultivate them at your leisure.
- **Enter the indieverse:** Connect to the [wildly weird web of indie apps](https://github.com/muni-town/weird/discussions/283), outside the dreary confines of big tech. 🚧*Coming soon*
- **Find the others:** Participate in [federated webrings](https://blog.muni.town/federated-webrings/). 🚧*Coming soon*

More technically put, Weird is a _distributed_ (optionally peer-to-peer and federated) Content Management System (CMS), designed to enable an [agentic web](https://github.com/muni-town/agentic-fediverse).

### Product story

> #### The atomic matter of the internet
>
> I consider the personal website to be the smallest possible building block of web identity. Once you wanna go past the observer (READ) level to the contributor (WRITE) level as a netizen, you’re gonna need a material web-persona to make yourself known.
>
> Unfortunately we never made personal websites easy enough to build, so centralized Big Tech solutions captured the market and became our mainstream platforms, ruling over our virtual homes like feudalistic landlords.
>
> #### Web pages (re)materialize the internet
>
> It's not too late. The world wide web is a Ship of Theseus, perpetually rebuilding itself; always rematerializing.
>
> How material is the virtual inter-web really? Who knows if we'll ever be able to reach out and touch it. But at least the 'size' of the internet can be reasonably measured in the virtual atomic mass of the websites it's made up of.
>
> With every personal web page we create and connect together we are collectively materializing the internet anew, redistributing web ownership to individual stewards of the web commons.

- [Weird web pages](https://blog.erlend.sh/weird-web-pages)
- [Weird netizens](https://blog.erlend.sh/weird-netizens)
- [Welcome to Muni Town](https://blog.muni.town/muni-town/)
- [Digital Homeownership](https://blog.muni.town/digital-homeownership/)

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

## Roadmap

[Tracking Issue](https://github.com/muni-town/weird/issues/1)

1. Personal webpage generator ✔️
2. Auth v1 (OIDC) ✔️
3. Web-stuff imports ✔️
4. Custom themes ✔️
5. Projects & Pages
6. Auth v2 (IndieAuth + FedCM)
7. Websites connector (_net of shared purpose_)
8. Open Social integrations v1 (fediverse)
9. Mutual Peers Grid (p2p net)
10. Auth v3 (Nomadic ID)

If you want to chat about Weird and our vision for it feel free to join our [Discord Server](https://discord.gg/mbQYgFVBQx) or our bridged [Matrix Space](https://matrix.to/#/#muni-town:commune.sh).
