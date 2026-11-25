# Frontend

Panel in `apps/frontend`, with Next.js 16 (App Router), React 19, Chakra UI 3, TanStack Query 5, React Hook Form with Zod, and Axios.

## Layers

```
services/            one file per domain, one function per endpoint (Axios)
queries/             TanStack Query keys and query options, used on the server and in the browser
hooks/               one folder per domain, one hook per file (hooks/users/use-get-users.ts)
components/ui/       reusable pieces: table, dialogs, form field, badges, filters, charts
components/views/    client screens that use the hooks
components/contents/ async server components that fetch the data and hydrate a view
app/(panel)/*        server pages: check the session and render the header right away
```

`services`, `queries` and `hooks` each have an `index.ts` and are imported through it (`@/services`, `@/queries`, `@/hooks`).

A screen component never calls Axios or `fetch`. The path is always view → hook → query options → service.

## Talking to the API

There are two Axios instances, and both carry the session:

| Instance            | Used by               | Calls                                                                                                                                                         |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxiedBackendApi` | hooks, in the browser | `/api/...` on the Next.js server, which adds the token from the cookie and forwards to the API                                                                |
| `directBackendApi`  | server components     | the API directly, created by `getDirectBackendApi()` (`lib/server/session.ts`), which reads the access cookie and calls `createDirectBackendApi(accessToken)` |

A read function in a service accepts `{ signal, directBackendApi }` (`RequestOptions` in `services/api.ts`) and uses `options.directBackendApi ?? proxiedBackendApi`. A write function only uses `proxiedBackendApi`, because the server never writes.

The panel never sends what the API refuses for the role: a teacher never asks `/users` or `/users/options` for a role other than `student` (the role filter only shows when `permissions.canChooseUserRole` allows it), only the administrator sends `assessorId`, and a student never sends `studentId`. Each filter that loads options is a small component mounted only when the role may use it, so its query never runs for a role that would get 403.

## Session

- Tokens live in `httpOnly` cookies written by the Next.js server (`lib/session/cookies.ts`). Browser JavaScript never reads them.
- The browser calls `/api/...`, and the `app/api/[...path]` route handler forwards the call to the API with the token. Login, logout and the session expired redirect have their own route handlers under `app/api/auth/`.
- `proxy.ts` runs before every page and API call. When only the refresh cookie is left, it renews the session before the page renders, so server components always see a valid token.
- A 401 seen by `proxiedBackendApi` sends the user back to the login screen.
- When the API fails while `proxy.ts` renews the session, the refresh cookie is kept: an API call gets the API's error, and a page shows its error screen, whose "Tentar de novo" button tries again.
- Requests that change data (and the login and logout) must come from the panel's own origin, on top of the `SameSite=Lax` cookies.
- On login, the panel passes the visitor address to the API only when `TRUSTED_PROXY_COUNT` says a reverse proxy wrote it, because Next.js keeps an `X-Forwarded-For` written by the visitor. See [decision 0009](../decisions/0009-visitor-address-on-login.md).

## Configuration

The panel server reads two settings, listed with sample values in `apps/frontend/.env.example`. Next.js loads them from `apps/frontend/.env.local` when it exists, and both have defaults that work in development. The panel listens on port 3000, or on `PORT` when it is set.

| Variable              | Purpose                                                                              |
| --------------------- | ------------------------------------------------------------------------------------ |
| `BACKEND_URL`         | API address, known only by the panel server (`http://localhost:3333/api` by default) |
| `TRUSTED_PROXY_COUNT` | Reverse proxies in front of the panel that append the visitor address (0 by default) |

## Pages

1. The page (`page.tsx`) calls `requireSessionUser(screen)` with its screen, and a role `lib/permissions.ts` keeps out goes to the home screen. The session lookup is wrapped in React `cache()`, so it does not repeat the call made by the layout. `generateMetadata` returns `getScreenMetadata(screen)`, so the browser tab shows the same title.
2. It renders the `PageHeader` right away, with `getScreenTitle(screen, role)`, since the title and the main button depend only on the role.
3. It wraps the content in `<Suspense>` with the skeleton of that screen.
4. The content component (`UsersContent`, `AssessmentsContent`, `DashboardContent`) fetches the data on the server with `queryClient.query(...).catch(noop)`, passing `await getDirectBackendApi()` to the query options, and returns the view inside a `HydrationBoundary`. A failed server fetch is not sent to the browser, which fetches again and shows the error state of the view if it fails too. `prefetchQuery`, `fetchQuery` and `ensureQueryData` are deprecated in TanStack Query 5 and are not used.
5. The filters used by the server fetch and by the view come from the same constant in `lib/initial-filters.ts`. If they differ, the cache key does not match and the browser shows the skeleton again.

