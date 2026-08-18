import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Rankings content is read from the filesystem at build/request time.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*", "./data/*.json"],
  },
};

export default nextConfig;
