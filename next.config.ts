import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;
