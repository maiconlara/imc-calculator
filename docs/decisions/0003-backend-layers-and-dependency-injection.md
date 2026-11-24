# 0003. Backend layers and dependency injection

- Status: accepted
- Date: 2026-11-23

## Context

The API must be easy to maintain by a team: each part with one responsibility, business rules separate from HTTP and from the database, and code that can be tested without a real server.

## Decision

Each request goes through `routes → controller → service → repository`:

- Routes map paths and apply the authentication and role middlewares.
- Controllers parse the input with the shared Zod schemas and translate the result into an HTTP response.
- Services hold the business rules and permissions. They receive their dependencies through the constructor, typed as interfaces (`UserRepository`, `PasswordHasher`, `AccessTokenService`, `Clock`), using `Pick` when they need only part of one.
- Repository interfaces live in the module; the TypeORM implementations live in `infra/database/repositories`.
- `container.ts` is the composition root, the only file that creates implementations and wires them.

TypeORM entities are `EntitySchema` definitions instead of decorated classes, so the domain types stay plain interfaces with no ORM in them.

Role checks happen twice on purpose. `requireRole` on the route rejects a role that can never call it. The service checks again and adds the rules that depend on data, such as "a teacher only edits students". The route is the first barrier, not the only one, so a service stays safe if it is called from somewhere else (a new route, a script, a test).

## Consequences

- Services can be tested with fakes for every dependency, and the clock can be fixed.
- Replacing the database or the token library means a new implementation and one change in `container.ts`.
- There are more files per feature than in a flat structure. The `docs/architecture/backend.md` checklist keeps adding a module predictable.
- Pure role checks appear in two layers. That repetition is accepted for safety; data-dependent checks appear only in the service.
