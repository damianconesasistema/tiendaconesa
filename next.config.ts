import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de productos pueden pesar varios MB. El default de
      // Next.js es 1MB y hacía crashear la subida de imágenes.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
