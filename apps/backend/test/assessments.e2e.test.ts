import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PublicAssessment } from "@imc-calculator/shared";
import { UserSchema } from "../src/infra/database/schemas/user.schema";
import type { User } from "../src/modules/users/user";
import { createTestEnvironment, type TestEnvironment } from "./environment";

const UNKNOWN_ID = "7d4c2a0e-5b1f-4e8a-9c3d-2f6e1a0b9c8d";
const NOT_FOUND = { message: "Avaliação não encontrada." };

let environment: TestEnvironment;
let carla: User;
let rafael: User;
let pedro: User;
let ana: User;
let lucas: User;
let anaAssessmentId: string;
let pedroOctoberAssessmentId: string;
let accessTokens: Record<"admin" | "carla" | "rafael" | "pedro", string>;

beforeEach(async () => {
  environment = await createTestEnvironment();
  await environment.createUser("admin", "admin");
  carla = await environment.createUser("carla.mendes", "teacher");
  rafael = await environment.createUser("rafael.souza", "teacher");
  pedro = await environment.createUser("pedro.costa", "student");
  ana = await environment.createUser("ana.oliveira", "student");
  lucas = await environment.createUser("lucas.ferreira", "student");

  await environment.recordAssessment({
    student: pedro,
    assessor: carla,
    weight: 94,
    height: 1.75,
    createdAt: "2026-09-10T10:00:00.000Z",
  });
  pedroOctoberAssessmentId = await environment.recordAssessment({
    student: pedro,
    assessor: rafael,
    weight: 88,
    height: 1.75,
    createdAt: "2026-10-10T10:00:00.000Z",
  });
  await environment.recordAssessment({
    student: pedro,
    assessor: carla,
    weight: 84,
    height: 1.75,
    createdAt: "2026-11-10T10:00:00.000Z",
  });
  anaAssessmentId = await environment.recordAssessment({
    student: ana,
    assessor: rafael,
    weight: 56,
    height: 1.62,
    createdAt: "2026-11-05T10:00:00.000Z",
  });

  accessTokens = {
    admin: await environment.getAccessToken("admin"),
    carla: await environment.getAccessToken("carla.mendes"),
    rafael: await environment.getAccessToken("rafael.souza"),
    pedro: await environment.getAccessToken("pedro.costa"),
  };
});

afterEach(() => environment.closeDatabase());

function as(person: keyof typeof accessTokens) {
  return environment.httpRequestAs(accessTokens[person]);
}

function getWeights(assessments: PublicAssessment[]): number[] {
  return assessments.map((assessment) => assessment.weight);
}

describe("access by role", () => {
  it.each([
    ["GET /api/assessments", () => environment.httpRequest().get("/api/assessments")],
    [
      "GET /api/assessments/summary",
      () => environment.httpRequest().get("/api/assessments/summary"),
    ],
    [
      "GET /api/assessments/:id",
      () => environment.httpRequest().get(`/api/assessments/${UNKNOWN_ID}`),
    ],
    [
      "POST /api/assessments",
      () => environment.httpRequest().post("/api/assessments").send({}),
    ],
    [
      "PUT /api/assessments/:id",
      () => environment.httpRequest().put(`/api/assessments/${UNKNOWN_ID}`).send({}),
    ],
    [
      "DELETE /api/assessments/:id",
      () => environment.httpRequest().delete(`/api/assessments/${UNKNOWN_ID}`),
    ],
  ])("answers 401 to %s without a session", async (_route, sendWithoutSession) => {
    await sendWithoutSession().expect(401);
  });

  it("answers 403 to a student who records, edits or deletes", async () => {
    await as("pedro")
      .post("/api/assessments", { studentId: pedro.id, height: 1.75, weight: 70 })
      .expect(403);
    await as("pedro")
      .put(`/api/assessments/${pedroOctoberAssessmentId}`, { height: 1.75, weight: 70 })
      .expect(403);
    await as("pedro").delete(`/api/assessments/${pedroOctoberAssessmentId}`).expect(403);
  });
});

