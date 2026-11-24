# API

Base URL in development: `http://localhost:3333/api`.

Every route except `/health` and the session routes requires `Authorization: Bearer <accessToken>`. In the panel, the browser never sends this header itself: it calls `/api/...` on the Next.js server, which adds the token (see [frontend.md](architecture/frontend.md#session)).

Values in the JSON are in English. Roles: `admin`, `teacher`, `student`. Statuses: `active`, `inactive`. Classifications: `underweight`, `normal-weight`, `overweight`, `obesity-class-1`, `obesity-class-2`, `obesity-class-3`.

## Errors

Every error has the same shape:

```json
{
  "message": "Dados inválidos. Confira os campos destacados.",
  "issues": [{ "path": "height", "message": "A altura máxima é 2,50 m" }]
}
```

`issues` only appears on validation errors. The messages are in Portuguese because the panel shows them as they are.

| Status | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| 400    | Invalid input (`issues` lists each field)                   |
| 401    | Missing, invalid or expired session                         |
| 403    | The role cannot do this, or the user is inactive (on login) |
| 404    | Not found, or not visible to this user                      |
| 409    | Conflict: username in use, user with linked assessments     |
| 422    | A business rule blocks the action                           |
| 429    | Too many failed login attempts                              |
| 500    | Unexpected error (logged on the server)                     |

## Pagination

List routes accept `page` (from 1) and `pageSize` (default 10, maximum 100) and answer:

```json
{ "items": [], "total": 0, "page": 1, "pageSize": 10 }
```

## Endpoints

### Health and session

| Method | Route           | Who       | Description                                     |
| ------ | --------------- | --------- | ----------------------------------------------- |
| GET    | `/health`       | public    | Checks the API and the database                 |
| POST   | `/auth/login`   | public    | Signs in with `username` and `password`         |
| POST   | `/auth/refresh` | public    | Exchanges a `refreshToken` for a new token pair |
| POST   | `/auth/logout`  | public    | Ends the session of a `refreshToken`            |
| GET    | `/auth/me`      | signed in | The user of the current session                 |

### Users

| Method | Route               | Who            | Description                                                                                                                                                                                                                                     |
| ------ | ------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/users`            | admin, teacher | Paginated list in name order, with `search` (part of the name or username, ignoring letter case and accents), `role` and `status` filters. A teacher only gets students, and asking for another role is 403                                     |
| GET    | `/users/options`    | admin, teacher | Short list for selects (`id`, `name`, `status`). `role` is required, and a teacher may only ask for `student`. `onlyAssessed=true` returns only people with assessments, as the student or as the assessor (for a teacher, only their students) |
| GET    | `/users/:id`        | admin, teacher | Details                                                                                                                                                                                                                                         |
| POST   | `/users`            | admin, teacher | Creates (`name`, `username`, `password`, `role`, `status`)                                                                                                                                                                                      |
| PUT    | `/users/:id`        | admin, teacher | Edits (`name`, `username`, `role`, optional `password`)                                                                                                                                                                                         |
| PATCH  | `/users/:id/status` | admin, teacher | Activates or deactivates (`status`)                                                                                                                                                                                                             |
| DELETE | `/users/:id`        | admin          | Deletes a user with no linked assessments                                                                                                                                                                                                       |

### Assessments

| Method | Route                  | Who            | Description                                                                                                                 |
| ------ | ---------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/assessments`         | signed in      | Paginated list, newest first, with `studentId`, `assessorId` and `classification` filters, limited to what the role can see |
| GET    | `/assessments/summary` | signed in      | Dashboard numbers; with `studentId`, also that student's progress                                                           |
| GET    | `/assessments/:id`     | signed in      | Details                                                                                                                     |
| POST   | `/assessments`         | admin, teacher | Records (`studentId`, `height`, `weight`)                                                                                   |
| PUT    | `/assessments/:id`     | admin, teacher | Fixes `height` and `weight` and recalculates the BMI                                                                        |
| DELETE | `/assessments/:id`     | admin          | Deletes                                                                                                                     |

## Examples

Sign in:

```http
POST /api/auth/login
Content-Type: application/json

{ "username": "carla.mendes", "password": "prof1234" }
```

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "accessTokenExpiresAt": "2026-11-23T18:15:00.000Z",
  "refreshToken": "q3J9...",
  "refreshTokenExpiresAt": "2026-11-30T18:00:00.000Z",
  "user": {
    "id": "5f0c...",
    "name": "Carla Mendes",
    "username": "carla.mendes",
    "role": "teacher"
  }
}
```

Register a student (`hasAssessments` says whether the user has assessments, as the student or as the assessor, which blocks deleting them and changing their role):

```http
POST /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{ "name": "Camila Duarte", "username": "Camila.Duarte", "password": "senha-da-camila", "role": "student" }
```

```json
{
  "id": "35c5...",
  "name": "Camila Duarte",
  "username": "camila.duarte",
  "role": "student",
  "status": "active",
  "createdAt": "2026-11-24T17:40:57.166Z",
  "hasAssessments": false
}
```

Record an assessment (the API calculates the BMI and the classification):

```http
POST /api/assessments
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{ "studentId": "9a1e...", "height": 1.75, "weight": 80 }
```

```json
{
  "id": "c27b...",
  "height": 1.75,
  "weight": 80,
  "bmi": 26.12,
  "classification": "overweight",
  "createdAt": "2026-11-23T18:02:11.000Z",
  "student": { "id": "9a1e...", "name": "Pedro Costa" },
  "assessor": { "id": "5f0c...", "name": "Carla Mendes" }
}
```

The route handlers are the official source: `apps/backend/src/modules/*/*.routes.ts`. When a route changes, this page changes in the same PR.
