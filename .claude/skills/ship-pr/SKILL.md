---
name: ship-pr
description: Takes a finished change to an open pull request following the project workflow (branch, Conventional Commits, checks, review, docs, PR template). Use when the work on a branch is done and the person driving the session asks to open the PR.
---

# Ship a pull request

Follow these steps in order. Stop and ask the person driving the session whenever a step needs their approval.

## 1. Confirm the scope

- Find the issue this change resolves. If there is none, ask whether to create one before going on.
- Check the branch: `git branch --show-current`. It must not be `main`, and its name must follow `<type>/<short-description>`.

## 2. Run the checks

At the repository root:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

If one fails, fix it or report it. Never open a PR with a failing check.

Then search the changed files for the em dash character (U+2014):

```bash
git diff --name-only main...HEAD | xargs -r grep -n $'\xe2\x80\x94'
```

## 3. Review

Run the `code-reviewer` agent on the branch. Fix every `blocker`, and either fix or explain each `should fix`.

## 4. Docs

Check that the docs affected by the change were updated (`docs/api.md` for routes, `docs/product/business-rules.md` for rules, `docs/architecture/*` for structure). If a decision may be questioned later, add a record in `docs/decisions/`.

## 5. Commit and push

Ask before each commit and before the push. Commit messages follow Conventional Commits:

```
feat(backend): add user management
```

Push the branch with `git push -u origin <branch>`.

## 6. Open the pull request

Ask before opening it. Use the repository template and a title in the commit convention, because the squash merge turns the title into the commit on `main`:

```bash
gh pr create --base main --title "feat(backend): add user management" --body-file <filled template>
```

The body must include `Closes #<issue>`, what changed, how it was tested and anything not verified.

## 7. Hand over

Share the PR link. Never merge it, never enable auto merge and never change branch protection.