describe("POST /api/assessments", () => {
  it("calculates the BMI and the classification, with the signed in user as the assessor", async () => {
    const response = await as("carla")
      .post("/api/assessments", {
        studentId: lucas.id,
        height: 1.8,
        weight: 104,
        assessorId: rafael.id,
        bmi: 10,
      })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      height: 1.8,
      weight: 104,
      bmi: 32.1,
      classification: "obesity-class-1",
      createdAt: "2026-11-19T12:00:00.000Z",
      student: { id: lucas.id, name: "Lucas Ferreira" },
      assessor: { id: carla.id, name: "Carla Mendes" },
    });
  });

  it("stores the classification with its official name and the measures rounded to 2 decimals", async () => {
    await as("carla")
      .post("/api/assessments", { studentId: lucas.id, height: 1.8049, weight: 104.0049 })
      .expect(201);

    const storedAssessments = await environment.dataSource.query(
      "SELECT altura, peso, imc, classificacao FROM avaliacao_imc WHERE id_usuario_aluno = ?",
      [lucas.id],
    );
    expect(storedAssessments).toEqual([
      { altura: 1.8, peso: 104, imc: 32.1, classificacao: "Obesidade grau I" },
    ]);
  });

  it("makes the student one of the teacher's students", async () => {
    const before = await as("carla")
      .get(`/api/assessments?studentId=${ana.id}`)
      .expect(200);
    expect(before.body.total).toBe(0);

    await as("carla")
      .post("/api/assessments", { studentId: ana.id, height: 1.62, weight: 57 })
      .expect(201);

    const after = await as("carla")
      .get(`/api/assessments?studentId=${ana.id}`)
      .expect(200);
    expect(getWeights(after.body.items)).toEqual([57, 56]);
  });

  it("does not record an assessment for an inactive student", async () => {
    const rodrigo = await environment.createUser(
      "rodrigo.pereira",
      "student",
      "inactive",
    );

    const response = await as("admin")
      .post("/api/assessments", { studentId: rodrigo.id, height: 1.77, weight: 86 })
      .expect(422);

    expect(response.body).toEqual({
      message: "Aluno inativo não pode receber novas avaliações.",
    });
  });

  it.each([
    ["a teacher", () => carla.id],
    ["an unknown user", () => UNKNOWN_ID],
  ])("answers 404 when the student is %s", async (_case, getStudentId) => {
    const response = await as("admin")
      .post("/api/assessments", { studentId: getStudentId(), height: 1.7, weight: 60 })
      .expect(404);

    expect(response.body).toEqual({ message: "Aluno não encontrado." });
  });

  it("validates the body with one message per field", async () => {
    const response = await as("carla")
      .post("/api/assessments", { studentId: "abc", height: 175, weight: "80" })
      .expect(400);

    expect(response.body.issues).toEqual([
      { path: "studentId", message: "Selecione o aluno" },
      { path: "height", message: "A altura máxima é 2,50 m" },
      { path: "weight", message: "Informe o peso em kg" },
    ]);
  });
});

