import axios from "axios";
import type { ApiErrorBody } from "@imc-calculator/shared";

const MAX_QUERY_RETRIES = 2;

/**
 * Turns any request failure into a message the user can read.
 *
 * @param error - Error thrown by axios or by the code around it.
 * @param fallback - Message used when the error carries none.
 * @returns The message shown in toasts and alerts.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Algo deu errado. Tente de novo.",
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    if (!error.response)
      return "Não foi possível falar com o servidor. Confira sua conexão.";
    return error.response.data?.message ?? fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
}

export function getErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/**
 * Retries a failed query only when trying again can help: network failures and server
 * errors, never an answer the API gave on purpose (400 to 499).
 *
 * @param failureCount - Failures so far.
 * @param error - Last error.
 * @returns `true` to try again.
 */
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status !== undefined && status < 500) return false;
  return failureCount < MAX_QUERY_RETRIES;
}
