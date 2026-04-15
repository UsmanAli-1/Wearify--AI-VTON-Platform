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
        hostname: "https://wearify-55y3.onrender.com",
        pathname: "/uploads/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
