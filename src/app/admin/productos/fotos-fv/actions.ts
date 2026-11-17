"use server";

import { rutaAdminProducto, rutaProducto } from "@/lib/rutas-producto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import {
  agregarDescripcionDeFV,
  agregarFotoDeFV,
  fichaDelFabricante,
  type ResultadoDescripcionFV,
  type ResultadoFotoFV,
} from "@/lib/fv";
import { getMarcas, marcasConWeb } from "@/lib/marcas-server";

// Traer de la pagina oficial de la marca (FV y Piazza, ver
// src/lib/web-de-marca.ts), por el codigo, la foto y la descripcion de
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
): Promise<
  | { ok: true; texto: string; ficha?: string; fabricante: string }
  | { ok: false; motivo: string; fabricante?: string; sinPagina?: boolean }
> {
  const session = await getAdminSession();
  if (!session) return { ok: false, motivo: "no autorizado" };
  const d = await fichaDelFabricante(itemId);
  if (d.sinPagina) return { ok: false, motivo: d.motivo ?? "sin página", sinPagina: true };
  if (!d.encontrado)
    return { ok: false, motivo: d.motivo ?? `${d.fabricante} no lo tiene`, fabricante: d.fabricante };
  if (!d.descripcion)
    return { ok: false, motivo: `la ficha de ${d.fabricante} no trae descripción`, fabricante: d.fabricante };
  return { ok: true, texto: d.descripcion, ficha: d.ficha, fabricante: d.fabricante };
}

export type Incompleto = {
  itemId: string;
  title: string;
  faltaFoto: boolean;
  faltaDescripcion: boolean;
  /** El fabricante: "FV", "Piazza". */
  marca: string;
};

/** Los articulos de las marcas con pagina (FV, Piazza) sin foto o sin
 *  descripcion. Se guia por la marca cargada (Product.brand), no por el
 *  titulo. */
export async function fvIncompletos(): Promise<Incompleto[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const conWeb = await marcasConWeb();
  const filas = await prisma.product.findMany({
    where: {
      brand: { in: [...conWeb.keys()] },
      OR: [
        { images: { none: {} } },
        { description: null },
        { description: "" },
      ],
    },
    select: {
      itemId: true,
      title: true,
      brand: true,
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
    marca: (p.brand && conWeb.get(p.brand)?.name) || "",
  }));
}

/** De a pocos por vez, igual que al crear por Excel: la pantalla los va
 *  pidiendo y muestra el avance, y a FV no le llegan cien pedidos juntos. */
const POR_TANDA = 2;

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

/** Las marcas SIN pagina web cargada que tienen articulos sin foto: para
 *  avisar en la pantalla que, cargandoles la web en Marcas, tambien se
 *  pueden buscar. */
export async function marcasSinWebConFaltantes(): Promise<{ id: string; name: string; sinFoto: number }[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const [marcas, conWeb] = await Promise.all([getMarcas(), marcasConWeb()]);
  const filas = await prisma.product.groupBy({
    by: ["brand"],
    where: { brand: { not: null, notIn: [...conWeb.keys()] }, images: { none: {} } },
    _count: { _all: true },
  });
  return filas
    .filter((f) => f.brand)
    .map((f) => ({
      id: f.brand as string,
      name: marcas.find((m) => m.id === f.brand)?.name ?? (f.brand as string),
      sinFoto: f._count._all,
    }))
    .sort((a, b) => b.sinFoto - a.sinFoto);
}
