import { rutaFoto } from "@/lib/rutas-producto";
import { prisma } from "@/lib/db";
import { processProductImage } from "@/lib/image-processing";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-images";
import {
  FV_HOST,
  codigoBase,
  elegirResultado,
  fotoDeVariante,
  leerDescripcion,
  leerResultados,
  partirTitulo,
  type TituloFV,
} from "@/lib/fv-ficha";

// Ir a buscar a la web de FV. La lectura de las paginas esta en fv-ficha.ts;
// aca solo se piden y se guarda la foto.
//
// Se le pide a una sola direccion, fija (fvsa.com). Nunca a una que venga
// del navegador: la foto que se descarga al crear el articulo se vuelve a
// validar aca contra ese dominio, para que el panel no se convierta en un
// descargador de cualquier cosa.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)";
const ESPERA_MAX = 20_000;

export type DatosFV = {
  encontrado: boolean;
  /** Por que no, en castellano. */
  motivo?: string;
  fv?: TituloFV;
  ficha?: string;
  foto?: string | null;
  /** La foto es de otra terminacion: FV no tiene la de este codigo. */
  fotoDeOtraTerminacion?: boolean;
  /** FV ya no lo fabrica: es stock que no se repone. */
  discontinuado?: boolean;
  /** La descripcion armada con la ficha de FV (fv-ficha.ts, leerDescripcion). */
  descripcion?: string | null;
};

async function pedir(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/** Lo ya buscado, para no volver a pedirlo si se aprieta el boton de nuevo.
 *  Es memoria del proceso: si el servidor reinicia, se vuelve a buscar. */
const memoria = new Map<string, { cuando: number; datos: DatosFV }>();
const VIGENCIA = 60 * 60 * 1000;

export async function buscarEnFV(codigo: string): Promise<DatosFV> {
  const completo = String(codigo || "").trim();
  const base = codigoBase(completo);
  if (!/^\d/.test(base))
    return { encontrado: false, motivo: "no parece un código de FV" };

  const guardado = memoria.get(completo.toUpperCase());
  if (guardado && Date.now() - guardado.cuando < VIGENCIA) return guardado.datos;

  const html = await pedir(`https://${FV_HOST}/?s=${encodeURIComponent(base)}`);
  if (html === null)
    // No se guarda en memoria: es un problema de conexion y conviene reintentar.
    return { encontrado: false, motivo: "la página de FV no contestó" };

  const r = elegirResultado(leerResultados(html), completo);
  let datos: DatosFV;
  if (!r) {
    datos = { encontrado: false, motivo: "FV no lo tiene en su página" };
  } else {
    let foto = r.foto;
    let otra = false;
    // La ficha se pide siempre: de ahi sale la descripcion. Si tiene varias
    // terminaciones, tambien la foto de la de este codigo.
    const ficha = await pedir(r.ficha);
    if (r.variable) {
      const propia = ficha ? fotoDeVariante(ficha, completo) : null;
      if (propia) foto = propia;
      else otra = foto !== null;
    }
    datos = {
      encontrado: true,
      fv: partirTitulo(r.titulo),
      ficha: r.ficha,
      foto,
      fotoDeOtraTerminacion: otra,
      discontinuado: r.discontinuado,
      descripcion: ficha ? leerDescripcion(ficha, completo) : null,
    };
  }
  memoria.set(completo.toUpperCase(), { cuando: Date.now(), datos });
  return datos;
}

/** Las paginas oficiales de las que se bajan fotos: FV y Piazza
 *  (src/lib/piazza.ts). Ninguna otra. */
const HOSTS_DE_FOTOS = [FV_HOST, "piazzagriferia.com"];

/** Una foto se baja solo si es https y de la pagina oficial de un
 *  fabricante de la lista. Nada mas. */
export function esFotoDeFV(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      HOSTS_DE_FOTOS.some((h) => u.hostname === h || u.hostname.endsWith(`.${h}`))
    );
  } catch {
    return false;
  }
}

/** Baja una foto de FV y la deja lista para guardar (achicada y en el
 *  formato de la tienda). null si no es de FV, no baja o no es una imagen. */
async function bajarFotoDeFV(
  url: string,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!esFotoDeFV(url)) return null;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    const tipo = r.headers.get("content-type") || "";
    if (!r.ok || !tipo.startsWith("image/")) return null;
    const crudo = Buffer.from(await r.arrayBuffer());
    if (crudo.length === 0 || crudo.length > 10 * 1024 * 1024) return null;
    const { data, contentType } = await processProductImage(crudo);
    return { data: Buffer.from(data), contentType };
  } catch {
    return null;
  }
}

/** Descarga la foto de FV y la deja como foto principal del articulo, si el
 *  articulo todavia no tiene ninguna. Devuelve si quedo guardada. Nunca
 *  tira: una foto que no baja no puede voltear el alta del articulo. */
