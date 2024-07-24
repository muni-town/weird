#!/usr/bin/env -S just --justfile

set dotenv-load := true

alias d := dev
alias f := fmt
alias l := lint
alias c := comply
alias k := check

[doc('List available commands.')]
_default:
    just --list --unsorted

[doc('Setup the repository.')]
setup:
    docker compose up -d
    pnpm i

[doc('Tasks to make the code-base comply with the rules. Mostly used in git hooks.')]
comply: fmt lint

[doc('Check if the repository comply with the rules and ready to be pushed.')]
check: fmt-check lint

[doc('Develop the app.')]
dev:
    pnpm run dev

[doc('Format the codebase.')]
fmt:
    cargo fmt --all
    pnpm run format
    dprint fmt

[doc('Check is the codebase properly formatted.')]
fmt-check:
    cargo fmt --all --check
    dprint check

[doc('Lint the codebase.')]
lint:
    cargo clippy --workspace --all-targets --all-features
    pnpm run lint
    # Run `typos  --write-changes` to fix the mistakes
    typos --exclude leaf/leaf-protocol/leaf-schemas/CommonMark/*
