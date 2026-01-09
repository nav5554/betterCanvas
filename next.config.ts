import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: {
    appDir: false,
    buildActivity: false,
  },
};

export default nextConfig;
