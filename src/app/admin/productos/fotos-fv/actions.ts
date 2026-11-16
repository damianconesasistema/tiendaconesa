"use server";

import { rutaAdminProducto, rutaProducto } from "@/lib/rutas-producto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { agregarFotoDeFV, type ResultadoFotoFV } from "@/lib/fv";

// Traer la foto de FV por el codigo, para articulos ya cargados.
// La busqueda y la descarga estan en src/lib/fv.ts; aca solo se piden y se
// refrescan las pantallas. La foto es del ARTICULO (compartido entre los
// locales), asi que no depende de que panel se use.

function refrescar(itemId?: string) {
  revalidatePath("/admin/productos");
  if (itemId) {
    revalidatePath(rutaAdminProducto(itemId));
    revalidatePath(rutaProducto(itemId));
  }
  revalidatePath("/tienda");
  revalidatePath("/");
}

/** El boton "Traer foto de FV" de la ficha de un articulo. */
export async function traerFotoFV(
  itemId: string,
  aunqueSeaDeOtraTerminacion = false,
): Promise<ResultadoFotoFV> {
  const session = await getAdminSession();
  if (!session) return { ok: false, motivo: "no autorizado" };
  const r = await agregarFotoDeFV(itemId, { aunqueSeaDeOtraTerminacion });
  if (r.ok) refrescar(itemId);
  return r;
}

export type SinFoto = { itemId: string; title: string };

/** Los articulos de FV que no tienen ninguna foto. Se guia por la marca
 *  cargada (Product.brand = "fv"), no por el titulo. */
export async function fvSinFoto(): Promise<SinFoto[]> {
  const session = await getAdminSession();
  if (!session) return [];
  return prisma.product.findMany({
    where: { brand: "fv", images: { none: {} } },
    select: { itemId: true, title: true },
    orderBy: { itemId: "asc" },
  });
}

/** De a pocos por vez, igual que al crear por Excel: la pantalla los va
 *  pidiendo y muestra el avance, y a FV no le llegan cien pedidos juntos. */
const POR_TANDA = 4;

export type ResultadoTanda = { itemId: string } & ResultadoFotoFV;

export async function traerFotosFVEnTanda(
  itemIds: string[],
  aunqueSeaDeOtraTerminacion = false,
): Promise<ResultadoTanda[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const salida: ResultadoTanda[] = [];
  for (const itemId of itemIds.slice(0, POR_TANDA)) {
    try {
      const r = await agregarFotoDeFV(itemId, { aunqueSeaDeOtraTerminacion });
      salida.push({ itemId, ...r });
    } catch (e) {
      salida.push({ itemId, ok: false, motivo: (e as Error).message });
    }
  }
  return salida;
}

/** Al terminar la tanda, una sola vez: refrescar todo junto. */
export async function terminarFotosFV(): Promise<void> {
  const session = await getAdminSession();
  if (!session) return;
  refrescar();
}
