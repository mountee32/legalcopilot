import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // experimental: {
  //   reactCompiler: true,
  // },
  typescript: {
    // TODO: Fix Next.js 15 route handler types and remove this
    ignoreBuildErrors: true,
  },
  eslint: {
    // TODO: Fix ESLint warnings and remove this
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
