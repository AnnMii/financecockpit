import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page behind the login is rendered per request, so the
  // prerender-oriented caching model is switched off.
  cacheComponents: false,
  serverExternalPackages: ["@libsql/client"],
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
