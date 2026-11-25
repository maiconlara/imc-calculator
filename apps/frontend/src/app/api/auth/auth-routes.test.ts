import type { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session/cookies";
import {
  PANEL_ORIGIN,
  buildLoginResponse,
  buildPanelRequest,
  sendJson,
  startFakeBackend,
  type FakeBackend,
} from "@/test-support/fake-backend";

type RouteHandler = (request: NextRequest) => Promise<Response> | Response;

let fakeBackend: FakeBackend;
let postLogin: RouteHandler;
let postLogout: RouteHandler;
let getSessionExpired: RouteHandler;

beforeAll(async () => {
  fakeBackend = await startFakeBackend();
  vi.stubEnv("BACKEND_URL", fakeBackend.url);
  ({ POST: postLogin } = await import("./login/route"));
  ({ POST: postLogout } = await import("./logout/route"));
  ({ GET: getSessionExpired } = await import("./session-expired/route"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await fakeBackend.close();
});

beforeEach(() => {
  vi.stubEnv("TRUSTED_PROXY_COUNT", "");
  fakeBackend.receivedRequests.length = 0;
  fakeBackend.handle((receivedRequest, response) => {
    if (receivedRequest.url === "/api/auth/login") {
      const { password } = JSON.parse(receivedRequest.body);
      if (password === "prof1234") {
        sendJson(response, 200, buildLoginResponse("new-access", "new-refresh"));
      } else {
        sendJson(response, 401, { message: "Usuário ou senha inválidos." });
      }
      return;
    }
    if (receivedRequest.url === "/api/auth/logout") {
      response.writeHead(204).end();
      return;
    }
    sendJson(response, 404, { message: "Rota não encontrada." });
  });
});

function sendLogin(body: unknown, headers: Record<string, string> = {}) {
  return postLogin(
    buildPanelRequest("/api/auth/login", {
      method: "POST",
      headers: { origin: PANEL_ORIGIN, ...headers },
      body,
    }),
  );
}

describe("POST /api/auth/login", () => {
  it("stores the tokens in httpOnly cookies and gives the browser only the user", async () => {
    const response = await sendLogin({
      username: " Carla.Mendes ",
      password: "prof1234",
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      user: {
        id: "carla-id",
        name: "Carla Mendes",
        username: "carla.mendes",
        role: "teacher",
      },
    });
    const setCookieHeader = response.headers.get("set-cookie") ?? "";
    expect(setCookieHeader).toContain(`${ACCESS_TOKEN_COOKIE}=new-access`);
    expect(setCookieHeader).toContain(`${REFRESH_TOKEN_COOKIE}=new-refresh`);
    expect(setCookieHeader.toLowerCase()).toContain("httponly");
    expect(setCookieHeader.toLowerCase()).toContain("samesite=lax");
    expect(JSON.parse(fakeBackend.receivedRequests[0]?.body ?? "")).toEqual({
      username: "carla.mendes",
      password: "prof1234",
    });
  });

  it("passes the API answer on when the credentials are wrong, without cookies", async () => {
    const response = await sendLogin({ username: "carla.mendes", password: "errada" });

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Usuário ou senha inválidos." });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("validates the body before calling the API", async () => {
    const response = await sendLogin({ username: "" });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Informe usuário e senha.",
      issues: [
        { path: "username", message: "Informe o usuário" },
        { path: "password", message: "Informe a senha" },
      ],
    });
    expect(fakeBackend.receivedRequests).toEqual([]);
  });

  it("refuses a login posted from another site", async () => {
    const response = await sendLogin(
      { username: "carla.mendes", password: "prof1234" },
      { origin: "https://attacker.example.com" },
    );

    expect(response.status).toBe(403);
    expect(fakeBackend.receivedRequests).toEqual([]);
  });

  it("does not pass on an X-Forwarded-For the visitor wrote when no proxy is trusted", async () => {
    await sendLogin(
      { username: "carla.mendes", password: "prof1234" },
      { "x-forwarded-for": "203.0.113.9" },
    );

    expect(fakeBackend.receivedRequests[0]?.forwardedFor).toBeUndefined();
  });

  it("passes on the address written by the trusted proxy, ignoring what the visitor wrote", async () => {
    vi.stubEnv("TRUSTED_PROXY_COUNT", "1");

    await sendLogin(
      { username: "carla.mendes", password: "prof1234" },
      { "x-forwarded-for": "203.0.113.9, 198.51.100.7" },
    );

    expect(fakeBackend.receivedRequests[0]?.forwardedFor).toBe("198.51.100.7");
  });
});

describe("POST /api/auth/logout", () => {
  it("ends the session in the API and clears the cookies", async () => {
    const response = await postLogout(
      buildPanelRequest("/api/auth/logout", {
        method: "POST",
        headers: { origin: PANEL_ORIGIN },
        cookies: { [REFRESH_TOKEN_COOKIE]: "current-refresh" },
      }),
    );

    expect(response.status).toBe(204);
    expect(JSON.parse(fakeBackend.receivedRequests[0]?.body ?? "")).toEqual({
      refreshToken: "current-refresh",
    });
    expect(response.headers.get("set-cookie")).toContain(`${REFRESH_TOKEN_COOKIE}=;`);
  });

  it("clears the cookies even when the API cannot be reached", async () => {
    fakeBackend.handle((_receivedRequest, response) => response.socket?.destroy());

    const response = await postLogout(
      buildPanelRequest("/api/auth/logout", {
        method: "POST",
        cookies: { [REFRESH_TOKEN_COOKIE]: "current-refresh" },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("set-cookie")).toContain(`${ACCESS_TOKEN_COOKIE}=;`);
  });
});

describe("GET /api/auth/session-expired", () => {
  it("clears the cookies and opens the login screen with the expired notice", async () => {
    const response = await getSessionExpired(
      buildPanelRequest("/api/auth/session-expired", {
        cookies: { [ACCESS_TOKEN_COOKIE]: "old-access" },
      }),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${PANEL_ORIGIN}/login?expired=1`);
    expect(response.headers.get("set-cookie")).toContain(`${ACCESS_TOKEN_COOKIE}=;`);
  });
});
