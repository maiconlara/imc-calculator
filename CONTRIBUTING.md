# Contributing

This guide applies to people and agents. The code rules are in [AGENTS.md](AGENTS.md); this file covers the Git and GitHub workflow.

## Prerequisites

- Node.js 26, the version in `.nvmrc` (with nvm, run `nvm install` and then `nvm use`).
- pnpm 12, the version in the `packageManager` field of `package.json`. Node.js 26 no longer ships Corepack, so install pnpm with npm:

  ```bash
  npm install -g pnpm@12.23.0
  ```

  npm 11 may warn that the pnpm install scripts are not covered by `allowScripts`. That is expected: pnpm works without them. Check with `pnpm -v`, which should print the version above.

  Do not rely on an older pnpm switching versions by itself: on Windows it can download pnpm 12 and then fail to start it. If `pnpm -v` still shows an older version, an older global pnpm comes first on `PATH`.

Then, at the repository root:

```bash
pnpm install
```

The API reads its settings from `apps/backend/.env`, which Git ignores. Create it from the sample, whose values work for development:

```bash
cp apps/backend/.env.example apps/backend/.env
```

The API refuses to start without `JWT_ACCESS_SECRET`, and refuses the sample secret when `NODE_ENV` is `production`.

## A change from start to finish

1. **Issue.** Every change has an issue that says what changes, for whom, and how to know it is done. Use the repository issue templates.
2. **Branch.** Start from an up to date `main`:

   ```bash
   git switch main
   git pull
   git switch -c feat/users-api
   ```

   The name follows `<type>/<short-description>`, with the same types used in commits.

3. **Small commits**, one idea each, following the convention below.
4. **Checks** at the root: `pnpm check`, which runs format, lint, type check, tests and build, the same steps as the CI.
5. **Documentation.** If a behavior, endpoint, table or rule changed, update the matching document in `docs/` in the same PR. If you made a decision someone will question later, record it in `docs/decisions/`.
6. **Pull request** with the template filled in and `Closes #<issue>` in the description.
7. **Review.** CI must pass and someone must approve. A reviewer agent can do the first pass, but the final approval comes from a person.
8. **Squash merge.** The PR commits become one commit on `main`, with the PR title as its message. That is why the PR title also follows the commit convention.

`main` is protected, administrators included: changes only arrive through a pull request, the `Pull request title` and `Checks` jobs must pass, history stays linear, and force pushes and deletion are blocked. The repository only allows squash merges.

## Commit convention

[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), with a lowercase type:

```
<type>(<optional scope>): <what changes, in the imperative>
```

| Type       | When to use                                   |
| ---------- | --------------------------------------------- |
| `feat`     | A new feature for the people using the system |
| `fix`      | A fix for a wrong behavior                    |
| `refactor` | A code change that keeps the behavior         |
| `test`     | Tests only                                    |
| `docs`     | Documentation only                            |
| `chore`    | Configuration, dependencies, scripts          |
| `ci`       | GitHub Actions pipeline                       |
| `perf`     | A performance gain that keeps the behavior    |

Scopes: `shared`, `backend`, `frontend`, `deps`. The subject starts with a lowercase letter and has no period at the end.

Examples:

```
feat(backend): add user management
fix(frontend): show error state when the users list fails to load
chore(deps): update next to 16.4.7
docs: describe how teachers see their students
```

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`:

| Job                  | What it checks                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Pull request title` | The title follows the commit convention above, since it becomes the commit on `main`                                                      |
| `Checks`             | A clean install from the lockfile with the Node.js and pnpm versions the project declares, then format, lint, type check, tests and build |
| `Docker images`      | Builds the API and panel images, creates the demo gym, starts them with Compose and signs in through the panel                            |

Third party actions are pinned to a commit SHA, with the version in a comment, so a moved tag cannot change what runs. The workflow only reads the repository.

## Definition of done

- [ ] `pnpm check` passes, and so does the CI.
- [ ] A new or changed rule has a test.
- [ ] Every new screen handles loading, error and empty list.
- [ ] Documentation is updated.
- [ ] No secrets, `console`, `any`, `useEffect` outside `useDebounce`, or em dash character (U+2014).
- [ ] The PR title follows the commit convention.

## Reviewing a PR

- Check that the PR does what the issue asks, no more and no less.
- Read the tests first: they say what the author believes the code does.
- Look for business rules outside a service (backend) or API calls outside hooks and services (frontend).
- Keep comments short and direct, as a colleague would: what is wrong, what it causes and what the fix would be.

## Dependencies

Versions are always pinned, with no `^` or `~`, at the latest stable release of each series that pnpm accepts. A dependency update is its own PR, `chore(deps): ...`, with the checks passing.

pnpm guards the supply chain, and those guards stay on:

- **Minimum release age.** pnpm refuses a version published less than a day ago. When the newest version is that fresh, use the previous one and update later. Never add `minimumReleaseAgeExclude` to `pnpm-workspace.yaml` to get around it.
- **Build scripts and agent skills.** A dependency only runs install scripts, or provides skills to AI agents, after an explicit decision recorded in `pnpm-workspace.yaml` (`allowBuilds` and `permissions`). When `pnpm install` reports a package awaiting approval, check why it needs it and decide in the PR, with `pnpm approve <package>` or `pnpm approve '!<package>'`.

The reasoning is in [decision 0008](docs/decisions/0008-dependency-supply-chain-guards.md).
