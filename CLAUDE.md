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

How to use them:

- Brief each agent with the issue, its acceptance criteria and the current branch. Each agent file lists the inputs it expects and the folders it owns.
- A task that touches both sides starts with the `backend-developer` (which owns `packages/shared`) and ends with the `frontend-developer`. Pass the `api_contract` from the backend report to the frontend agent.
- Every agent returns a structured report. A `blocked` status or a finding for another owner means the session decides the next step, not the agent.
- Carry `decisions_for_pr_body` and `not_verified` from the reports into the pull request description.
- Agents never commit, push or open pull requests.

### Skills

They live in `.claude/skills/`. Each skill is a step by step for a recurring task.

| Skill                | Purpose                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `ship-pr`            | Take a finished change to a pull request, following the rules                               |
| `add-bmi-band`       | Add, split, change, rename or remove a BMI band (preloaded in `backend-developer`)          |
| `new-backend-module` | Create a new API resource with every layer and its tests (preloaded in `backend-developer`) |

### Permissions

`.claude/settings.json` sets what runs without asking:

- **Allowed:** `pnpm check` and each of its steps, `pnpm format`, `pnpm install --frozen-lockfile`, and reading Git state (`git status`, `git diff`, `git log`).
- **Asks first:** commits, pushes, opening a PR, and adding, removing, updating or approving dependencies.
- **Denied:** force pushes, `git reset --hard`, merging PRs and reading `.env` files.

Personal overrides go in `.claude/settings.local.json`, which Git ignores.

### Before closing a task

1. Run `pnpm check`.
2. Search the changed files for the em dash character (U+2014) and replace it with a comma, a colon or parentheses.
3. Run the `code-reviewer` agent on the diff.
4. Update the affected documentation.

Commit, push and PR only with an explicit go-ahead from the person driving the session, one at a time.
