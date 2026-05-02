import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Playwright is only used in background workers — keep it out of server bundles
  serverExternalPackages: ["playwright", "playwright-core"],
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
