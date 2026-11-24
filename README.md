# IMC Calculator

Web system for a gym to track the Body Mass Index (BMI, "IMC" in Portuguese) of its students. Teachers record assessments with height and weight, the system calculates and stores the BMI and its classification, and each student follows their own progress.

> The project is under construction. The monorepo and its tooling are in place; the API and the panel are being added, and the instructions to run them arrive together with the code.

## What it does

| Role          | Can                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------ |
| Administrator | Register, edit, activate, deactivate and delete users of any role; manage every assessment |
| Teacher       | Register and edit students; record and edit assessments; see their students' history       |
| Student       | See their own assessments and progress                                                     |

Inactive users cannot sign in and cannot receive new assessments. The full rules are in [docs/product/business-rules.md](docs/product/business-rules.md).

## Tech stack

| Layer    | Technology                                                                               |
| -------- | ---------------------------------------------------------------------------------------- |
| Monorepo | pnpm 12 workspaces, Node.js 26, TypeScript 6 (`strict`)                                  |
| API      | Express 5, TypeORM 1 with migrations, SQLite (better-sqlite3), Zod, jsonwebtoken         |
| Panel    | Next.js 16 (App Router), React 19, Chakra UI 3, TanStack Query 5, React Hook Form, Axios |
| Shared   | BMI rules, roles and Zod schemas used by both apps                                       |

Every dependency is pinned to an exact version. See [decision 0007](docs/decisions/0007-pinned-versions.md).

## Repository structure

```
imc-calculator/
├── apps/
│   ├── backend/     REST API
│   └── frontend/    Web panel
├── packages/
│   └── shared/      Rules and contracts shared by both apps
├── docs/            Product, architecture, API and decision records
├── .claude/         Claude Code agents and skills
└── .github/         Issue and pull request templates, CI
```

## Development

Prerequisites: Node.js 26 (exact version in [.nvmrc](.nvmrc)) and pnpm 12. How to install them is in [CONTRIBUTING.md](CONTRIBUTING.md#prerequisites).

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Documentation

- [Requirements](docs/product/requirements.md) and [business rules](docs/product/business-rules.md)
- [Architecture overview](docs/architecture/overview.md), with [backend](docs/architecture/backend.md), [frontend](docs/architecture/frontend.md) and [database](docs/architecture/database.md)
- [API reference](docs/api.md)
- [Decision records](docs/decisions/README.md)

## Built for people and agents

The project is set up so AI agents can work on it with the same rules as people:

- [AGENTS.md](AGENTS.md) is the single source of the project rules, read by any agent (Claude Code, Codex, Cursor, Copilot).
- [CLAUDE.md](CLAUDE.md) imports it and lists the Claude Code agents and skills in [.claude/](.claude/).
- [docs/agents.md](docs/agents.md) explains how a task flows from an issue to a merged pull request, and where people stay in control.

## Contributing

Branches, Conventional Commits, pull requests and reviews are described in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
