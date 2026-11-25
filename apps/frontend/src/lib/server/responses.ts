import axios from "axios";
import { NextResponse } from "next/server";
import type { ApiErrorBody } from "@imc-calculator/shared";

/**
 * Passes an API error on to the browser as it came, or answers 502 when the API could
 * not be reached.
 *
 * @param error - Error thrown by the call to the API.
 * @returns The response for the browser.
 */
export function createApiErrorResponse(error: unknown): NextResponse {
  if (axios.isAxiosError(error) && error.response) {
    return NextResponse.json(error.response.data, { status: error.response.status });
  }
  return NextResponse.json(
    {
      message: "Não foi possível falar com a API. Tente de novo em instantes.",
    } satisfies ApiErrorBody,
    { status: 502 },
  );
}

export function createForbiddenOriginResponse(): NextResponse {
  return NextResponse.json({ message: "Origem não permitida." } satisfies ApiErrorBody, {
    status: 403,
  });
}
