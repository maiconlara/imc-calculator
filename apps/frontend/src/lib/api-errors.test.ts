import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";
import { getErrorMessage, getErrorStatus, shouldRetryQuery } from "./api-errors";

function buildAxiosError(status?: number, data?: unknown): AxiosError {
  const response: AxiosResponse | undefined =
    status === undefined
      ? undefined
      : {
          status,
          statusText: "",
          data,
          headers: {},
          config: { headers: new AxiosHeaders() },
        };
  return new AxiosError(
    "Request failed",
    "ERR_BAD_RESPONSE",
    undefined,
    undefined,
    response,
  );
}

describe("getErrorMessage", () => {
  it("shows the message the API sent", () => {
    expect(getErrorMessage(buildAxiosError(409, { message: "Usuário em uso." }))).toBe(
      "Usuário em uso.",
    );
  });

  it("explains a failure to reach the server", () => {
    expect(getErrorMessage(buildAxiosError())).toBe(
      "Não foi possível falar com o servidor. Confira sua conexão.",
    );
  });

  it("falls back when the error carries no message", () => {
    expect(getErrorMessage(buildAxiosError(500, ""))).toBe(
      "Algo deu errado. Tente de novo.",
    );
    expect(getErrorMessage("unexpected", "Não deu certo.")).toBe("Não deu certo.");
  });
});

describe("shouldRetryQuery", () => {
  it("never retries an answer the API gave on purpose", () => {
    expect(getErrorStatus(buildAxiosError(404))).toBe(404);
    expect(shouldRetryQuery(0, buildAxiosError(404))).toBe(false);
    expect(shouldRetryQuery(0, buildAxiosError(401))).toBe(false);
  });

  it("retries server and network failures twice", () => {
    expect(shouldRetryQuery(0, buildAxiosError(503))).toBe(true);
    expect(shouldRetryQuery(1, buildAxiosError())).toBe(true);
    expect(shouldRetryQuery(2, buildAxiosError(503))).toBe(false);
  });
});
