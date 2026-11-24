import { loadEnv } from "../../../config/env";
import { createLogger } from "../../logger";
import { createDataSource } from "../data-source";

const env = loadEnv();
const logger = createLogger(env);
const dataSource = await createDataSource({ database: env.DB_DATABASE }).initialize();

try {
  const appliedMigrations = await dataSource.runMigrations({ transaction: "each" });
  logger.info(
    appliedMigrations.length > 0
      ? `Migrations applied: ${appliedMigrations.map((migration) => migration.name).join(", ")}`
      : "The database is already up to date.",
  );
} finally {
  await dataSource.destroy();
}
