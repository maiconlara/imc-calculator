import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["node_modules"] },
  js.configs.recommended,
  tseslint.configs.strict,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "no-console": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lodash", "lodash/*", "lodash-es", "lodash.*"],
              message: "Use the language's native APIs.",
            },
          ],
        },
      ],
    },
  },
);
