import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@imc-calculator/shared";
import { AppError } from "../errors";

const MAX_VALIDATION_ISSUES = 20;

function isBodyParserError(error: unknown): error is { status: number; type: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  );
}

/**
 * Keeps the first issue of each field, so a field that breaks two rules shows one
 * message, the same one the form shows.
 *
 * @param validationError - Error thrown by a Zod schema.
 * @returns One `{ path, message }` per invalid field, in schema order.
 */
function getFirstIssuePerField(
  validationError: ZodError,
): NonNullable<ApiErrorBody["issues"]> {
  const seenPaths = new Set<string>();
  return validationError.issues.flatMap((issue) => {
    const path = issue.path.join(".");
    if (seenPaths.has(path)) return [];
    seenPaths.add(path);
    return [{ path, message: issue.message }];
  });
}

export const handleRouteNotFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." } satisfies ApiErrorBody);
};

export const handleErrors: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message } satisfies ApiErrorBody);
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Dados inválidos. Confira os campos destacados.",
      issues: getFirstIssuePerField(error).slice(0, MAX_VALIDATION_ISSUES),
    } satisfies ApiErrorBody);
    return;
  }

  if (isBodyParserError(error)) {
    const message =
      error.type === "entity.too.large"
        ? "O corpo da requisição é grande demais."
        : "O corpo da requisição não é um JSON válido.";
    res.status(error.status).json({ message } satisfies ApiErrorBody);
    return;
  }

  req.log.error({ err: error }, "Unexpected error");
  res.status(500).json({ message: "Erro interno do servidor." } satisfies ApiErrorBody);
};
