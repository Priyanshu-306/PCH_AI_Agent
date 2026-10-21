import type { NextConfig } from "next";

// Cache Components is intentionally off: every page here is DB-driven and edited
// live from the admin panel, so request-time rendering keeps edits instantly visible.
const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "exceljs", "pg"],
  // Lets the shop site (shop.localhost) load dev assets from the same dev server.
  allowedDevOrigins: ["shop.localhost", "*.localhost", "127.0.0.1"],
  experimental: {
    serverActions: { bodySizeLimit: "20mb" },
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
