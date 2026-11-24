# 0007. Pinned versions

- Status: accepted, refined by [0008](0008-dependency-supply-chain-guards.md)
- Date: 2026-11-23

## Context

With version ranges (`^1.2.0`, `~1.2.0`), two installs on different days can resolve to different versions, and the project can behave differently on another machine or in CI. The requirements also ask for the latest stable release of each series and for the Node.js and pnpm versions to be declared.

## Decision

- Every dependency in every `package.json` is pinned to an exact version, with no `^` or `~`, at the latest stable release of its series.
- Node.js 26 (LTS) is declared in `engines` and in `.nvmrc`.
- pnpm 12 is declared in `packageManager`, so Corepack picks the same version everywhere.
- The lockfile is committed.
- JWT uses `jsonwebtoken`, the library named in the requirements.
- Updates are their own PRs, `chore(deps): ...`, with every check passing.

## Consequences

- The same install on any machine and in CI.
- Security fixes do not arrive by themselves: dependencies must be reviewed and updated on purpose.
- A dependency update PR shows exactly what changed.
