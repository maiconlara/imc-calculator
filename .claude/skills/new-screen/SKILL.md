---
name: new-screen
description: Creates a new panel screen (a page with its data, list, filters, forms and permissions) following the frontend layers, with the users screen as the model. Use when the panel needs a new page or a new list screen, such as "add a plans screen" or "create the payments page". For a new field or button on an existing screen, follow that screen instead.
---

# New panel screen

A screen goes from the page on the server down to the service that calls the API. `apps/frontend/src` has a complete model: the users screen. Open each of its files next to the step that describes it, and copy its shape, not its rules.

```
lib/routes.ts, lib/permissions.ts, lib/screen-titles.ts   the screen, who opens it, its title
services/<name>.service.ts                                  one function per endpoint
queries/<name>.queries.ts                                   query keys and queryOptions
hooks/<name>/use-*.ts                                       one hook per file
lib/initial-filters.ts                                      filters shared by server and browser
components/views/<name>-view/                               the client screen, one file per part
components/views/<name>-view/<name>-form-dialog/            the create and edit form
components/contents/<name>-content.tsx                      the server fetch
app/(panel)/<route>/page.tsx                                the page
```

Every `.tsx` file holds one component (`react/no-multi-comp` fails the lint otherwise). The users screen folder shows the split:

```
components/views/users-view/
├── index.ts                      re-exports UsersView and NewUserButton, the only parts used outside
├── users-view.tsx                UsersView: only assembles hooks, filter bar, table and dialogs
├── users-view.types.ts           the row context and row props types
├── use-filter-users.ts           filters and page (useListPagination)
├── use-confirm-user-actions.ts   the confirmation flow (useDialogTarget)
├── get-user-confirmation-copy.ts the wording of each confirmation, with its test
├── get-user-columns.tsx          the table columns
├── users-filter-bar.tsx          FilterBar with the screen's filters
├── user-row-actions.tsx          RowActions with the per-row permissions
├── user-card.tsx                 the phone card (ListCard)
├── user-avatar.tsx, user-name.tsx, user-status-control.tsx   parts of a row
├── user-confirm-dialog.tsx       ConfirmDialog with the confirmation copy
├── new-user-button.tsx           the main button of the page header
└── user-form-dialog/             UserFormDialog and UserForm
```

The `frontend-developer` agent owns every step under `apps/frontend` and `docs/architecture/frontend.md`. A missing endpoint or a rule that both sides need is a finding for the `backend-developer`.

## 1. Write down the screen

Before any code: the route, the title for each role, who opens it, the actions and who may use each one, the endpoints it calls (see `docs/api.md`), the filters, and the four states of every block that loads data (loading, error with retry, empty, empty because of a filter). If the request leaves one of them open, the main session asks the person driving it; an agent returns `status: blocked` with the question.

## 2. Screen, permissions and title

- `lib/routes.ts`: add the screen to `PANEL_SCREENS` and its path to `PANEL_ROUTES`.
- `lib/permissions.ts`: the roles in `SCREEN_ROLES`, and each new action in `PANEL_ACTIONS` and `ACTION_ROLES`, mirroring `docs/product/business-rules.md`. Components ask `permissions.canPerform(role, action)`; never write `role === "admin"` in a component.
- `lib/screen-titles.ts`: the title for each role.
- `components/layout/app-sidebar/sidebar-navigation.ts`: the menu group in `SCREEN_NAV_GROUPS` and the icon in `SCREEN_ICONS`.

The type checker points out any of these that is missing.

## 3. Service, queries and hooks

- `services/<name>.service.ts`: one function per endpoint. A read takes `options: RequestOptions = {}` and calls `(options.directBackendApi ?? proxiedBackendApi)` with `signal`; a write only uses `proxiedBackendApi`. Export it from `services/index.ts`.
- `queries/<name>.queries.ts`: the keys (`userQueryKeys`) and `queryOptions` that take the filters and an optional `directBackendApi`, as in `queries/user.queries.ts`. Export them from `queries/index.ts`.
- `hooks/<name>/`: `useGet...` with `useQuery` and `placeholderData: keepPreviousData` for paginated lists; one mutation hook per write, which calls `useInvalidateUsersAndAssessments` (or its own invalidation) on success. Export them from the folder `index.ts` and from `hooks/index.ts`.
- Request only what the role may ask for. The API answers 403 to a filter the role cannot use, so a filter that depends on the role is a component that mounts only when `permissions` allows it.

