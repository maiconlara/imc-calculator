import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTestEnvironment, type TestEnvironment } from "./environment";

let environment: TestEnvironment;

beforeEach(async () => {
  environment = await createTestEnvironment();
});

afterEach(() => environment.closeDatabase());

describe("GET /api/health", () => {
  it("answers ok when the database responds", async () => {
    const response = await environment.httpRequest().get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("answers a generic 500 when the database is down", async () => {
    await environment.dataSource.destroy();

    const response = await environment.httpRequest().get("/api/health");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Erro interno do servidor." });
  });

  it("sends the security headers and hides the framework", async () => {
    const response = await environment.httpRequest().get("/api/health");

    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("CORS", () => {
  const panelOrigin = "http://localhost:3000";

  it("allows only the configured origins", async () => {
    const corsEnvironment = await createTestEnvironment({
      allowedOrigins: [panelOrigin],
    });

    const allowedResponse = await corsEnvironment
      .httpRequest()
      .get("/api/health")
      .set("origin", panelOrigin);
    const foreignResponse = await corsEnvironment
      .httpRequest()
      .get("/api/health")
      .set("origin", "https://attacker.example.com");
    await corsEnvironment.closeDatabase();

    expect(allowedResponse.headers["access-control-allow-origin"]).toBe(panelOrigin);
    expect(foreignResponse.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("requests the API cannot handle", () => {
  it("answers 404 in the standard error shape for an unknown route", async () => {
    const response = await environment.httpRequest().get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Rota não encontrada." });
  });

  it("answers 400 for a body that is not valid JSON", async () => {
    const response = await environment
      .httpRequest()
      .post("/api/health")
      .set("content-type", "application/json")
      .send("{ not json");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "O corpo da requisição não é um JSON válido.",
    });
  });

  it("answers 413 for a body larger than 10 kB", async () => {
    const response = await environment
      .httpRequest()
      .post("/api/health")
      .send({ filler: "a".repeat(11 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({ message: "O corpo da requisição é grande demais." });
  });
});
