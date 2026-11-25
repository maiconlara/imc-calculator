import type { NextRequest } from "next/server";

/**
 * Blocks state-changing requests sent from another site (CSRF), on top of the
 * `SameSite=Lax` session cookies.
 *
 * @param request - Incoming route handler request.
 * @returns `true` when the request comes from this same site.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

/**
 * Reads `TRUSTED_PROXY_COUNT`: how many reverse proxies stand in front of the panel
 * and append the visitor address to `X-Forwarded-For`.
 *
 * @param setting - Raw value, `process.env.TRUSTED_PROXY_COUNT` by default.
 * @returns The number of trusted proxies, 0 when the setting is empty.
 */
export function parseTrustedProxyCount(
  setting: string | undefined = process.env.TRUSTED_PROXY_COUNT,
): number {
  if (setting === undefined || setting.trim() === "") return 0;
  if (!/^\d+$/.test(setting.trim())) {
    throw new Error(
      `TRUSTED_PROXY_COUNT must be a whole number from 0, received "${setting}"`,
    );
  }
  return Number(setting.trim());
}

/**
 * Picks the visitor address the panel passes to the API on login, for the failed login
 * limit. Next.js keeps an `X-Forwarded-For` sent by the visitor, so the header is only
 * trusted at the position written by the last trusted proxy. Without proxies nothing is
 * forwarded, and the API sees the panel's own address.
 *
 * @param request - Incoming login request.
 * @param trustedProxyCount - Proxies in front of the panel.
 * @returns The header to send to the API, or no header.
 */
export function getForwardedIpHeaders(
  request: NextRequest,
  trustedProxyCount = parseTrustedProxyCount(),
): Record<string, string> {
  if (trustedProxyCount === 0) return {};
  const forwardedAddresses = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
  const visitorAddress = forwardedAddresses.at(-trustedProxyCount);
  return visitorAddress ? { "x-forwarded-for": visitorAddress } : {};
}
