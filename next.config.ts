import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.56.1",
    "192.168.1.153",
    "192.168.*",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "usercontent.jamendo.com",
      },
      {
        protocol: "https",
        hostname: "**.imgjam.com",
      },
      {
        protocol: "https",
        hostname: "imgjam.com",
      },
      {
        protocol: "https",
        hostname: "imgjam1.com",
      },
      {
        protocol: "https",
        hostname: "imgjam2.com",
      },
    ],
  },
};

export default nextConfig;