There is no `loading.tsx` in the `(panel)` group: it would swap the whole page, header included, for a skeleton.

When a page cannot be built (the API is down or answers an unexpected error), `(panel)/error.tsx` shows `PageLoadError` inside the panel, with the menu. An error in the panel layout itself, such as the session lookup, is caught by `app/error.tsx`, which shows the same screen. Its button calls `retry()`, which fetches the page again from the server.

## Screen states

Every screen that shows data handles four states:

| State                     | What the person sees                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Loading                   | The skeleton of that screen or block                                                        |
| Error                     | A message saying the data could not be loaded and a "Tentar de novo" button that refetches  |
| Empty                     | A message explaining there is nothing yet and, when the role can, how to add the first item |
| Empty because of a filter | A message saying nothing matches and how to clear the filters                               |

An error must never look like an empty list: "no users yet" when the API is down misleads the administrator.

`DataTable` draws the four states itself: it requires `loadError` and `onRetry`, and receives `emptyState`, `filteredEmptyState` (which comes with a "Limpar filtros" button) and `hasActiveFilters`. `hasActiveFilters` reflects the filters the rows were fetched with (the debounced search, not the text still being typed), and an empty list that is refreshing shows the skeleton, so clearing a search that found nobody never flashes "nothing registered yet". When a deletion or a status change leaves the current page past the last one, it offers to go back to the last page. `PersonSelect` does the same inside its list: loading, failed load with "Tentar de novo", nobody registered, and nobody matching the typed name. A failed refresh keeps the people already loaded selectable; the error shows only when there is nobody to list. A block outside a table, such as the progress chart of a student, uses `LoadErrorMessage` for its error.

## Permissions

`lib/permissions.ts` is the single place that says which role sees each screen and each action. The menu, the page guard (`requireSessionUser`) and the buttons read from it. Screens use `permissions.canOpenScreen(role, screen)`; actions use `permissions.canPerform(role, action)`, with the actions listed in `PANEL_ACTIONS` and their roles in one table that mirrors [business-rules.md](../product/business-rules.md). `permissions.getManageableRoles(role)` lists the roles a user may create and edit, and `permissions.canChooseUserRole(role)` says whether the role filter, the role column and the role choice show. Components never compare `role` themselves. The API enforces the same rules again; the panel only avoids offering an action that would fail.

The screens themselves are listed once in `lib/routes.ts` (`PANEL_SCREENS` and their `PANEL_ROUTES`), and their titles for each role in `lib/screen-titles.ts`, which the menu, the page header and the browser tab share. A new screen gets an entry in each of these files and in the sidebar (`SCREEN_NAV_GROUPS` and `SCREEN_ICONS` in `components/layout/app-sidebar.tsx`), and the type checker points out any one that is missing.

## Forms

- `useForm` with `zodResolver` and the schema from `packages/shared`, so the panel shows the same messages as the API.
- The same form creates and edits. It lives inside a `FormDialog`, opened with `lazyMount` and `unmountOnExit`, so the form remounts on every open and `defaultValues` are always right. The form component (the one that calls `useForm`) renders `FormDialogForm`, which holds the fields, the "Cancelar" button and the submit button.
- Decimal fields are text parsed with `parseDecimal`, which accepts a comma. Height uses the `maskHeight` mask (typing 171 shows 1,71) and weight goes through `sanitizeWeight`, both through a `Controller`. The live BMI of the assessment form comes from `buildBmiPreview` (`lib/bmi-preview.ts`), which explains an out of range value with the message of the shared schema.
- Field errors returned by the API go back to the form with `getFieldErrors(error, fieldNames)` and `setError`; the field names come from the form schema (`schema.keyof().options`), so no cast is needed. Success and general errors become toasts (`notify`).
- A user with assessments, or the signed in user, keeps their role: the role select offers only the current one and explains why. The delete button is never disabled with a hover hint, which phones and screen readers miss. On a user with assessments it opens the suggestion to deactivate without calling the API (or, for a user already inactive, a toast saying it cannot be deleted). Deleting a user who gained assessments meanwhile answers 409 and leads to the same suggestion. The signed in user's own row has no delete button.
- The edit form validates the password with the shared `optionalNewPasswordSchema` (empty keeps the current one) and turns the result back into text, so the create and edit values keep the same type and need no cast.
- After a mutation, users and assessments are invalidated together (`useInvalidateUsersAndAssessments`), since a rename shows up in the assessment list and a new assessment changes the "has assessments" flag of a user.

