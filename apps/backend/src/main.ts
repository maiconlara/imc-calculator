import { loadEnv } from "./config/env";
import { createLogger } from "./infra/logger";
import { startServer } from "./server";

const env = loadEnv();
const logger = createLogger(env);

try {
  const runningServer = await startServer(env, logger);

  const shutdownGracefully = (signal: NodeJS.Signals) => {
    logger.info(`Received ${signal}, shutting down`);
    void runningServer.close().finally(() => process.exit(0));
  };
  process.once("SIGINT", shutdownGracefully);
  process.once("SIGTERM", shutdownGracefully);
} catch (startupError) {
  logger.fatal({ err: startupError }, "The API could not start");
  process.exitCode = 1;
}
