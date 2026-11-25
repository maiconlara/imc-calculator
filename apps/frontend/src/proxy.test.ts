import type { NextRequest, NextResponse } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/session/cookies";
import { SESSION_RENEWAL_FAILED_HEADER } from "@/lib/session/session-renewal";
import {
  PANEL_ORIGIN,
  buildLoginResponse,
  buildPanelRequest,
  sendJson,
  startFakeBackend,
  type FakeBackend,
} from "@/test-support/fake-backend";

let fakeBackend: FakeBackend;
let proxy: (request: NextRequest) => Promise<NextResponse>;

beforeAll(async () => {
  fakeBackend = await startFakeBackend();
  vi.stubEnv("BACKEND_URL", fakeBackend.url);
  ({ proxy } = await import("./proxy"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await fakeBackend.close();
});

beforeEach(() => {
  fakeBackend.receivedRequests.length = 0;
  fakeBackend.handle((receivedRequest, response) => {
    const { refreshToken } = JSON.parse(receivedRequest.body);
    if (refreshToken === "revoked-refresh") {
      sendJson(response, 401, { message: "Sessão expirada ou inválida." });
      return;
    }
    if (refreshToken.startsWith("crashing-refresh")) {
      sendJson(response, 500, { message: "Erro interno do servidor." });
      return;
    }
    sendJson(
      response,
      200,
      buildLoginResponse(`access-for-${refreshToken}`, "next-refresh"),
    );
  });
});

function passesThrough(response: NextResponse): boolean {
  return response.headers.get("x-middleware-next") === "1";
}

describe("proxy", () => {
  it.each(["/login", "/api/auth/login", "/api/auth/session-expired"])(
    "lets %s through without a session",
    async (path) => {
      expect(passesThrough(await proxy(buildPanelRequest(path)))).toBe(true);
    },
  );

  it("lets a request with the access cookie through without calling the API", async () => {
    const response = await proxy(
      buildPanelRequest("/users", { cookies: { [ACCESS_TOKEN_COOKIE]: "valid-access" } }),
    );

    expect(passesThrough(response)).toBe(true);
    expect(fakeBackend.receivedRequests).toEqual([]);
  });

  it("sends a page without a session to the login screen, remembering where it was", async () => {
    const response = await proxy(buildPanelRequest("/users?page=2"));

    expect(response.headers.get("location")).toBe(
      `${PANEL_ORIGIN}/login?redirect=%2Fusers%3Fpage%3D2`,
    );
  });

  it("sends the root without a session straight to the login screen", async () => {
    const response = await proxy(buildPanelRequest("/"));

    expect(response.headers.get("location")).toBe(`${PANEL_ORIGIN}/login`);
  });

  it("answers 401 to an API call without a session", async () => {
    const response = await proxy(buildPanelRequest("/api/users"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "Sessão expirada. Entre novamente.",
    });
  });

  it("renews the session before the page when only the refresh cookie is left", async () => {
    const response = await proxy(
      buildPanelRequest("/dashboard", {
        cookies: { [REFRESH_TOKEN_COOKIE]: "valid-refresh" },
      }),
    );

    expect(passesThrough(response)).toBe(true);
    expect(response.cookies.get(ACCESS_TOKEN_COOKIE)?.value).toBe(
      "access-for-valid-refresh",
    );
    expect(response.cookies.get(REFRESH_TOKEN_COOKIE)?.value).toBe("next-refresh");
    expect(response.headers.get("x-middleware-request-cookie")).toContain(
      `${ACCESS_TOKEN_COOKIE}=access-for-valid-refresh`,
    );
  });

  it("sends to the login screen and clears the cookies when the refresh is refused", async () => {
    const response = await proxy(
      buildPanelRequest("/dashboard", {
        cookies: { [REFRESH_TOKEN_COOKIE]: "revoked-refresh" },
      }),
    );

    expect(response.headers.get("location")).toBe(
      `${PANEL_ORIGIN}/login?redirect=%2Fdashboard`,
    );
    expect(response.headers.get("set-cookie")).toContain(`${REFRESH_TOKEN_COOKIE}=;`);
  });

  it("keeps the session and lets the page show its error screen when the API fails the renewal", async () => {
    const response = await proxy(
      buildPanelRequest("/dashboard", {
        cookies: { [REFRESH_TOKEN_COOKIE]: "crashing-refresh-page" },
      }),
    );

    expect(passesThrough(response)).toBe(true);
    expect(
      response.headers.get(`x-middleware-request-${SESSION_RENEWAL_FAILED_HEADER}`),
    ).toBe("1");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("passes the API failure on to an API call during the renewal, keeping the cookies", async () => {
    const response = await proxy(
      buildPanelRequest("/api/users", {
        cookies: { [REFRESH_TOKEN_COOKIE]: "crashing-refresh-api" },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Erro interno do servidor." });
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
