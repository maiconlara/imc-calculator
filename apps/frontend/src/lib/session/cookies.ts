import type { SessionTokens } from "@imc-calculator/shared";

export const ACCESS_TOKEN_COOKIE = "imc_calculator_access";
export const REFRESH_TOKEN_COOKIE = "imc_calculator_refresh";

const RENEWAL_MARGIN_SECONDS = 30;

interface CookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}

export interface WritableCookies {
  set(name: string, value: string, options: CookieOptions): unknown;
  delete(name: string): unknown;
}

function secondsUntil(isoDate: string, now: number): number {
  return Math.max(0, Math.floor((new Date(isoDate).getTime() - now) / 1000));
}

/**
 * Stores the token pair in httpOnly cookies. Lifetimes use `maxAge`, so the
 * browser clock does not matter, and the access cookie expires a little before
 * the token itself to trigger the renewal in the proxy.
 *
 * @param cookies - Cookie store of the response being built.
 * @param tokens - Tokens returned by the API.
 * @param now - Current timestamp in milliseconds.
 */
export function writeSessionCookies(
  cookies: WritableCookies,
  tokens: SessionTokens,
  now = Date.now(),
): void {
  const sharedCookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
  cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    ...sharedCookieOptions,
    maxAge: Math.max(
      0,
      secondsUntil(tokens.accessTokenExpiresAt, now) - RENEWAL_MARGIN_SECONDS,
    ),
  });
  cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...sharedCookieOptions,
    maxAge: secondsUntil(tokens.refreshTokenExpiresAt, now),
  });
}

export function clearSessionCookies(cookies: WritableCookies): void {
  cookies.delete(ACCESS_TOKEN_COOKIE);
  cookies.delete(REFRESH_TOKEN_COOKIE);
}
