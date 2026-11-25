import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_COOKIE } from "@/lib/session/cookies";
import { SESSION_RENEWAL_FAILED_HEADER } from "@/lib/session/session-renewal";
import {
  sendJson,
  startFakeBackend,
  type FakeBackend,
} from "@/test-support/fake-backend";
import type * as SessionModule from "./session";

const requestCookies = new Map<string, string>();
const requestHeaders = new Headers();

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      requestCookies.has(name) ? { name, value: requestCookies.get(name) } : undefined,
  }),
  headers: async () => requestHeaders,
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

const TEACHER = {
  id: "carla-id",
  name: "Carla Mendes",
  username: "carla.mendes",
  role: "teacher",
};
const STUDENT = {
  id: "pedro-id",
  name: "Pedro Costa",
  username: "pedro.costa",
  role: "student",
};

let fakeBackend: FakeBackend;
let session: typeof SessionModule;

beforeAll(async () => {
  fakeBackend = await startFakeBackend();
  vi.stubEnv("BACKEND_URL", fakeBackend.url);
  session = await import("./session");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await fakeBackend.close();
});

beforeEach(() => {
  requestCookies.clear();
  requestHeaders.delete(SESSION_RENEWAL_FAILED_HEADER);
  fakeBackend.handle((receivedRequest, response) => {
    if (receivedRequest.authorization === "Bearer teacher-access") {
      sendJson(response, 200, TEACHER);
    } else if (receivedRequest.authorization === "Bearer student-access") {
      sendJson(response, 200, STUDENT);
    } else if (receivedRequest.authorization === "Bearer crashing-access") {
      sendJson(response, 500, { message: "Erro interno do servidor." });
    } else {
      sendJson(response, 401, { message: "Sessão expirada ou inválida." });
    }
  });
});

describe("getSessionUser", () => {
  it("asks the API who the access token belongs to", async () => {
    requestCookies.set(ACCESS_TOKEN_COOKIE, "teacher-access");

    await expect(session.getSessionUser()).resolves.toEqual(TEACHER);
    expect(fakeBackend.receivedRequests.at(-1)?.url).toBe("/api/auth/me");
  });

  it("answers null without an access cookie or when the API refuses the token", async () => {
    await expect(session.getSessionUser()).resolves.toBeNull();

    requestCookies.set(ACCESS_TOKEN_COOKIE, "expired-access");
    await expect(session.getSessionUser()).resolves.toBeNull();
  });

  it("lets an API failure through, so the page shows its error screen", async () => {
    requestCookies.set(ACCESS_TOKEN_COOKIE, "crashing-access");

    await expect(session.getSessionUser()).rejects.toThrow();
  });

  it("fails instead of answering null when the proxy could not renew the session", async () => {
    requestHeaders.set(SESSION_RENEWAL_FAILED_HEADER, "1");

    await expect(session.getSessionUser()).rejects.toThrow(/renewed/);
  });
});

describe("requireSessionUser", () => {
  it("sends a request without a session to the session expired route", async () => {
    await expect(session.requireSessionUser("dashboard")).rejects.toThrow(
      "redirect:/api/auth/session-expired",
    );
  });

  it("sends a role the permission map keeps out of the screen to the home screen", async () => {
    requestCookies.set(ACCESS_TOKEN_COOKIE, "student-access");

    await expect(session.requireSessionUser("users")).rejects.toThrow(
      "redirect:/dashboard",
    );
    await expect(session.requireSessionUser("assessments")).resolves.toEqual(STUDENT);
  });

  it("returns the user of a role allowed on the screen, or on any screen without one", async () => {
    requestCookies.set(ACCESS_TOKEN_COOKIE, "teacher-access");

    await expect(session.requireSessionUser("users")).resolves.toEqual(TEACHER);
    await expect(session.requireSessionUser()).resolves.toEqual(TEACHER);
  });
});

describe("getDirectBackendApi", () => {
  it("calls the API directly with the access token of the cookie", async () => {
    requestCookies.set(ACCESS_TOKEN_COOKIE, "teacher-access");

    const directBackendApi = await session.getDirectBackendApi();
    await directBackendApi.get("/auth/me");

    expect(fakeBackend.receivedRequests.at(-1)).toMatchObject({
      url: "/api/auth/me",
      authorization: "Bearer teacher-access",
    });
  });

  it("sends no token without an access cookie", async () => {
    const directBackendApi = await session.getDirectBackendApi();
    await expect(directBackendApi.get("/auth/me")).rejects.toThrow();

    expect(fakeBackend.receivedRequests.at(-1)?.authorization).toBeUndefined();
  });
});

describe("getScreenMetadata", () => {
  it("names the tab after the screen as the role sees it", async () => {
    requestCookies.set(ACCESS_TOKEN_COOKIE, "teacher-access");

    await expect(session.getScreenMetadata("users")).resolves.toEqual({
      title: "Alunos",
    });
  });

  it("leaves the default title without a session", async () => {
    await expect(session.getScreenMetadata("users")).resolves.toEqual({});
  });
});
