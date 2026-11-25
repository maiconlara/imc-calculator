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

| Instance            | Used by               | Calls                                                                                                                |
| ------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `proxiedBackendApi` | hooks, in the browser | `/api/...` on the Next.js server, which adds the token from the cookie and forwards to the API                       |
| `directBackendApi`  | server components     | the API directly, created on the server by `createDirectBackendApi(accessToken)` with the token read from the cookie |

A read function in a service accepts `{ signal, directBackendApi }` and uses `options.directBackendApi ?? proxiedBackendApi`. A write function only uses `proxiedBackendApi`, because the server never writes.

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
4. The content component (`UsersContent`, `AssessmentsContent`, `DashboardContent`) fetches the data on the server with `queryClient.query(...).catch(noop)` and returns the view inside a `HydrationBoundary`. `prefetchQuery`, `fetchQuery` and `ensureQueryData` are deprecated in TanStack Query 5 and are not used.
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

## Permissions

`lib/permissions.ts` is the single place that says which role sees each screen and each action. The menu, the page guard (`requireSessionUser`) and the buttons read from it. The API enforces the same rules again; the panel only avoids offering an action that would fail.

The screens themselves are listed once in `lib/routes.ts` (`PANEL_SCREENS` and their `PANEL_ROUTES`), and their titles for each role in `lib/screen-titles.ts`, which the menu, the page header and the browser tab share. A new screen gets an entry in each of these files and in the sidebar (`SCREEN_NAV_GROUPS` and `SCREEN_ICONS` in `components/layout/app-sidebar.tsx`), and the type checker points out any one that is missing.

## Forms

- `useForm` with `zodResolver` and the schema from `packages/shared`, so the panel shows the same messages as the API.
- The same form creates and edits. It lives inside a `FormDialog`, opened with `lazyMount` and `unmountOnExit`, so the form remounts on every open and `defaultValues` are always right.
- Decimal fields are text parsed with `parseDecimal`, which accepts a comma. Height uses the `maskHeight` mask (typing 171 shows 1,71) and weight goes through `sanitizeWeight`, both through a `Controller`.
- Field errors returned by the API go back to the form with `getFieldErrors` and `setError`. Success and general errors become toasts (`notify`).
- After a mutation, users and assessments are invalidated together (`useInvalidateUsersAndAssessments`), since a rename shows up in the assessment list and a new assessment changes the "has assessments" flag of a user.

## Reusable components

| Component                          | Used for                                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `DataTable`                        | Lists with pagination; on phones each row becomes a card (`renderCard`), so key columns and actions are never hidden behind a sideways scroll |
| `FormDialog`                       | The dialog shell shared by every create and edit form                                                                                         |
| `ConfirmDialog`                    | Confirming destructive or sensitive actions                                                                                                   |
| `FormField`                        | Label, required mark, helper text and error message of a field                                                                                |
| `PageHeader`, `PageContent`        | Title, main actions and page spacing                                                                                                          |
| `FilterBar`, `FilterSelect`        | Search and filters with a clear button                                                                                                        |
| `UserStatusIndicator`              | Active or inactive status                                                                                                                     |
| `RoleBadge`, `ClassificationBadge` | Role and BMI classification labels with their colors                                                                                          |

Before writing markup that already exists on another screen, look here first.

## Rules

- No `useEffect`. Derive values during render with `useMemo`, load data with TanStack Query, focus with `autoFocus`. The only exception is `useDebounce` in `src/hooks`, used for search fields.
- Constants used by server pages cannot live in a `"use client"` file.
- No `any` and no Lodash.
- Visual identity: yellow `brand` with black text, graphite (`graphite` token) in the menu and highlights, uppercase titles with the `heading` font, small labels in `mono`. Yellow is never used as text color on a white background (low contrast).

## Tests

Vitest runs the tests in Node. The functions in `lib/` have unit tests. The route handlers under `app/api/` and `proxy.ts` run against a small fake API (`src/test-support/fake-backend.ts`) that records each request and answers like the real one, so the cookies, the session renewal and the headers sent to the API are checked from the panel side.
