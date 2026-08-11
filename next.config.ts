import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR/error-overlay requests when testing the dev server over the LAN.
  allowedDevOrigins: ["192.168.1.28", "192.168.1.62", "192.168.110.34"],
};

export default nextConfig;
