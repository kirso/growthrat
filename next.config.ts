import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Convex handles API, but we need API routes for SSE panel streaming
  experimental: {
    // Enable server actions for Convex mutations from server components
  },
};

export default nextConfig;
