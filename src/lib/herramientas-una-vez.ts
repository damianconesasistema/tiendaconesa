// Reacomodar Herramientas, UNA sola vez. Damian, 18/11/2026: "bombas de agua
// sacalo de ahi y hay que ponerlo como subrubro en herramientas" y "creame en
// herramienta Pistola de Calor, Amoladora, Taladro, Lijadora, Pulidora,
// Caladora y etiquetame bien los productos que tengo de DOGO".
//
// Los subrubros nuevos estan en src/lib/subrubros.ts. Esto acomoda lo que ya
// estaba cargado:
//   1. Lo que estaba en el rubro "Bombas de Agua" (agregado a mano) pasa a
//      Herramientas, subrubro Bombas de Agua, y ese rubro sale de la lista.
//   2. Todo lo de la marca Dogo pasa a Herramientas, con el subrubro que dice
//      su titulo (amoladora, taladro, rotomartillo...).
//   3. Lo de Herramientas que no tenia subrubro, el que dice su titulo.
//   4. Si se habia agregado a mano un subrubro de Herramientas que ahora ya
//      viene de fabrica ("Amoladoras" = "Amoladora"), sus productos pasan al
//      de fabrica y el repetido sale de la lista.
//
// Igual que los titulos en mayusculas (src/lib/titulos-mayusculas.ts): va
// desde el programa y no como migracion, para que si algo falla la tienda
// arranque igual y se reintente la proxima vez. Antes de tocar nada guarda
// rubro y subrubro de cada producto que cambia en la tabla Setting
// ("herramientas_antes", {codigo: {category, subcategory}}), para poder
// volver atras. Solo cambia rubro y subrubro: precios, stock, fotos y si
// esta publicado quedan igual.

import { prisma } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { getRubrosExtra, quitarRubroAMano, quitarSubrubrosAMano } from "@/lib/rubros-server";
import { slugDeNombre } from "@/lib/rubros";
import { SUBRUBROS, subrubroSugerido, subrubroValido } from "@/lib/subrubros";

const S_HECHO = "herramientas_ordenadas_hecho";
const S_RESPALDO = "herramientas_antes";
const HERRAMIENTAS = "herramientas";
const BOMBAS = "bombas-de-agua";

/** "bombas-de-agua", "bomba-de-agua", "bombas": el rubro hecho a mano. */
const esRubroDeBombas = (slug: string) => /^bombas?(-|$)/.test(slug);

/** El mismo nombre que uno de fabrica, en singular o plural ("amoladoras"). */
function deFabricaIgual(slug: string): string | null {
  const sin = (s: string) => slugDeNombre(s).replace(/(es|s)$/, "");
  const base = (SUBRUBROS[HERRAMIENTAS] ?? []).find((s) => s.slug === slug || sin(s.slug) === sin(slug));
  return base ? base.slug : null;
}

let corriendo: Promise<number> | null = null;

/** Devuelve cuantos productos cambio (0 si ya estaba hecho). */
export function herramientasUnaVez(): Promise<number> {
  if (!corriendo)
    corriendo = (async () => {
      try {
        if (await getSetting(S_HECHO)) return 0;
        const extra = await getRubrosExtra();
        const rubrosDeBombas = extra.rubros.map((r) => r.slug).filter(esRubroDeBombas);
        // Los subrubros de herramientas hechos a mano que ya vienen de
        // fabrica: slug a mano -> slug de fabrica.
        const repetidos = new Map<string, string>();
        for (const s of extra.subrubros[HERRAMIENTAS] ?? []) {
          const base = deFabricaIgual(s.slug);
          if (base && base !== s.slug) repetidos.set(s.slug, base);
        }
        // La lista sin los repetidos: con esa se deduce el subrubro.
        const extraLimpio = {
          rubros: extra.rubros.filter((r) => !esRubroDeBombas(r.slug)),
          subrubros: {
            ...extra.subrubros,
            [HERRAMIENTAS]: (extra.subrubros[HERRAMIENTAS] ?? []).filter((s) => !repetidos.has(s.slug)),
          },
        };

        const productos = await prisma.product.findMany({
          where: {
            OR: [
              { category: HERRAMIENTAS },
              { brand: "dogo" },
              ...rubrosDeBombas.map((slug) => ({ category: slug })),
              { category: { startsWith: "bomba" } },
            ],
          },
          select: { itemId: true, title: true, category: true, subcategory: true, brand: true },
        });

        const cambios: { itemId: string; antes: { category: string; subcategory: string | null }; subcategory: string | null }[] = [];
        for (const p of productos) {
          let sub: string | null;
          if (esRubroDeBombas(p.category)) sub = BOMBAS;
          else {
            const actual = p.subcategory ? (repetidos.get(p.subcategory) ?? p.subcategory) : null;
            const valido = actual && subrubroValido(HERRAMIENTAS, actual, extraLimpio) ? actual : null;
            const delTitulo = subrubroSugerido(HERRAMIENTAS, null, p.title, extraLimpio).slug;
            // Los de Dogo: lo que dice el titulo manda ("etiquetame bien").
            // Los demas: se respeta el que ya tenian; si no tenian, el titulo.
            sub = p.brand === "dogo" ? (delTitulo ?? valido) : (valido ?? delTitulo);
          }
          if (p.category === HERRAMIENTAS && p.subcategory === sub) continue;
          cambios.push({ itemId: p.itemId, antes: { category: p.category, subcategory: p.subcategory }, subcategory: sub });
        }

        // El respaldo primero. Si ya habia uno (un intento anterior que se
        // corto), se suma: nunca se pisa lo original con algo ya cambiado.
        let respaldo: Record<string, { category: string; subcategory: string | null }> = {};
        try {
          respaldo = JSON.parse((await getSetting(S_RESPALDO)) || "{}");
        } catch {
          respaldo = {};
        }
        for (const c of cambios) if (!(c.itemId in respaldo)) respaldo[c.itemId] = c.antes;
        await setSetting(S_RESPALDO, JSON.stringify(respaldo));

        for (const c of cambios)
          await prisma.product.update({
            where: { itemId: c.itemId },
            data: { category: HERRAMIENTAS, subcategory: c.subcategory },
          });

        // Recien con los productos ya movidos, las listas.
        for (const slug of rubrosDeBombas) await quitarRubroAMano(slug);
        if (repetidos.size) await quitarSubrubrosAMano(HERRAMIENTAS, [...repetidos.keys()]);

        await setSetting(S_HECHO, new Date().toISOString());
        return cambios.length;
      } finally {
        setTimeout(() => (corriendo = null), 0);
      }
    })();
  return corriendo;
}
