---
name: new-backend-module
description: Creates a new backend module (a resource with its own routes, controller, service, repository and end-to-end tests) following the project layers, with the users module as the model. Use when the API needs a new resource or a new group of endpoints, such as "add a plans API" or "create the payments endpoints". For one more route in an existing module, follow that module instead.
---

# New backend module

A module is one resource of the API. `apps/backend/src/modules/users` is the model: open each of its files next to the step that describes it, and copy its shape, not its rules.

```
packages/shared/src/<name>.ts                          input schemas and response types
apps/backend/src/modules/<name>/
├── <name>.ts                                           domain types
├── <name>.repository.ts                                repository interface and its errors
├── <name>.service.ts                                   rules and permissions
├── <name>.mapper.ts                                    domain object to API response
├── <name>.controller.ts                                HTTP only
└── <name>.routes.ts                                    paths and role gates
apps/backend/src/infra/database/repositories/typeorm-<name>.repository.ts
apps/backend/test/<name>.e2e.test.ts
```

The `backend-developer` agent, which preloads this skill, owns every step. A step that needs another owner becomes a finding in its report.

## 1. Write down the contract

For each endpoint: method, path, roles allowed, input (body, params, query), success response, and every error with its status. If the issue leaves one of them open, the main session asks the person driving it; an agent returns `status: blocked` with the question.

## 2. Shared contract (`packages/shared/src/<name>.ts`)

- Zod schemas for every input, with messages in Brazilian Portuguese. The panel shows them as they are.
- A list query extends `paginationSchema`, and each optional filter goes through `optionalParam`, so `?role=` counts as no filter.
- Types come from the schema output (`z.output<typeof createUserSchema>`), never written by hand.
- The response type (`PublicUser`) has dates as ISO strings and values in English.
- Export the file from `packages/shared/src/index.ts`, and test the schemas next to it.

## 3. Domain types and repository interface

- `<name>.ts` holds the domain type, with `Date` objects and English values, and the input types of the repository: `NewUser = Omit<User, "id">` (the service sets `createdAt` from the clock) and `UserChanges`.
- `<name>.repository.ts` lists only the methods the service calls now. A method another stage will need is added by that stage.
- An error the repository raises for something a person can cause, such as a duplicated unique value, is a class in this file (`UsernameTakenError`). The service turns it into an HTTP error.

## 4. Service (`<name>.service.ts`)

```ts
export interface UserServiceDependencies {
  userRepository: UserRepository;
  refreshTokenRepository: Pick<RefreshTokenRepository, "deleteAllOfUser">;
  passwordHasher: Pick<PasswordHasher, "hash">;
  clock: Clock;
}
```

- Dependencies arrive through the constructor, typed as interfaces, with `Pick` when only part of one is needed. The service never imports Express, TypeORM or a concrete repository.
- Every method that depends on who asks takes `actingUser: AuthenticatedUser` first and checks the role again: the route is the first barrier, not the only one. Rules that depend on data (a teacher only manages students) live only here.
- Errors come from `shared/errors.ts`, with messages in Portuguese: `NotFoundError` (404), `ForbiddenError` (403), `ConflictError` (409), `BusinessRuleError` (422).
- Dates come from `clock()`, never from `new Date()`, so the tests control time.
- Responses go out through the mapper.

## 5. TypeORM repository (`infra/database/repositories/typeorm-<name>.repository.ts`)

- Get the ORM repository from `dataSource.getRepository(<Name>Schema)`. Only `infra/database` (and the wiring in `container.ts`) knows TypeORM; the module never imports it and reaches the database only through the repository interface.
- In query builder conditions, use property names (`u.role`), never column names, and translate values with `column-values.ts`: the role `teacher` is stored as `professor`.

  ```ts
  filteredQuery.andWhere("u.role = :role", {
    role: roleColumnValues.toColumnValue(userFilters.role),
  });
  ```

- A subquery over another table uses `query.subQuery().from(<Other>Schema, alias)` with property names, as in `buildFilteredQuery` of the users repository.
- A text search compares `fold_text(column)` with a pattern built by `foldText` (`infra/database/fold-text.ts`), so it ignores letter case and accents, escapes `%`, `_` and `\`, and uses `LIKE :pattern ESCAPE '\'`. SQLite's `LOWER` only handles ASCII, so never search or sort names with it. Sort names by `fold_text(...)` too.
- Map a unique or foreign key violation a person can cause to the domain error of step 3 (`UsernameTakenError`, `UserHasAssessmentsError`). Without it, two requests at the same time turn into a 500.
- A delete that also removes dependent rows runs in `dataSource.transaction`.
- A rule that blocks a delete because other rows depend on it is checked by the service first, for the precise message, and the repository maps the foreign key violation only as the fallback for a race. SQLite's message does not name the table, so a new table that references `usuario` must also be checked in `UserService.deleteUser` and reviewed in the `delete` of the users repository.

## 6. Schema and migration (only when a table changes)

- An `EntitySchema` in `infra/database/schemas/`, with Portuguese table and column names (see `docs/architecture/database.md`).
- A new migration `<timestamp>-<what-it-does>.ts`, registered in `data-source.ts`. A migration that was already applied is never edited.
- `test/database.test.ts` compares the schemas with the migrations; it must keep passing.

## 7. Mapper, controller and routes

- The mapper turns the domain object into the response type (`toPublicUser`), with dates as ISO strings and no secrets.
- The controller parses `body`, `params` and `query` with the shared schemas, calls the service with `getAuthenticatedUser(req)` and picks the status: 201 on create, 204 on delete. No `if` about roles, no `try/catch`.
- The routes apply `router.use(authenticateRequest)` and `requireRole(...)` on each route. Fixed paths such as `/options` come before `/:id`.

## 8. Wiring

- `container.ts`: create the TypeORM repository and the service, and add the service to `AppServices`. This is the only file that names a concrete implementation.
- `app.ts`: mount the router on `apiRouter`, passing the controller and `authenticateRequest`.

## 9. Tests (`apps/backend/test/<name>.e2e.test.ts`)

The test environment (`test/environment.ts`) runs the real app on an in-memory database with a fixed clock. Use its helpers: `createUser`, `getAccessToken`, `httpRequestAs(accessToken)`, `recordAssessment` and `advanceClock`. Add a helper there when a second test file needs the same setup.

Cover, for every endpoint:

- each role that may use it, and the exact response body;
- each role that may not (403), and no session (401);
- not found (404) and every business error (409, 422) with its message;
- invalid body, params and query (400), checking the exact `issues`.

A rule the end-to-end tests cannot reach (a defensive branch, a race) gets a unit test of the service with fakes, like `modules/auth/auth.service.test.ts`.

## 10. Docs

- `docs/api.md`: the endpoint table and, for a new resource, an example.
- `docs/product/business-rules.md`: new rules and the permissions table.
- `docs/architecture/backend.md` when the folder structure changes, and `docs/architecture/database.md` when a table changes.
- A choice worth explaining goes to `decisions_for_pr_body`, never to a code comment.

## 11. Finish

Run `pnpm check` at the repository root and search the changed files for the em dash character (U+2014).

- The `backend-developer` agent returns its report, with the `api_contract` of every new route, and stops there.
- The main session opens the pull request with the `ship-pr` skill, usually titled `feat(backend): add <resource> management`.
