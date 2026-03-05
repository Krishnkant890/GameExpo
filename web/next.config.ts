import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        pathname: '/**',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/assets/:path*',
        destination: 'http://localhost:4000/assets/:path*',
      },
    ];
  },
};

export default nextConfig;
