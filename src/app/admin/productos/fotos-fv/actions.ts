"use server";

import { rutaAdminProducto, rutaProducto } from "@/lib/rutas-producto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import {
  agregarDescripcionDeFV,
  agregarFotoDeFV,
  buscarEnFV,
  type ResultadoDescripcionFV,
  type ResultadoFotoFV,
} from "@/lib/fv";

// Traer de la pagina de FV, por el codigo, la foto y la descripcion de
// articulos ya cargados. La busqueda y la descarga estan en src/lib/fv.ts;
// aca solo se piden y se refrescan las pantallas. Foto y descripcion son del
// ARTICULO (compartido entre los locales), asi que no depende del panel.

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

/** "Buscar en la web" al lado de la descripcion, en la ficha del panel,
 *  cuando el articulo es FV: primero se prueba aca.
 *  NO guarda: devuelve el texto para ponerlo en el cuadro, que se revisa y
 *  se guarda con el boton de siempre (igual que el de la IA). */
export async function descripcionDeFV(
  itemId: string,
): Promise<{ ok: true; texto: string; ficha?: string } | { ok: false; motivo: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, motivo: "no autorizado" };
  const d = await buscarEnFV(itemId);
  if (!d.encontrado) return { ok: false, motivo: d.motivo ?? "FV no lo tiene" };
  if (!d.descripcion) return { ok: false, motivo: "la ficha de FV no trae descripción" };
  return { ok: true, texto: d.descripcion, ficha: d.ficha };
}

export type Incompleto = {
  itemId: string;
  title: string;
  faltaFoto: boolean;
  faltaDescripcion: boolean;
};

/** Los articulos de FV sin foto o sin descripcion. Se guia por la marca
 *  cargada (Product.brand = "fv"), no por el titulo. */
export async function fvIncompletos(): Promise<Incompleto[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const filas = await prisma.product.findMany({
    where: {
      brand: "fv",
      OR: [
        { images: { none: {} } },
        { description: null },
        { description: "" },
      ],
    },
    select: {
      itemId: true,
      title: true,
      description: true,
      _count: { select: { images: true } },
    },
    orderBy: { itemId: "asc" },
  });
  return filas.map((p) => ({
    itemId: p.itemId,
    title: p.title,
    faltaFoto: p._count.images === 0,
    faltaDescripcion: !p.description?.trim(),
  }));
}

/** De a pocos por vez, igual que al crear por Excel: la pantalla los va
 *  pidiendo y muestra el avance, y a FV no le llegan cien pedidos juntos. */
const POR_TANDA = 4;

export type ResultadoTanda = {
  itemId: string;
  foto?: ResultadoFotoFV;
  descripcion?: ResultadoDescripcionFV;
};

export async function completarFVEnTanda(
  pedidos: { itemId: string; faltaFoto: boolean; faltaDescripcion: boolean }[],
  aunqueSeaDeOtraTerminacion = false,
): Promise<ResultadoTanda[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const salida: ResultadoTanda[] = [];
  for (const p of pedidos.slice(0, POR_TANDA)) {
    const r: ResultadoTanda = { itemId: p.itemId };
    try {
      // La busqueda en FV queda en memoria: pedir foto y descripcion del
      // mismo articulo va una sola vez a la pagina.
      if (p.faltaFoto)
        r.foto = await agregarFotoDeFV(p.itemId, { aunqueSeaDeOtraTerminacion });
      if (p.faltaDescripcion) r.descripcion = await agregarDescripcionDeFV(p.itemId);
    } catch (e) {
      const motivo = (e as Error).message;
      if (p.faltaFoto && !r.foto) r.foto = { ok: false, motivo };
      if (p.faltaDescripcion && !r.descripcion) r.descripcion = { ok: false, motivo };
    }
    salida.push(r);
  }
  return salida;
}

/** Al terminar la tanda, una sola vez: refrescar todo junto. */
export async function terminarFV(): Promise<void> {
  const session = await getAdminSession();
  if (!session) return;
  refrescar();
}
