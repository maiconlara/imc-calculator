import axios from "axios";
import type { BackendApi } from "@/services";

export const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3333/api";

const BACKEND_TIMEOUT_MS = 10_000;

/**
 * Creates an API instance that calls the backend directly. Only server code uses
 * it, so the backend address and the tokens never reach the browser.
 *
 * @param accessToken - Bearer token of the current session, when there is one.
 * @param extraHeaders - Extra headers, such as the forwarded client IP.
 * @returns An axios instance pointing to the backend.
 */
export function createDirectBackendApi(
  accessToken?: string,
  extraHeaders: Record<string, string> = {},
): BackendApi {
  return axios.create({
    baseURL: BACKEND_URL,
    timeout: BACKEND_TIMEOUT_MS,
    headers: {
      ...extraHeaders,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
}
