import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// The app loads nothing from other origins. Next.js needs inline scripts for
// its own bootstrapping, hence 'unsafe-inline' for scripts; 'unsafe-eval' is
// only for the development server.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Only meaningful over HTTPS; browsers ignore it on plain http.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // The Docker image builds a self-contained server (see Dockerfile).
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // Migrations are read from ./drizzle at start-up.
  outputFileTracingIncludes: { "/*": ["./drizzle/**/*"] },
  poweredByHeader: false,
  // Every page behind the login is rendered per request, so the
  // prerender-oriented caching model is switched off.
  cacheComponents: false,
  serverExternalPackages: ["@libsql/client"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
