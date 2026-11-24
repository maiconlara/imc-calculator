# Requirements

## The problem

A gym wants to track the Body Mass Index (BMI) of its students over time. Teachers record assessments with height and weight, the system calculates the BMI and its classification, and each student can see their own history. The administration registers people and controls who has access.

## Roles

| Role          | Who                  | In one sentence                                  |
| ------------- | -------------------- | ------------------------------------------------ |
| Administrator | Gym staff            | Registers anyone and manages everything          |
| Teacher       | Runs the assessments | Registers students and records their assessments |
| Student       | Is assessed          | Sees only their own assessments                  |

The detail of each permission is in [business-rules.md](business-rules.md).

## Functional requirements

Each requirement lists the criteria that tell when it is met.

### FR1. User registration

People are registered with name, username, password and role (administrator, teacher or student).

- The username is unique and case insensitive.
- The API never returns the password, and it is stored only as a hash.
- The same form creates and edits. When editing, an empty password keeps the current one.

### FR2. Activate and deactivate

Any user can be activated or deactivated by someone with permission over them.

- An inactive user cannot sign in.
- A user who was already signed in loses access on their next action, without waiting for the token to expire.
- An inactive student cannot receive a new assessment.

### FR3. BMI assessment

An assessment records the height and weight of a student. The system calculates the BMI and stores the value and the classification with the assessment.

- BMI = weight (kg) / height (m)², rounded to 2 decimal places.
- The classification follows the table below and is stored in the database, not only calculated on screen.
- Editing the height or the weight recalculates the BMI and the classification.

| BMI          | Classification (stored and shown in Portuguese) |
| ------------ | ----------------------------------------------- |
| Below 18.5   | Abaixo do peso (underweight)                    |
| 18.5 to 24.9 | Peso normal (normal weight)                     |
| 25 to 29.9   | Sobrepeso (overweight)                          |
| 30 to 34.9   | Obesidade grau I (obesity class I)              |
| 35 to 39.9   | Obesidade grau II (obesity class II)            |
| 40 or above  | Obesidade grau III (obesity class III)          |

Values between two bands (for example, 24.95) stay in the lower band: each band goes from its lower limit up to, but not including, the lower limit of the next one.

### FR4. Assessment search

Assessments can be searched with filters by student and by teacher (who ran the assessment).

- The list is paginated, newest first.
- Each role only sees the assessments it is allowed to see (see [business-rules.md](business-rules.md)).
- When a student is selected, the screen shows their progress over time.

### FR5. Authentication

Access is by username and password, for all three roles.

- A wrong username or a wrong password returns the same message, without saying which one was wrong.
- Repeated failed login attempts are limited.
- The session renews itself while the person keeps using the system.

## Technical requirements

| Layer      | Technology                                                             |
| ---------- | ---------------------------------------------------------------------- |
| Monorepo   | pnpm 12 with workspaces                                                |
| Runtime    | Node.js 26 (LTS)                                                       |
| Language   | TypeScript 6 with `strict: true`                                       |
| API        | Express 5, TypeORM 1 with migrations, SQLite through better-sqlite3 12 |
| Session    | JWT with the jsonwebtoken 9 library                                    |
| Validation | Zod 4, in the backend and in the frontend                              |
| Panel      | Next.js 16 with the App Router, React 19, Chakra UI 3                  |
| Data       | TanStack Query 5 and Axios 1                                           |
| Forms      | React Hook Form 7 with `@hookform/resolvers` 7 and Zod                 |

Version policy:

- Always the latest stable release of each series above.
- Pinned versions in `package.json`, with no `^` or `~`, so the project runs the same on any machine.
- Node.js declared in `engines` and in `.nvmrc`; pnpm declared in `packageManager`.

The reasoning is in [decisions/0007-pinned-versions.md](../decisions/0007-pinned-versions.md).

## Quality requirements

The system must be easy for a team to maintain and evolve, not only work.

### Backend

- Each class or module has one responsibility, receives its dependencies through the constructor and depends on interfaces instead of implementations.
- Routes and controllers only handle HTTP; rules live in services; data access, in repositories.
- BMI calculation and classification stay out of controllers, and a new BMI band must not require changes scattered across the code.
- Authentication and role checks are reusable middlewares.
- Errors are handled in one place, with domain errors and standard HTTP responses.
- Configuration comes from environment variables, with a `.env.example` and no secrets in the repository.

### Frontend

- Elements used on more than one screen (field, table, button, confirmation dialog, page header, status indicator) are components of their own.
- The same form for create and edit.
- API calls in services and hooks, never inside screen components.
- Routes, menu and actions follow the role of the signed in user.
- Loading, error and empty list states on every screen.
- Full typing, with no `any`.

### Delivery

- A README with the step by step to install, configure the environment variables, run the migrations, start the API and the panel, and sign in with each role.
- Git history in Conventional Commits.
- Automated tests and Docker as a bonus.
