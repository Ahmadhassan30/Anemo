/** @type {import('next').NextConfig} */
const apiBase =
  process.env.NEXTAUTH_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ||
  "http://localhost:8000";

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/static/:path*",
        destination: `${apiBase}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;
