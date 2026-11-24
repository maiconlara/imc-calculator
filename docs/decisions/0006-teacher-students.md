# 0006. Who the teacher's students are

- Status: accepted
- Date: 2026-11-23

## Context

The rules say a teacher "can see the assessments of their students", but the data model has no link between a teacher and a student. The only relation between them is the assessment itself (`id_usuario_avaliacao` is the teacher, `id_usuario_aluno` is the student).

Options considered:

1. **Only the assessments the teacher recorded.** Simple, but the teacher sees a broken history: if two teachers take turns with a student, neither can follow the full progress.
2. **The students the teacher has assessed at least once, with their full history.** Uses only the existing model and gives the teacher the whole progress of each student they work with.
3. **A new teacher and student link table.** The most precise, but it changes the specified data model and adds a registration step the requirements do not mention.

## Decision

Option 2. A student becomes one of the teacher's students when the teacher records the first assessment for them. From then on, the teacher sees every assessment of that student, including those recorded by other teachers. Any teacher can record an assessment for any active student.

The rule is implemented in one place: the visibility scope built by `AssessmentService`, which every assessment query goes through.

## Consequences

- Teachers can follow the full progress of the students they work with.
- Recording one assessment grants access to that student's history. That fits a gym where teachers share students; a gym that wants exclusive assignment would need option 3.
- If option 3 is adopted later, only the visibility scope and a migration change; the screens stay the same.