## Reusable components

| Component                          | Used for                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DataTable`                        | Lists with pagination and the four screen states; on phones each row becomes a card (`renderCard`), so key columns and actions are never hidden behind a sideways scroll |
| `FormDialog`, `FormDialogForm`     | The dialog shell shared by every create and edit form, and its fields and footer                                                                                         |
| `ConfirmDialog`                    | Confirming destructive or sensitive actions                                                                                                                              |
| `FormField`                        | Label, required mark, helper text and error message of a field                                                                                                           |
| `PageHeader`, `PageContent`        | Title, main actions and page spacing                                                                                                                                     |
| `FilterBar`, `FilterSelect`        | Search and fixed list filters with a clear button; `FilterSelect` returns the value with the type of its options                                                         |
| `PersonSelect`                     | Searchable choice of a person loaded from `/users/options`, with the four states and the status of inactive people                                                       |
| `StateMessage`, `LoadErrorMessage` | Empty, filtered and failed states of a block; the error one shows the reason and "Tentar de novo"                                                                        |
| `UserStatusIndicator`              | Active or inactive status (Chakra `Status`), shown on the signed in user's own row and next to inactive people in `PersonSelect`                                         |
| `RoleBadge`, `ClassificationBadge` | Role and BMI classification labels with their colors                                                                                                                     |
| `Panel`                            | Card with a title and description around a chart or a summary                                                                                                            |
| `ProgressChart`, `BmiScale`        | BMI or weight over time, and the BMI ruler with the band colors                                                                                                          |
| `ListSkeleton`                     | Placeholder of a list page while the server fetches it                                                                                                                   |

Before writing markup that already exists on another screen, look here first.

## Rules

- No `useEffect`. Derive values during render with `useMemo`, load data with TanStack Query, focus with `autoFocus`. The only exception is `useDebounce` in `src/hooks`, used for search fields.
- Constants used by server pages cannot live in a `"use client"` file.
- No `any` and no Lodash.
- Visual identity: yellow `brand` with black text, graphite (`graphite` token) in the menu and highlights, uppercase titles with the `heading` font. Yellow is never used as text color on a white background (low contrast).
- Small uppercase labels (field labels, table headers, menu groups, "(você)") use the theme text style `textStyle="monoLabel"` and set only their color (`fg.muted`, or `whiteAlpha.600` on graphite). Its weight is `medium`, the same the Field and Table recipes use, so the label looks the same everywhere.
- Dates are shown in the gym time zone, `GYM_TIME_ZONE` from the shared package (`lib/formatters.ts`), so the server render and the browser render show the same day and hour, and they match the month the API counts in "assessments this month". See [decisions/0010-gym-time-zone.md](../decisions/0010-gym-time-zone.md).

## Adding a screen

The users screen is the model to copy: screen, permissions and title, service, queries and hooks, view, form, server fetch and page, in that order. In Claude Code, the `new-screen` skill (`.claude/skills/new-screen/SKILL.md`) details each step.

## Tests

Vitest runs the tests in Node, with `TZ=UTC`, outside the gym time zone, so a date that depends on the machine's zone fails. The functions in `lib/` have unit tests. The route handlers under `app/api/` and `proxy.ts` run against a small fake API (`src/test-support/fake-backend.ts`) that records each request and answers like the real one, so the cookies, the session renewal and the headers sent to the API are checked from the panel side.
