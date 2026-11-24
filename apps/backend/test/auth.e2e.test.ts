import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserSchema } from "../src/infra/database/schemas/user.schema";
import { UserTokenSchema } from "../src/infra/database/schemas/user-token.schema";
import type { User } from "../src/modules/users/user";
import {
  TEST_USER_PASSWORD,
  buildAuthorizationHeader,
  createTestEnvironment,
  type TestEnvironment,
} from "./environment";

const ONE_MINUTE_MS = 60 * 1000;
const ONE_DAY_MS = 24 * 60 * ONE_MINUTE_MS;
const FAILED_LOGINS_ALLOWED = 10;

let environment: TestEnvironment;
let student: User;

beforeEach(async () => {
  environment = await createTestEnvironment();
  await environment.createUser("admin", "admin");
  student = await environment.createUser("pedro.costa", "student");
  await environment.createUser("rodrigo.pereira", "student", "inactive");
});

afterEach(() => environment.closeDatabase());

function sendLogin(username: string, password: string) {
  return environment.httpRequest().post("/api/auth/login").send({ username, password });
}

function sendRefresh(refreshToken: string) {
  return environment.httpRequest().post("/api/auth/refresh").send({ refreshToken });
}

function getSessionUser(accessToken: string) {
  return environment
    .httpRequest()
    .get("/api/auth/me")
    .set(...buildAuthorizationHeader(accessToken));
}

async function inactivateUser(userId: string): Promise<void> {
  await environment.dataSource
    .getRepository(UserSchema)
    .update({ id: userId }, { status: "inactive" });
}

describe("POST /api/auth/login", () => {
  it("returns the tokens with their expiration and the user, without the password", async () => {
    const response = await sendLogin("  Pedro.Costa ", TEST_USER_PASSWORD);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      accessToken: expect.any(String),
      accessTokenExpiresAt: "2026-11-19T12:15:00.000Z",
      refreshToken: expect.any(String),
      refreshTokenExpiresAt: "2026-11-26T12:00:00.000Z",
      user: {
        id: student.id,
        name: "Pedro Costa",
        username: "pedro.costa",
        role: "student",
      },
    });
  });

  it("stores only the SHA-256 hash of the refresh token", async () => {
    const { refreshToken } = await environment.login("pedro.costa");

    const storedTokens = await environment.dataSource
      .getRepository(UserTokenSchema)
      .findBy({ userId: student.id });

    expect(storedTokens).toHaveLength(1);
    expect(storedTokens[0]?.refreshTokenHash).toBe(
      createHash("sha256").update(refreshToken).digest("hex"),
    );
  });

  it("removes the expired refresh tokens of the user on a new login", async () => {
    await environment.login("pedro.costa");
    environment.advanceClock(8 * ONE_DAY_MS);
    await environment.login("pedro.costa");

    const storedTokens = await environment.dataSource
      .getRepository(UserTokenSchema)
      .findBy({ userId: student.id });

    expect(storedTokens).toHaveLength(1);
  });

  it("answers the same for an unknown user and a wrong password", async () => {
    const wrongPasswordResponse = await sendLogin("pedro.costa", "outra-senha");
    const unknownUserResponse = await sendLogin("ninguem", "outra-senha");

    expect(wrongPasswordResponse.status).toBe(401);
    expect(unknownUserResponse.status).toBe(401);
    expect(wrongPasswordResponse.body).toEqual({
      message: "Usuário ou senha inválidos.",
    });
    expect(unknownUserResponse.body).toEqual(wrongPasswordResponse.body);
  });

  it("blocks an inactive user with the right password", async () => {
    const response = await sendLogin("rodrigo.pereira", TEST_USER_PASSWORD);

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "Usuário inativo. Procure a administração da academia.",
    });
  });

  it("does not reveal that a user is inactive when the password is wrong", async () => {
    const response = await sendLogin("rodrigo.pereira", "outra-senha");

    expect(response.status).toBe(401);
  });

  it("validates the body with one message per field", async () => {
    const response = await environment
      .httpRequest()
      .post("/api/auth/login")
      .send({ username: "" });

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual([
      { path: "username", message: "Informe o usuário" },
      { path: "password", message: "Informe a senha" },
    ]);
  });
});

describe("login rate limit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  async function failLogin(username: string, times: number): Promise<void> {
    for (let attempt = 1; attempt <= times; attempt++) {
      await sendLogin(username, "senha-errada").expect(401);
    }
  }

  it("allows 10 failed attempts, then blocks the username even with the right password", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-19T12:00:00.000Z") });
    await failLogin("pedro.costa", FAILED_LOGINS_ALLOWED);

    const response = await sendLogin("pedro.costa", TEST_USER_PASSWORD);

    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      message: "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
    });
    expect(response.headers["retry-after"]).toBe("600");
  });

  it("unblocks the username 10 minutes after the first failed attempt", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-19T12:00:00.000Z") });
    await failLogin("pedro.costa", FAILED_LOGINS_ALLOWED);

    vi.setSystemTime(new Date("2026-11-19T12:09:59.000Z"));
    await sendLogin("pedro.costa", TEST_USER_PASSWORD).expect(429);

    vi.setSystemTime(new Date("2026-11-19T12:10:00.000Z"));
    await sendLogin("pedro.costa", TEST_USER_PASSWORD).expect(200);
  });

  it("counts the username without spaces and in any letter case", async () => {
    await failLogin(" Pedro.COSTA ", FAILED_LOGINS_ALLOWED);

    await sendLogin("pedro.costa", TEST_USER_PASSWORD).expect(429);
  });

  it("keeps other usernames from the same address working", async () => {
    await failLogin("pedro.costa", FAILED_LOGINS_ALLOWED);

    await sendLogin("admin", TEST_USER_PASSWORD).expect(200);
  });

  it("does not count successful logins", async () => {
    for (let attempt = 0; attempt <= FAILED_LOGINS_ALLOWED; attempt++) {
      await sendLogin("pedro.costa", TEST_USER_PASSWORD).expect(200);
    }
  });
});

