# Development Setup

Steps to get Weird running locally.

## Getting Started

The following is a detailed guide on setting up the development enviroment for weird.

### Pre-Requisites

- [Docker & Docker Compose](https://docs.docker.com/engine/install/)
- [dprint](https://dprint.dev/install/)
- [Justfile](https://github.com/casey/just) (Optional but Recommended)
- [pnpm](https://pnpm.io/installation)
- [Rust](https://rustup.rs)

### Setup

1. Clone the repo

```bash
# HTTPS
git clone https://github.com/muni-town/weird.git
```

```bash
# SSH
git clone git@github.com:muni-town/weird.git
```

2. Change directory to the cloned repo

```bash
cd ./weird
```

3. Setup Dockerized Environment to run Rauthy Auth Server and SMTP4Dev.

- Rauthy is a OIDC Server written in Rust, different to most OIDC solutions out there Rauthy comes with a Admin UI to allow you manage accounts
- SMTP4Dev is a SMTP Relay for development purposes. Any emails sent in the development phase will be reaching to this inbox.

If you have Justfile installed, you can use the following just recipe

```bash
just setup
```

Alternatively you can use the following commands:

```bash
docker compose build && pnpm i
```

4. The `Leaf Server` is the main process running as back-end solution for Weird, its written in Rust.

Install server dependencies to prepare the project:

```bash
cargo b
```

### Development

Once you have run the setup process successfully all requirements are now set to begin the develpment process.

1. Run the containerized environment in Docker using:

If you have `just` installed, use the following command:

```bash
just services
```

Alternatively use the following `docker compose` command:

```bash
docker compose up -d
```

> If you want to hook into the Docker process just remove the `-d` (detached) option.

2. Run the `Leaf Server`:

```bash
cargo r
```

3. Open a separate terminal to run the front-end solution for Weird

```bash
pnpm run dev
```

### Environment

Once you run [Development](#development) commands you will have the following services available running in your system.

| Service  | Address          |
| -------- | ---------------- |
| Rauthy   | `localhost:8921` |
| SMTP4Dev | `localhost:8091` |

### Cleanup and Resume

When you are ready, you can stop background tasks using `just stop`, alternatively you can run `docker compose down`.

### Troubleshooting

If you are getting HTTP 500 errors you may need to:

- stop the `cargo r` command
- remove the `data` dir, and
- start it again with `cargo r`

This will clear all of the Weird app data ( but not the registered user accounts themselves ), which might not be compatible with the current version of the app, if you had the `data` dir left over from working on a previous version.

### Fully Containerized Setup

The steps above partially containerize the environment, leaving the backend (`leaf-rpc-server`) and frontend (`weird's svletekit`) running locally.
To fully containerize all services, follow the steps below:

```bash
$ docker compose -f compose.local.yaml up -d
```

The ports remain the same, so you can continue accessing services on the previous ports, such as <http://localhost:9523>, as usual.
