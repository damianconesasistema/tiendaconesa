import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El sistema Punto dejo de ser una demo (Damian, 22/11/2026: "la palabra
  // demo ya no la quiero, la quiero ya como sistema"): vive en /sistema. La
  // direccion vieja manda a la nueva con 307, que conserva el metodo: una
  // pestaña que quedo abierta con la pagina vieja y manda un comprobante
  // (POST) llega igual.
  async redirects() {
    return [
      { source: "/sistema/demo", destination: "/sistema", permanent: false },
      { source: "/sistema/demo/:camino*", destination: "/sistema/:camino*", permanent: false },
    ];
  },
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
