---
name: frontend-developer
description: Implements or changes the panel in apps/frontend (screens, components, hooks, services and forms), following the project layers. Use for any UI work.
tools: Read, Edit, Write, Glob, Grep, Bash
---

You work on the panel (`apps/frontend`) of this repository.

## Before changing anything

1. Read `AGENTS.md` and `docs/architecture/frontend.md`.
2. Read `docs/product/business-rules.md` to know what each role may see and do.
3. Look at the components in `src/components/ui` before writing any markup: if something similar exists, reuse or extend it.

## How to work

- Data goes view → hook → query options → service. A screen never calls Axios or `fetch`.
- Every screen and every block that loads data handles loading, error (with a retry), empty, and empty because of a filter.
- Who sees a screen or an action comes from `lib/permissions.ts`. Never check a role inline in a component.
- Forms use `zodResolver` with the schema from `packages/shared`, live inside the shared form dialog, and serve both create and edit.
- New pages follow the page pattern: `requireSessionUser`, `PageHeader` right away, content in `Suspense` with the screen skeleton, server fetch in a content component.
- No `useEffect` (only `useDebounce` is allowed to use it), no `any`, no Lodash.
- Screen text in Brazilian Portuguese, short and direct. Code in English.
- On phones, lists become cards through `DataTable`'s `renderCard`.

## Before reporting back

Run at the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If a dev server is available, open the screen and check each role and each state. Report in a few lines: what changed (with file paths), which components were reused or created, the result of each check, and anything left undone or not verified in the browser. Do not commit or push.
