import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
};

export default nextConfig;

// Forced rebuild due to Turbopack caching issues with lib/ai/groq.ts exports