export async function guardarFotoDeFV(
  itemId: string,
  url: string,
): Promise<boolean> {
  if (!esFotoDeFV(url)) return false;
  try {
    const producto = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true, _count: { select: { images: true } } },
    });
    if (!producto || producto._count.images > 0) return false;

    const foto = await bajarFotoDeFV(url);
    if (!foto) return false;
    await prisma.productImage.create({
      data: { productId: producto.id, data: foto.data, contentType: foto.contentType, position: 0 },
    });
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: rutaFoto(itemId, Date.now()) },
    });
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Foto de FV para un articulo YA CARGADO.
//
// Damian, 16/11/2026: "podes hacer que levante por el codigo fotos del
// modelo desde la pagina de FV?". Al crear por Excel ya la traia; esto es
// para los que ya estan (el boton de la ficha del panel y la pantalla
// "Fotos de FV"). FV tiene UNA foto por modelo y terminacion (revisado en
// 0103/L8, 0207, 0181, 0411 y 0119): no hay galeria para traer.
//
// Se AGREGA a la galeria, no reemplaza: si no tenia ninguna queda de
// principal; si ya tenia, va al final y se elige desde la ficha. Si FV solo
// tiene la de otra terminacion (pidio negro y hay cromo), no se agrega salvo
// que se pida: un cromo en la ficha de un negro es mostrar otro producto.
// ---------------------------------------------------------------------------

/** Mismo tope que la galeria del panel. */
const MAX_FOTOS = MAX_PRODUCT_IMAGES;

export type ResultadoFotoFV =
  | { ok: true; principal: boolean; discontinuado?: boolean; ficha?: string }
  | {
      ok: false;
      motivo: string;
      /** FV la tiene, pero en otra terminacion: se puede pedir igual. */
      deOtraTerminacion?: boolean;
      ficha?: string;
    };

export async function agregarFotoDeFV(
  itemId: string,
  opciones: { aunqueSeaDeOtraTerminacion?: boolean } = {},
): Promise<ResultadoFotoFV> {
  const producto = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true, images: { select: { data: true } } },
  });
  if (!producto) return { ok: false, motivo: "no está el artículo" };
  if (producto.images.length >= MAX_FOTOS)
    return { ok: false, motivo: `ya tiene ${MAX_FOTOS} fotos, el máximo` };

  const d = await buscarEnFV(itemId);
  if (!d.encontrado) return { ok: false, motivo: d.motivo ?? "FV no lo tiene" };
  if (!d.foto)
    return { ok: false, motivo: "FV no tiene foto de este modelo", ficha: d.ficha };
  if (d.fotoDeOtraTerminacion && !opciones.aunqueSeaDeOtraTerminacion)
    return {
      ok: false,
      motivo: "FV tiene la foto de este modelo pero en otra terminación",
      deOtraTerminacion: true,
      ficha: d.ficha,
    };

  const foto = await bajarFotoDeFV(d.foto);
  if (!foto) return { ok: false, motivo: "la foto de FV no se pudo bajar", ficha: d.ficha };

  // Apretar dos veces no la carga dos veces: la misma foto de FV, achicada
  // igual, da exactamente los mismos bytes.
  if (producto.images.some((i) => Buffer.from(i.data).equals(foto.data)))
    return { ok: false, motivo: "ya tiene esa foto de FV", ficha: d.ficha };

  const principal = producto.images.length === 0;
  await prisma.productImage.create({
    data: {
      productId: producto.id,
      data: foto.data,
      contentType: foto.contentType,
      position: producto.images.length,
    },
  });
  if (principal)
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: rutaFoto(itemId, Date.now()) },
    });
  return { ok: true, principal, discontinuado: d.discontinuado, ficha: d.ficha };
}

// ---------------------------------------------------------------------------
// Descripcion de FV para un articulo YA CARGADO.
//
// Damian, 16/11/2026: "faltaria que me traigas la descripcion de los
// articulos desde la pagina o internet". Solo si el articulo no tiene: una
// descripcion escrita a mano no se pisa nunca desde aca. Para cambiar una que
// ya esta, la ficha del panel tiene "Buscar en la web", que la pone en el cuadro
// para revisarla antes de guardar.
// ---------------------------------------------------------------------------

export type ResultadoDescripcionFV =
  | { ok: true; descripcion: string; ficha?: string }
  | { ok: false; motivo: string; ficha?: string };

export async function agregarDescripcionDeFV(
  itemId: string,
): Promise<ResultadoDescripcionFV> {
  const producto = await prisma.product.findUnique({
    where: { itemId },
    select: { description: true },
  });
  if (!producto) return { ok: false, motivo: "no está el artículo" };
  if (producto.description?.trim())
    return { ok: false, motivo: "ya tiene descripción" };

  const d = await buscarEnFV(itemId);
  if (!d.encontrado) return { ok: false, motivo: d.motivo ?? "FV no lo tiene" };
  if (!d.descripcion)
    return { ok: false, motivo: "la ficha de FV no trae descripción", ficha: d.ficha };

  await prisma.product.update({
    where: { itemId },
    data: { description: d.descripcion },
  });
  return { ok: true, descripcion: d.descripcion, ficha: d.ficha };
}
