import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    main: "src/main.ts",
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
