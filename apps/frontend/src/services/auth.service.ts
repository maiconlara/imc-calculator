import axios from "axios";
import type { LoginData, SessionUser } from "@imc-calculator/shared";

/**
 * Opens the session. Uses a bare axios call because a wrong password answers 401,
 * which must not trigger the session expired redirect of `proxiedBackendApi`.
 *
 * @param credentials - Username and password typed on the login screen.
 * @returns The signed in user.
 */
export async function login(credentials: LoginData): Promise<SessionUser> {
  const { data: loginResult } = await axios.post<{ user: SessionUser }>(
    "/api/auth/login",
    credentials,
  );
  return loginResult.user;
}

export async function logout(): Promise<void> {
  await axios.post("/api/auth/logout");
}