## 4. The view

`components/views/<name>-view/<name>-view.tsx` is a `"use client"` component that reads the session with `useSessionUser()` and the data with the hooks, and only assembles the parts of its folder. It never calls Axios or `fetch`.

- Lists use `DataTable`: it requires `loadError` and `onRetry`, and takes `emptyState`, `filteredEmptyState`, `hasActiveFilters`, `onClearFilters`, `pagination`, `itemNoun` and, for phones, `renderCard`. Use `hideBelow` on secondary columns so the actions stay visible at 1024 px.
- The page and the filters live in a `use-filter-<name>.ts` hook built on `useListPagination`, and every dialog that acts on a row uses `useDialogTarget`. Do not write the page reset or the "selected item plus dialog open" pair again.
- Filters use `FilterBar` and `FilterSelect` (generic over the values, so no `as` cast), and a search field takes the `maxLength` of the shared schema. The search text goes through `useDebounce`.
- A select that loads people uses `PersonSelect`, which handles its own four states.
- Each part of a row is a small component in its own file (`UserRowActions` on top of `RowActions`, `UserCard` on top of `ListCard`) that receives a `rowContext` object with the handlers and the permissions, never a `render*` helper.
- Destructive or sensitive actions go through `ConfirmDialog`. Success and general errors become toasts with `notify`.
- Labels, badges and status use the shared pieces (`FormField`, the `monoLabel` text style, `RoleBadge`, `ClassificationBadge`, `UserStatusIndicator`, `StateMessage`, `LoadErrorMessage`) instead of new markup.

## 5. The form

`components/views/<name>-view/<name>-form-dialog/` creates and edits with the same form, with the dialog and the form in separate files:

- `FormDialog` is the shell (it mounts the form on each open, so `defaultValues` are always right) and `FormDialogForm` holds the fields, Cancelar and the submit button.
- `useForm` with `zodResolver` and the shared schema, so the panel shows the same messages as the API.
- Field errors from the API go back to the fields with `getFieldErrors(error, fieldNames)` and `setError`; decimals go through `parseDecimal`, `maskHeight` or `sanitizeWeight` in a `Controller`.

## 6. Server fetch and page

- `lib/initial-filters.ts`: the first filters of the screen. The server fetch and the view read the same constant, or the cache key differs and the skeleton shows again.
- `components/contents/<name>-content.tsx`: an async server component that gets `getDirectBackendApi()`, runs `queryClient.query(...).catch(noop)` with the initial filters and returns the view inside a `HydrationBoundary`.
- `app/(panel)/<route>/page.tsx`: `requireSessionUser("<screen>")`, `generateMetadata` returning `getScreenMetadata("<screen>")`, `PageHeader` with `getScreenTitle` and the main button when `permissions` allows, and the content in `Suspense` with `ListSkeleton`. No `loading.tsx`.

`(panel)/error.tsx` and `app/error.tsx` already show the error screen with "Tentar de novo" when the page itself cannot be built.

## 7. Check it

- New functions in `lib/` get Vitest tests (`src/**/*.test.ts`). Components have no automated tests in this project.
- Run `pnpm check` at the repository root and search the changed files for the em dash character (U+2014).
- In the browser (`.claude/launch.json` starts the API and the panel; the demo logins are in `docs/architecture/database.md#demo-data`), open the screen with each role that can see it and force each state: loading, error with the API stopped and "Tentar de novo", empty, empty because of a filter, and the phone width.

## 8. Docs and finish

- `docs/architecture/frontend.md` when a reusable component or a pattern changes.
- A choice worth explaining goes to `decisions_for_pr_body`, never to a code comment.
- The `frontend-developer` agent returns its report and stops there; the main session opens the pull request with the `ship-pr` skill, usually titled `feat(frontend): add <screen> screen`.
