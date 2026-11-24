import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { describe, expect, it } from "vitest";
import { loadEnv, loadMigrationEnv, parseTrustProxy } from "./env";

const OWN_JWT_ACCESS_SECRET = "a-secret-of-our-own-with-more-than-32-characters";
const requiredVariables = { JWT_ACCESS_SECRET: OWN_JWT_ACCESS_SECRET };
const sampleVariables = parseEnv(
  readFileSync(new URL("../../.env.example", import.meta.url), "utf8"),
);

describe("parseTrustProxy", () => {
  it.each([
    ["true", true],
    ["false", false],
    ["2", 2],
    ["loopback", "loopback"],
    ["10.0.0.1, 10.0.0.0/8, uniquelocal", "10.0.0.1, 10.0.0.0/8, uniquelocal"],
    ["::1", "::1"],
    ["fd00::/8, 192.168.0.0/32", "fd00::/8, 192.168.0.0/32"],
  ])("reads %s as %s", (trustProxySetting, expectedValue) => {
    expect(parseTrustProxy(trustProxySetting)).toBe(expectedValue);
  });

  it.each([
    "lopback",
    "10.0.0.300",
    "10.0.0.0/8/1",
    "10.0.0.0/33",
    "fd00::/129",
    "proxy.example.com",
  ])("rejects %s", (invalidSetting) => {
    expect(parseTrustProxy(invalidSetting)).toBeNull();
  });
});

describe("loadEnv", () => {
  it("fills every setting but the JWT secret with a development default", () => {
    expect(loadEnv(requiredVariables)).toEqual({
      NODE_ENV: "development",
      PORT: 3333,
      LOG_LEVEL: "info",
      CORS_ORIGIN: ["http://localhost:3000"],
      TRUST_PROXY: "loopback",
      DB_DATABASE: "database.sqlite",
      JWT_ACCESS_SECRET: OWN_JWT_ACCESS_SECRET,
      JWT_ACCESS_TTL_MINUTES: 15,
      REFRESH_TOKEN_TTL_DAYS: 7,
      BCRYPT_ROUNDS: 10,
    });
  });

  it("accepts every sample value of .env.example", () => {
    expect(() => loadEnv(sampleVariables)).not.toThrow();
  });

  it("reads a comma separated list of allowed origins", () => {
    expect(
      loadEnv({
        ...requiredVariables,
        CORS_ORIGIN: "https://panel.example.com, http://localhost:3000,",
      }).CORS_ORIGIN,
    ).toEqual(["https://panel.example.com", "http://localhost:3000"]);
  });

  it("refuses to start with an invalid value and names the variable", () => {
    expect(() => loadEnv({ ...requiredVariables, PORT: "abc" })).toThrow(
      /Invalid environment variables[\s\S]*PORT/,
    );
    expect(() => loadEnv({ ...requiredVariables, NODE_ENV: "staging" })).toThrow(
      /NODE_ENV/,
    );
    expect(() => loadEnv({ ...requiredVariables, TRUST_PROXY: "lopback" })).toThrow(
      /Invalid environment variables[\s\S]*TRUST_PROXY/,
    );
  });

  it("requires a JWT secret of at least 32 characters", () => {
    expect(() => loadEnv({})).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => loadEnv({ JWT_ACCESS_SECRET: "a".repeat(31) })).toThrow(
      /JWT_ACCESS_SECRET/,
    );
    expect(loadEnv({ JWT_ACCESS_SECRET: "a".repeat(32) }).JWT_ACCESS_SECRET).toHaveLength(
      32,
    );
  });

  it("refuses the sample JWT secret of .env.example in production", () => {
    expect(() => loadEnv({ ...sampleVariables, NODE_ENV: "production" })).toThrow(
      /Replace the sample secret[\s\S]*JWT_ACCESS_SECRET/,
    );
    expect(
      loadEnv({ ...sampleVariables, ...requiredVariables, NODE_ENV: "production" })
        .NODE_ENV,
    ).toBe("production");
  });

  it.each([
    ["JWT_ACCESS_TTL_MINUTES", "0"],
    ["JWT_ACCESS_TTL_MINUTES", "1441"],
    ["REFRESH_TOKEN_TTL_DAYS", "0"],
    ["REFRESH_TOKEN_TTL_DAYS", "91"],
    ["BCRYPT_ROUNDS", "3"],
    ["BCRYPT_ROUNDS", "16"],
    ["BCRYPT_ROUNDS", "10.5"],
  ])("refuses %s=%s", (variableName, outOfRangeValue) => {
    expect(() =>
      loadEnv({ ...requiredVariables, [variableName]: outOfRangeValue }),
    ).toThrow(new RegExp(variableName));
  });
});

describe("loadMigrationEnv", () => {
  it("needs only the database settings, not the API secrets", () => {
    expect(loadMigrationEnv({})).toEqual({
      NODE_ENV: "development",
      LOG_LEVEL: "info",
      DB_DATABASE: "database.sqlite",
    });
  });

  it("still refuses an invalid value", () => {
    expect(() => loadMigrationEnv({ DB_DATABASE: "" })).toThrow(/DB_DATABASE/);
  });
});
