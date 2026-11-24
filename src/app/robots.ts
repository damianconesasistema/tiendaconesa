import type { MetadataRoute } from "next";
import { TIENDA_URL } from "@/lib/dominio";

// Que puede recorrer Google (src/lib/seo.ts). El panel, el sistema, el
// carrito y el pago no son paginas para buscar. /api tampoco, MENOS las
// fotos de los productos (/api/productos/...): sin ellas no hay fotos en
// Google Imagenes ni en los resultados.
//
// Cloudflare le agrega arriba sus propias lineas (las "content signals"):
// eso es de Cloudflare y esta bien que quede.
//
// V.0.11.243 (Damian: "el sistema la url no tiene que estar taggeada en
// ningun buscador"): /sistema y /admin ya NO se nombran aca. Este archivo lo
// lee cualquiera, y nombrarlos le avisaba a todo el mundo que existen. Que no
// se indexen lo dice el servidor en cada respuesta (X-Robots-Tag: noindex, en
// next.config.ts): Google lo respeta, y si estuvieran bloqueados aca ni
// siquiera podria leer ese aviso.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/productos/"],
        disallow: ["/api/", "/tienda/carrito", "/tienda/checkout"],
      },
    ],
    sitemap: `${TIENDA_URL}/sitemap.xml`,
  };
}