describe("GET /api/assessments", () => {
  it("shows the admin every assessment, newest first, with pagination", async () => {
    const firstPage = await as("admin").get("/api/assessments?pageSize=3").expect(200);
    const secondPage = await as("admin")
      .get("/api/assessments?page=2&pageSize=3")
      .expect(200);

    expect(firstPage.body).toMatchObject({ total: 4, page: 1, pageSize: 3 });
    expect(getWeights(firstPage.body.items)).toEqual([84, 56, 88]);
    expect(getWeights(secondPage.body.items)).toEqual([94]);
  });

  it("shows a teacher the full history of the students they assessed, and nothing else", async () => {
    const carlaView = await as("carla").get("/api/assessments").expect(200);
    expect(getWeights(carlaView.body.items)).toEqual([84, 88, 94]);
    expect(
      carlaView.body.items.map(
        (assessment: PublicAssessment) => assessment.assessor.name,
      ),
    ).toEqual(["Carla Mendes", "Rafael Souza", "Carla Mendes"]);

    const rafaelView = await as("rafael").get("/api/assessments").expect(200);
    expect(rafaelView.body.total).toBe(4);

    const otherStudent = await as("carla")
      .get(`/api/assessments?studentId=${ana.id}`)
      .expect(200);
    expect(otherStudent.body).toMatchObject({ items: [], total: 0 });
  });

  it("shows a student only their own assessments", async () => {
    const response = await as("pedro").get("/api/assessments").expect(200);

    expect(getWeights(response.body.items)).toEqual([84, 88, 94]);
    await as("pedro").get(`/api/assessments?studentId=${pedro.id}`).expect(200);
  });

  it("answers 403 to a student asking for another student", async () => {
    const response = await as("pedro")
      .get(`/api/assessments?studentId=${ana.id}`)
      .expect(403);

    expect(response.body).toEqual({ message: "Alunos só veem as próprias avaliações." });
  });

  it.each(["carla", "pedro"] as const)(
    "answers 403 when %s filters by teacher",
    async (person) => {
      const response = await as(person)
        .get(`/api/assessments?assessorId=${carla.id}`)
        .expect(403);

      expect(response.body).toEqual({
        message: "Só o administrador filtra avaliações por professor.",
      });
    },
  );

  it("filters by student, teacher and classification, ignoring empty values", async () => {
    const byTeacher = await as("admin")
      .get(`/api/assessments?assessorId=${rafael.id}`)
      .expect(200);
    expect(getWeights(byTeacher.body.items)).toEqual([56, 88]);

    const byStudentAndTeacher = await as("admin")
      .get(`/api/assessments?studentId=${pedro.id}&assessorId=${carla.id}`)
      .expect(200);
    expect(getWeights(byStudentAndTeacher.body.items)).toEqual([84, 94]);

    const byClassification = await as("admin")
      .get("/api/assessments?classification=overweight")
      .expect(200);
    expect(getWeights(byClassification.body.items)).toEqual([84, 88]);

    const withEmptyFilters = await as("admin")
      .get("/api/assessments?studentId=&assessorId=&classification=")
      .expect(200);
    expect(withEmptyFilters.body.total).toBe(4);
  });

  it("validates the query", async () => {
    const response = await as("admin")
      .get("/api/assessments?studentId=abc&classification=obesity&page=0")
      .expect(400);

    expect(response.body.issues).toEqual([
      { path: "page", message: "A página precisa ser um número inteiro a partir de 1" },
      { path: "studentId", message: "Aluno inválido" },
      { path: "classification", message: "Classificação inválida" },
    ]);
  });
});

describe("GET /api/assessments/:id", () => {
  it("shows a teacher an assessment of their student recorded by another teacher", async () => {
    const response = await as("carla")
      .get(`/api/assessments/${pedroOctoberAssessmentId}`)
      .expect(200);

    expect(response.body).toEqual({
      id: pedroOctoberAssessmentId,
      height: 1.75,
      weight: 88,
      bmi: 28.73,
      classification: "overweight",
      createdAt: "2026-10-10T10:00:00.000Z",
      student: { id: pedro.id, name: "Pedro Costa" },
      assessor: { id: rafael.id, name: "Rafael Souza" },
    });
  });

  it("answers 404 for an assessment the user may not see", async () => {
    const forTeacher = await as("carla")
      .get(`/api/assessments/${anaAssessmentId}`)
      .expect(404);
    expect(forTeacher.body).toEqual(NOT_FOUND);

    await as("pedro").get(`/api/assessments/${anaAssessmentId}`).expect(404);
    await as("pedro").get(`/api/assessments/${pedroOctoberAssessmentId}`).expect(200);
  });

  it("answers 404 for an unknown assessment and 400 for an invalid id", async () => {
    await as("admin").get(`/api/assessments/${UNKNOWN_ID}`).expect(404);

    const response = await as("admin").get("/api/assessments/123").expect(400);
    expect(response.body.issues).toEqual([
      { path: "id", message: "Identificador inválido" },
    ]);
  });
});

