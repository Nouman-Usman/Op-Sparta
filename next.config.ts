import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['3a35-103-151-47-72.ngrok-free.app'],
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'phkhtujhimrqsrzmqmem.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'suohjsfhspalrwczqbop.supabase.co',
      },
    ],
  },
};

export default nextConfig;
