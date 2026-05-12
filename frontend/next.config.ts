import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The backend is at a different origin (the EigenCloud-hosted enclave),
  // so production builds talk to it over HTTPS via NEXT_PUBLIC_API_BASE_URL.
  // For local dev we proxy /api/* to the backend.
  async rewrites() {
    const backend = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!backend) return [];
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/verify", destination: `${backend}/verify` },
      { source: "/healthz", destination: `${backend}/healthz` },
    ];
  },
};

export default nextConfig;
