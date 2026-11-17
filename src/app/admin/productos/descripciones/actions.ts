"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { fichaDelFabricante } from "@/lib/fv";
import { marcasConWeb } from "@/lib/marcas-server";
import { mlConectado } from "@/lib/mercadolibre";
import { geminiConfigurado, redactarDescripcion } from "@/lib/gemini";

// "Buscar descripciones en la web" en tanda. Damian, 16/11/2026: "se puede
// hacer que busquen en la web masivamente, para no hacer uno por uno".
//
// Es el mismo "Buscar en la web" de la ficha, para muchos a la vez:
// - FV: la ficha oficial de fvsa.com (src/lib/fv.ts).
// - El resto, o un FV que FV no tiene: internet con la IA (src/lib/gemini.ts).
//
// Buscar NO guarda. La pantalla muestra cada texto para revisarlo y se
// guardan solo los que quedan tildados (guardarDescripciones). La IA se
// puede equivocar: la ultima palabra la tiene la persona, igual que en la
// ficha.

/** De donde salio el texto. "titulo": la IA no pudo buscar en internet (se
 *  acabo el cupo de busqueda de Google) y lo escribio solo con el titulo.
 *  Esos van destildados: pueden traer datos inventados. */
export type Fuente = "fv" | "web" | "titulo";

export type Encontrada =
  | { itemId: string; ok: true; texto: string; fuente: Fuente; fuentes?: string[] }
  | { itemId: string; ok: false; motivo: string };

/** Pocos por pedido: con busqueda en internet cada uno tarda varios
 *  segundos, y un pedido largo puede cortarse. La pantalla los va pidiendo. */
const POR_TANDA = 2;

export async function buscarDescripcionesEnTanda(
  itemIds: string[],
): Promise<Encontrada[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const conIA = geminiConfigurado();
  const salida: Encontrada[] = [];
  const conWeb = await marcasConWeb();
  const ml = await mlConectado();

  for (const itemId of itemIds.slice(0, POR_TANDA)) {
    try {
      const p = await prisma.product.findUnique({
        where: { itemId },
        select: { title: true, category: true, brand: true, description: true },
      });
      if (!p) {
        salida.push({ itemId, ok: false, motivo: "no está el artículo" });
        continue;
      }
      if (p.description?.trim()) {
        salida.push({ itemId, ok: false, motivo: "ya tiene descripción" });
        continue;
      }

      // FV y Piazza: primero la ficha oficial del fabricante. La fuente
      // sigue llamandose "fv" por compatibilidad: quiere decir "la pagina
      // oficial de la marca".
      if (p.brand && (conWeb.has(p.brand) || ml)) {
        const d = await fichaDelFabricante(itemId);
        if (d.descripcion) {
          salida.push({ itemId, ok: true, texto: d.descripcion, fuente: "fv" });
          continue;
        }
      }

      if (!conIA) {
        salida.push({
          itemId,
          ok: false,
          motivo: "la búsqueda en internet no está configurada",
        });
        continue;
      }
      const r = await redactarDescripcion(p.title, p.category);
      if (r.ok && r.texto) {
        salida.push({
          itemId,
          ok: true,
          texto: r.texto,
          fuente: r.conBusqueda === false ? "titulo" : "web",
          fuentes: r.fuentes,
        });
      } else {
        salida.push({ itemId, ok: false, motivo: r.error ?? "no se encontró nada" });
      }
    } catch (e) {
      salida.push({ itemId, ok: false, motivo: (e as Error).message });
    }
  }
  return salida;
}

/** Guarda las descripciones tildadas. Solo en articulos que siguen sin
 *  descripcion: si alguien escribio una mientras tanto, no se pisa. */
export async function guardarDescripciones(
  items: { itemId: string; texto: string }[],
): Promise<{ guardadas: number; saltadas: number }> {
  const session = await getAdminSession();
  if (!session) return { guardadas: 0, saltadas: items.length };
  let guardadas = 0;
  let saltadas = 0;
  for (const it of items.slice(0, 50)) {
    const texto = it.texto.trim().slice(0, 4000);
    if (!texto) {
      saltadas++;
      continue;
    }
    const r = await prisma.product.updateMany({
      where: { itemId: it.itemId, OR: [{ description: null }, { description: "" }] },
      data: { description: texto },
    });
    if (r.count > 0) guardadas++;
    else saltadas++;
  }
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { guardadas, saltadas };
}