describe("PUT /api/assessments/:id", () => {
  it("recalculates the BMI and keeps the date and the assessor", async () => {
    const response = await as("rafael")
      .put(`/api/assessments/${anaAssessmentId}`, { height: 1.62, weight: 66 })
      .expect(200);

    expect(response.body).toMatchObject({
      height: 1.62,
      weight: 66,
      bmi: 25.15,
      classification: "overweight",
      createdAt: "2026-11-05T10:00:00.000Z",
      assessor: { id: rafael.id },
    });
  });

  it("lets a teacher fix another teacher's record of their student, keeping its assessor and date", async () => {
    const response = await as("carla")
      .put(`/api/assessments/${pedroOctoberAssessmentId}`, { height: 1.75, weight: 87 })
      .expect(200);

    expect(response.body).toMatchObject({
      weight: 87,
      bmi: 28.41,
      createdAt: "2026-10-10T10:00:00.000Z",
      assessor: { id: rafael.id, name: "Rafael Souza" },
    });
  });

  it("does not let a teacher fix an assessment of someone else's student", async () => {
    const response = await as("carla")
      .put(`/api/assessments/${anaAssessmentId}`, { height: 1.62, weight: 66 })
      .expect(404);
    expect(response.body).toEqual(NOT_FOUND);
  });

  it("still fixes an assessment of a student who became inactive", async () => {
    await environment.dataSource
      .getRepository(UserSchema)
      .update({ id: pedro.id }, { status: "inactive" });

    await as("carla")
      .put(`/api/assessments/${pedroOctoberAssessmentId}`, { height: 1.75, weight: 87 })
      .expect(200);
  });

  it("validates the body and the id", async () => {
    const response = await as("admin")
      .put(`/api/assessments/${anaAssessmentId}`, { height: 0.4, weight: 401 })
      .expect(400);
    expect(response.body.issues).toEqual([
      { path: "height", message: "A altura mínima é 0,50 m" },
      { path: "weight", message: "O peso máximo é 400 kg" },
    ]);

    await as("admin")
      .put(`/api/assessments/${UNKNOWN_ID}`, { height: 1.7, weight: 70 })
      .expect(404);
  });
});

describe("DELETE /api/assessments/:id", () => {
  it("lets only the admin delete", async () => {
    await as("rafael").delete(`/api/assessments/${anaAssessmentId}`).expect(403);
    await as("admin").delete(`/api/assessments/${anaAssessmentId}`).expect(204);

    await as("admin").get(`/api/assessments/${anaAssessmentId}`).expect(404);
    await as("admin").delete(`/api/assessments/${anaAssessmentId}`).expect(404);
    await as("admin").delete("/api/assessments/123").expect(400);
  });

  it("frees a student whose only assessment was deleted to be deleted too", async () => {
    await as("admin").delete(`/api/users/${ana.id}`).expect(409);

    await as("admin").delete(`/api/assessments/${anaAssessmentId}`).expect(204);

    await as("admin").delete(`/api/users/${ana.id}`).expect(204);
  });
});

