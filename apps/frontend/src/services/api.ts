import axios, { type AxiosInstance } from "axios";
import { SESSION_EXPIRED_ROUTE } from "@/lib/routes";

export type BackendApi = AxiosInstance;

export interface RequestOptions {
  signal?: AbortSignal;
  /**
   * API instance that calls the backend directly with the session token, passed by
   * server components. Without it the request goes through `proxiedBackendApi`.
   */
  directBackendApi?: BackendApi;
}

const PROXIED_REQUEST_TIMEOUT_MS = 15_000;

/**
 * API instance used by the hooks. It calls `/api` on the Next.js server, which adds
 * the session token from the httpOnly cookie and forwards the request to the
 * backend. A 401 sends the user back to the login screen.
 */
export const proxiedBackendApi: BackendApi = axios.create({
  baseURL: "/api",
  timeout: PROXIED_REQUEST_TIMEOUT_MS,
});

proxiedBackendApi.interceptors.response.use(undefined, (error: unknown) => {
  if (
    axios.isAxiosError(error) &&
    error.response?.status === 401 &&
    typeof window !== "undefined"
  ) {
    window.location.assign(SESSION_EXPIRED_ROUTE);
  }
  return Promise.reject(error);
});
