# 0002. Shared rules package

- Status: accepted
- Date: 2026-11-23

## Context

The panel shows the BMI and its classification while the teacher types, and validates forms before sending them. The API calculates the BMI that is stored and validates every input again. If each side had its own copy of these rules, a change in one place would silently disagree with the other: the panel would accept a value the API rejects, or show a classification different from the stored one.

The requirements also ask that adding a BMI band must not mean changing code scattered across the application.

## Decision

`packages/shared` holds every rule both sides need:

- The BMI band table, the calculation and the classification.
- Roles, statuses and their Portuguese labels.
- Height, weight, username and password limits.
- The Zod schemas for every input (login, users, assessments, filters) and the API response types.

The band table is the single source of the classification. Each band declares its code, its official Portuguese name and its lower limit. The list of classifications, the labels and the value stored in the database are derived from it. The panel only keeps the color of each band, and the type checker flags a band without a color.

The backend validates requests with the same schemas the panel forms use.

## Consequences

- Validation messages are identical in the panel and in the API.
- Adding a band is one new row in the table, plus its color in the panel.
- A new rule that both sides need must start here, never in one of the apps.
- Labels shown on screen live in this package too, which is acceptable because the API also returns Portuguese messages.