describe("GET /api/assessments/summary", () => {
  const emptyDistribution = [
    { classification: "underweight", total: 0 },
    { classification: "normal-weight", total: 0 },
    { classification: "overweight", total: 0 },
    { classification: "obesity-class-1", total: 0 },
    { classification: "obesity-class-2", total: 0 },
    { classification: "obesity-class-3", total: 0 },
  ];

  it("summarizes the gym for the admin with the latest assessment of each student", async () => {
    const response = await as("admin").get("/api/assessments/summary").expect(200);

    expect(response.body).toEqual({
      totalAssessments: 4,
      assessmentsThisMonth: 2,
      assessedStudents: 2,
      activeStudents: 3,
      averageBmi: 24.39,
      distribution: [
        { classification: "underweight", total: 0 },
        { classification: "normal-weight", total: 1 },
        { classification: "overweight", total: 1 },
        { classification: "obesity-class-1", total: 0 },
        { classification: "obesity-class-2", total: 0 },
        { classification: "obesity-class-3", total: 0 },
      ],
      progress: null,
    });
  });

  it("limits a teacher's numbers to their students, but counts every active student", async () => {
    const response = await as("carla").get("/api/assessments/summary").expect(200);

    expect(response.body).toMatchObject({
      totalAssessments: 3,
      assessmentsThisMonth: 1,
      assessedStudents: 1,
      activeStudents: 3,
      averageBmi: 27.43,
      progress: null,
    });
  });

  it("gives a teacher with no students zeros and no average", async () => {
    await environment.createUser("nova.professora", "teacher");
    const asNewTeacher = environment.httpRequestAs(
      await environment.getAccessToken("nova.professora"),
    );

    const response = await asNewTeacher.get("/api/assessments/summary").expect(200);

    expect(response.body).toEqual({
      totalAssessments: 0,
      assessmentsThisMonth: 0,
      assessedStudents: 0,
      activeStudents: 3,
      averageBmi: null,
      distribution: emptyDistribution,
      progress: null,
    });
  });

  it("gives a student their own numbers and progress, oldest first, without the active count", async () => {
    const response = await as("pedro").get("/api/assessments/summary").expect(200);

    expect(response.body).toMatchObject({
      totalAssessments: 3,
      assessedStudents: 1,
      activeStudents: null,
      averageBmi: 27.43,
    });
    expect(response.body.progress).toEqual([
      expect.objectContaining({
        weight: 94,
        bmi: 30.69,
        classification: "obesity-class-1",
      }),
      expect.objectContaining({ weight: 88, bmi: 28.73, classification: "overweight" }),
      expect.objectContaining({ weight: 84, bmi: 27.43, classification: "overweight" }),
    ]);
  });

  it("brings one student's progress for the admin and for their teachers", async () => {
    const adminView = await as("admin")
      .get(`/api/assessments/summary?studentId=${pedro.id}`)
      .expect(200);
    expect(getWeights(adminView.body.progress)).toEqual([94, 88, 84]);

    const teacherView = await as("carla")
      .get(`/api/assessments/summary?studentId=${pedro.id}`)
      .expect(200);
    expect(getWeights(teacherView.body.progress)).toEqual([94, 88, 84]);

    const otherStudent = await as("carla")
      .get(`/api/assessments/summary?studentId=${ana.id}`)
      .expect(200);
    expect(otherStudent.body).toMatchObject({
      totalAssessments: 0,
      averageBmi: null,
      progress: [],
    });
  });

  it("answers 403 to a student asking for another student's summary", async () => {
    await as("pedro").get(`/api/assessments/summary?studentId=${ana.id}`).expect(403);
  });

  it("leaves an inactive student out of the current numbers, but keeps their history", async () => {
    const rodrigo = await environment.createUser(
      "rodrigo.pereira",
      "student",
      "inactive",
    );
    await environment.recordAssessment({
      student: rodrigo,
      assessor: carla,
      weight: 120,
      height: 1.7,
      createdAt: "2026-11-08T10:00:00.000Z",
    });

    const response = await as("admin").get("/api/assessments/summary").expect(200);

    expect(response.body).toMatchObject({
      totalAssessments: 5,
      assessmentsThisMonth: 3,
      assessedStudents: 2,
      activeStudents: 3,
      averageBmi: 24.39,
    });
    expect(response.body.distribution).toContainEqual({
      classification: "obesity-class-3",
      total: 0,
    });
  });

  it("counts one current assessment per student, even with two at the same instant", async () => {
    for (const weight of [70, 72]) {
      await environment.recordAssessment({
        student: lucas,
        assessor: rafael,
        weight,
        height: 1.8,
        createdAt: "2026-11-12T10:00:00.000Z",
      });
    }

    const response = await as("admin").get("/api/assessments/summary").expect(200);

    expect(response.body).toMatchObject({ totalAssessments: 6, assessedStudents: 3 });
  });

  it("counts the month from its first instant in the gym time zone", async () => {
    await environment.recordAssessment({
      student: lucas,
      assessor: rafael,
      weight: 70,
      height: 1.8,
      createdAt: "2026-11-01T03:00:00.000Z",
    });
    await environment.recordAssessment({
      student: lucas,
      assessor: rafael,
      weight: 71,
      height: 1.8,
      createdAt: "2026-11-01T02:59:59.000Z",
    });

    const response = await as("admin").get("/api/assessments/summary").expect(200);

    expect(response.body).toMatchObject({ totalAssessments: 6, assessmentsThisMonth: 3 });
  });

  it("validates the query", async () => {
    const response = await as("admin")
      .get("/api/assessments/summary?studentId=abc")
      .expect(400);

    expect(response.body.issues).toEqual([
      { path: "studentId", message: "Aluno inválido" },
    ]);
  });
});
