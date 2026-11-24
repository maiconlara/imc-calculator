import { pino } from "pino";
import request from "supertest";
import { createApp } from "../src/app";
import { createContainer } from "../src/container";
import { createDataSource } from "../src/infra/database/data-source";

/**
 * Builds the real app over a fresh in-memory database with every migration applied.
 *
 * @param options - Origins the app accepts through CORS, none by default.
 * @returns The app, its data source and helpers for end-to-end tests.
 */
export async function createTestEnvironment(options: { allowedOrigins?: string[] } = {}) {
  const dataSource = createDataSource({ database: ":memory:" });
  await dataSource.initialize();
  await dataSource.runMigrations();

  const app = createApp(createContainer({ dataSource }), {
    logger: pino({ level: "silent" }),
    allowedOrigins: options.allowedOrigins ?? [],
    trustProxy: false,
  });

  return {
    app,
    dataSource,
    httpRequest: () => request(app),
    closeDatabase: async () => {
      if (dataSource.isInitialized) await dataSource.destroy();
    },
  };
}

export type TestEnvironment = Awaited<ReturnType<typeof createTestEnvironment>>;
