# Release Instructions

Manually bump the versions in the `package.json` and `leaf/ts/package.json` files.

Use [`cargo workspaces`](https://github.com/pksunkara/cargo-workspaces) to bump the version of all the Rust crates:

    cargo ws version minor --no-git-commit

Make sure everything still works.

Do a cargo publish dry-run just to make sure everything looks ready for cargo:

    cargo ws publish --no-git-push --publish-as-is --no-remove-dev-deps --dry-run

Commit the changes and push them.

Make sure CI passes on GitHub.

Create a new tag locally and push it:

    git tag -a v0.2.0
    git push --tags

Publish the npm packages:

    pnpm publish -r

Publish the cargo packages:

    cargo ws publish --no-git-push --publish-as-is --no-remove-dev-deps
