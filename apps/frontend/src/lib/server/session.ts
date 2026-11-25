import "server-only";
import axios from "axios";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { SessionUser } from "@imc-calculator/shared";
import { permissions } from "@/lib/permissions";
import { HOME_ROUTE, SESSION_EXPIRED_ROUTE, type PanelScreen } from "@/lib/routes";
import { getScreenTitle } from "@/lib/screen-titles";
import { ACCESS_TOKEN_COOKIE } from "@/lib/session/cookies";
import { SESSION_RENEWAL_FAILED_HEADER } from "@/lib/session/session-renewal";
import { createDirectBackendApi } from "./backend";

/**
 * Reads the signed in user from the API once per request. The API checks the user in
 * the database, so a deleted or deactivated account is detected right away.
 *
 * @returns The session user, or `null` when there is no valid session.
 * @throws When the API fails, also while `proxy.ts` was renewing the session, so the
 *         page shows its error screen instead of ending the session.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!accessToken) {
    if ((await headers()).get(SESSION_RENEWAL_FAILED_HEADER)) {
      throw new Error("The API failed while the session was being renewed");
    }
    return null;
  }
  try {
    const { data: sessionUser } =
      await createDirectBackendApi(accessToken).get<SessionUser>("/auth/me");
    return sessionUser;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null;
    throw error;
  }
});

/**
 * Guards a panel layout or page: without a session it goes to the login screen, and a
 * role that `lib/permissions.ts` keeps out of the screen goes to the home screen.
 *
 * @param screen - Screen being opened; omitted by the panel layout.
 * @returns The session user.
 */
export async function requireSessionUser(screen?: PanelScreen): Promise<SessionUser> {
  const sessionUser = await getSessionUser();
  if (!sessionUser) redirect(SESSION_EXPIRED_ROUTE);
  if (screen && !permissions.canOpenScreen(sessionUser.role, screen))
    redirect(HOME_ROUTE);
  return sessionUser;
}

/**
 * Names the browser tab after the screen, as the signed in role sees it.
 *
 * @param screen - Panel screen.
 * @returns The page metadata.
 */
export async function getScreenMetadata(screen: PanelScreen): Promise<Metadata> {
  const sessionUser = await getSessionUser();
  return sessionUser ? { title: getScreenTitle(screen, sessionUser.role) } : {};
}
