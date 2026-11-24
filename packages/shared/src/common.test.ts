import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MAX_PAGE_SIZE, idParamSchema, optionalParam, paginationSchema } from "./common";

describe("optionalParam", () => {
  const optionalNumber = optionalParam(z.coerce.number());

  it("treats an empty query string value as absent", () => {
    expect(optionalNumber.parse("")).toBeUndefined();
    expect(optionalNumber.parse(undefined)).toBeUndefined();
  });

  it("validates a present value with the given schema", () => {
    expect(optionalNumber.parse("7")).toBe(7);
  });
});

describe("paginationSchema", () => {
  it("defaults to the first page with 10 items", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it.each([
    [{ page: "0" }, "A página precisa ser um número inteiro a partir de 1"],
    [{ page: "1.5" }, "A página precisa ser um número inteiro a partir de 1"],
    [
      { pageSize: String(MAX_PAGE_SIZE + 1) },
      `O tamanho da página precisa ser um número inteiro de 1 a ${MAX_PAGE_SIZE}`,
    ],
  ])("rejects %j with a Portuguese message", (query, expectedMessage) => {
    expect(paginationSchema.safeParse(query).error?.issues[0]?.message).toBe(
      expectedMessage,
    );
  });
});

describe("idParamSchema", () => {
  it("accepts a UUID and rejects anything else", () => {
    expect(
      idParamSchema.safeParse({ id: "6f1c2c7e-3d1b-4b7a-9a43-1f8f6b2a9c10" }).success,
    ).toBe(true);
    expect(idParamSchema.safeParse({ id: "42" }).error?.issues[0]?.message).toBe(
      "Identificador inválido",
    );
  });
});
