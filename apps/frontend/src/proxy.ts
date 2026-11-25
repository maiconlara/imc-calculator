import { NextResponse, type NextRequest } from "next/server";
import type { ApiErrorBody, LoginResponse } from "@imc-calculator/shared";
import { LOGIN_ROUTE } from "@/lib/routes";
import { createApiErrorResponse } from "@/lib/server/responses";
import { refreshSession } from "@/lib/server/session-refresh";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearSessionCookies,
  writeSessionCookies,
} from "@/lib/session/cookies";
import { SESSION_RENEWAL_FAILED_HEADER } from "@/lib/session/session-renewal";

function isPublicRoute(pathname: string): boolean {
  return pathname === LOGIN_ROUTE || pathname.startsWith("/api/auth/");
}

function respondWithoutSession(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const sessionlessResponse = pathname.startsWith("/api/")
    ? NextResponse.json(
        { message: "Sessão expirada. Entre novamente." } satisfies ApiErrorBody,
        { status: 401 },
      )
    : NextResponse.redirect(
        new URL(
          pathname === "/"
            ? LOGIN_ROUTE
            : `${LOGIN_ROUTE}?redirect=${encodeURIComponent(pathname + search)}`,
          request.url,
        ),
      );
  clearSessionCookies(sessionlessResponse.cookies);
  return sessionlessResponse;
}

function respondWithUnavailableApi(request: NextRequest, error: unknown): NextResponse {
  if (request.nextUrl.pathname.startsWith("/api/")) return createApiErrorResponse(error);
  request.headers.set(SESSION_RENEWAL_FAILED_HEADER, "1");
  return NextResponse.next({ request: { headers: request.headers } });
}

/**
 * Guards every page and API call. When only the refresh cookie is left (the access
 * cookie expired), it renews the session before the request reaches the page, so
 * server components always see a valid token. When the API fails during the renewal,
 * the refresh cookie is kept: API calls get a 502 and pages show their error screen.
 *
 * @param request - Incoming request.
 * @returns The response that continues, redirects or rejects the request.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (isPublicRoute(request.nextUrl.pathname)) return NextResponse.next();
  if (request.cookies.has(ACCESS_TOKEN_COOKIE)) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return respondWithoutSession(request);

  let renewedSession: LoginResponse | null;
  try {
    renewedSession = await refreshSession(refreshToken);
  } catch (renewalError) {
    return respondWithUnavailableApi(request, renewalError);
  }
  if (!renewedSession) return respondWithoutSession(request);

  request.cookies.set(ACCESS_TOKEN_COOKIE, renewedSession.accessToken);
  request.cookies.set(REFRESH_TOKEN_COOKIE, renewedSession.refreshToken);
  const responseWithRenewedSession = NextResponse.next({
    request: { headers: request.headers },
  });
  writeSessionCookies(responseWithRenewedSession.cookies, renewedSession);
  return responseWithRenewedSession;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
