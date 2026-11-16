import { prisma } from "@/lib/db";
import { processProductImage } from "@/lib/image-processing";
import {
  FV_HOST,
  codigoBase,
  elegirResultado,
  fotoDeVariante,
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
    if (r.variable) {
      // Varias terminaciones: la foto buena esta en la ficha, por codigo.
      const ficha = await pedir(r.ficha);
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
    };
  }
  memoria.set(completo.toUpperCase(), { cuando: Date.now(), datos });
  return datos;
}

/** Una foto es de FV si es https y del dominio de FV. Nada mas se descarga. */
export function esFotoDeFV(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      (u.hostname === FV_HOST || u.hostname.endsWith(`.${FV_HOST}`))
    );
  } catch {
    return false;
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

    const r = await fetch(url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    const tipo = r.headers.get("content-type") || "";
    if (!r.ok || !tipo.startsWith("image/")) return false;
    const crudo = Buffer.from(await r.arrayBuffer());
    if (crudo.length === 0 || crudo.length > 10 * 1024 * 1024) return false;

    const { data, contentType } = await processProductImage(crudo);
    await prisma.productImage.create({
      data: { productId: producto.id, data, contentType, position: 0 },
    });
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: `/api/productos/${itemId}/imagen?v=${Date.now()}` },
    });
    return true;
  } catch {
    return false;
  }
}
