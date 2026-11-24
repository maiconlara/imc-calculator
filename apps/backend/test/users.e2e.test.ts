import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PublicUser, UserOption } from "@imc-calculator/shared";
import type { User } from "../src/modules/users/user";
import {
  TEST_USER_PASSWORD,
  createTestEnvironment,
  type TestEnvironment,
} from "./environment";

const TEACHER_MANAGES_ONLY_STUDENTS = "Professores só podem gerenciar alunos.";
const UNKNOWN_USER_ID = "7d4c2a0e-5b1f-4e8a-9c3d-2f6e1a0b9c8d";

let environment: TestEnvironment;
let admin: User;
let teacher: User;
let student: User;
let adminToken: string;
let teacherToken: string;

const newStudentPayload = {
  name: "Camila Duarte",
  username: "camila.duarte",
  password: "senha-da-camila",
  role: "student",
};

beforeEach(async () => {
  environment = await createTestEnvironment();
  admin = await environment.createUser("admin", "admin");
  teacher = await environment.createUser("carla.mendes", "teacher");
  student = await environment.createUser("pedro.costa", "student");
  adminToken = await environment.getAccessToken("admin");
  teacherToken = await environment.getAccessToken("carla.mendes");
});

afterEach(() => environment.closeDatabase());

function asAdmin() {
  return environment.httpRequestAs(adminToken);
}

function asTeacher() {
  return environment.httpRequestAs(teacherToken);
}

function getUsernames(users: PublicUser[]): string[] {
  return users.map((user) => user.username);
}

function getOptionNames(userOptions: UserOption[]): string[] {
  return userOptions.map((userOption) => userOption.name);
}

async function recordAssessmentOf(assessedStudent: User, assessor: User): Promise<void> {
  await environment.recordAssessment({
    student: assessedStudent,
    assessor,
    weight: 80,
    height: 1.8,
    createdAt: "2026-11-01T10:00:00.000Z",
  });
}

describe("access by role", () => {
  it.each([
    ["GET /api/users", () => environment.httpRequest().get("/api/users")],
    [
      "GET /api/users/options",
      () => environment.httpRequest().get("/api/users/options?role=student"),
    ],
    [
      "GET /api/users/:id",
      () => environment.httpRequest().get(`/api/users/${UNKNOWN_USER_ID}`),
    ],
    [
      "POST /api/users",
      () => environment.httpRequest().post("/api/users").send(newStudentPayload),
    ],
    [
      "PUT /api/users/:id",
      () => environment.httpRequest().put(`/api/users/${UNKNOWN_USER_ID}`).send({}),
    ],
    [
      "PATCH /api/users/:id/status",
      () =>
        environment
          .httpRequest()
          .patch(`/api/users/${UNKNOWN_USER_ID}/status`)
          .send({ status: "inactive" }),
    ],
    [
      "DELETE /api/users/:id",
      () => environment.httpRequest().delete(`/api/users/${UNKNOWN_USER_ID}`),
    ],
  ])("answers 401 to %s without a session", async (_route, sendWithoutSession) => {
    await sendWithoutSession().expect(401);
  });

  it("answers 403 to a student on every user route", async () => {
    const asStudent = environment.httpRequestAs(
      await environment.getAccessToken("pedro.costa"),
    );

    await asStudent.get("/api/users").expect(403);
    await asStudent.get("/api/users/options?role=student").expect(403);
    await asStudent.get(`/api/users/${student.id}`).expect(403);
    await asStudent.post("/api/users", newStudentPayload).expect(403);
    await asStudent
      .put(`/api/users/${student.id}`, {
        name: "Pedro Costa",
        username: "pedro.costa",
        role: "student",
      })
      .expect(403);
    await asStudent
      .patch(`/api/users/${student.id}/status`, { status: "inactive" })
      .expect(403);
    await asStudent.delete(`/api/users/${teacher.id}`).expect(403);
  });
});

