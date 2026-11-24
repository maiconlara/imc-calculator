import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AssessmentSchema } from "../src/infra/database/schemas/assessment.schema";
import { UserSchema } from "../src/infra/database/schemas/user.schema";
import type { User } from "../src/modules/users/user";
import { createTestEnvironment, type TestEnvironment } from "./environment";

let environment: TestEnvironment;

beforeEach(async () => {
  environment = await createTestEnvironment();
});

afterEach(() => environment.closeDatabase());

async function insertUser(userFields: Partial<User> = {}): Promise<User> {
  const user: User = {
    id: randomUUID(),
    name: "Pedro Costa",
    username: `user.${randomUUID().slice(0, 8)}`,
    passwordHash: "hash",
    role: "student",
    status: "active",
    createdAt: new Date("2026-11-19T12:00:00.000Z"),
    ...userFields,
  };
  await environment.dataSource.getRepository(UserSchema).insert(user);
  return user;
}

describe("initial migration", () => {
  it("creates the three tables of the data model", async () => {
    const tables: { name: string }[] = await environment.dataSource.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT IN ('migrations', 'sqlite_sequence') ORDER BY name",
    );

    expect(tables.map((table) => table.name)).toEqual([
      "avaliacao_imc",
      "usuario",
      "usuario_token",
    ]);
  });

  it("creates the Portuguese columns of the assessment table", async () => {
    const columns: { name: string }[] = await environment.dataSource.query(
      "PRAGMA table_info(avaliacao_imc)",
    );

    expect(columns.map((column) => column.name)).toEqual([
      "id",
      "altura",
      "peso",
      "imc",
      "classificacao",
      "id_usuario_avaliacao",
      "id_usuario_aluno",
      "dt_inclusao",
    ]);
  });

  it.each([
    ["role", "gerente", "ativo"],
    ["status", "aluno", "suspenso"],
  ])("rejects a %s outside the allowed values", async (_field, role, status) => {
    await expect(
      environment.dataSource.query(
        "INSERT INTO usuario (id, nome, usuario, senha, perfil, situacao) VALUES (?, 'X', 'x', 'h', ?, ?)",
        [randomUUID(), role, status],
      ),
    ).rejects.toThrow(/CHECK constraint failed/);
  });

  it("creates the indexes the lists and the token lookup rely on", async () => {
    const indexNamesOf = async (tableName: string) => {
      const indexes: { name: string }[] = await environment.dataSource.query(
        `PRAGMA index_list(${tableName})`,
      );
      return indexes.map((index) => index.name).filter((name) => name.startsWith("IDX_"));
    };

    expect(await indexNamesOf("usuario_token")).toEqual(["IDX_usuario_token_usuario"]);
    expect((await indexNamesOf("avaliacao_imc")).toSorted()).toEqual([
      "IDX_avaliacao_imc_aluno_data",
      "IDX_avaliacao_imc_avaliador",
      "IDX_avaliacao_imc_data",
    ]);
  });

  it("matches the TypeORM schemas, so generating a migration would change nothing", async () => {
    const pendingSchemaChanges = await environment.dataSource.driver
      .createSchemaBuilder()
      .log();

    expect(pendingSchemaChanges.upQueries.map((upQuery) => upQuery.query)).toEqual([]);
  });

  it("can be reverted, leaving no data tables behind", async () => {
    await environment.dataSource.undoLastMigration();

    const tables: { name: string }[] = await environment.dataSource.query(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('usuario', 'usuario_token', 'avaliacao_imc')",
    );
    expect(tables).toEqual([]);
  });
});

describe("Portuguese values in the database", () => {
  it("stores the role and status in Portuguese and reads them back in English", async () => {
    const teacher = await insertUser({ role: "teacher", status: "inactive" });

    const [storedRow] = await environment.dataSource.query(
      "SELECT perfil, situacao FROM usuario WHERE id = ?",
      [teacher.id],
    );
    const loadedTeacher = await environment.dataSource
      .getRepository(UserSchema)
      .findOneByOrFail({ id: teacher.id });

    expect(storedRow).toEqual({ perfil: "professor", situacao: "inativo" });
    expect(loadedTeacher).toMatchObject({ role: "teacher", status: "inactive" });
  });

  it("stores the classification as the official band name and the measures as numbers", async () => {
    const student = await insertUser({ role: "student" });
    const assessor = await insertUser({ role: "teacher" });
    const assessmentId = randomUUID();

    await environment.dataSource.getRepository(AssessmentSchema).insert({
      id: assessmentId,
      height: 1.75,
      weight: 80,
      bmi: 26.12,
      classification: "overweight",
      studentId: student.id,
      assessorId: assessor.id,
      createdAt: new Date("2026-11-19T12:00:00.000Z"),
    });

    const [storedRow] = await environment.dataSource.query(
      "SELECT classificacao FROM avaliacao_imc WHERE id = ?",
      [assessmentId],
    );
    const loadedAssessment = await environment.dataSource
      .getRepository(AssessmentSchema)
      .findOneByOrFail({ id: assessmentId });

    expect(storedRow).toEqual({ classificacao: "Sobrepeso" });
    expect(loadedAssessment).toMatchObject({
      classification: "overweight",
      height: 1.75,
      weight: 80,
      bmi: 26.12,
    });
  });

  it("keeps a user with assessments from being deleted", async () => {
    const student = await insertUser({ role: "student" });
    const assessor = await insertUser({ role: "teacher" });
    await environment.dataSource.getRepository(AssessmentSchema).insert({
      id: randomUUID(),
      height: 1.75,
      weight: 70,
      bmi: 22.86,
      classification: "normal-weight",
      studentId: student.id,
      assessorId: assessor.id,
      createdAt: new Date("2026-11-19T12:00:00.000Z"),
    });

    await expect(
      environment.dataSource.getRepository(UserSchema).delete({ id: student.id }),
    ).rejects.toThrow(/FOREIGN KEY constraint failed/);
  });

  it("carries a changed user id over to the assessments (ON UPDATE CASCADE)", async () => {
    const student = await insertUser({ role: "student" });
    const assessor = await insertUser({ role: "teacher" });
    const assessmentId = randomUUID();
    await environment.dataSource.getRepository(AssessmentSchema).insert({
      id: assessmentId,
      height: 1.75,
      weight: 70,
      bmi: 22.86,
      classification: "normal-weight",
      studentId: student.id,
      assessorId: assessor.id,
      createdAt: new Date("2026-11-19T12:00:00.000Z"),
    });
    const newStudentId = randomUUID();

    await environment.dataSource.query("UPDATE usuario SET id = ? WHERE id = ?", [
      newStudentId,
      student.id,
    ]);

    const [storedRow] = await environment.dataSource.query(
      "SELECT id_usuario_aluno FROM avaliacao_imc WHERE id = ?",
      [assessmentId],
    );
    expect(storedRow).toEqual({ id_usuario_aluno: newStudentId });
  });
});
