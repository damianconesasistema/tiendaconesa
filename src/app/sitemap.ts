import type { MetadataRoute } from "next";
import { articulosEnVenta } from "@/lib/catalogo";
import { rutaProducto } from "@/lib/rutas-producto";
import { rutaCatalogo, url } from "@/lib/seo";

// El mapa del sitio para Google: la portada, el catalogo, cada rubro,
// subrubro y marca con productos, y cada producto publicado, con su foto y
// la fecha en que cambio. Se arma en el momento con lo que esta a la venta
// (src/lib/seo.ts), asi un producto nuevo entra solo y uno pausado sale solo.

export const dynamic = "force-dynamic";

// Next escribe la direccion tal cual adentro del XML: un "&" suelto (el de
// ?cat=griferia&marca=fv) lo rompe. Va escrito como &amp;.
const xml = (s: string) => s.replace(/&/g, "&amp;");

/** Una combinacion rubro + marca entra al mapa si tiene al menos estos
 *  productos: menos que eso es una pagina casi vacia. */
const MINIMO_COMBINADA = 3;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productos = (await articulosEnVenta({ orden: ["titulo"] }).catch(() => [])).filter(
    (p) => p.active && p.itemId !== "__RESET_PRICES_MARKER__",
  );
  const ultimo = productos.reduce<Date | undefined>(
    (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
    undefined,
  );

  const paginas: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: ultimo, changeFrequency: "daily", priority: 1 },
    { url: url("/tienda"), lastModified: ultimo, changeFrequency: "daily", priority: 0.9 },
  ];

  // Rubros, subrubros, marcas y rubro + marca: los que tienen productos.
  const cuenta = new Map<string, number>();
  const sumar = (ruta: string) => cuenta.set(ruta, (cuenta.get(ruta) ?? 0) + 1);
  for (const p of productos) {
    sumar(rutaCatalogo({ cat: p.category }));
    if (p.subcategory) sumar(rutaCatalogo({ cat: p.category, sub: p.subcategory }));
    if (p.brand) {
      sumar(rutaCatalogo({ marca: p.brand }));
      sumar(rutaCatalogo({ cat: p.category, marca: p.brand }));
    }
  }
  for (const [ruta, n] of cuenta) {
    const combinada = ruta.includes("cat=") && ruta.includes("marca=");
    if (combinada && n < MINIMO_COMBINADA) continue;
    paginas.push({
      url: xml(url(ruta)),
      lastModified: ultimo,
      changeFrequency: "weekly",
      priority: combinada ? 0.6 : 0.8,
    });
  }

  for (const p of productos) {
    const foto = p.imageUrl
      ? p.imageUrl.startsWith("http")
        ? p.imageUrl
        : url(p.imageUrl)
      : null;
    paginas.push({
      url: xml(url(rutaProducto(p.itemId))),
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
      ...(foto ? { images: [xml(foto)] } : {}),
    });
  }

  paginas.push(
    { url: url("/legales"), changeFrequency: "yearly", priority: 0.2 },
    { url: url("/arrepentimiento"), changeFrequency: "yearly", priority: 0.2 },
  );
  return paginas;
}
