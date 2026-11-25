import { describe, expect, it } from "vitest";
import { HOME_ROUTE, getSafeRedirectPath } from "./routes";

describe("getSafeRedirectPath", () => {
  it.each([
    ["/assessments?page=2", "/assessments?page=2"],
    ["/users#top", "/users#top"],
    ["/apiary", "/apiary"],
    ["/users/../assessments", "/assessments"],
  ])("keeps the internal path %j as %j", (redirect, expected) => {
    expect(getSafeRedirectPath(redirect)).toBe(expected);
  });

  it.each([
    null,
    undefined,
    "",
    "users",
    "https://malicious-site.com",
    "//malicious-site.com",
    "/\\malicious-site.com",
    "/\t/malicious-site.com",
    "/\n/malicious-site.com",
    "/\r/malicious-site.com",
    "/\t\\malicious-site.com",
    "/.//malicious-site.com",
    "/a/..//malicious-site.com",
    "/%2e//malicious-site.com",
    "/./\\malicious-site.com",
    "/users/../..//malicious-site.com",
    "/api",
    "/api/auth/logout",
    "/API/auth/logout",
    "/login",
    "/Login?expired=1",
  ])("replaces %j with the home screen", (redirect) => {
    expect(getSafeRedirectPath(redirect)).toBe(HOME_ROUTE);
  });
});

const PIECES = [
  "/",
  "\\",
  ".",
  "..",
  "%2e",
  "%2f",
  "%5c",
  "\t",
  "\n",
  "evil.example.com",
  "@",
  ":",
  "users",
];
const PANEL_ORIGIN = "http://localhost:3000";

function* buildRedirectCandidates(maxPieces: number, prefix = "/"): Generator<string> {
  yield prefix;
  if (maxPieces === 0) return;
  for (const piece of PIECES) {
    yield* buildRedirectCandidates(maxPieces - 1, `${prefix}${piece}`);
  }
}

describe("getSafeRedirectPath against generated tricks", () => {
  it("always answers a path that stays on the panel", () => {
    let checkedCandidates = 0;
    for (const candidate of buildRedirectCandidates(4)) {
      const safePath = getSafeRedirectPath(candidate);
      const destination = new URL(safePath, PANEL_ORIGIN);
      expect(destination.origin, `${JSON.stringify(candidate)} -> ${safePath}`).toBe(
        PANEL_ORIGIN,
      );
      checkedCandidates += 1;
    }
    expect(checkedCandidates).toBeGreaterThan(30_000);
  });
});
