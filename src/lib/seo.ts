// Lo que lee Google de la tienda. Damian, 19/11/2026: "arma tambien todo el
// SEO para google de la pagina tienda por favor".
//
// Tres cosas que antes estaban mal o faltaban:
//
// 1. LA DIRECCION OFICIAL DE CADA PAGINA (canonical). El layout le ponia a
//    TODAS la de la portada, asi que cada producto le decia a Google "soy una
//    copia de la portada" y Google no los mostraba. Ahora cada pagina dice la
//    suya. Sale de aca, y no de cada pantalla, para que el mapa del sitio
//    (src/app/sitemap.ts) y las paginas digan exactamente la misma direccion.
//
// 2. UNA PAGINA POR RUBRO, SUBRUBRO Y MARCA. Son el mismo catalogo con un
//    filtro (/tienda?cat=griferia&marca=fv), pero para Google cada una es una
//    pagina con su titulo ("Grifería FV") y su descripcion. La busqueda, el
//    orden y el "mostrar mas" no cuentan: son la misma pagina.
//
// 3. LA FICHA DE CADA PRODUCTO PARA GOOGLE (datos estructurados): nombre,
//    marca, codigo, fotos, precio, si hay stock. Con eso Google puede mostrar
//    el precio y el "En stock" en el resultado de busqueda.

import { TIENDA_URL } from "@/lib/dominio";
import { nombreMarca, type Marca } from "@/lib/marcas";
import { nombreRubro, type RubrosExtra } from "@/lib/rubros";
import { nombreSubrubro } from "@/lib/subrubros";
import { rutaProducto } from "@/lib/rutas-producto";

export type FiltroCatalogo = { cat?: string | null; sub?: string | null; marca?: string | null };

const vale = (x: string | null | undefined) => (x && x !== "all" ? x : null);

/** /tienda con los filtros que hacen una pagina distinta, siempre en el mismo
 *  orden. Lo demas (busqueda, orden, cuantos se ven) se deja afuera. */
export function rutaCatalogo(f: FiltroCatalogo = {}): string {
  const p = new URLSearchParams();
  const cat = vale(f.cat);
  if (cat) p.set("cat", cat);
  const sub = cat ? vale(f.sub) : null;
  if (sub) p.set("sub", sub);
  const marca = vale(f.marca);
  if (marca) p.set("marca", marca);
  const q = p.toString();
  return q ? `/tienda?${q}` : "/tienda";
}

/** "Grifería FV", "Loza sanitaria · Inodoros", "Ferrum". null sin filtros. */
export function nombreCatalogo(f: FiltroCatalogo, marcas: readonly Marca[], extra: RubrosExtra): string | null {
  const cat = vale(f.cat);
  const sub = cat ? vale(f.sub) : null;
  const marca = vale(f.marca);
  const partes: string[] = [];
  if (cat) partes.push(nombreRubro(cat, extra));
  const nSub = sub ? nombreSubrubro(cat, sub, extra) : null;
  if (nSub) partes.push(nSub);
  const nMarca = marca ? nombreMarca(marca, marcas) || marca : null;
  if (partes.length === 0) return nMarca;
  return `${partes.join(" · ")}${nMarca ? ` ${nMarca}` : ""}`;
}

export const url = (ruta: string) => `${TIENDA_URL}${ruta}`;

/** El JSON para un <script type="application/ld+json">. Sin "<" crudo: un
 *  titulo con "</script>" no puede cerrar la etiqueta. */
export function jsonLd(dato: unknown): string {
  return JSON.stringify(dato).replace(/</g, "\\u003c");
}

/** Texto plano corto, para descripciones. */
export function resumen(texto: string | null | undefined, max = 300): string {
  const t = String(texto ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : t;
}

export type MigaDePan = { nombre: string; ruta: string };

export function migasDeProducto(
  p: { itemId: string; title: string; category: string; subcategory?: string | null },
  extra: RubrosExtra,
): MigaDePan[] {
  const migas: MigaDePan[] = [
    { nombre: "Inicio", ruta: "/" },
    { nombre: "Tienda", ruta: "/tienda" },
    { nombre: nombreRubro(p.category, extra), ruta: rutaCatalogo({ cat: p.category }) },
  ];
  const sub = p.subcategory ? nombreSubrubro(p.category, p.subcategory, extra) : null;
  if (sub) migas.push({ nombre: sub, ruta: rutaCatalogo({ cat: p.category, sub: p.subcategory }) });
  migas.push({ nombre: p.title, ruta: rutaProducto(p.itemId) });
  return migas;
}

export function ldMigas(migas: MigaDePan[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: migas.map((m, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: m.nombre,
      item: url(m.ruta),
    })),
  };
}

/** La ficha del producto para Google (schema.org/Product). `precio` es el
 *  que se ve grande en la ficha; sin precio (a consultar) no va la oferta. */
export function ldProducto(p: {
  itemId: string;
  title: string;
  description: string | null;
  marca: string | null;
  codigoFabricante: string | null;
  rubro: string;
  fotos: string[];
  precio: number | null;
  stock: number;
}) {
  const direccion = url(rutaProducto(p.itemId));
  const descripcion = resumen(p.description, 4000) || p.title;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${direccion}#producto`,
    name: p.title,
    description: descripcion,
    sku: p.itemId,
    ...(p.codigoFabricante ? { mpn: p.codigoFabricante } : {}),
    ...(p.marca ? { brand: { "@type": "Brand", name: p.marca } } : {}),
    category: p.rubro,
    image: p.fotos,
    url: direccion,
    ...(p.precio && p.precio > 0
      ? {
          offers: {
            "@type": "Offer",
            url: direccion,
            priceCurrency: "ARS",
            price: p.precio,
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@id": `${TIENDA_URL}/#marca` },
            // Lo que dice /arrepentimiento: 10 dias corridos, sin costo.
            hasMerchantReturnPolicy: {
              "@type": "MerchantReturnPolicy",
              applicableCountry: "AR",
              returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
              merchantReturnDays: 10,
              returnFees: "https://schema.org/FreeReturn",
            },
          },
        }
      : {}),
  };
}
