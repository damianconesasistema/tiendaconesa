"use server";

import { rutaAdminProducto, rutaProducto } from "@/lib/rutas-producto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import {
  agregarFotosDeUnLink,
  agregarDescripcionDeFV,
  agregarFotoDeFV,
  fichaDelFabricante,
  type ResultadoDescripcionFV,
  type ResultadoFotoFV,
} from "@/lib/fv";
import { getMarcas, marcasConWeb } from "@/lib/marcas-server";
import { mlConectado } from "@/lib/mercadolibre";
import { leerLink } from "@/lib/web-de-marca";
import { conRegistro } from "@/lib/actividad";

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
async function traerFotoFV__(
  itemId: string,
  aunqueSeaDeOtraTerminacion = false,
  reemplazar = false,
): Promise<ResultadoFotoFV> {
  const session = await getAdminSession();
  if (!session) return { ok: false, motivo: "no autorizado" };
  const r = await agregarFotoDeFV(itemId, { aunqueSeaDeOtraTerminacion, reemplazar });
  if (r.ok) refrescar(itemId);
  return r;
}

/** "Buscar en la web" al lado de la descripcion, en la ficha del panel,
 *  cuando el articulo es FV: primero se prueba aca.
 *  NO guarda: devuelve el texto para ponerlo en el cuadro, que se revisa y
 *  se guarda con el boton de siempre (igual que el de la IA). */
async function descripcionDeFV__(
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
  /** Cuantas fotos tiene ya. */
  fotos: number;
  /** El fabricante: "FV", "Piazza". */
  marca: string;
};

/** Los articulos de las marcas con pagina (FV, Piazza) sin foto o sin
 *  descripcion. Se guia por la marca cargada (Product.brand), no por el
 *  titulo. */
async function fvIncompletos__(
  /** Tambien los que tienen UNA sola foto, para sumarles las otras del
   *  modelo (Damian, 17/11/2026: "que traiga mas de 1 foto del modelo"). */
  galeria = false,
): Promise<Incompleto[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const conWeb = await marcasConWeb();
  // Con MercadoLibre conectado se puede buscar cualquier marca; sin, solo las
  // que tienen su pagina cargada.
  const ml = await mlConectado();
  const filas = await prisma.product.findMany({
    where: {
      brand: ml ? { not: null } : { in: [...conWeb.keys()] },
      ...(galeria
        ? {}
        : {
            OR: [{ images: { none: {} } }, { description: null }, { description: "" }],
          }),
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
  return filas
    .filter((p) => !galeria || p._count.images < 2 || !p.description?.trim())
    .map((p) => ({
    itemId: p.itemId,
    title: p.title,
    fotos: p._count.images,
    faltaFoto: galeria ? p._count.images < 2 : p._count.images === 0,
    faltaDescripcion: !p.description?.trim(),
    marca: (p.brand && (conWeb.get(p.brand)?.name ?? (ml ? "MercadoLibre" : ""))) || "",
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

async function completarFVEnTanda__(
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
async function terminarFV__(): Promise<void> {
  const session = await getAdminSession();
  if (!session) return;
  refrescar();
}

/** Las marcas SIN pagina web cargada que tienen articulos sin foto: para
 *  avisar en la pantalla que, cargandoles la web en Marcas, tambien se
 *  pueden buscar. */
async function marcasSinWebConFaltantes__(): Promise<{ id: string; name: string; sinFoto: number }[]> {
  const session = await getAdminSession();
  if (!session) return [];
  // Con MercadoLibre conectado no hay a quien avisar: se buscan todas.
  if (await mlConectado()) return [];
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

/** "Traer desde un link" de la ficha: lee la pagina que pego Damian, suma sus
 *  fotos a la galeria y devuelve la descripcion para el cuadro (no la guarda:
 *  se revisa y se guarda con el boton de siempre). */
async function traerDeUnLink__(
  itemId: string,
  link: string,
): Promise<
  | {
      ok: true;
      agregadas: number;
      principal: boolean;
      descripcion: string | null;
      nombre: string;
      ficha: string;
      /** El link era directo a una foto. */
      soloFoto?: boolean;
    }
  | { ok: false; motivo: string }
> {
  const session = await getAdminSession();
  if (!session) return { ok: false, motivo: "no autorizado" };
  const d = await leerLink(link);
  if (!d.encontrado || (!d.nombre && !d.soloFoto))
    return { ok: false, motivo: d.motivo ?? "no se pudo leer esa página" };
  const ficha = d.ficha ?? link;
  let web = "";
  try {
    web = new URL(ficha).origin;
  } catch {
    /* sin web, no se bajan fotos */
  }
  const fotos = web ? await agregarFotosDeUnLink(itemId, d.fotos ?? [], web) : { agregadas: 0, principal: false };
  if (fotos.agregadas > 0) refrescar(itemId);
  return {
    ok: true,
    agregadas: fotos.agregadas,
    principal: fotos.principal,
    descripcion: d.descripcion ?? null,
    nombre: d.nombre ?? "",
    ficha,
    ...(d.soloFoto ? { soloFoto: true } : {}),
  };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function traerFotoFV(...a: Parameters<typeof traerFotoFV__>): ReturnType<typeof traerFotoFV__> {
  return conRegistro("traerFotoFV", a, () => traerFotoFV__(...a));
}
export async function descripcionDeFV(...a: Parameters<typeof descripcionDeFV__>): ReturnType<typeof descripcionDeFV__> {
  return conRegistro("descripcionDeFV", a, () => descripcionDeFV__(...a));
}
export async function fvIncompletos(...a: Parameters<typeof fvIncompletos__>): ReturnType<typeof fvIncompletos__> {
  return conRegistro("fvIncompletos", a, () => fvIncompletos__(...a));
}
export async function completarFVEnTanda(...a: Parameters<typeof completarFVEnTanda__>): ReturnType<typeof completarFVEnTanda__> {
  return conRegistro("completarFVEnTanda", a, () => completarFVEnTanda__(...a));
}
export async function terminarFV(...a: Parameters<typeof terminarFV__>): ReturnType<typeof terminarFV__> {
  return conRegistro("terminarFV", a, () => terminarFV__(...a));
}
export async function marcasSinWebConFaltantes(...a: Parameters<typeof marcasSinWebConFaltantes__>): ReturnType<typeof marcasSinWebConFaltantes__> {
  return conRegistro("marcasSinWebConFaltantes", a, () => marcasSinWebConFaltantes__(...a));
}
export async function traerDeUnLink(...a: Parameters<typeof traerDeUnLink__>): ReturnType<typeof traerDeUnLink__> {
  return conRegistro("traerDeUnLink", a, () => traerDeUnLink__(...a));
}
