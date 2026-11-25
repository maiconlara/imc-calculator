import { existsSync } from "node:fs";
import { isIP } from "node:net";
import { z } from "zod";

const TRUST_PROXY_PRESETS = new Set(["loopback", "linklocal", "uniquelocal"]);

const MAX_PREFIX_LENGTH_BY_IP_VERSION: Record<number, number> = { 4: 32, 6: 128 };

const SAMPLE_JWT_ACCESS_SECRET = "change-this-development-secret-to-a-random-one";

const JWT_ACCESS_SECRET_MIN_LENGTH = 32;

function isTrustedProxyEntry(entry: string): boolean {
  if (TRUST_PROXY_PRESETS.has(entry)) return true;
  const [address = "", prefixLength, ...extraParts] = entry.split("/");
  const maxPrefixLength = MAX_PREFIX_LENGTH_BY_IP_VERSION[isIP(address)];
  if (extraParts.length > 0 || maxPrefixLength === undefined) return false;
  if (prefixLength === undefined) return true;
  return /^\d{1,3}$/.test(prefixLength) && Number(prefixLength) <= maxPrefixLength;
}

/**
 * Translates the `TRUST_PROXY` setting into the value Express expects.
 *
 * @param trustProxySetting - `true`, `false`, a hop count, or a comma separated list
 *                            of addresses, subnets and the Express presets.
 * @returns The value for the `trust proxy` setting, or `null` when it is invalid.
 */
export function parseTrustProxy(
  trustProxySetting: string,
): boolean | number | string | null {
  const setting = trustProxySetting.trim();
  if (setting === "true") return true;
  if (setting === "false") return false;
  if (/^\d+$/.test(setting)) return Number(setting);
  const entries = setting.split(",").map((entry) => entry.trim());
  return entries.every(isTrustedProxyEntry) ? entries.join(", ") : null;
}

const migrationEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  DB_DATABASE: z.string().min(1).default("database.sqlite"),
});

const seedEnvSchema = migrationEnvSchema.extend({
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

const envSchema = seedEnvSchema
  .extend({
    PORT: z.coerce.number().int().min(0).max(65535).default(3333),
    CORS_ORIGIN: z
      .string()
      .default("http://localhost:3000")
      .transform((commaSeparatedOrigins) =>
        commaSeparatedOrigins
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),
    TRUST_PROXY: z
      .string()
      .default("loopback")
      .transform((trustProxySetting, context) => {
        const trustProxy = parseTrustProxy(trustProxySetting);
        if (trustProxy === null) {
          context.addIssue({
            code: "custom",
            message:
              "Use true, false, a hop count, or addresses, subnets, loopback, linklocal or uniquelocal separated by commas",
          });
          return z.NEVER;
        }
        return trustProxy;
      }),
    JWT_ACCESS_SECRET: z
      .string({
        error: `Set a random secret of at least ${JWT_ACCESS_SECRET_MIN_LENGTH} characters`,
      })
      .min(
        JWT_ACCESS_SECRET_MIN_LENGTH,
        `Use a secret of at least ${JWT_ACCESS_SECRET_MIN_LENGTH} characters`,
      ),
    JWT_ACCESS_TTL_MINUTES: z.coerce.number().int().min(1).max(1440).default(15),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  })
  .refine(
    (env) =>
      env.NODE_ENV !== "production" || env.JWT_ACCESS_SECRET !== SAMPLE_JWT_ACCESS_SECRET,
    {
      message: "Replace the sample secret of .env.example with your own in production",
      path: ["JWT_ACCESS_SECRET"],
    },
  );

export type Env = z.output<typeof envSchema>;
export type MigrationEnv = z.output<typeof migrationEnvSchema>;
export type SeedEnv = z.output<typeof seedEnvSchema>;

function parseEnvironmentVariables<T extends z.ZodType>(
  schema: T,
  environmentVariables: NodeJS.ProcessEnv,
): z.output<T> {
  if (environmentVariables === process.env && existsSync(".env")) {
    process.loadEnvFile(".env");
  }
  const envValidation = schema.safeParse(environmentVariables);
  if (!envValidation.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(envValidation.error)}`,
    );
  }
  return envValidation.data;
}

/**
 * Loads `.env` (when present) and validates every variable the API needs.
 *
 * @param environmentVariables - Variables to validate, `process.env` by default.
 * @returns The typed configuration.
 */
export function loadEnv(environmentVariables: NodeJS.ProcessEnv = process.env): Env {
  return parseEnvironmentVariables(envSchema, environmentVariables);
}

/**
 * Loads `.env` (when present) and validates only what the migrate and revert
 * commands use, so they run without the API secrets.
 *
 * @param environmentVariables - Variables to validate, `process.env` by default.
 * @returns The typed configuration of the migration commands.
 */
export function loadMigrationEnv(
  environmentVariables: NodeJS.ProcessEnv = process.env,
): MigrationEnv {
  return parseEnvironmentVariables(migrationEnvSchema, environmentVariables);
}

/**
 * Loads `.env` (when present) and validates what the seed command uses: the migration
 * settings plus the bcrypt cost of the demo passwords.
 *
 * @param environmentVariables - Variables to validate, `process.env` by default.
 * @returns The typed configuration of the seed command.
 */
export function loadSeedEnv(
  environmentVariables: NodeJS.ProcessEnv = process.env,
): SeedEnv {
  return parseEnvironmentVariables(seedEnvSchema, environmentVariables);
}
