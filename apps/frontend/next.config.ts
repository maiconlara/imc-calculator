import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const monorepoRoot = fileURLToPath(new URL("../..", import.meta.url));
const isStandaloneBuild = process.env.NEXT_BUILD_OUTPUT === "standalone";

const nextConfig: NextConfig = {
  output: isStandaloneBuild ? "standalone" : undefined,
  outputFileTracingRoot: monorepoRoot,
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: { position: "bottom-right" },
  transpilePackages: ["@imc-calculator/shared"],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react", "lucide-react"],
  },
};

export default nextConfig;
