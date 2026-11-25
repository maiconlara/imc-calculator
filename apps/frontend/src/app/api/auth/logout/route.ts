import { NextResponse, type NextRequest } from "next/server";
import { createDirectBackendApi } from "@/lib/server/backend";
import { isSameOrigin } from "@/lib/server/origin";
import { createForbiddenOriginResponse } from "@/lib/server/responses";
import { REFRESH_TOKEN_COOKIE, clearSessionCookies } from "@/lib/session/cookies";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) return createForbiddenOriginResponse();

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    await createDirectBackendApi()
      .post("/auth/logout", { refreshToken })
      .catch(() => undefined);
  }

  const browserResponse = new NextResponse(null, { status: 204 });
  clearSessionCookies(browserResponse.cookies);
  return browserResponse;
}
