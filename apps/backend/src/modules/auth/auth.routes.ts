import { Router, type RequestHandler } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { loginSchema } from "@imc-calculator/shared";
import { TooManyRequestsError } from "../../shared/errors";
import type { AuthController } from "./auth.controller";

const FAILED_LOGIN_LIMIT = 10;
const FAILED_LOGIN_WINDOW_MS = 10 * 60 * 1000;

/**
 * Limits failed logins per client IP and username, so the panel server (which calls
 * the API for every visitor) does not block unrelated people.
 *
 * @returns The rate limit middleware of the login route.
 */
export function createLoginRateLimiter(): RequestHandler {
  return rateLimit({
    windowMs: FAILED_LOGIN_WINDOW_MS,
    limit: FAILED_LOGIN_LIMIT,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => {
      const username = loginSchema.shape.username.safeParse(req.body?.username).data;
      return `${ipKeyGenerator(req.ip ?? "")}:${username ?? ""}`;
    },
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsError(
          "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.",
        ),
      );
    },
  });
}

export function createAuthRouter(dependencies: {
  controller: AuthController;
  authenticateRequest: RequestHandler;
  loginRateLimiter: RequestHandler;
}): Router {
  const { controller } = dependencies;
  const router = Router();
  router.post("/login", dependencies.loginRateLimiter, controller.login);
  router.post("/refresh", controller.refreshSession);
  router.post("/logout", controller.logout);
  router.get("/me", dependencies.authenticateRequest, controller.getSessionUser);
  return router;
}
