import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDataSource } from "../src/infra/database/data-source";
import { AssessmentSchema } from "../src/infra/database/schemas/assessment.schema";
import { UserSchema } from "../src/infra/database/schemas/user.schema";

const SEED_SCRIPT = fileURLToPath(
  new URL("../src/infra/database/cli/seed.ts", import.meta.url),
);
const TSX_LOADER = import.meta.resolve("tsx");

let workingDirectory: string;
let databasePath: string;

beforeEach(() => {
  workingDirectory = mkdtempSync(join(tmpdir(), "imc-seed-"));
  databasePath = join(workingDirectory, "seed.sqlite");
});

afterEach(() => {
  rmSync(workingDirectory, { recursive: true, force: true });
});

function runSeedCommand(nodeEnv: string) {
  const environmentWithoutApiSecret = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => name !== "JWT_ACCESS_SECRET"),
  );
  return spawnSync(process.execPath, ["--import", TSX_LOADER, SEED_SCRIPT], {
    cwd: workingDirectory,
    env: {
      ...environmentWithoutApiSecret,
      NODE_ENV: nodeEnv,
      LOG_LEVEL: "info",
      BCRYPT_ROUNDS: "4",
      DB_DATABASE: databasePath,
    },
    encoding: "utf8",
  });
}

describe("pnpm db:seed", { timeout: 20_000 }, () => {
  it("refuses to run in production, without touching the database", () => {
    const seedRun = runSeedCommand("production");

    expect(seedRun.status).toBe(1);
    expect(seedRun.stdout).toContain("does not run with NODE_ENV=production");
    expect(existsSync(databasePath)).toBe(false);
  });

  it("migrates and seeds the database without the API secrets, and prints the logins", async () => {
    const seedRun = runSeedCommand("test");

    expect(seedRun.status).toBe(0);
    expect(seedRun.stdout).toContain("Database seeded with 14 users and 54 assessments.");
    expect(seedRun.stdout).toContain("admin / admin123");

    const dataSource = await createDataSource({ database: databasePath }).initialize();
    try {
      expect(await dataSource.getRepository(UserSchema).count()).toBe(14);
      expect(await dataSource.getRepository(AssessmentSchema).count()).toBe(54);
    } finally {
      await dataSource.destroy();
    }
  });
});
