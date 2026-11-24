# Contributing

This guide applies to people and agents. The code rules are in [AGENTS.md](AGENTS.md); this file covers the Git and GitHub workflow.

## Prerequisites

- Node.js 26 (the version is in `.nvmrc`; with nvm, run `nvm use`).
- pnpm 12. With Node's Corepack, `corepack enable` picks the version declared in the `packageManager` field of `package.json`.

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
4. **Checks** at the root: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
5. **Documentation.** If a behavior, endpoint, table or rule changed, update the matching document in `docs/` in the same PR. If you made a decision someone will question later, record it in `docs/decisions/`.
6. **Pull request** with the template filled in and `Closes #<issue>` in the description.
7. **Review.** CI must pass and someone must approve. A reviewer agent can do the first pass, but the final approval comes from a person.
8. **Squash merge.** The PR commits become one commit on `main`, with the PR title as its message. That is why the PR title also follows the commit convention.

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

Scopes: `shared`, `backend`, `frontend`, `deps`.

Examples:

```
feat(backend): add user management
fix(frontend): show error state when the users list fails to load
chore(deps): update next to 16.4.7
docs: describe how teachers see their students
```

## Definition of done

- [ ] The four checks pass.
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

Versions are always pinned, with no `^` or `~`, at the latest stable release of each series. A dependency update is its own PR, `chore(deps): ...`, with the checks passing.
