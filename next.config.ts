/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["*"]
    },
  },
};

export default nextConfig;
