import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "wearify-backend-production.up.railway.app",
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
