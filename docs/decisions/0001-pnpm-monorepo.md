# 0001. pnpm monorepo

- Status: accepted
- Date: 2026-11-23

## Context

The system has an API and a web panel that share rules (BMI calculation and bands, roles, input limits) and contracts (request and response types). Keeping them in separate repositories means publishing a package or copying code every time a rule changes, and the two sides drift apart.

## Decision

One repository with pnpm workspaces:

- `apps/backend` and `apps/frontend` for the two applications.
- `packages/shared` for what both need.

The shared package is plain TypeScript with no build step. Next.js transpiles it (`transpilePackages`) and the backend bundler includes it in the output (`deps.alwaysBundle` in `tsdown.config.ts`).

## Consequences

- A contract change happens in one PR, and the type checker breaks both sides at once if they disagree.
- Commands run from the root for every package (`pnpm lint`, `pnpm test`).
- The shared package must stay free of Node, database and browser imports, or one of the apps stops building.
- CI runs the checks for the whole repository on every PR, which is fine at this size.
