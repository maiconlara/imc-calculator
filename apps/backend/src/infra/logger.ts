import { pino, type Logger } from "pino";
import type { Env } from "../config/env";

export type { Logger };

/**
 * Says whether the logs can be human readable: only in development, and only when
 * `pino-pretty` is installed. It is a development dependency, so the production image
 * does not have it, even for a command run there with `NODE_ENV=development`.
 *
 * @param nodeEnv - Current environment.
 * @param resolveModule - Finds a module, `import.meta.resolve` by default.
 * @returns `true` when the logs should go through `pino-pretty`.
 */
export function canPrettyPrintLogs(
  nodeEnv: Env["NODE_ENV"],
  resolveModule: (moduleName: string) => string = (moduleName) =>
    import.meta.resolve(moduleName),
): boolean {
  if (nodeEnv !== "development") return false;
  try {
    resolveModule("pino-pretty");
    return true;
  } catch {
    return false;
  }
}

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
    ...(canPrettyPrintLogs(env.NODE_ENV)
      ? {
          transport: {
            target: "pino-pretty",
            options: { translateTime: "SYS:HH:MM:ss" },
          },
        }
      : {}),
  });
}
