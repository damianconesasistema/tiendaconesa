import type { MetadataRoute } from "next";
import { TIENDA_URL } from "@/lib/dominio";

// Que puede recorrer Google (src/lib/seo.ts). El panel, el sistema, el
// carrito y el pago no son paginas para buscar. /api tampoco, MENOS las
// fotos de los productos (/api/productos/...): sin ellas no hay fotos en
// Google Imagenes ni en los resultados.
//
// Cloudflare le agrega arriba sus propias lineas (las "content signals"):
// eso es de Cloudflare y esta bien que quede.

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/productos/"],
        disallow: ["/admin", "/api/", "/sistema", "/tienda/carrito", "/tienda/checkout"],
      },
    ],
    sitemap: `${TIENDA_URL}/sitemap.xml`,
  };
}
