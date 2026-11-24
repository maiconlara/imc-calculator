import { pino, type Logger } from "pino";
import type { Env } from "../config/env";

export type { Logger };

/**
 * Creates the application logger, human readable in development and JSON elsewhere.
 *
 * @param env - Validated configuration.
 * @returns A pino logger instance.
 */
export function createLogger(env: Pick<Env, "NODE_ENV" | "LOG_LEVEL">): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "refreshToken",
    ],
    ...(env.NODE_ENV === "development"
      ? {
          transport: {
            target: "pino-pretty",
            options: { translateTime: "SYS:HH:MM:ss" },
          },
        }
      : {}),
  });
}
