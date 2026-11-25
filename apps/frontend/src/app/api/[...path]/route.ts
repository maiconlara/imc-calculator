import { NextResponse, type NextRequest } from "next/server";
import type { ApiErrorBody, LoginResponse } from "@imc-calculator/shared";
import { createDirectBackendApi } from "@/lib/server/backend";
import { isForwardablePath } from "@/lib/server/forwarding";
import { isSameOrigin } from "@/lib/server/origin";
import {
  createApiErrorResponse,
  createForbiddenOriginResponse,
} from "@/lib/server/responses";
import { refreshSession } from "@/lib/server/session-refresh";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  writeSessionCookies,
} from "@/lib/session/cookies";

interface ForwardRouteContext {
  params: Promise<{ path: string[] }>;
}

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD", "DELETE"]);

/**
 * Forwards browser calls to the backend, adding the session token kept in the
 * httpOnly cookie. Session routes (login, refresh, logout) are not exposed here,
 * only `auth/me`.
 *
 * @param request - Same-origin request from the browser.
 * @param routeContext - Dynamic route params with the backend path.
 * @returns The backend answer, with renewed cookies when the token had to be refreshed.
 */
async function forwardToBackend(
  request: NextRequest,
  routeContext: ForwardRouteContext,
): Promise<NextResponse> {
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return createForbiddenOriginResponse();
  }

  const { path: backendPathSegments } = await routeContext.params;
  if (!isForwardablePath(backendPathSegments)) {
    return NextResponse.json({ message: "Rota não encontrada." } satisfies ApiErrorBody, {
      status: 404,
    });
  }

  const backendPath = `/${backendPathSegments.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  const requestBody = METHODS_WITHOUT_BODY.has(request.method)
    ? undefined
    : await request.text();
  const sendToBackend = (accessToken: string | undefined) =>
    createDirectBackendApi(accessToken).request({
      url: backendPath,
      method: request.method,
      data: requestBody || undefined,
      headers: requestBody ? { "Content-Type": "application/json" } : {},
      validateStatus: () => true,
    });

  try {
    let backendResponse = await sendToBackend(
      request.cookies.get(ACCESS_TOKEN_COOKIE)?.value,
    );
    let renewedSession: LoginResponse | null = null;

    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (backendResponse.status === 401 && refreshToken) {
      renewedSession = await refreshSession(refreshToken);
      if (renewedSession) {
        backendResponse = await sendToBackend(renewedSession.accessToken);
      }
    }

    const browserResponse =
      backendResponse.status === 204
        ? new NextResponse(null, { status: 204 })
        : NextResponse.json(backendResponse.data, { status: backendResponse.status });

    if (renewedSession) writeSessionCookies(browserResponse.cookies, renewedSession);
    else if (backendResponse.status === 401) clearSessionCookies(browserResponse.cookies);
    return browserResponse;
  } catch (error) {
    return createApiErrorResponse(error);
  }
}

export {
  forwardToBackend as DELETE,
  forwardToBackend as GET,
  forwardToBackend as PATCH,
  forwardToBackend as POST,
  forwardToBackend as PUT,
};
