import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["framer-motion"],
  },
  poweredByHeader: false,
};

export default nextConfig;
