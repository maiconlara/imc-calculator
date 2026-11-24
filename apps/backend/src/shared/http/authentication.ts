import type { Request, RequestHandler } from "express";
import type { Role } from "@imc-calculator/shared";
import type { AuthService } from "../../modules/auth/auth.service";
import type { AuthenticatedUser } from "../../modules/users/user";
import { ForbiddenError, UnauthorizedError } from "../errors";

const BEARER_AUTHORIZATION_PATTERN = /^Bearer\s+(\S+)$/i;

/**
 * Creates the `authenticateRequest` middleware, which loads the user of the bearer
 * token into `req.user` and answers 401 when the token or the user is not valid.
 *
 * @param authService - Resolves the user of an access token.
 * @returns The authentication middleware.
 */
export function createAuthenticationMiddleware(
  authService: Pick<AuthService, "identifyUserByAccessToken">,
): RequestHandler {
  return async (req, _res, next) => {
    const accessToken = BEARER_AUTHORIZATION_PATTERN.exec(
      req.headers.authorization ?? "",
    )?.[1];
    if (!accessToken) throw new UnauthorizedError();
    req.user = await authService.identifyUserByAccessToken(accessToken);
    next();
  };
}

/**
 * Blocks the route for every role outside the list. Runs after `authenticateRequest`.
 *
 * @param allowedRoles - Roles that may use the route.
 * @returns The authorization middleware.
 */
export function requireRole(...allowedRoles: [Role, ...Role[]]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}

export function getAuthenticatedUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}
