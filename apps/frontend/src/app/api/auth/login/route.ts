import { NextResponse, type NextRequest } from "next/server";
import {
  loginSchema,
  type ApiErrorBody,
  type LoginResponse,
} from "@imc-calculator/shared";
import { createDirectBackendApi } from "@/lib/server/backend";
import { getForwardedIpHeaders, isSameOrigin } from "@/lib/server/origin";
import {
  createApiErrorResponse,
  createForbiddenOriginResponse,
} from "@/lib/server/responses";
import { writeSessionCookies } from "@/lib/session/cookies";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return createForbiddenOriginResponse();

  const loginCredentials = loginSchema.safeParse(await request.json().catch(() => null));
  if (!loginCredentials.success) {
    return NextResponse.json(
      {
        message: "Informe usuário e senha.",
        issues: loginCredentials.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      } satisfies ApiErrorBody,
      { status: 400 },
    );
  }

  const forwardedIpHeaders = getForwardedIpHeaders(request);
  try {
    const { data: loginResponse } = await createDirectBackendApi(
      undefined,
      forwardedIpHeaders,
    ).post<LoginResponse>("/auth/login", loginCredentials.data);
    const browserResponse = NextResponse.json({ user: loginResponse.user });
    writeSessionCookies(browserResponse.cookies, loginResponse);
    return browserResponse;
  } catch (error) {
    return createApiErrorResponse(error);
  }
}
