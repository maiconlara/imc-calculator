import { existsSync } from "node:fs";
import { isIP } from "node:net";
import { z } from "zod";

const TRUST_PROXY_PRESETS = new Set(["loopback", "linklocal", "uniquelocal"]);

const MAX_PREFIX_LENGTH_BY_IP_VERSION: Record<number, number> = { 4: 32, 6: 128 };

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

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3333),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
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
  DB_DATABASE: z.string().min(1).default("database.sqlite"),
});

export type Env = z.output<typeof envSchema>;

/**
 * Loads `.env` (when present) and validates the environment variables.
 *
 * @param environmentVariables - Variables to validate, `process.env` by default.
 * @returns The typed configuration.
 */
export function loadEnv(environmentVariables: NodeJS.ProcessEnv = process.env): Env {
  if (environmentVariables === process.env && existsSync(".env")) {
    process.loadEnvFile(".env");
  }
  const envValidation = envSchema.safeParse(environmentVariables);
  if (!envValidation.success) {
    throw new Error(
      `Invalid environment variables:\n${z.prettifyError(envValidation.error)}`,
    );
  }
  return envValidation.data;
}
