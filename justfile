#!/usr/bin/env -S just --justfile

set dotenv-load := true

alias d := dev
alias f := fmt
alias l := lint
alias c := comply
alias k := check

# List available commands.
_default:
    just --list --unsorted

# Setup the repository.
setup:
    docker compose up -d
    pnpm i

# Tasks to make the code-base comply with the rules. Mostly used in git hooks.
comply: fmt lint

# Check if the repository comply with the rules and ready to be pushed.
check: fmt-check lint

# Develop the app.
dev:
    pnpm run dev

# Format the codebase.
fmt:
    cargo fmt --all
    pnpm run format
    dprint fmt

# Check is the codebase properly formatted.
fmt-check:
    cargo fmt --all --check
    dprint check

# Lint the codebase.
lint:
    cargo clippy --workspace --all-targets --all-features
    pnpm run lint
    # Run `typos  --write-changes` to fix the mistakes
    typos
