# IMC Calculator

[![CI](https://github.com/maiconlara/imc-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/maiconlara/imc-calculator/actions/workflows/ci.yml)

Web system for a gym to track the Body Mass Index (BMI, "IMC" in Portuguese) of its students. Teachers record assessments with height and weight, the system calculates and stores the BMI and its classification, and each student follows their own progress.

## What it does

| Role          | Can                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Administrator | Register, edit, activate, deactivate and delete users of any role; manage every assessment; see the gym's dashboard |
| Teacher       | Register and edit students; record and edit assessments; see their students' history and dashboard                  |
| Student       | See their own assessments and progress                                                                              |

Inactive users cannot sign in and cannot receive new assessments. The full rules are in [docs/product/business-rules.md](docs/product/business-rules.md).

## Tech stack

| Layer    | Technology                                                                               |
| -------- | ---------------------------------------------------------------------------------------- |
| Monorepo | pnpm 12 workspaces, Node.js 26, TypeScript 6 (`strict`)                                  |
| API      | Express 5, TypeORM 1 with migrations, SQLite (better-sqlite3), Zod, jsonwebtoken         |
| Panel    | Next.js 16 (App Router), React 19, Chakra UI 3, TanStack Query 5, React Hook Form, Axios |
| Shared   | BMI rules, roles and Zod schemas used by both apps                                       |
| Run      | Docker multi-stage images for the API and the panel, Docker Compose                      |

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
├── .claude/         Claude Code agents, skills and permissions
├── .github/         Issue and pull request templates, CI
├── Dockerfile       API and panel images
└── compose.yaml     API, panel and demo seed with Docker Compose
```

## Running with Docker

Only Docker with Compose is needed, or Podman with `podman-compose`. Node.js and pnpm are not.

1. Create the database with the demo gym. The system has no sign-up, so the demo data also brings the first administrator. The command builds the API image, applies the migrations and replaces every row:

   ```bash
   docker compose --profile seed run --rm seed
   ```

2. Build and start the API and the panel:

   ```bash
   docker compose up --build --detach
   ```

3. Open `http://localhost:3000` and sign in with one of the [demo logins](#demo-logins).

- Only the panel is published, on `127.0.0.1`. The API runs in production mode and answers only the panel, inside the Compose network.
- The database lives in the `api-data` volume, together with the token secret the API generates on its first start (set `JWT_ACCESS_SECRET` to use your own). `docker compose down` keeps the volume, and `docker compose down --volumes` deletes it.
- `PANEL_PORT` changes the port on your machine, for example `PANEL_PORT=8080 docker compose up --detach`.
- The session cookies are `Secure` in production mode, and browsers accept them over plain HTTP only on `localhost`. A server for real users needs a reverse proxy with HTTPS in front of the panel. The reasons and the trade-offs are in [decision 0011](docs/decisions/0011-docker-setup.md).

## Development

Prerequisites: Node.js 26 (exact version in [.nvmrc](.nvmrc)) and pnpm 12. How to install them is in [CONTRIBUTING.md](CONTRIBUTING.md#prerequisites).

```bash
pnpm install
pnpm check
```

`pnpm check` runs format, lint, type check, tests and build, the same steps the CI runs on every pull request.

### Running the system

1. Create the API settings from the sample, whose values work for development:

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

2. Create the database with the demo gym. The command applies the migrations, replaces every row and prints the demo logins:

   ```bash
   pnpm db:seed
   ```

3. Start the API and the panel with hot reload:

   ```bash
   pnpm dev
   ```

   The API answers on `http://localhost:3333/api` and the panel on `http://localhost:3000`. `pnpm dev:backend` and `pnpm dev:frontend` start only one of them. The panel settings are in `apps/frontend/.env.example`, and the defaults work in development.

4. Open `http://localhost:3000` and sign in with one of the [demo logins](#demo-logins).

`pnpm db:migrate` alone applies new migrations without touching the data.

### Demo logins

| Login          | Password   | What it shows                                                     |
| -------------- | ---------- | ----------------------------------------------------------------- |
| `admin`        | `admin123` | The whole gym: dashboard, users of every role and all assessments |
| `carla.mendes` | `prof1234` | A teacher: the dashboard of their students, students, assessments |
| `pedro.costa`  | `aluno123` | A student: their own progress and assessments                     |

The full list, with inactive users and a student with no assessments, is in [docs/architecture/database.md](docs/architecture/database.md#demo-data).

### Calling the API directly

With `pnpm dev` running, sign in and use the returned `accessToken` as `Authorization: Bearer <accessToken>` on the other routes:

```bash
curl -X POST http://localhost:3333/api/auth/login -H "Content-Type: application/json" -d '{"username":"carla.mendes","password":"prof1234"}'
```

Every route is in the [API reference](docs/api.md).

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
