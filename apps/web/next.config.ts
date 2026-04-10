import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@yt-harness/db',
    '@yt-harness/shared',
    '@yt-harness/sdk',
  ],
};

export default nextConfig;