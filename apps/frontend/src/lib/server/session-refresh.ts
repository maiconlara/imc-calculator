import axios from "axios";
import type { LoginResponse } from "@imc-calculator/shared";
import { createDirectBackendApi } from "./backend";

const REFRESH_RESULT_REUSE_MS = 10_000;

const recentRefreshes = new Map<string, Promise<LoginResponse | null>>();

async function requestSessionRefresh(
  refreshToken: string,
): Promise<LoginResponse | null> {
  try {
    const { data: renewedSession } = await createDirectBackendApi().post<LoginResponse>(
      "/auth/refresh",
      { refreshToken },
    );
    return renewedSession;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response && error.response.status < 500) {
      return null;
    }
    throw error;
  }
}

/**
 * Renews the session with the refresh token. Concurrent calls with the same token
 * (parallel requests after the access cookie expired) share one API call, and the
 * answer is reused for a few seconds.
 *
 * @param refreshToken - Current refresh token from the cookie.
 * @returns The new tokens, or `null` when the session can no longer be renewed.
 */
export function refreshSession(refreshToken: string): Promise<LoginResponse | null> {
  const pendingRefresh = recentRefreshes.get(refreshToken);
  if (pendingRefresh) return pendingRefresh;

  const sessionRefresh = requestSessionRefresh(refreshToken);
  recentRefreshes.set(refreshToken, sessionRefresh);
  sessionRefresh.then(
    () => setTimeout(() => recentRefreshes.delete(refreshToken), REFRESH_RESULT_REUSE_MS),
    () => recentRefreshes.delete(refreshToken),
  );
  return sessionRefresh;
}
