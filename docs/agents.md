# Working with agents

This project is meant to be changed by people and by AI agents, with the same rules for both. This page explains how the pieces fit together and how a task flows from an issue to a merged pull request.

## One source of rules

| File              | Read by                      | Holds                                                                        |
| ----------------- | ---------------------------- | ---------------------------------------------------------------------------- |
| `AGENTS.md`       | Every agent and every person | All project rules: structure, layers, naming, team rules, definition of done |
| `CLAUDE.md`       | Claude Code                  | Imports `AGENTS.md` and lists the Claude Code agents and skills              |
| `CONTRIBUTING.md` | Everyone                     | Branches, commits, PRs and reviews                                           |
| `docs/`           | Everyone, on demand          | The detail behind each rule                                                  |

Rules are never duplicated between these files. `AGENTS.md` states a rule in one line and links to the document that explains it. Tools that do not read `CLAUDE.md` (Codex, Cursor, Copilot) still get every rule from `AGENTS.md`.

## Claude Code setup

```
.claude/
├── agents/
│   ├── backend-developer.md    API and shared package work
│   ├── frontend-developer.md   panel work
│   └── code-reviewer.md        read-only review of a diff
└── skills/
    └── ship-pr/SKILL.md        from a finished change to an open pull request
```

- **Agents** are specialists with their own instructions and tools. The main session delegates a focused task to one of them and gets back a report.
- **Skills** are step by step guides for tasks that repeat. New skills are added together with the code they teach how to change, so a skill never describes code that does not exist yet.

## How a task flows

```mermaid
flowchart TD
  issue["Issue with acceptance criteria"] --> plan["Plan: which layers and files change"]
  plan --> approve{"Person approves the plan"}
  approve --> branch["Branch from main"]
  branch --> shared["shared: rules and schemas"]
  shared --> backend["backend-developer: API and tests"]
  backend --> frontend["frontend-developer: screens"]
  frontend --> checks["lint, typecheck, test, build"]
  checks --> review["code-reviewer: findings"]
  review --> fix["Fix findings"]
  fix --> commit{"Person approves commit and push"}
  commit --> pr["ship-pr: open the pull request"]
  pr --> ci["CI and human review"]
  ci --> merge["Squash merge by a person"]
```

Not every task touches every layer: a screen tweak skips the shared and backend steps. The order matters when it does: contracts first, then the API, then the panel.

## Where people stay in control

- Approving the plan before code is written.
- Every commit, every push and opening each pull request.
- The final review and the merge.
- Any change to GitHub settings, CI secrets or branch protection.

Agents never merge, never force push and never turn off a check to make it pass.

## Asking an agent for a task

A good request names the outcome, the place in the system and how to know it is done. For example:

> Add a "last assessment" column to the users list, visible to administrators and teachers. It shows the date of the latest assessment of each student, or a dash when there is none. Done when the column shows up, sorting is unchanged, and the users e2e test covers a student with and without assessments.

The agent should answer with a plan listing the files per layer before changing anything.

## Adding a new agent or skill

- Create an agent when a kind of task needs different instructions or tools (for example, read-only review). Create a skill when a sequence of steps repeats.
- Keep the instructions short and point to `AGENTS.md` and `docs/` instead of copying rules.
- List it in `CLAUDE.md` and in this page in the same PR.
