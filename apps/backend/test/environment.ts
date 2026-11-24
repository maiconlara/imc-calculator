import { randomUUID } from "node:crypto";
import { pino } from "pino";
import request from "supertest";
import type { LoginResponse, Role, UserStatus } from "@imc-calculator/shared";
import { createApp } from "../src/app";
import { createContainer, type ContainerSettings } from "../src/container";
import { createDataSource } from "../src/infra/database/data-source";
import { UserSchema } from "../src/infra/database/schemas/user.schema";
import { BcryptPasswordHasher } from "../src/infra/security/bcrypt-password-hasher";
import type { User } from "../src/modules/users/user";

export const TEST_USER_PASSWORD = "senha-forte-123";

export const TEST_SETTINGS: ContainerSettings = {
  JWT_ACCESS_SECRET: "test-secret-with-at-least-32-characters",
  JWT_ACCESS_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 7,
  BCRYPT_ROUNDS: 4,
};

function toDisplayName(username: string): string {
  return username
    .split(".")
    .map((namePart) => namePart.charAt(0).toUpperCase() + namePart.slice(1))
    .join(" ");
}

/**
 * Builds the real app over a fresh in-memory database with every migration applied.
 * The clock starts at 2026-11-19T12:00:00.000Z and only moves with `advanceClock`.
 *
 * @param options - Origins the app accepts through CORS, none by default.
 * @returns The app, its data source and helpers for end-to-end tests.
 */
export async function createTestEnvironment(options: { allowedOrigins?: string[] } = {}) {
  const dataSource = createDataSource({ database: ":memory:" });
  await dataSource.initialize();
  await dataSource.runMigrations();

  let currentTime = new Date("2026-11-19T12:00:00.000Z");
  const app = createApp(
    createContainer({ dataSource, env: TEST_SETTINGS, clock: () => currentTime }),
    {
      logger: pino({ level: "silent" }),
      allowedOrigins: options.allowedOrigins ?? [],
      trustProxy: false,
    },
  );

  const passwordHasher = new BcryptPasswordHasher(TEST_SETTINGS.BCRYPT_ROUNDS);
  const testUserPasswordHash = await passwordHasher.hash(TEST_USER_PASSWORD);

  async function createUser(
    username: string,
    role: Role,
    status: UserStatus = "active",
  ): Promise<User> {
    const user: User = {
      id: randomUUID(),
      name: toDisplayName(username),
      username,
      passwordHash: testUserPasswordHash,
      role,
      status,
      createdAt: currentTime,
    };
    await dataSource.getRepository(UserSchema).insert(user);
    return user;
  }

  async function login(
    username: string,
    password = TEST_USER_PASSWORD,
  ): Promise<LoginResponse> {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({ username, password });
    if (loginResponse.status !== 200) {
      throw new Error(
        `Login of ${username} failed: ${loginResponse.status} ${JSON.stringify(loginResponse.body)}`,
      );
    }
    return loginResponse.body;
  }

  async function getAccessToken(username: string): Promise<string> {
    return (await login(username)).accessToken;
  }

  return {
    app,
    dataSource,
    httpRequest: () => request(app),
    createUser,
    login,
    getAccessToken,
    advanceClock: (milliseconds: number) => {
      currentTime = new Date(currentTime.getTime() + milliseconds);
    },
    closeDatabase: async () => {
      if (dataSource.isInitialized) await dataSource.destroy();
    },
  };
}

export type TestEnvironment = Awaited<ReturnType<typeof createTestEnvironment>>;

export function buildAuthorizationHeader(accessToken: string): [string, string] {
  return ["authorization", `Bearer ${accessToken}`];
}
