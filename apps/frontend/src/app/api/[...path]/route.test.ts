import type { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session/cookies";
import {
  buildLoginResponse,
  buildPanelRequest,
  sendJson,
  startFakeBackend,
  type FakeBackend,
} from "@/test-support/fake-backend";

let fakeBackend: FakeBackend;
let forwardToBackend: (
  request: NextRequest,
  routeContext: { params: Promise<{ path: string[] }> },
) => Promise<Response>;

beforeAll(async () => {
  fakeBackend = await startFakeBackend();
  vi.stubEnv("BACKEND_URL", fakeBackend.url);
  ({ GET: forwardToBackend } = await import("./route"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await fakeBackend.close();
});

beforeEach(() => {
  fakeBackend.receivedRequests.length = 0;
  fakeBackend.handle((receivedRequest, response) => {
    if (receivedRequest.url === "/api/auth/refresh") {
      const { refreshToken } = JSON.parse(receivedRequest.body);
      if (refreshToken === "valid-refresh") {
        sendJson(response, 200, buildLoginResponse("renewed-access", "renewed-refresh"));
      } else {
        sendJson(response, 401, { message: "Sessão expirada ou inválida." });
      }
      return;
    }
    if (receivedRequest.authorization === "Bearer expired-access") {
      sendJson(response, 401, { message: "Sessão expirada ou inválida." });
      return;
    }
    if (receivedRequest.method === "DELETE") {
      response.writeHead(204).end();
      return;
    }
    if (receivedRequest.url.startsWith("/api/unreachable")) {
      response.socket?.destroy();
      return;
    }
    sendJson(response, 200, { echoedBody: receivedRequest.body || null });
  });
});

function forward(path: string, options: Parameters<typeof buildPanelRequest>[1] = {}) {
  const backendPath = path.split("?")[0]?.replace(/^\/api\//, "") ?? "";
  return forwardToBackend(buildPanelRequest(path, options), {
    params: Promise.resolve({ path: backendPath.split("/").map(decodeURIComponent) }),
  });
}

describe("/api/[...path]", () => {
  it("forwards the call with the token of the cookie, the path and the query", async () => {
    const response = await forward("/api/users?page=2&search=ana", {
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ echoedBody: null });
    expect(fakeBackend.receivedRequests).toEqual([
      expect.objectContaining({
        method: "GET",
        url: "/api/users?page=2&search=ana",
        authorization: "Bearer valid-access",
      }),
    ]);
  });

  it("encodes each path segment, so a segment cannot climb to another route", async () => {
    await forward("/api/users/a%2F..%2Fauth", {
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
    });

    expect(fakeBackend.receivedRequests[0]?.url).toBe("/api/users/a%2F..%2Fauth");
  });

  it("sends the body of a write as JSON", async () => {
    const response = await forward("/api/users", {
      method: "POST",
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
      headers: { origin: "http://localhost:3000" },
      body: { name: "Camila Duarte" },
    });

    expect(await response.json()).toEqual({ echoedBody: '{"name":"Camila Duarte"}' });
    expect(fakeBackend.receivedRequests[0]?.contentType).toBe("application/json");
  });

  it("answers 204 without a body when the API does", async () => {
    const response = await forward("/api/users/5f0c", {
      method: "DELETE",
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
    });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });

  it("renews the session once when the API answers 401, and stores the new tokens", async () => {
    const response = await forward("/api/users", {
      cookies: {
        [ACCESS_TOKEN_COOKIE]: "expired-access",
        [REFRESH_TOKEN_COOKIE]: "valid-refresh",
      },
    });

    expect(response.status).toBe(200);
    expect(fakeBackend.receivedRequests.map((request) => request.authorization)).toEqual([
      "Bearer expired-access",
      undefined,
      "Bearer renewed-access",
    ]);
    const setCookieHeader = response.headers.get("set-cookie") ?? "";
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=renewed-access`);
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=renewed-refresh`);
    expect(setCookieHeader.toLowerCase()).toContain("httponly");
  });

  it("answers 401 and clears the cookies when the session cannot be renewed", async () => {
    const response = await forward("/api/users", {
      cookies: {
        [ACCESS_TOKEN_COOKIE]: "expired-access",
        [REFRESH_TOKEN_COOKIE]: "revoked-refresh",
      },
    });

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain(`${ACCESS_TOKEN_COOKIE}=;`);
  });

  it("refuses a write sent from another site without calling the API", async () => {
    const response = await forward("/api/users", {
      method: "POST",
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
      headers: { origin: "https://attacker.example.com" },
      body: { name: "Invasor" },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Origem não permitida." });
    expect(fakeBackend.receivedRequests).toEqual([]);
  });

  it.each([
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/logout",
    "/api/AUTH/login",
    "/api/Auth/refresh",
    "/api/auth/LOGOUT",
    "/api/users/%2E%2E/auth/refresh",
    "/api/users/./me",
  ])("does not expose the session route %s", async (path) => {
    const response = await forward(path, {
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
    });

    expect(response.status).toBe(404);
    expect(fakeBackend.receivedRequests).toEqual([]);
  });

  it.each(["/api/auth/me", "/api/AUTH/Me"])(
    "forwards the session user route %s",
    async (path) => {
      await forward(path, { cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" } });

      expect(fakeBackend.receivedRequests).toHaveLength(1);
    },
  );

  it("answers 502 with a readable message when the API cannot be reached", async () => {
    const response = await forward("/api/unreachable", {
      cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" },
    });

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      message: "Não foi possível falar com a API. Tente de novo em instantes.",
    });
  });
});
