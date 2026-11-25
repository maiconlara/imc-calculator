import { describe, expect, it } from "vitest";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  writeSessionCookies,
  type WritableCookies,
} from "./cookies";

type CookieOptions = Parameters<WritableCookies["set"]>[2];

function createCookies() {
  const written = new Map<string, { value: string; options: CookieOptions }>();
  const deleted: string[] = [];
  return {
    written,
    deleted,
    set: (name: string, value: string, options: CookieOptions) =>
      written.set(name, { value, options }),
    delete: (name: string) => deleted.push(name),
  };
}

describe("writeSessionCookies", () => {
  const now = Date.parse("2026-11-19T12:00:00Z");

  it("stores the tokens in httpOnly cookies with a relative lifetime", () => {
    const cookies = createCookies();
    writeSessionCookies(
      cookies,
      {
        accessToken: "access",
        accessTokenExpiresAt: "2026-11-19T12:15:00Z",
        refreshToken: "refresh",
        refreshTokenExpiresAt: "2026-11-26T12:00:00Z",
      },
      now,
    );

    expect(cookies.written.get(ACCESS_TOKEN_COOKIE)).toEqual({
      value: "access",
      options: expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15 * 60 - 30,
      }),
    });
    expect(cookies.written.get(REFRESH_TOKEN_COOKIE)?.options).toMatchObject({
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
    });
  });

  it("never stores a negative lifetime", () => {
    const cookies = createCookies();
    writeSessionCookies(
      cookies,
      {
        accessToken: "a",
        accessTokenExpiresAt: "2026-11-19T11:00:00Z",
        refreshToken: "r",
        refreshTokenExpiresAt: "2026-11-19T11:00:00Z",
      },
      now,
    );
    expect(cookies.written.get(ACCESS_TOKEN_COOKIE)?.options.maxAge).toBe(0);
    expect(cookies.written.get(REFRESH_TOKEN_COOKIE)?.options.maxAge).toBe(0);
  });
});

describe("clearSessionCookies", () => {
  it("deletes both cookies", () => {
    const cookies = createCookies();
    clearSessionCookies(cookies);
    expect(cookies.deleted).toEqual([ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE]);
  });
});
