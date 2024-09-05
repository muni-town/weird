# Contributing to Weird

Thanks for your help in improving the project!

## Contributor License Compromise

Independent contributions (i.e., individual pull requests) from anyone other than the Weird team ([Erlend Sogge Heggen][erlend] and [Kapono Haws][kapono]) are dual-licensed as [Polyform NonCommercial][polyform] (granted to Weird as the _licensor_) and [Blue Oak Model License v1.0][blueoak].

Thusly all independent contributors retain ownership of their contributions, albeit non-exclusively. In other words, your contributions belong equally to you as to the Weird project.

Furthermore, as a consequence of our [Polyform Countdown License Grant](/LICENSE.md#polyform-countdown-to-blue-oak), all code releases older than two years are solely licensed as Blue Oak Model License v1.0, i.e. no longer PolyForm NonCommercial licensed.

<details>

<summary>ℹ️ Questions and Answers</summary>

## Q&A

#### What is a "Contributor License Compromise"

It is our alternative to a [CLA][cla] or [DCO][dco]. The CLC intends to grant the maintainers of Weird the necessary ownership privileges to run a sustainable project whilst providing a low-friction way for external contributors to submit changes without fully relinquishing ownership of their contributions.

#### Why the PolyForm NonCommercial license?

Because Weird wants to serve self-hosters and cloud-subscribers on equal terms. As product developers we believe 'you become what you sell', and we want first and foremost to be software providers, not cloud providers. (Expounding blog post TBA).

#### Why the Blue Oak license?

Blue Oak is a simpler and [more modern alternative][blue-oak] to older permissive licenses with equivalent legal implications. It is [OSI approved][osi-approved]

</details>

## Development Setup

Steps to get Weird running locally.

### Dependencies

- Docker
- Docker Compose
- pnpm
- Rust

### Steps

- Clone the repo.
- `just setup`, Or`docker compose up -d && pnpm i`
- `just dev`, Or `pnpm run dev`
- In a separate terminal `cargo r -p backend`

### Result

- You will be able to hit the app at <http://localhost:9523>
- To see emails sent by the system you can go to the development SMTP viewer at <http://localhost:8091>

## Pull Requests

Even tiny pull requests (e.g., one character pull request fixing a typo in documentation) are greatly appreciated. Before making a large change, it is usually a good idea to first open an issue describing the change to solicit feedback and guidance. This will increase the likelihood of the PR getting merged.

### Commits

#### Commit message guidelines

We expect you to use the following format.

```
<type>(<scope>): <short summary>
  │       │             │
  │       │             └─> Summary. Not capitalized.
  │       │
  │       └─> Commit Scope
  │
  └─> Commit Type: build|ci|docs|feat|fix|perf|refactor|test
```

The `<type>` and `<summary>` fields are mandatory, the `(<scope>)` field is optional.

`<type>` must be one of the following:

- **build**: Changes that affect the build system or external dependencies (example scopes: gulp, broccoli, npm)
- **ci**: Changes to our CI configuration files and scripts (examples: CircleCi, SauceLabs)
- **docs**: Documentation only changes
- **feat**: A new feature
- **fix**: A bug fix
- **perf**: A code change that improves performance
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **test**: Adding missing tests or correcting existing tests

### Opening the Pull Request

Before opening a pull request, ensure everything functions correctly locally.
You can do this by running `just comply` followed by `just check`.

[erlend]: https://github.com/erlend-sh/
[kapono]: https://github.com/zicklag/
[polyform]: https://polyformproject.org/licenses/noncommercial/1.0.0/
[blueoak]: https://blueoakcouncil.org/license/1.0.0
[osi-approved]: https://opensource.org/license/blue-oak-model-license

<!-- dprint-ignore -->
[cla]: https://en.wikipedia.org/wiki/Contributor_License_Agreement
[dco]: https://en.wikipedia.org/wiki/Developer_Certificate_of_Origin

<!-- dprint-ignore -->
[blue-oak]: https://writing.kemitchell.com/2019/03/09/Deprecation-Notice.html
