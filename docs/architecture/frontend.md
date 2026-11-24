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

| Instance            | Used by               | Calls                                                                                          |
| ------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `proxiedBackendApi` | hooks, in the browser | `/api/...` on the Next.js server, which adds the token from the cookie and forwards to the API |
| `directBackendApi`  | server components     | the API directly, with the token read from the cookie, created by `getDirectBackendApi()`      |

A read function in a service accepts `{ signal, directBackendApi }` and uses `options.directBackendApi ?? proxiedBackendApi`. A write function only uses `proxiedBackendApi`, because the server never writes.

## Session

- Tokens live in `httpOnly` cookies written by the Next.js server (`lib/session/cookies.ts`). Browser JavaScript never reads them.
- The browser calls `/api/...`, and the `app/api/[...path]` route handler forwards the call to the API with the token. Login, logout and the session expired redirect have their own route handlers under `app/api/auth/`.
- `proxy.ts` runs before every page and API call. When only the refresh cookie is left, it renews the session before the page renders, so server components always see a valid token.
- A 401 seen by `proxiedBackendApi` sends the user back to the login screen.

## Pages

1. The page (`page.tsx`) calls `requireSessionUser()` with the roles allowed to open it. The function is wrapped in React `cache()`, so it does not repeat the call made by the layout.
2. It renders the `PageHeader` right away, since the title and the main button depend only on the role.
3. It wraps the content in `<Suspense>` with the skeleton of that screen.
4. The content component (`UsersContent`, `AssessmentsContent`, `DashboardContent`) fetches the data on the server with `queryClient.query(...).catch(noop)` and returns the view inside a `HydrationBoundary`. `prefetchQuery`, `fetchQuery` and `ensureQueryData` are deprecated in TanStack Query 5 and are not used.
5. The filters used by the server fetch and by the view come from the same constant in `lib/initial-filters.ts`. If they differ, the cache key does not match and the browser shows the skeleton again.

There is no `loading.tsx` in the `(panel)` group: it would swap the whole page, header included, for a skeleton.

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
