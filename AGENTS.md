# Guide for agents and people

This file is the single source of the project rules. It applies to any AI agent (Claude Code, Codex, Cursor, Copilot) and to any person who changes the code. `CLAUDE.md` only imports this file and adds what is specific to Claude Code.

## The project

A web system for a gym to track the BMI of its students. Three roles sign in with username and password: administrator, teacher and student. Each one sees and does only what the business rules allow.

## Where things are

| I need to...                                    | Read                                                             |
| ----------------------------------------------- | ---------------------------------------------------------------- |
| Understand what the system does                 | [docs/product/requirements.md](docs/product/requirements.md)     |
| Know who can do what                            | [docs/product/business-rules.md](docs/product/business-rules.md) |
| See how the parts connect                       | [docs/architecture/overview.md](docs/architecture/overview.md)   |
| Change the API                                  | [docs/architecture/backend.md](docs/architecture/backend.md)     |
| Change the panel                                | [docs/architecture/frontend.md](docs/architecture/frontend.md)   |
| Change the database                             | [docs/architecture/database.md](docs/architecture/database.md)   |
| Look up an endpoint                             | [docs/api.md](docs/api.md)                                       |
| Understand why something was done a certain way | [docs/decisions/](docs/decisions/README.md)                      |
| Branch, commit and open a pull request          | [CONTRIBUTING.md](CONTRIBUTING.md)                               |
| Know how agents and people split the work       | [docs/agents.md](docs/agents.md)                                 |

## Structure

A pnpm workspaces monorepo:

- `apps/backend`: REST API with Express 5, TypeORM 1, SQLite (better-sqlite3), Zod and JWT (jsonwebtoken).
- `apps/frontend`: panel with Next.js 16 (App Router), React 19, Chakra UI 3, TanStack Query 5, React Hook Form, Zod and Axios.
- `packages/shared`: rules and contracts used by both sides (`@imc-calculator/shared`).

Exact versions live in the `package.json` files, always pinned (no `^` or `~`). Node.js 26 (exact version in `.nvmrc`) and pnpm 12 (in `packageManager`). Setup and dependency rules are in [CONTRIBUTING.md](CONTRIBUTING.md).

## Commands

Run them at the repository root:

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `pnpm install`      | Installs the dependencies of every package    |
| `pnpm dev`          | Starts the API and the panel with hot reload  |
| `pnpm check`        | Runs every check below, in order, like the CI |
| `pnpm format:check` | Prettier, without changing files              |
| `pnpm lint`         | ESLint on every package                       |
| `pnpm typecheck`    | Type checking on every package                |
| `pnpm test`         | Tests (Vitest) of every package               |
| `pnpm build`        | Production build of both apps                 |
| `pnpm format`       | Formats every file with Prettier              |
| `pnpm db:migrate`   | Applies the pending migrations                |
| `pnpm db:seed`      | Recreates the database with demo data         |

Before saying a task is done, `pnpm check` must pass with no errors. If it fails, say which step failed and show the output.

## Workflow

1. Every change starts from a GitHub issue.
2. Create a branch from an up to date `main`, named `<type>/<short-description>` (for example, `feat/users-api`).
3. Commits follow Conventional Commits (`feat(backend): add user management`).
4. Run the checks and update the affected documentation.
5. Open the pull request with the template and `Closes #<issue>`. Merges are squashed, so the PR title becomes the commit on `main`.

Details in [CONTRIBUTING.md](CONTRIBUTING.md).

## Language and naming

- Code in English: files, folders, identifiers, API and screen routes, JSON fields, enum values, logs and test names.
- Text shown on screen is in Brazilian Portuguese: labels, validation messages, API error messages shown to the user and toasts.
- Documentation, commit messages and pull requests in English.
- Files in kebab-case (`assessment-form-dialog.tsx`, `user.service.ts`). Components stay in PascalCase inside the file.
- Every name explains its use at first read. A function that fetches starts with `get` (`getUsers`), a hook that fetches with `useGet` (`useGetUsers`), a boolean reads as a question (`isLoading`, `canDeleteUsers`). No bare `api`, `client`, `data` or `item`: say which one (`proxiedBackendApi`, `usersPage`).
- Renaming one link renames the whole chain: variable, parameter, option and type.
- Roles are `admin`, `teacher` and `student`; statuses, `active` and `inactive`; classifications, from `underweight` to `obesity-class-3`. The Portuguese labels live in `packages/shared`.

## Architecture rules

A summary of what must not be broken. The reasons are in the architecture documents and in the decision records.

### Shared

- A rule both sides need (validation, enum, calculation, BMI table) is born in `packages/shared`. Never duplicate a rule in the backend and the frontend.
- The BMI band table is the only source of the classification. Adding a band means adding one row to it.
- The package is plain TypeScript, with no build step, and imports nothing from Node, the database or the browser.

### Backend

- Layers: `routes → controller → service → repository (interface) → TypeORM implementation`.
- A controller only handles HTTP: it validates `body`, `params` and `query` with the shared schema and calls the service.
- A service holds the rules and permissions. It receives its dependencies through the constructor and depends only on interfaces.
- Only the TypeORM repositories (`infra/database/repositories`) know the ORM.
- `container.ts` is the only place that binds an interface to its implementation.
- Authentication and role are checked by the `authenticateRequest` and `requireRole` middlewares. A permission rule that depends on data (a teacher only manages students) lives in the service.
- Business errors use the classes in `shared/errors.ts`. Error handling is centralized and the response is always `{ message, issues? }`.
- Database change: a new migration. An applied migration is never edited.
- Logs only through pino (`req.log` in routes). `console` is forbidden.

### Frontend

- Layers: `services` (Axios, one function per endpoint) → `queries` (TanStack Query keys and options) → `hooks` (one per file) → `components/views` (screens) → `components/contents` (server-side fetch) → `app/(panel)` (pages).
- A screen component never calls the API directly: always hook → service.
- Every screen handles four states: loading, error (with a way to retry), empty list and empty list because of a filter.
- An element used on more than one screen becomes a component in `components/ui`. Never copy and paste between screens.
- The same form handles create and edit.
- Who can see each screen and each action comes from one place: `lib/permissions.ts`. The menu, the pages and the buttons read from it.
- Session tokens live in `httpOnly` cookies. The browser never sees a token.

## Team rules

- No `useEffect`. The linter blocks it. Derive during render with `useMemo`, use TanStack Query for data and `autoFocus` for focus. Only exception: the `useDebounce` hook.
- No Lodash. Use the language's native APIs.
- No `any`. Full typing.
- No code comments, except short technical JSDoc in English.
- No em dash character (U+2014) in code, screen text, documentation or commit messages.
- Screen text in Brazilian Portuguese, short and direct sentences.

## Security

- No secrets in the repository. Each app has a `.env.example` with sample values, and the real `.env` stays out of Git.
- Input always goes through a Zod schema before reaching a service.
- Passwords only as hashes (bcrypt). Refresh tokens only as hashes in the database.

## Done means

- `pnpm check` passes (format, lint, types, tests and build), and so does the CI.
- A new or changed rule has a test.
- The affected documentation was updated in the same PR, and a new decision became a record in `docs/decisions/`.

## What an agent never does on its own

- Commit, push, open or merge a PR without an explicit request from the person driving the session.
- Change GitHub settings (`main` protection, permissions, CI secrets).
- Add or upgrade a dependency, approve its install scripts or agent skills, or add a release age exception in `pnpm-workspace.yaml`.
- Delete data, migrations or Git history.
- Turn off a lint, TypeScript or CI check to make something pass.
