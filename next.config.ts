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
  // V.0.11.243. Damian, 24/11/2026: "el sistema la url no tiene que estar
  // taggeada en ningun buscador, hay alguna forma de darle seguridad".
  async headers() {
    // Lo de adentro (Punto y el panel): que ningun buscador lo guarde, que
    // nadie lo pueda meter adentro de otra pagina para engañar (solo este
    // mismo sitio: Punto muestra el panel en su solapa Web) y que al tocar
    // un link de afuera no viaje la direccion de adentro.
    const privado = [
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      // V.0.11.298: tambien desde las otras direcciones de conesa.com.ar. El
      // panel de cada local vive en su subdominio (buenosaires.conesa.com.ar)
      // y Punto lo muestra en su solapa Web: con 'self' solo, al tocar
      // Productos el navegador lo bloqueaba (Damian: "no me funciona la
      // pagina productos"). Sin X-Frame-Options: no admite mas de un sitio, y
      // los navegadores usan frame-ancestors cuando estan los dos.
      {
        key: "Content-Security-Policy",
        value: "frame-ancestors 'self' https://conesa.com.ar https://*.conesa.com.ar",
      },
      { key: "Referrer-Policy", value: "same-origin" },
    ];
    return [
      {
        // Todo el sitio: siempre por https (el navegador ya no prueba por
        // http) y que no adivine el tipo de un archivo.
        source: "/:camino*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      { source: "/sistema", headers: privado },
      { source: "/sistema/:camino*", headers: privado },
      { source: "/admin", headers: privado },
      { source: "/admin/:camino*", headers: privado },
      { source: "/api/admin/:camino*", headers: privado },
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
