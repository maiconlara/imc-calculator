import express, { type Express } from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import type { Role } from "@imc-calculator/shared";
import type { AuthenticatedUser } from "../../modules/users/user";
import { UnauthorizedError } from "../errors";
import {
  createAuthenticationMiddleware,
  getAuthenticatedUser,
  requireRole,
} from "./authentication";
import { handleErrors } from "./error-handler";

const usersByAccessToken = new Map<string, AuthenticatedUser>([
  ["admin-token", { id: "1", name: "Ana Souza", username: "ana.souza", role: "admin" }],
  [
    "teacher-token",
    { id: "2", name: "Carla Mendes", username: "carla.mendes", role: "teacher" },
  ],
  [
    "student-token",
    { id: "3", name: "Pedro Costa", username: "pedro.costa", role: "student" },
  ],
]);

const authenticateRequest = createAuthenticationMiddleware({
  identifyUserByAccessToken: async (accessToken) => {
    const user = usersByAccessToken.get(accessToken);
    if (!user) throw new UnauthorizedError();
    return user;
  },
});

function createProtectedApp(...allowedRoles: [Role, ...Role[]]): Express {
  const app = express();
  app.get("/protected", authenticateRequest, requireRole(...allowedRoles), (req, res) => {
    res.json(getAuthenticatedUser(req));
  });
  app.get("/without-authentication", requireRole(...allowedRoles), (_req, res) => {
    res.json({ reached: true });
  });
  app.use(handleErrors);
  return app;
}

describe("authenticateRequest", () => {
  const protectedApp = createProtectedApp("admin", "teacher", "student");

  it("loads the user of the bearer token", async () => {
    const response = await request(protectedApp)
      .get("/protected")
      .set("authorization", "Bearer teacher-token");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(usersByAccessToken.get("teacher-token"));
  });

  it("accepts the scheme in any letter case", async () => {
    await request(protectedApp)
      .get("/protected")
      .set("authorization", "bearer teacher-token")
      .expect(200);
  });

  it.each([
    ["no authorization header", undefined],
    ["another scheme", "Basic teacher-token"],
    ["a bearer without token", "Bearer "],
    ["extra parts after the token", "Bearer teacher-token extra"],
    ["an unknown token", "Bearer unknown-token"],
  ])("answers 401 for %s", async (_case, authorizationHeader) => {
    const protectedRequest = request(protectedApp).get("/protected");
    if (authorizationHeader !== undefined) {
      protectedRequest.set("authorization", authorizationHeader);
    }

    const response = await protectedRequest;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Sessão expirada ou inválida. Entre novamente.",
    });
  });
});

describe("requireRole", () => {
  const managersOnlyApp = createProtectedApp("admin", "teacher");

  it.each(["admin-token", "teacher-token"])("lets %s through", async (accessToken) => {
    await request(managersOnlyApp)
      .get("/protected")
      .set("authorization", `Bearer ${accessToken}`)
      .expect(200);
  });

  it("answers 403 to a role outside the list", async () => {
    const response = await request(managersOnlyApp)
      .get("/protected")
      .set("authorization", "Bearer student-token");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({ message: "Você não tem permissão para esta ação." });
  });

  it("answers 403 when the route has no authenticated user", async () => {
    await request(managersOnlyApp).get("/without-authentication").expect(403);
  });
});
