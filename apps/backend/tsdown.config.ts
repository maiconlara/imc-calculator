import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "src/main.ts",
    migrate: "src/infra/database/cli/migrate.ts",
    revert: "src/infra/database/cli/revert.ts",
  },
  format: "esm",
  platform: "node",
  target: "node26",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: false,
  deps: { alwaysBundle: ["@imc-calculator/shared"] },
});
