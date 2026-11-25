import { NextResponse, type NextRequest } from "next/server";
import { LOGIN_ROUTE } from "@/lib/routes";
import { clearSessionCookies } from "@/lib/session/cookies";

export function GET(request: NextRequest): NextResponse {
  const browserResponse = NextResponse.redirect(
    new URL(`${LOGIN_ROUTE}?expired=1`, request.url),
  );
  clearSessionCookies(browserResponse.cookies);
  return browserResponse;
}
