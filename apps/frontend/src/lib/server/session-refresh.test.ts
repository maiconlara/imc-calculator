import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type * as SessionRefresh from "./session-refresh";
import {
  buildLoginResponse,
  sendJson,
  startFakeBackend,
  type FakeBackend,
} from "@/test-support/fake-backend";

let fakeBackend: FakeBackend;
let refreshSession: typeof SessionRefresh.refreshSession;

beforeAll(async () => {
  fakeBackend = await startFakeBackend();
  vi.stubEnv("BACKEND_URL", fakeBackend.url);
  ({ refreshSession } = await import("./session-refresh"));
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await fakeBackend.close();
});

beforeEach(() => {
  fakeBackend.receivedRequests.length = 0;
  fakeBackend.handle((receivedRequest, response) => {
    const { refreshToken } = JSON.parse(receivedRequest.body);
    if (refreshToken.startsWith("revoked")) {
      sendJson(response, 401, { message: "Sessão expirada ou inválida." });
      return;
    }
    if (refreshToken.startsWith("crashing")) {
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

describe("refreshSession", () => {
  it("makes one API call for parallel renewals of the same token", async () => {
    const renewedSessions = await Promise.all([
      refreshSession("shared-refresh"),
      refreshSession("shared-refresh"),
      refreshSession("shared-refresh"),
    ]);

    expect(fakeBackend.receivedRequests).toHaveLength(1);
    expect(renewedSessions.map((renewedSession) => renewedSession?.accessToken)).toEqual([
      "access-for-shared-refresh",
      "access-for-shared-refresh",
      "access-for-shared-refresh",
    ]);
  });

  it("reuses the answer for a request that arrives right after", async () => {
    await refreshSession("reused-refresh");
    await refreshSession("reused-refresh");

    expect(fakeBackend.receivedRequests).toHaveLength(1);
  });

  it("answers null when the API refuses the token", async () => {
    await expect(refreshSession("revoked-refresh")).resolves.toBeNull();
  });

  it("lets an API failure through and tries again on the next call", async () => {
    await expect(refreshSession("crashing-refresh")).rejects.toThrow();
    await expect(refreshSession("crashing-refresh")).rejects.toThrow();

    expect(fakeBackend.receivedRequests).toHaveLength(2);
  });
});
