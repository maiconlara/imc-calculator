import type { DataSource } from "typeorm";
import { checkDatabaseConnection } from "./infra/database/check-database-connection";

export interface Container {
  checkDatabaseHealth: () => Promise<void>;
}

/**
 * Composition root: the only place that knows which implementation backs each port.
 *
 * @param dependencies - Open data source.
 * @returns What the HTTP layer needs.
 */
export function createContainer(dependencies: { dataSource: DataSource }): Container {
  const { dataSource } = dependencies;

  return {
    checkDatabaseHealth: () => checkDatabaseConnection(dataSource),
  };
}
