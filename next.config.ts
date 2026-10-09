import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Las fotos de productos pueden pesar varios MB. El default de
      // Next.js es 1MB y hacía crashear la subida de imágenes.
      // Con el achique del navegador (src/lib/image-client.ts) lo que llega
      // ronda los 300 KB. El margen es para las que no se pudieron achicar.
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
