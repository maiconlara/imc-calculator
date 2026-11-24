# 0008. Dependency supply chain guards

- Status: accepted
- Date: 2026-11-23

## Context

[Decision 0007](0007-pinned-versions.md) asks for the latest stable release of each series, pinned. pnpm 12 adds guards against compromised packages that interact with that rule:

- It refuses versions published less than a day ago (minimum release age). A hijacked release is usually caught and pulled within hours, so a short wait blocks most of these attacks.
- A dependency only runs install scripts, or provides skills to AI agents, after the project approves it.

When the monorepo was set up, the newest releases of `@tanstack/react-query`, `typescript-eslint`, `lucide-react` and `recharts` were a few hours old. pnpm offered to add each one to an exception list (`minimumReleaseAgeExclude`). Two packages had install scripts (`better-sqlite3`, which compiles the SQLite driver, and `esbuild`, which fetches its binary), and `tsdown` offered agent skills.

## Decision

- "Latest" means the newest release of the series that pnpm accepts. If the newest one is less than a day old, the previous release is used and the update comes in a later `chore(deps)` PR.
- The minimum release age stays on, and `minimumReleaseAgeExclude` is not used.
- Install scripts are allowed only for `better-sqlite3` and `esbuild` (`allowBuilds` in `pnpm-workspace.yaml`).
- Agent skills from dependencies are denied (`permissions` in `pnpm-workspace.yaml`). The project's agents follow only the instructions reviewed in `AGENTS.md`, `CLAUDE.md` and `.claude/`.
- Every new approval is a decision made in a PR, never by an agent on its own.

## Consequences

- Some versions are one patch behind for a day or two after a release.
- `pnpm install` stops when a new dependency needs a script or offers skills, which forces a conscious decision.
- The exception list never grows, so there is no stale configuration to clean up.
