import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A PDF exportok betűtípusai fájlként kellenek a szerveren.
  outputFileTracingIncludes: { "/export/**": ["./src/fonts/**"] },
  serverExternalPackages: ["@react-pdf/renderer"],
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
