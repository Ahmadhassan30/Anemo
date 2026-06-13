/*
 * Purpose: Next.js configuration for the LectureOS web app.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["next-auth"]
};

export default nextConfig;