describe("GET /api/auth/me", () => {
  it.each([
    ["no authorization header", undefined],
    ["another scheme", "Basic cGVkcm86c2VuaGE="],
    ["a bearer without token", "Bearer"],
    ["a token that is not a JWT", "Bearer fake-token"],
  ])("answers 401 for %s", async (_case, authorizationHeader) => {
    const meRequest = environment.httpRequest().get("/api/auth/me");
    if (authorizationHeader) meRequest.set("authorization", authorizationHeader);

    const response = await meRequest;

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Sessão expirada ou inválida. Entre novamente.",
    });
  });

  it("returns the user of the token", async () => {
    const accessToken = await environment.getAccessToken("pedro.costa");

    const response = await getSessionUser(accessToken);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: student.id,
      name: "Pedro Costa",
      username: "pedro.costa",
      role: "student",
    });
  });

  it("rejects the access token once it expires", async () => {
    const accessToken = await environment.getAccessToken("pedro.costa");

    environment.advanceClock(14 * ONE_MINUTE_MS);
    await getSessionUser(accessToken).expect(200);
    environment.advanceClock(ONE_MINUTE_MS);
    await getSessionUser(accessToken).expect(401);
  });

  it("cuts the access and the session renewal as soon as the user is inactivated", async () => {
    const studentSession = await environment.login("pedro.costa");
    await getSessionUser(studentSession.accessToken).expect(200);

    await inactivateUser(student.id);

    await getSessionUser(studentSession.accessToken).expect(401);
    await sendRefresh(studentSession.refreshToken).expect(401);
    const remainingTokens = await environment.dataSource
      .getRepository(UserTokenSchema)
      .countBy({ userId: student.id });
    expect(remainingTokens).toBe(0);
  });

  it("rejects the access token of a user that was deleted", async () => {
    const accessToken = await environment.getAccessToken("pedro.costa");

    await environment.dataSource
      .getRepository(UserTokenSchema)
      .delete({ userId: student.id });
    await environment.dataSource.getRepository(UserSchema).delete({ id: student.id });

    await getSessionUser(accessToken).expect(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("rotates the refresh token and accepts the old one for 30 more seconds", async () => {
    const studentSession = await environment.login("pedro.costa");

    const renewedSession = await sendRefresh(studentSession.refreshToken).expect(200);
    expect(renewedSession.body.refreshToken).not.toBe(studentSession.refreshToken);
    expect(renewedSession.body.user).toMatchObject({ username: "pedro.costa" });

    environment.advanceClock(29_000);
    await sendRefresh(studentSession.refreshToken).expect(200);

    environment.advanceClock(2_000);
    await sendRefresh(studentSession.refreshToken).expect(401);
    await sendRefresh(renewedSession.body.refreshToken).expect(200);
  });

  it("never extends a refresh token that expires before the reuse window ends", async () => {
    const studentSession = await environment.login("pedro.costa");
    environment.advanceClock(7 * ONE_DAY_MS - 10_000);

    await sendRefresh(studentSession.refreshToken).expect(200);
    environment.advanceClock(10_000);

    await sendRefresh(studentSession.refreshToken).expect(401);
  });

  it("rejects an expired refresh token", async () => {
    const studentSession = await environment.login("pedro.costa");
    environment.advanceClock(7 * ONE_DAY_MS);

    await sendRefresh(studentSession.refreshToken).expect(401);
  });

  it("rejects an unknown refresh token", async () => {
    await sendRefresh("token-que-nunca-existiu").expect(401);
  });

  it("validates the body", async () => {
    const response = await environment.httpRequest().post("/api/auth/refresh").send({});

    expect(response.status).toBe(400);
    expect(response.body.issues).toEqual([
      { path: "refreshToken", message: "Sessão inválida. Entre novamente." },
    ]);
  });
});

describe("POST /api/auth/logout", () => {
  it("ends the session of the refresh token", async () => {
    const studentSession = await environment.login("pedro.costa");

    await environment
      .httpRequest()
      .post("/api/auth/logout")
      .send({ refreshToken: studentSession.refreshToken })
      .expect(204);

    await sendRefresh(studentSession.refreshToken).expect(401);
  });

  it("answers 204 for a refresh token that no longer exists", async () => {
    await environment
      .httpRequest()
      .post("/api/auth/logout")
      .send({ refreshToken: "token-que-nunca-existiu" })
      .expect(204);
  });
});
