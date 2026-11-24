import { MigrationExecutor } from "typeorm";
import { loadEnv } from "../../../config/env";
import { createLogger } from "../../logger";
import { createDataSource } from "../data-source";

const env = loadEnv();
const logger = createLogger(env);
const dataSource = await createDataSource({ database: env.DB_DATABASE }).initialize();

try {
  const executedMigrations = await new MigrationExecutor(
    dataSource,
  ).getExecutedMigrations();
  const lastExecutedMigration = executedMigrations[0];

  if (lastExecutedMigration) {
    await dataSource.undoLastMigration({ transaction: "each" });
    logger.info(`Migration reverted: ${lastExecutedMigration.name}`);
  } else {
    logger.info("There is no applied migration to revert.");
  }
} finally {
  await dataSource.destroy();
}
