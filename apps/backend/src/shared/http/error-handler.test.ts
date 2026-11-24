import express, { type Express } from "express";
import { pino } from "pino";
import { pinoHttp } from "pino-http";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createUserSchema } from "@imc-calculator/shared";
import {
  BusinessRuleError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../errors";
import { handleErrors } from "./error-handler";

function createAppThatThrows(errorToThrow: unknown, loggedLines: string[] = []): Express {
  const app = express();
  app.use(
    pinoHttp({
      logger: pino({ level: "error" }, { write: (line) => loggedLines.push(line) }),
    }),
  );
  app.get("/fails", () => {
    throw errorToThrow;
  });
  app.use(handleErrors);
  return app;
}

describe("handleErrors", () => {
  it.each([
    [new UnauthorizedError(), 401, "Sessão expirada ou inválida. Entre novamente."],
    [new ForbiddenError(), 403, "Você não tem permissão para esta ação."],
    [new NotFoundError("Usuário não encontrado."), 404, "Usuário não encontrado."],
    [
      new ConflictError('O usuário "ana" já está em uso.'),
      409,
      'O usuário "ana" já está em uso.',
    ],
    [new BusinessRuleError("Aluno inativo."), 422, "Aluno inativo."],
  ])("turns %s into status %s", async (domainError, expectedStatus, expectedMessage) => {
    const response = await request(createAppThatThrows(domainError)).get("/fails");

    expect(response.status).toBe(expectedStatus);
    expect(response.body).toEqual({ message: expectedMessage });
  });

  it("turns a validation error into 400 with one issue per field", async () => {
    const validationError = z
      .object({ height: z.number().max(2.5, "A altura máxima é 2,50 m") })
      .safeParse({ height: 3 }).error;

    const response = await request(createAppThatThrows(validationError)).get("/fails");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "Dados inválidos. Confira os campos destacados.",
      issues: [{ path: "height", message: "A altura máxima é 2,50 m" }],
    });
  });

  it("keeps only the first message of a field that breaks two rules", async () => {
    const validationError = createUserSchema.safeParse({
      name: "Ana Souza",
      username: "A!",
      password: "secret-123",
      role: "student",
    }).error;
    expect(
      validationError?.issues.filter((issue) => issue.path[0] === "username"),
    ).toHaveLength(2);

    const response = await request(createAppThatThrows(validationError)).get("/fails");

    expect(response.body.issues).toEqual([
      { path: "username", message: "O usuário precisa ter ao menos 3 caracteres" },
    ]);
  });

  it("hides an unexpected error behind a generic 500 and logs it", async () => {
    const loggedLines: string[] = [];
    const app = createAppThatThrows(new Error("database file is locked"), loggedLines);

    const response = await request(app).get("/fails");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro interno do servidor." });
    expect(loggedLines.join("\n")).toContain("database file is locked");
  });
});
