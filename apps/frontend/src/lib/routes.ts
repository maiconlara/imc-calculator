export const PANEL_SCREENS = ["dashboard", "assessments", "users"] as const;

export type PanelScreen = (typeof PANEL_SCREENS)[number];

export const PANEL_ROUTES: Record<PanelScreen, string> = {
  dashboard: "/dashboard",
  assessments: "/assessments",
  users: "/users",
};

export const HOME_ROUTE = PANEL_ROUTES.dashboard;
export const LOGIN_ROUTE = "/login";
export const SESSION_EXPIRED_ROUTE = "/api/auth/session-expired";

const PANEL_PLACEHOLDER_ORIGIN = "http://panel.invalid";

/**
 * Keeps only internal paths as the post-login destination, so a crafted link
 * cannot send the user to another site. The value is resolved the way the browser
 * would resolve it, which also catches tricks such as a tab or a backslash after the
 * first slash, and the resolved path must still stay on the panel, since dot segments
 * can collapse into a `//host` path.
 *
 * @param redirect - Value received in the `redirect` query parameter.
 * @returns A safe internal path.
 */
export function getSafeRedirectPath(redirect: string | null | undefined): string {
  if (!redirect?.startsWith("/")) return HOME_ROUTE;

  let resolvedRedirect: URL;
  try {
    resolvedRedirect = new URL(redirect, PANEL_PLACEHOLDER_ORIGIN);
  } catch {
    return HOME_ROUTE;
  }
  if (resolvedRedirect.origin !== PANEL_PLACEHOLDER_ORIGIN) return HOME_ROUTE;

  const { pathname, search, hash } = resolvedRedirect;
  const safePath = `${pathname}${search}${hash}`;
  if (
    pathname.startsWith("//") ||
    new URL(safePath, PANEL_PLACEHOLDER_ORIGIN).origin !== PANEL_PLACEHOLDER_ORIGIN
  ) {
    return HOME_ROUTE;
  }

  const lowercasePathname = pathname.toLowerCase();
  if (
    lowercasePathname === "/api" ||
    lowercasePathname.startsWith("/api/") ||
    lowercasePathname.startsWith(LOGIN_ROUTE)
  ) {
    return HOME_ROUTE;
  }
  return safePath;
}
