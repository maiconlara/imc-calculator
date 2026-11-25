const DOT_SEGMENTS = new Set([".", ".."]);

/**
 * Tells whether the browser may reach a backend path through the panel. The API
 * matches routes in any letter case, so the check does too. Session routes stay with
 * the panel's own handlers, except `auth/me`, and dot segments are refused because
 * the HTTP client would resolve them into another route.
 *
 * @param backendPathSegments - Decoded path segments after `/api`.
 * @returns `true` when the path may be forwarded.
 */
export function isForwardablePath(backendPathSegments: string[]): boolean {
  const normalizedSegments = backendPathSegments.map((segment) => segment.toLowerCase());
  if (normalizedSegments.some((segment) => segment === "" || DOT_SEGMENTS.has(segment))) {
    return false;
  }
  return normalizedSegments[0] !== "auth" || normalizedSegments.join("/") === "auth/me";
}
