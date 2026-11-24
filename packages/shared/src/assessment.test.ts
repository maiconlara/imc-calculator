import { describe, expect, it } from "vitest";
import {
  MAX_HEIGHT,
  MAX_WEIGHT,
  MIN_HEIGHT,
  MIN_WEIGHT,
  createAssessmentSchema,
  listAssessmentsQuerySchema,
} from "./assessment";

const studentId = "6f1c2c7e-3d1b-4b7a-9a43-1f8f6b2a9c10";

describe("createAssessmentSchema", () => {
  it("accepts the height and weight limits", () => {
    expect(
      createAssessmentSchema.safeParse({
        studentId,
        height: MIN_HEIGHT,
        weight: MIN_WEIGHT,
      }).success,
    ).toBe(true);
    expect(
      createAssessmentSchema.safeParse({
        studentId,
        height: MAX_HEIGHT,
        weight: MAX_WEIGHT,
      }).success,
    ).toBe(true);
  });

  it.each([
    [MIN_HEIGHT - 0.01, 70, "A altura mínima é 0,50 m"],
    [MAX_HEIGHT + 0.01, 70, "A altura máxima é 2,50 m"],
    [1.75, MIN_WEIGHT - 0.1, "O peso mínimo é 10 kg"],
    [1.75, MAX_WEIGHT + 0.1, "O peso máximo é 400 kg"],
  ])("rejects height %s and weight %s with %s", (height, weight, expectedMessage) => {
    const parsedAssessment = createAssessmentSchema.safeParse({
      studentId,
      height,
      weight,
    });
    expect(parsedAssessment.success).toBe(false);
    expect(parsedAssessment.error?.issues[0]?.message).toBe(expectedMessage);
  });

  it("requires a student id", () => {
    const parsedAssessment = createAssessmentSchema.safeParse({
      studentId: "",
      height: 1.75,
      weight: 70,
    });
    expect(parsedAssessment.error?.issues[0]?.message).toBe("Selecione o aluno");
  });
});

describe("listAssessmentsQuerySchema", () => {
  it("accepts the student, teacher and classification filters", () => {
    expect(
      listAssessmentsQuerySchema.parse({
        studentId,
        assessorId: studentId,
        classification: "overweight",
      }),
    ).toMatchObject({ studentId, assessorId: studentId, classification: "overweight" });
  });

  it.each([
    [{ classification: "obese" }, "Classificação inválida"],
    [{ studentId: "42" }, "Aluno inválido"],
    [{ assessorId: "42" }, "Professor inválido"],
  ])("rejects %j with a Portuguese message", (query, expectedMessage) => {
    expect(listAssessmentsQuerySchema.safeParse(query).error?.issues[0]?.message).toBe(
      expectedMessage,
    );
  });
});