describe("POST /api/users", () => {
  it("lets the admin register any role, active by default, without exposing the password", async () => {
    const response = await asAdmin()
      .post("/api/users", {
        ...newStudentPayload,
        username: "Novo.Professor",
        role: "teacher",
      })
      .expect(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: "Camila Duarte",
      username: "novo.professor",
      role: "teacher",
      status: "active",
      createdAt: "2026-11-19T12:00:00.000Z",
      hasAssessments: false,
    });
    await environment.login("novo.professor", newStudentPayload.password);
  });

  it("lets a teacher register students only", async () => {
    await asTeacher().post("/api/users", newStudentPayload).expect(201);

    for (const role of ["teacher", "admin"]) {
      const response = await asTeacher()
        .post("/api/users", { ...newStudentPayload, username: `novo.${role}`, role })
        .expect(403);
      expect(response.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
    }
  });

  it("rejects a username already in use, in any letter case", async () => {
    const response = await asAdmin()
      .post("/api/users", { ...newStudentPayload, username: "Pedro.Costa" })
      .expect(409);

    expect(response.body).toEqual({ message: 'O usuário "pedro.costa" já está em uso.' });
  });

  it("answers 409, not 500, when two requests take the same username at once", async () => {
    const responses = await Promise.all([
      asAdmin().post("/api/users", newStudentPayload),
      asAdmin().post("/api/users", newStudentPayload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
  });

  it("validates the body with one message per field", async () => {
    const response = await asAdmin()
      .post("/api/users", { name: "Al", username: "maria silva", password: "curta" })
      .expect(400);

    expect(response.body.issues).toEqual([
      { path: "name", message: "O nome precisa ter ao menos 3 letras" },
      {
        path: "username",
        message: "Use só letras minúsculas, números, ponto, hífen ou sublinhado",
      },
      { path: "password", message: "A senha precisa ter ao menos 8 caracteres" },
      { path: "role", message: "Selecione um perfil" },
    ]);
  });
});

describe("GET /api/users", () => {
  it("shows a teacher only the students", async () => {
    const response = await asTeacher().get("/api/users").expect(200);

    expect(getUsernames(response.body.items)).toEqual(["pedro.costa"]);
  });

  it.each(["admin", "teacher"])(
    "answers 403 when a teacher asks for the %s role",
    async (otherRole) => {
      const response = await asTeacher().get(`/api/users?role=${otherRole}`).expect(403);

      expect(response.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
    },
  );

  it("lets a teacher ask for the student role", async () => {
    const response = await asTeacher().get("/api/users?role=student").expect(200);

    expect(getUsernames(response.body.items)).toEqual(["pedro.costa"]);
  });

  it("filters by search, role and status, ignoring empty values", async () => {
    await environment.createUser("ana.oliveira", "student", "inactive");

    const bySearch = await asAdmin().get("/api/users?search=OLIV").expect(200);
    expect(getUsernames(bySearch.body.items)).toEqual(["ana.oliveira"]);

    const byRole = await asAdmin().get("/api/users?role=teacher&status=").expect(200);
    expect(getUsernames(byRole.body.items)).toEqual(["carla.mendes"]);

    const byStatus = await asAdmin().get("/api/users?status=inactive&role=").expect(200);
    expect(getUsernames(byStatus.body.items)).toEqual(["ana.oliveira"]);
  });

  it("treats % and _ in the search as plain characters", async () => {
    await environment.createUser("joao_silva", "student");

    const byUnderscore = await asAdmin().get("/api/users?search=_").expect(200);
    expect(getUsernames(byUnderscore.body.items)).toEqual(["joao_silva"]);

    const byPercent = await asAdmin().get("/api/users?search=%25").expect(200);
    expect(byPercent.body.items).toEqual([]);
  });

  it("searches names and usernames ignoring letter case and accents", async () => {
    await environment.createUser("erica.santos", "student", "active", "Érica Santos");
    await environment.createUser("joao.silva", "student", "active", "João Silva");

    for (const search of ["érica", "ERICA", "Erica Sa"]) {
      const response = await asAdmin()
        .get(`/api/users?search=${encodeURIComponent(search)}`)
        .expect(200);
      expect(getUsernames(response.body.items)).toEqual(["erica.santos"]);
    }
    const byUnaccentedName = await asAdmin().get("/api/users?search=joao").expect(200);
    expect(getUsernames(byUnaccentedName.body.items)).toEqual(["joao.silva"]);
  });

  it("paginates in name order, with accented names in their alphabetical place", async () => {
    await environment.createUser("zeca.lima", "student", "active", "Zeca Lima");
    await environment.createUser("erica.santos", "student", "active", "Érica Santos");
    await environment.createUser("bruno.alves", "student", "active", "bruno alves");

    const firstPage = await asAdmin().get("/api/users?page=1&pageSize=4").expect(200);
    const secondPage = await asAdmin().get("/api/users?page=2&pageSize=4").expect(200);

    expect(secondPage.body).toMatchObject({ total: 6, page: 2, pageSize: 4 });
    expect([
      ...getUsernames(firstPage.body.items),
      ...getUsernames(secondPage.body.items),
    ]).toEqual([
      "admin",
      "bruno.alves",
      "carla.mendes",
      "erica.santos",
      "pedro.costa",
      "zeca.lima",
    ]);
  });

  it("flags who has assessments, as the student or as the assessor", async () => {
    await environment.createUser("ana.oliveira", "student");
    await recordAssessmentOf(student, teacher);

    const response = await asAdmin().get("/api/users").expect(200);

    const hasAssessmentsByUsername = Object.fromEntries(
      response.body.items.map((user: PublicUser) => [user.username, user.hasAssessments]),
    );
    expect(hasAssessmentsByUsername).toEqual({
      admin: false,
      "ana.oliveira": false,
      "carla.mendes": true,
      "pedro.costa": true,
    });
  });

  it("validates the query", async () => {
    const response = await asAdmin().get("/api/users?pageSize=1000").expect(400);

    expect(response.body.issues).toEqual([
      {
        path: "pageSize",
        message: "O tamanho da página precisa ser um número inteiro de 1 a 100",
      },
    ]);
  });
});

describe("GET /api/users/options", () => {
  it("returns only the id, name and status, in name order with accented names in place", async () => {
    await environment.createUser("zeca.lima", "student", "active", "Zeca Lima");
    await environment.createUser("erica.santos", "student", "active", "Érica Santos");
    await environment.createUser("ana.oliveira", "student", "inactive");

    const response = await asTeacher().get("/api/users/options?role=student").expect(200);

    expect(response.body).toEqual([
      { id: expect.any(String), name: "Ana Oliveira", status: "inactive" },
      { id: expect.any(String), name: "Érica Santos", status: "active" },
      { id: student.id, name: "Pedro Costa", status: "active" },
      { id: expect.any(String), name: "Zeca Lima", status: "active" },
    ]);
  });

  it("filters by status", async () => {
    await environment.createUser("ana.oliveira", "student", "inactive");

    const response = await asTeacher()
      .get("/api/users/options?role=student&status=active")
      .expect(200);

    expect(getOptionNames(response.body)).toEqual(["Pedro Costa"]);
  });

  it.each(["teacher", "admin"])(
    "answers 403 when a teacher asks for the %s role",
    async (otherRole) => {
      const response = await asTeacher()
        .get(`/api/users/options?role=${otherRole}`)
        .expect(403);

      expect(response.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
    },
  );

  it("with onlyAssessed, gives a teacher only their students and the admin every assessed student", async () => {
    const otherTeacher = await environment.createUser("rafael.souza", "teacher");
    const ana = await environment.createUser("ana.oliveira", "student");
    await environment.createUser("lucas.ferreira", "student");
    await recordAssessmentOf(student, teacher);
    await recordAssessmentOf(ana, otherTeacher);

    const teacherOptions = await asTeacher()
      .get("/api/users/options?role=student&onlyAssessed=true")
      .expect(200);
    expect(getOptionNames(teacherOptions.body)).toEqual(["Pedro Costa"]);

    const adminOptions = await asAdmin()
      .get("/api/users/options?role=student&onlyAssessed=true")
      .expect(200);
    expect(getOptionNames(adminOptions.body)).toEqual(["Ana Oliveira", "Pedro Costa"]);
  });

  it("with onlyAssessed, gives the admin the teachers who recorded assessments", async () => {
    await environment.createUser("rafael.souza", "teacher");
    await recordAssessmentOf(student, teacher);

    const response = await asAdmin()
      .get("/api/users/options?role=teacher&onlyAssessed=true")
      .expect(200);

    expect(getOptionNames(response.body)).toEqual(["Carla Mendes"]);
  });

  it("requires the role", async () => {
    const response = await asAdmin().get("/api/users/options").expect(400);

    expect(response.body.issues).toEqual([
      { path: "role", message: "Selecione um perfil" },
    ]);
  });
});

describe("GET /api/users/:id", () => {
  it("shows the admin any user and a teacher only students", async () => {
    const adminView = await asAdmin().get(`/api/users/${teacher.id}`).expect(200);
    expect(adminView.body).toMatchObject({ username: "carla.mendes", role: "teacher" });

    await asTeacher().get(`/api/users/${student.id}`).expect(200);
    const forbidden = await asTeacher().get(`/api/users/${admin.id}`).expect(403);
    expect(forbidden.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
  });

  it("answers 404 for an unknown user and 400 for an invalid id", async () => {
    const notFound = await asAdmin().get(`/api/users/${UNKNOWN_USER_ID}`).expect(404);
    expect(notFound.body).toEqual({ message: "Usuário não encontrado." });

    const invalidId = await asAdmin().get("/api/users/123").expect(400);
    expect(invalidId.body.issues).toEqual([
      { path: "id", message: "Identificador inválido" },
    ]);
  });
});

describe("PUT /api/users/:id", () => {
  const pedroChanges = {
    name: "Pedro H. Costa",
    username: "pedro.costa",
    role: "student",
  };

  it("lets a teacher edit a student, but not move them to another role or edit other roles", async () => {
    const response = await asTeacher()
      .put(`/api/users/${student.id}`, pedroChanges)
      .expect(200);
    expect(response.body).toMatchObject({ name: "Pedro H. Costa", role: "student" });

    const promotion = await asTeacher()
      .put(`/api/users/${student.id}`, { ...pedroChanges, role: "admin" })
      .expect(403);
    expect(promotion.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
    const adminEdit = await asTeacher()
      .put(`/api/users/${admin.id}`, { name: "Admin", username: "admin", role: "admin" })
      .expect(403);
    expect(adminEdit.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
  });

  it("lets the admin change the role of a user without assessments", async () => {
    const response = await asAdmin()
      .put(`/api/users/${student.id}`, { ...pedroChanges, role: "teacher" })
      .expect(200);

    expect(response.body.role).toBe("teacher");
  });

  it("does not let anyone change their own role", async () => {
    const response = await asAdmin()
      .put(`/api/users/${admin.id}`, {
        name: "Admin",
        username: "admin",
        role: "teacher",
      })
      .expect(422);

    expect(response.body).toEqual({ message: "Você não pode alterar o próprio perfil." });
  });

  it("does not change the role of a user with assessments, as the student or as the assessor", async () => {
    await recordAssessmentOf(student, teacher);

    await asAdmin()
      .put(`/api/users/${student.id}`, { ...pedroChanges, role: "teacher" })
      .expect(422);
    const response = await asAdmin()
      .put(`/api/users/${teacher.id}`, {
        name: "Carla Mendes",
        username: "carla.mendes",
        role: "admin",
      })
      .expect(422);
    expect(response.body).toEqual({
      message:
        "Não é possível mudar o perfil de um usuário que já tem avaliações vinculadas.",
    });
  });

  it("rejects a username taken by another user", async () => {
    const response = await asAdmin()
      .put(`/api/users/${student.id}`, { ...pedroChanges, username: "Carla.Mendes" })
      .expect(409);

    expect(response.body).toEqual({
      message: 'O usuário "carla.mendes" já está em uso.',
    });
  });

  it("answers 409, not 500, when two edits take the same username at once", async () => {
    const ana = await environment.createUser("ana.oliveira", "student");

    const responses = await Promise.all([
      asAdmin().put(`/api/users/${student.id}`, {
        ...pedroChanges,
        username: "novo.usuario",
        password: "nova-senha-123",
      }),
      asAdmin().put(`/api/users/${ana.id}`, {
        name: "Ana Oliveira",
        username: "novo.usuario",
        role: "student",
        password: "nova-senha-456",
      }),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
  });

  it("validates the body with one message per field", async () => {
    const response = await asAdmin()
      .put(`/api/users/${student.id}`, {
        name: "",
        username: "pedro costa",
        role: "chefe",
      })
      .expect(400);

    expect(response.body.issues).toEqual([
      { path: "name", message: "O nome precisa ter ao menos 3 letras" },
      {
        path: "username",
        message: "Use só letras minúsculas, números, ponto, hífen ou sublinhado",
      },
      { path: "role", message: "Selecione um perfil" },
    ]);
  });

  it("answers 404 for an unknown user", async () => {
    const response = await asAdmin()
      .put(`/api/users/${UNKNOWN_USER_ID}`, pedroChanges)
      .expect(404);

    expect(response.body).toEqual({ message: "Usuário não encontrado." });
  });

  it("keeps the current password when the new one is empty", async () => {
    await asAdmin()
      .put(`/api/users/${student.id}`, { ...pedroChanges, password: "" })
      .expect(200);

    await environment.login("pedro.costa", TEST_USER_PASSWORD);
  });

  it("ends the sessions of a user whose password someone else changed", async () => {
    const studentSession = await environment.login("pedro.costa");

    await asTeacher()
      .put(`/api/users/${student.id}`, { ...pedroChanges, password: "nova-senha-123" })
      .expect(200);

    await environment
      .httpRequest()
      .post("/api/auth/refresh")
      .send({ refreshToken: studentSession.refreshToken })
      .expect(401);
    await environment.login("pedro.costa", "nova-senha-123");
  });

  it("keeps the session of a user who changes their own password", async () => {
    const adminSession = await environment.login("admin");

    await asAdmin()
      .put(`/api/users/${admin.id}`, {
        name: "Admin",
        username: "admin",
        role: "admin",
        password: "nova-senha-123",
      })
      .expect(200);

    await environment
      .httpRequest()
      .post("/api/auth/refresh")
      .send({ refreshToken: adminSession.refreshToken })
      .expect(200);
  });
});

describe("PATCH /api/users/:id/status", () => {
  it("does not let anyone change their own status", async () => {
    const response = await asAdmin()
      .patch(`/api/users/${admin.id}/status`, { status: "inactive" })
      .expect(422);

    expect(response.body).toEqual({
      message: "Você não pode alterar a situação da própria conta.",
    });
  });

  it("lets a teacher inactivate a student, which ends the student's access right away", async () => {
    const studentSession = await environment.login("pedro.costa");

    const inactivated = await asTeacher()
      .patch(`/api/users/${student.id}/status`, { status: "inactive" })
      .expect(200);
    expect(inactivated.body.status).toBe("inactive");

    await environment
      .httpRequestAs(studentSession.accessToken)
      .get("/api/auth/me")
      .expect(401);
    await environment
      .httpRequest()
      .post("/api/auth/refresh")
      .send({ refreshToken: studentSession.refreshToken })
      .expect(401);

    const reactivated = await asTeacher()
      .patch(`/api/users/${student.id}/status`, { status: "active" })
      .expect(200);
    expect(reactivated.body.status).toBe("active");
    await environment.login("pedro.costa");
  });

  it("lets the admin inactivate and reactivate a teacher", async () => {
    const inactivated = await asAdmin()
      .patch(`/api/users/${teacher.id}/status`, { status: "inactive" })
      .expect(200);
    expect(inactivated.body).toMatchObject({
      username: "carla.mendes",
      status: "inactive",
    });

    await asAdmin()
      .patch(`/api/users/${teacher.id}/status`, { status: "active" })
      .expect(200);
  });

  it("does not let a teacher change the status of another teacher", async () => {
    const otherTeacher = await environment.createUser("rafael.souza", "teacher");

    const response = await asTeacher()
      .patch(`/api/users/${otherTeacher.id}/status`, { status: "inactive" })
      .expect(403);
    expect(response.body).toEqual({ message: TEACHER_MANAGES_ONLY_STUDENTS });
  });

  it("answers 404 for an unknown user", async () => {
    await asAdmin()
      .patch(`/api/users/${UNKNOWN_USER_ID}/status`, { status: "inactive" })
      .expect(404);
  });

  it("validates the status", async () => {
    const response = await asAdmin()
      .patch(`/api/users/${student.id}/status`, { status: "blocked" })
      .expect(400);

    expect(response.body.issues).toEqual([
      { path: "status", message: "Selecione a situação" },
    ]);
  });
});

describe("DELETE /api/users/:id", () => {
  it("lets only the admin delete a user without assessments, along with their sessions", async () => {
    const ana = await environment.createUser("ana.oliveira", "student");
    const anaSession = await environment.login("ana.oliveira");

    await asTeacher().delete(`/api/users/${ana.id}`).expect(403);
    await asAdmin().delete(`/api/users/${ana.id}`).expect(204);

    await asAdmin().get(`/api/users/${ana.id}`).expect(404);
    await environment
      .httpRequest()
      .post("/api/auth/refresh")
      .send({ refreshToken: anaSession.refreshToken })
      .expect(401);
  });

  it("keeps users with assessments, as the student or as the assessor, and their sessions", async () => {
    await recordAssessmentOf(student, teacher);
    const studentSession = await environment.login("pedro.costa");

    const response = await asAdmin().delete(`/api/users/${student.id}`).expect(409);
    expect(response.body).toEqual({
      message:
        "Este usuário tem avaliações vinculadas e não pode ser excluído. Inative o cadastro.",
    });
    await asAdmin().delete(`/api/users/${teacher.id}`).expect(409);

    await asAdmin().get(`/api/users/${student.id}`).expect(200);
    await environment
      .httpRequest()
      .post("/api/auth/refresh")
      .send({ refreshToken: studentSession.refreshToken })
      .expect(200);
  });

  it("does not let the admin delete their own account", async () => {
    const response = await asAdmin().delete(`/api/users/${admin.id}`).expect(422);

    expect(response.body).toEqual({ message: "Você não pode excluir a própria conta." });
  });

  it("answers 404 for an unknown user and 400 for an invalid id", async () => {
    await asAdmin().delete(`/api/users/${UNKNOWN_USER_ID}`).expect(404);
    await asAdmin().delete("/api/users/123").expect(400);
  });
});
