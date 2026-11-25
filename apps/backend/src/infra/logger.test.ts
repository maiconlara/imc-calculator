import { describe, expect, it } from "vitest";
import type { Env } from "../config/env";
import { canPrettyPrintLogs } from "./logger";

function failToResolve(moduleName: string): string {
  throw new Error(`Cannot find module '${moduleName}'`);
}

describe("canPrettyPrintLogs", () => {
  it("prints human readable logs in development when pino-pretty is installed", () => {
    expect(canPrettyPrintLogs("development")).toBe(true);
  });

  it("falls back to JSON when pino-pretty is missing, as in the production image", () => {
    expect(canPrettyPrintLogs("development", failToResolve)).toBe(false);
  });

  it.each<Env["NODE_ENV"]>(["test", "production"])("prints JSON in %s", (nodeEnv) => {
    expect(canPrettyPrintLogs(nodeEnv)).toBe(false);
  });
});
