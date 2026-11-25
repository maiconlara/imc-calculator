# Business rules

## Permissions by role

| Action                                         | Administrator      | Teacher            | Student               |
| ---------------------------------------------- | ------------------ | ------------------ | --------------------- |
| See users                                      | any role           | students only      | no                    |
| Create and edit users                          | any role           | students only      | no                    |
| Activate and deactivate users                  | any role           | students only      | no                    |
| Delete a user (only with no linked assessment) | yes                | no                 | no                    |
| Record assessments                             | any active student | any active student | no                    |
| Edit assessments                               | all                | of their students  | no                    |
| Delete assessments                             | yes                | no                 | no                    |
| See assessments                                | all                | of their students  | only their own        |
| Filter assessments by student                  | yes                | yes                | no (always their own) |
| Filter assessments by teacher                  | yes                | no                 | no                    |

The API enforces every line of this table. The panel only hides what the role cannot do, so the person is never offered an action that would fail. A filter the role cannot use answers 403 instead of being ignored: a teacher or a student filtering by teacher, or a student asking for another student.

## Users

- Nobody changes their own role or status, and nobody deletes their own account. This way there is always at least one active administrator.
- A user with linked assessments (as a student or as the assessor) cannot be deleted and cannot change role. The panel suggests deactivating instead.
- Changing another user's password ends that user's open sessions: they can no longer be renewed, and the access already granted lasts at most until the access token expires (15 minutes by default). Changing your own password keeps your current session.
- Deactivating a user ends their open sessions right away, and the API checks the status on every request, so the access ends on the next action.

### User fields

| Field    | Rule                                                                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name     | 3 to 60 characters, spaces at the ends removed                                                                                                                                                                 |
| Username | 3 to 60 characters, only lowercase letters, digits, dot, hyphen and underscore. Typed uppercase becomes lowercase, so `Maria.Silva` is stored as `maria.silva`; `maria silva` is rejected because of the space |
| Password | 8 to 72 characters and at most 72 bytes, the limit bcrypt reads. Accented letters and symbols take more than one byte, so a long password full of them can be rejected below 72 characters                     |

When editing a user, an empty password keeps the current one.

## Assessments

- Only active students receive new assessments. Editing an existing assessment of a student who became inactive is still allowed, to fix typing mistakes.
- The assessor is always the signed in user who records the assessment.
- The BMI and the classification are calculated by the API from the height and the weight. The client never sends them.
- Accepted ranges: height from 0.50 m to 2.50 m and weight from 10 kg to 400 kg.

### BMI calculation

`BMI = weight / height²`, rounded to 2 decimal places. The classification uses the rounded value and the band table in [requirements.md](requirements.md). Each band includes its lower limit and excludes the lower limit of the next band.

Examples:

| Height | Weight | BMI   | Classification     |
| ------ | ------ | ----- | ------------------ |
| 1.75 m | 56 kg  | 18.29 | Abaixo do peso     |
| 1.75 m | 70 kg  | 22.86 | Peso normal        |
| 1.75 m | 80 kg  | 26.12 | Sobrepeso          |
| 1.60 m | 80 kg  | 31.25 | Obesidade grau I   |
| 1.60 m | 95 kg  | 37.11 | Obesidade grau II  |
| 1.60 m | 110 kg | 42.97 | Obesidade grau III |

## Who the teacher's students are

The database has no direct link between a teacher and a student. A student becomes one of the teacher's students when the teacher records the first assessment for that student. From then on, the teacher sees the student's full history, including assessments recorded by other teachers, because progress cannot be followed with only part of the history.

Any teacher can record an assessment for any active student. The reasoning and the alternatives are in [decisions/0006-teacher-students.md](../decisions/0006-teacher-students.md).

## Dashboard numbers

- **Active students:** every student with status active, for the administrator and for teachers alike, since any teacher can assess any active student. Students do not get this number.
- **Assessments this month:** assessments created since the first day of the current month, in the server time zone.
- **Assessed students, current average BMI and current classification:** only the latest assessment of each active student. Two assessments at the same instant count once.
- **Assessment counters:** the full history.

For a teacher, every number except active students is limited to their students. For a student, every number covers only their own assessments, and the summary also brings their progress.

## Sign in

- A wrong username or password returns "Usuário ou senha inválidos." in both cases.
- An inactive user with the right password gets a message telling them to contact the gym.
- After 10 failed attempts for the same username from the same address within 10 minutes, the login is blocked until the window ends. When the panel has no reverse proxy in front of it, every visitor counts as the same address, so the block applies to the username for everyone ([decision 0009](../decisions/0009-visitor-address-on-login.md)).
