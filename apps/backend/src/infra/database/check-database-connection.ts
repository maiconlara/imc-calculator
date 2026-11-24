import type { DataSource } from "typeorm";

/**
 * Runs the cheapest possible query to confirm the database answers.
 *
 * @param dataSource - Open data source.
 */
export async function checkDatabaseConnection(dataSource: DataSource): Promise<void> {
  await dataSource.query("SELECT 1");
}
