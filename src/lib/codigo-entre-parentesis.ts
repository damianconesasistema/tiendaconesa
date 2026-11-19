// El codigo de fabricante que viene entre parentesis en el titulo. Damian,
// 19/11/2026: "en Mi Pileta fijate que los articulos tienen el codigo de
// fabricante entre los ()". Lo mismo en otras marcas: Flowater
// "(FW-ASIMEITAN)", Fluvial "(112100)", Ariel "(BAM-226BA-HMBL)".
//
// Solo cuenta si parece un codigo: sin espacios, de 3 a 20 letras y numeros
// (con . - /), con algun numero o un guion, y que no sea una medida ("(1/2)",
// "(50MM)"). "(BLANCO)" o "(2 UNIDADES)" no son codigos.

import { prisma } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { agregarNovedades } from "@/lib/novedades";

export function codigoEntreParentesis(titulo: string): string | null {
  const grupos = [...String(titulo ?? "").toUpperCase().matchAll(/\(([^()]{3,20})\)/g)].map((m) => m[1].trim());
  for (const g of grupos.reverse()) {
    if (/\s/.test(g)) continue;
    if (!/^[A-Z0-9][A-Z0-9.\-/]*[A-Z0-9]$/.test(g)) continue;
    if (!/\d/.test(g) && !/[A-Z]-[A-Z0-9]/.test(g)) continue;
    if (/^\d+([.,/]\d+)?(MM|CM|MTS?|M|LTS?|L|KG|GR|W|V|HZ|HP|CC|")?$/.test(g) && /[/.,]|[A-Z]$/.test(g)) continue;
    return g;
  }
  return null;
}

/** Los productos con el codigo de fabricante vacio, UNA vez: se completa con
 *  el que esta entre parentesis en el titulo (FV ya tiene el suyo: el SKU).
 *  Igual que src/lib/fv-codigo-una-vez.ts. */
const S_HECHO = "codigo_parentesis_hecho";
let corriendo = false;

export async function codigoEntreParentesisUnaVez(): Promise<void> {
  if (corriendo || (await getSetting(S_HECHO))) return;
  corriendo = true;
  try {
    const filas = await prisma.product.findMany({
      where: {
        title: { contains: "(" },
        OR: [{ codigoFabricante: null }, { codigoFabricante: "" }],
      },
      select: { id: true, title: true, brand: true },
    });
    const porMarca = new Map<string, number>();
    for (const f of filas) {
      const codigo = codigoEntreParentesis(f.title);
      if (!codigo) continue;
      await prisma.product.update({ where: { id: f.id }, data: { codigoFabricante: codigo } });
      porMarca.set(f.brand ?? "sin marca", (porMarca.get(f.brand ?? "sin marca") ?? 0) + 1);
    }
    const total = [...porMarca.values()].reduce((a, b) => a + b, 0);
    if (total > 0)
      await agregarNovedades([
        {
          tipo: "nuevos",
          nivel: "info",
          texto: `Código de fabricante tomado de los paréntesis del título en ${total} productos (${[...porMarca]
            .map(([m, n]) => `${m}: ${n}`)
            .join(", ")}).`,
          link: "/admin/productos",
        },
      ]);
    await setSetting(S_HECHO, new Date().toISOString());
  } finally {
    corriendo = false;
  }
}
