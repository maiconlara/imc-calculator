import { describe, expect, it } from "vitest";
import { loadEnv, parseTrustProxy } from "./env";

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
  it("fills every setting with a development default", () => {
    expect(loadEnv({})).toEqual({
      NODE_ENV: "development",
      PORT: 3333,
      LOG_LEVEL: "info",
      CORS_ORIGIN: ["http://localhost:3000"],
      TRUST_PROXY: "loopback",
      DB_DATABASE: "database.sqlite",
    });
  });

  it("reads a comma separated list of allowed origins", () => {
    expect(
      loadEnv({ CORS_ORIGIN: "https://panel.example.com, http://localhost:3000," })
        .CORS_ORIGIN,
    ).toEqual(["https://panel.example.com", "http://localhost:3000"]);
  });

  it("refuses to start with an invalid value and names the variable", () => {
    expect(() => loadEnv({ PORT: "abc" })).toThrow(
      /Invalid environment variables[\s\S]*PORT/,
    );
    expect(() => loadEnv({ NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
    expect(() => loadEnv({ TRUST_PROXY: "lopback" })).toThrow(
      /Invalid environment variables[\s\S]*TRUST_PROXY/,
    );
  });
});
