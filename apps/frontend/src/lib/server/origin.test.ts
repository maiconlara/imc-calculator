import { describe, expect, it } from "vitest";
import { buildPanelRequest } from "@/test-support/fake-backend";
import { getForwardedIpHeaders, isSameOrigin, parseTrustedProxyCount } from "./origin";

describe("isSameOrigin", () => {
  it.each([
    ["no Origin header", {}, true],
    ["the panel itself", { origin: "http://localhost:3000" }, true],
    ["another site", { origin: "https://attacker.example.com" }, false],
    ["another port", { origin: "http://localhost:4000" }, false],
    ["an invalid Origin", { origin: "not a url" }, false],
  ])("answers for %s", (_case, headers, expected) => {
    expect(isSameOrigin(buildPanelRequest("/api/users", { headers }))).toBe(expected);
  });
});

describe("parseTrustedProxyCount", () => {
  it.each([
    [undefined, 0],
    ["", 0],
    ["0", 0],
    ["2", 2],
    [" 1 ", 1],
  ])("reads %j as %i", (setting, expected) => {
    expect(parseTrustedProxyCount(setting)).toBe(expected);
  });

  it.each(["-1", "1.5", "two"])("refuses %j", (setting) => {
    expect(() => parseTrustedProxyCount(setting)).toThrow(/TRUSTED_PROXY_COUNT/);
  });
});

describe("getForwardedIpHeaders", () => {
  const requestWithChain = buildPanelRequest("/api/auth/login", {
    headers: { "x-forwarded-for": "203.0.113.9, 198.51.100.7, 192.0.2.4" },
  });

  it("forwards nothing when no proxy is trusted, since the visitor may have written the header", () => {
    expect(getForwardedIpHeaders(requestWithChain, 0)).toEqual({});
  });

  it("takes the address written by the outermost trusted proxy", () => {
    expect(getForwardedIpHeaders(requestWithChain, 1)).toEqual({
      "x-forwarded-for": "192.0.2.4",
    });
    expect(getForwardedIpHeaders(requestWithChain, 2)).toEqual({
      "x-forwarded-for": "198.51.100.7",
    });
  });

  it("forwards nothing when the chain is shorter than the trusted proxies", () => {
    expect(getForwardedIpHeaders(requestWithChain, 4)).toEqual({});
    expect(getForwardedIpHeaders(buildPanelRequest("/api/auth/login"), 1)).toEqual({});
  });
});
