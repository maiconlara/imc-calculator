import { loadSeedEnv } from "../../../config/env";
import { createLogger } from "../../logger";
import { BcryptPasswordHasher } from "../../security/bcrypt-password-hasher";
import { createDataSource } from "../data-source";
import { DEMO_PASSWORDS, seedDemoData } from "../demo-data";

const env = loadSeedEnv();
const logger = createLogger(env);

if (env.NODE_ENV === "production") {
  logger.error(
    "The seed deletes every row, so it does not run with NODE_ENV=production.",
  );
  process.exitCode = 1;
} else {
  const dataSource = await createDataSource({ database: env.DB_DATABASE }).initialize();

  try {
    await dataSource.runMigrations({ transaction: "each" });
    const seededCounts = await seedDemoData(
      dataSource,
      new BcryptPasswordHasher(env.BCRYPT_ROUNDS),
      new Date(),
    );
    logger.info(
      `Database seeded with ${seededCounts.userCount} users and ${seededCounts.assessmentCount} assessments.`,
    );
    logger.info(
      `Logins: admin / ${DEMO_PASSWORDS.admin}, carla.mendes or rafael.souza / ${DEMO_PASSWORDS.teacher}, pedro.costa and the other students / ${DEMO_PASSWORDS.student}`,
    );
  } finally {
    await dataSource.destroy();
  }
}
