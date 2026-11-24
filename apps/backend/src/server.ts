import type { Server } from "node:http";
import { createApp } from "./app";
import type { Env } from "./config/env";
import { createContainer, type ContainerSettings } from "./container";
import { createDataSource } from "./infra/database/data-source";
import type { Logger } from "./infra/logger";

export interface RunningServer {
  port: number;
  close: () => Promise<void>;
}

function waitUntilListening(httpServer: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.once("listening", () => resolve());
    httpServer.once("error", reject);
  });
}

/**
 * Opens the database and starts listening. Fails instead of reporting a start that did
 * not happen, when the database cannot be opened or the port is taken.
 *
 * @param env - Validated configuration.
 * @param logger - Application logger.
 * @returns The port in use and a function that stops the server and closes the database.
 */
export async function startServer(
  env: Pick<Env, "DB_DATABASE" | "PORT" | "CORS_ORIGIN" | "TRUST_PROXY"> &
    ContainerSettings,
  logger: Logger,
): Promise<RunningServer> {
  const dataSource = createDataSource({ database: env.DB_DATABASE });
  await dataSource.initialize();

  try {
    if (await dataSource.showMigrations()) {
      logger.warn(
        "There are pending migrations. Run `pnpm db:migrate` before using the API.",
      );
    }

    const app = createApp(createContainer({ dataSource, env }), {
      logger,
      allowedOrigins: env.CORS_ORIGIN,
      trustProxy: env.TRUST_PROXY,
    });
    const httpServer = app.listen(env.PORT);
    await waitUntilListening(httpServer);

    const listeningAddress = httpServer.address();
    const port =
      typeof listeningAddress === "object" && listeningAddress !== null
        ? listeningAddress.port
        : env.PORT;
    logger.info(`API listening on http://localhost:${port}/api`);

    return {
      port,
      close: () =>
        new Promise<void>((resolve) => {
          httpServer.close(() => {
            void dataSource.destroy().finally(resolve);
          });
        }),
    };
  } catch (startupError) {
    await dataSource.destroy();
    throw startupError;
  }
}
