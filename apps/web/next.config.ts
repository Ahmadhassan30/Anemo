/*
 * Purpose: Next.js configuration for the LectureOS web app.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["next-auth"],
  output: "standalone"
};

export default nextConfig;

