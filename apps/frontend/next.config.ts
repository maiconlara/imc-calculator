import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: { position: "bottom-right" },
  transpilePackages: ["@imc-calculator/shared"],
  experimental: {
    optimizePackageImports: ["@chakra-ui/react", "lucide-react"],
  },
};

export default nextConfig;
