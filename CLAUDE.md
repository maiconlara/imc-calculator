@AGENTS.md

## Claude Code only

The project rules are in `AGENTS.md`, imported above. This section only covers what depends on Claude Code features.

### Project agents

They live in `.claude/agents/`. Call one by name when the task fits:

| Agent                | When to use                                                                    |
| -------------------- | ------------------------------------------------------------------------------ |
| `backend-developer`  | Endpoint, business rule, repository, migration or test in the API or shared    |
| `frontend-developer` | Screen, component, hook, service or form in the panel                          |
| `code-reviewer`      | Before opening a PR: reviews the diff against this guide and the documentation |

A task that touches both sides starts in `packages/shared`, moves to the backend and ends in the frontend.

### Skills

They live in `.claude/skills/`. Each skill is a step by step for a recurring task.

| Skill     | Purpose                                                       |
| --------- | ------------------------------------------------------------- |
| `ship-pr` | Take a finished change to a pull request, following the rules |

### Before closing a task

1. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.
2. Search the changed files for the em dash character (U+2014) and replace it with a comma, a colon or parentheses.
3. Run the `code-reviewer` agent on the diff.
4. Update the affected documentation.

Commit, push and PR only with an explicit go-ahead from the person driving the session, one at a time.
