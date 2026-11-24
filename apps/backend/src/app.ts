import cors from "cors";
import express, { Router, type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { Container } from "./container";
import type { Logger } from "./infra/logger";
import { AuthController } from "./modules/auth/auth.controller";
import { createAuthRouter, createLoginRateLimiter } from "./modules/auth/auth.routes";
import { UserController } from "./modules/users/user.controller";
import { createUsersRouter } from "./modules/users/user.routes";
import { createAuthenticationMiddleware } from "./shared/http/authentication";
import { handleErrors, handleRouteNotFound } from "./shared/http/error-handler";

export interface AppOptions {
  logger: Logger;
  allowedOrigins: string[];
  trustProxy: boolean | number | string;
}

const HEALTH_ROUTE = "/api/health";

export function createApp(container: Container, appOptions: AppOptions): Express {
  const { services } = container;
  const app = express();

  app.set("trust proxy", appOptions.trustProxy);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: appOptions.allowedOrigins }));
  app.use(
    pinoHttp({
      logger: appOptions.logger,
      autoLogging: { ignore: (req) => req.url === HEALTH_ROUTE },
    }),
  );
  app.use(express.json({ limit: "10kb" }));

  const authenticateRequest = createAuthenticationMiddleware(services.authService);
  const apiRouter = Router();

  apiRouter.get("/health", async (_req, res) => {
    await container.checkDatabaseHealth();
    res.json({ status: "ok" });
  });
  apiRouter.use(
    "/auth",
    createAuthRouter({
      controller: new AuthController(services.authService),
      authenticateRequest,
      loginRateLimiter: createLoginRateLimiter(),
    }),
  );
  apiRouter.use(
    "/users",
    createUsersRouter({
      controller: new UserController(services.userService),
      authenticateRequest,
    }),
  );

  app.use("/api", apiRouter);
  app.use(handleRouteNotFound);
  app.use(handleErrors);
  return app;
}
