---
name: add-bmi-band
description: Adds, splits, changes, renames or removes a BMI classification band. Use when someone asks for a new BMI classification, a different limit for an existing band, a renamed band or the removal of a band. The band table in packages/shared is the single source of the classification.
---

# Add or change a BMI band

The BMI classification comes from one table: `BMI_BANDS` in `packages/shared/src/bmi.ts`. Everything else (the list of classifications, the labels, the ranges shown on screen and the value stored with each assessment) is derived from it. Never write a band limit or label anywhere else.

Each step names its owner. The `backend-developer` agent, which preloads this skill, does its own steps and reports the others as findings for their owners.

## 1. Confirm the request (owner: whoever runs the skill)

The issue must say:

- The code of the band, in English kebab-case (`obesity-class-4`).
- The official name in Portuguese, as it appears on screen and is stored (`Obesidade grau IV`), with at most 30 characters.
- The lower limit (inclusive). The band ends where the next one starts.
- For a changed limit: whether assessments already stored keep their classification or are reclassified.
- For a removed band: which band its stored assessments move to.

If something is missing, the main session asks the person driving it; an agent returns `status: blocked` with the question.

## 2. Change the table (owner: backend-developer)

Add or edit the row in `BMI_BANDS`, keeping the rows ordered by `minBmi`. Only the first band has `minBmi: null`.

```ts
{ classification: "obesity-class-4", label: "Obesidade grau IV", minBmi: 50 },
```

## 3. Stored assessments (owner: backend-developer)

The stored classification is the band's Portuguese name (see `docs/architecture/database.md`).

| Change        | Old rows                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| New band      | Nothing to do.                                                                                                                        |
| Changed limit | Keep them (default) or, if the issue asks, reclassify them with a migration that recalculates `classificacao`.                        |
| Renamed band  | Always a migration that updates `avaliacao_imc.classificacao` from the old name to the new one. Without it, reading an old row fails. |
| Removed band  | A migration that moves its rows to another band, decided in the issue.                                                                |

## 4. Tests (owner: backend-developer)

In `packages/shared/src/bmi.test.ts`:

- Add cases to the `classifyBmi` table for the new limit and the value just below it.
- Update the expected texts in the `describeBmiRange` test.

The table checks (increasing limits, unique codes and labels, label length, each limit in its own band) cover the new row by themselves. A migration gets its own test in the backend.

## 5. What else needs a decision

```bash
pnpm typecheck
```

Any `Record<BmiClassification, ...>` in the apps stops compiling until the new band gets a value there. Fill in the ones you own; never widen the type to make the error go away. The color of each band in the panel belongs to the `frontend-developer`: the backend agent reports it as an `out-of-ownership` finding with the band code and name.

## 6. Docs (owner: backend-developer)

- The BMI table in `docs/product/requirements.md`.
- The examples in `docs/product/business-rules.md`, if a limit moved.
- If old assessments were reclassified or renamed, add a line to `decisions_for_pr_body` so the session records the decision in `docs/decisions/`.

## 7. Finish

Run `pnpm check`.

- The `backend-developer` agent returns its report and stops there.
- The main session opens the pull request with the `ship-pr` skill. The title is usually `feat(shared): add <band name> BMI band`.
