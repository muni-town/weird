# Arhcitecture

This describes the current architecture in weird. This is probalby going to change a lot as we go,
but right now we're starting with what's familar and easy to get going with.

## Overview

The overal arhcitecture is pictured below:

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
