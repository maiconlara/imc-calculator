# Backend

REST API in `apps/backend`, with Express 5, TypeORM 1 over SQLite, Zod for input validation and jsonwebtoken for the access token.

## Layers

```
routes → controller → service → repository (interface) → TypeORM implementation
```

| Layer                | Does                                                                                                 | Never does                        |
| -------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------- |
| Route                | Maps method and path, applies `authenticateRequest` and `requireRole`                                | Business rules                    |
| Controller           | Parses `body`, `params` and `query` with the shared schema, calls the service, picks the status code | Database access, permission rules |
| Service              | Business rules and permissions that depend on data                                                   | Know Express or TypeORM           |
| Repository interface | Describes the data operations the service needs                                                      | Know how they are implemented     |
| TypeORM repository   | Implements the interface with queries                                                                | Business rules                    |

`container.ts` is the composition root: the only place that creates the TypeORM repositories, the password hasher and the token service and passes them to the services. Services declare what they need with interfaces (using `Pick` when they only need part of one), which keeps them testable with fakes and independent of the database.

## Folders

```
src/
├── main.ts                 loads the config and the logger, logs a failed start, handles shutdown signals
├── server.ts               opens the database and listens; fails on a taken port or a database it cannot open
├── app.ts                  builds the Express app: security headers, logs, routes, error handling
├── container.ts            binds every interface to its implementation
├── config/env.ts           environment variables validated with Zod
├── types/express.d.ts      types `req.user`, the user loaded by `authenticateRequest`
├── modules/
│   ├── auth/               login, session renewal, logout, token and hasher interfaces
│   ├── users/              registration, status and user permissions
│   └── assessments/        assessments, visibility scope by role and dashboard summary
├── infra/
│   ├── database/           data source, connection check, TypeORM schemas, value translation,
│   │                       text folding (fold_text), migrations, repositories, seed,
│   │                       and cli/ (migrate, revert and seed commands)
│   ├── security/           bcrypt hasher and JWT token service
│   └── logger.ts           pino logger
└── shared/
    ├── errors.ts           domain error classes
    ├── clock.ts            injectable clock
    └── http/               authentication middlewares and error handler
```

A module folder holds its routes, controller, service, repository interface, mapper (domain object to API response) and domain types. The TypeORM implementation lives in `infra/database/repositories`, so the module never imports the ORM.

## Authentication and authorization

- **Access token:** a JWT signed with HS256 by `jsonwebtoken`, with issuer, audience and the user id as subject. Short lived (15 minutes by default).
- **Refresh token:** a random opaque value, stored in the `usuario_token` table only as a SHA-256 hash. It is rotated on every use, and the previous one stays valid for 30 seconds so parallel requests do not end the session.
- `authenticateRequest` validates the token and loads the user from the database on every request. An inactive or deleted user is rejected right away.
- `requireRole(...roles)` blocks a route for the other roles.
- `POST /auth/login` allows 10 failed attempts per client IP and username in 10 minutes, then answers 429 until the window ends. Successful logins do not count. The panel server calls the API for every visitor and forwards the visitor IP, which is why the limit needs `TRUST_PROXY` and also counts per username.
- The service repeats the role check and adds the checks that depend on data, such as "a teacher only edits students". The route is the first barrier, not the only one. See [decision 0003](../decisions/0003-backend-layers-and-dependency-injection.md).

## Errors

Business errors are thrown as classes from `shared/errors.ts` and turned into HTTP responses by a single error handler:

| Class                  | Status | When                                                  |
| ---------------------- | ------ | ----------------------------------------------------- |
| `UnauthorizedError`    | 401    | Missing, invalid or expired session                   |
| `ForbiddenError`       | 403    | The role cannot do this                               |
| `NotFoundError`        | 404    | The resource does not exist or is not visible         |
| `ConflictError`        | 409    | Username in use, user with linked assessments         |
| `BusinessRuleError`    | 422    | A rule blocks the action (inactive student, own role) |
| `TooManyRequestsError` | 429    | Too many failed login attempts                        |

A `ZodError` becomes a 400 with one entry per invalid field. Anything else is logged and becomes a 500 with a generic message. Every error response has the same shape: `{ "message": string, "issues"?: [{ "path": string, "message": string }] }`.

Express 5 forwards errors thrown by async handlers to the error handler, so controllers have no `try/catch`.

## Configuration

Every setting comes from an environment variable, validated at startup by `config/env.ts`, and the app refuses to start with an invalid value. The full list with sample values is in `apps/backend/.env.example`; a new setting is added to both files and to this table in the same PR. The migrate and revert commands validate only `NODE_ENV`, `LOG_LEVEL` and `DB_DATABASE`, and the seed command also `BCRYPT_ROUNDS`, so they run without the API secrets.

| Variable                 | Purpose                                                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`               | `development`, `test` or `production`                                                                                                 |
| `PORT`                   | API port                                                                                                                              |
| `LOG_LEVEL`              | pino log level                                                                                                                        |
| `CORS_ORIGIN`            | Allowed origins, comma separated                                                                                                      |
| `TRUST_PROXY`            | Who may report the real client IP                                                                                                     |
| `DB_DATABASE`            | SQLite file path                                                                                                                      |
| `JWT_ACCESS_SECRET`      | Secret that signs the access token, at least 32 characters. Required, and the sample value of `.env.example` is refused in production |
| `JWT_ACCESS_TTL_MINUTES` | Access token lifetime in minutes (15 by default)                                                                                      |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh token lifetime in days (7 by default)                                                                                         |
| `BCRYPT_ROUNDS`          | bcrypt cost factor of the password hashes (10 by default)                                                                             |

## Adding a module

1. Write the input schemas and response types in `packages/shared`.
2. Create `modules/<name>/` with the domain types, the repository interface, the service, the controller and the routes.
3. Implement the repository in `infra/database/repositories/typeorm-<name>.repository.ts`.
4. If the database changes, add a migration and register it in `data-source.ts`.
5. Bind everything in `container.ts` and mount the router in `app.ts`.
6. Write end-to-end tests in `test/` covering each role.
7. Document the endpoints in [api.md](../api.md).

The users module is the model to copy. In Claude Code, the `new-backend-module` skill (`.claude/skills/new-backend-module/SKILL.md`) details each step.

## Tests

End-to-end tests with Vitest and Supertest run the real app against an in-memory SQLite database, one per test file, with a fixed clock. They cover each endpoint for each role, including the forbidden paths.
