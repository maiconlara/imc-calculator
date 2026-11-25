import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lodash", "lodash/*", "lodash-es", "lodash.*"],
              message: "Use the language's native APIs.",
            },
          ],
          paths: [
            {
              name: "react",
              importNames: ["useEffect", "useLayoutEffect"],
              message:
                "Derive values during render, load data with TanStack Query, or use the useDebounce hook.",
            },
          ],
        },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
      "react/no-multi-comp": ["error", { ignoreStateless: false }],
    },
  },
  {
    files: ["src/hooks/use-debounce.ts"],
    rules: { "no-restricted-imports": "off" },
  },
]);
