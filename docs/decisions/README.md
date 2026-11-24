# Decision records

Each file here records one architecture decision: the context, what was chosen and why, and what it costs. They are short on purpose, so anyone (person or agent) can find out why the code looks the way it does before changing it.

## Index

| #    | Decision                                                                                   | Status   |
| ---- | ------------------------------------------------------------------------------------------ | -------- |
| 0001 | [pnpm monorepo](0001-pnpm-monorepo.md)                                                     | accepted |
| 0002 | [Shared rules package](0002-shared-rules-package.md)                                       | accepted |
| 0003 | [Backend layers and dependency injection](0003-backend-layers-and-dependency-injection.md) | accepted |
| 0004 | [Database in Portuguese, code in English](0004-database-in-portuguese-code-in-english.md)  | accepted |
| 0005 | [Session in httpOnly cookies through Next.js](0005-session-in-httponly-cookies.md)         | accepted |
| 0006 | [Who the teacher's students are](0006-teacher-students.md)                                 | accepted |
| 0007 | [Pinned versions](0007-pinned-versions.md)                                                 | accepted |

## When to write one

- The choice has a reasonable alternative that someone may suggest later.
- The choice interprets an ambiguous requirement.
- Undoing the choice would be expensive.

A decision is never edited to say something else. If it changes, write a new record that replaces the old one and set the old one's status to `replaced by NNNN`.

## Template

```markdown
# NNNN. Title

- Status: accepted
- Date: YYYY-MM-DD

## Context

What problem or requirement led to this decision.

## Decision

What was chosen.

## Consequences

What gets easier, what gets harder, and what to watch for.
```
