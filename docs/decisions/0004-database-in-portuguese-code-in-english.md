# 0004. Database in Portuguese, code in English

- Status: accepted
- Date: 2026-11-23

## Context

The data model was defined in Portuguese: tables `usuario`, `usuario_token` and `avaliacao_imc`, columns like `perfil` and `dt_inclusao`, and stored values like `aluno`, `ativo` and `Sobrepeso`. The code base, on the other hand, is written in English, and mixing both languages in identifiers makes the code harder to read and to search.

## Decision

- The database follows the data model exactly, in Portuguese.
- The code uses English names and values (`role: "student"`, `status: "active"`, `classification: "overweight"`).
- The translation lives in one place:
  - column names through `name:` in the TypeORM `EntitySchema` files;
  - values through the transformers in `infra/database/column-values.ts`.
- Raw query builder conditions and `getRaw*` results, where transformers do not run, call the same mapping explicitly (`toColumnValue`, `fromColumnValue`).

## Consequences

- Anyone querying the database sees the model as specified; anyone reading the code sees English.
- Every raw query must remember to translate values. Forgetting it returns no rows or throws on an unknown stored value, which the end-to-end tests catch.
- The stored classification is the official band name. Renaming a band later needs a migration that updates old rows.
