import { DataSource } from "typeorm";
import { registerFoldTextFunction } from "./fold-text";
import { CreateInitialTables1795046400000 } from "./migrations/1795046400000-create-initial-tables";
import { AssessmentSchema } from "./schemas/assessment.schema";
import { UserTokenSchema } from "./schemas/user-token.schema";
import { UserSchema } from "./schemas/user.schema";

export interface CreateDataSourceOptions {
  database: string;
  logging?: boolean;
}

export function createDataSource({
  database,
  logging = false,
}: CreateDataSourceOptions): DataSource {
  return new DataSource({
    type: "better-sqlite3",
    database,
    enableWAL: database !== ":memory:",
    entities: [UserSchema, UserTokenSchema, AssessmentSchema],
    migrations: [CreateInitialTables1795046400000],
    migrationsTableName: "migrations",
    synchronize: false,
    logging,
    prepareDatabase: registerFoldTextFunction,
  });
}
