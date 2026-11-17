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
import { buscarEnPiazza } from "@/lib/piazza";
import { getMarcas, marcasConWeb } from "@/lib/marcas-server";
import { buscarEnMercadoLibre, fotoDeMercadoLibre, mlConectado } from "@/lib/mercadolibre";
import {
  buscarArticuloDeLaMarca,
  codigosDelArticulo,
  fotoDeLaMarca,
  urlPublica,
} from "@/lib/web-de-marca";

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
  /** Todas las fotos del modelo (Piazza y las otras marcas traen varias; FV
   *  tiene una por terminacion). */
  fotos?: string[];
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
  web?: string | null,
): Promise<{ data: Buffer; contentType: string } | null> {
  if (!esFotoDeFV(url) && !fotoDeLaMarca(url, web) && !fotoDeMercadoLibre(url)) return null;
  // Nunca a la red interna del servidor, aunque el nombre lo disfrace.
  if (!(await urlPublica(url))) return null;
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
  /** Las otras fotos del modelo, despues de la principal. */
  extras: string[] = [],
  /** La pagina de donde salieron, si se pego un link: valen sus fotos. */
  otraWeb?: string | null,
): Promise<boolean> {
  try {
    const producto = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true, brand: true, _count: { select: { images: true } } },
    });
    if (!producto || producto._count.images > 0) return false;
    // De FV o Piazza, o de la pagina de la marca del articulo. Nada mas.
    const web = producto.brand ? (await marcasConWeb()).get(producto.brand)?.web : undefined;
    const valeDe = fotoDeLaMarca(url, web) ? web : otraWeb && fotoDeLaMarca(url, otraWeb) ? otraWeb : web;
    if (!esFotoDeFV(url) && !fotoDeLaMarca(url, valeDe) && !fotoDeMercadoLibre(url)) return false;

    const foto = await bajarFotoDeFV(url, valeDe);
    if (!foto) return false;
    await prisma.productImage.create({
      data: { productId: producto.id, data: foto.data, contentType: foto.contentType, position: 0 },
    });
    // Las demas del modelo, atras. Si alguna no baja, no pasa nada.
    const yaTiene: Buffer[] = [foto.data];
    let posicion = 1;
    for (const otra of extras.slice(0, 5)) {
      if (!esFotoDeFV(otra) && !fotoDeLaMarca(otra, valeDe) && !fotoDeMercadoLibre(otra)) continue;
      const f = await bajarFotoDeFV(otra, valeDe);
      if (!f || yaTiene.some((b) => b.equals(f.data))) continue;
      await prisma.productImage.create({
        data: { productId: producto.id, data: f.data, contentType: f.contentType, position: posicion++ },
      });
      yaTiene.push(f.data);
    }
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
// La ficha del fabricante de un articulo YA CARGADO, segun su marca.
//
// Damian, 17/11/2026, sobre el boton "Fotos y descripcion FV": "que no diga
// FV porque va a ser para todas las marcas". Hoy se sabe leer la pagina de FV
// y la de Piazza, y cualquier marca con su pagina web cargada en Marcas
// (src/lib/web-de-marca.ts). La foto y la descripcion de
// abajo pasan por aca, asi andan para las dos.
// ---------------------------------------------------------------------------

export type FichaDeFabricante = DatosFV & {
  fabricante: string;
  /** La pagina web de la marca, para validar de donde se baja la foto. */
  web?: string;
  /** La marca no tiene pagina cargada: no se busco en ningun lado. */
  sinPagina?: boolean;
};

/** Donde buscar un articulo ya cargado, segun su marca:
 *  - FV y Piazza: sus lectores propios, que conocen esas paginas a fondo.
 *  - Cualquier otra con su pagina web cargada en Marcas: el lector general
 *    (src/lib/web-de-marca.ts) y, si ahi no esta, Google.
 *  - Sin pagina cargada: no se busca. */
export async function fichaDelFabricante(itemId: string): Promise<FichaDeFabricante> {
  const p = await prisma.product.findUnique({
    where: { itemId },
    select: { brand: true, title: true, memo: true },
  });
  if (!p) return { encontrado: false, motivo: "no está el artículo", fabricante: "la marca" };
  const conWeb = await marcasConWeb();
  const marca = p.brand ? conWeb.get(p.brand) : undefined;

  // MercadoLibre de respaldo: si la pagina de la marca no lo tiene, o la
  // marca no tiene pagina, se busca la ficha EXACTA en su catalogo
  // (src/lib/mercadolibre.ts). Damian, 17/11/2026: "si no busca en la web de
  // la marca, que busque en mercadolibre, pero tiene que ser exacto".
  const nombreDeLaMarca =
    marca?.name ?? (p.brand ? (await getMarcas()).find((m) => m.id === p.brand)?.name : undefined);
  const enMercadoLibre = async (motivoAntes?: string): Promise<FichaDeFabricante | null> => {
    if (!nombreDeLaMarca || !(await mlConectado())) return null;
    const ml = await buscarEnMercadoLibre({
      marca: nombreDeLaMarca,
      codigos: codigosDelArticulo(`${p.memo ?? ""} ${p.title}`, itemId),
    });
    if (!ml.encontrado)
      return motivoAntes
        ? { encontrado: false, motivo: `${motivoAntes}; ${ml.motivo}`, fabricante: nombreDeLaMarca }
        : null;
    return {
      encontrado: true,
      ficha: ml.ficha,
      foto: ml.foto ?? null,
      fotos: ml.fotos,
      descripcion: ml.descripcion ?? null,
      fabricante: `${nombreDeLaMarca} (MercadoLibre)`,
    };
  };

  if (p.brand === "piazza") {
    // El codigo de Piazza no es el SKU: viene en la descripcion de GBP (que
    // queda en memo al crear por Excel) o en el titulo ("... Piazza 21006").
    const conMemo = p.memo?.trim() ? await buscarEnPiazza(p.memo, itemId) : null;
    const d = conMemo?.encontrado ? conMemo : await buscarEnPiazza(p.title, itemId);
    const r = d.encontrado || !conMemo ? d : conMemo;
    if (!r.encontrado) {
      const ml = await enMercadoLibre(r.motivo);
      if (ml) return ml;
    }
    return {
      encontrado: r.encontrado,
      motivo: r.motivo,
      ficha: r.ficha,
      foto: r.foto ?? null,
      fotos: r.fotos,
      descripcion: r.descripcion ?? null,
      fabricante: "Piazza",
      web: marca?.web,
    };
  }
  // FV: el SKU es el codigo de FV.
  if (p.brand === "fv") {
    const d = await buscarEnFV(itemId);
    if (!d.encontrado) {
      const ml = await enMercadoLibre(d.motivo);
      if (ml) return ml;
    }
    return { ...d, fabricante: "FV", web: marca?.web };
  }

  if (!marca) {
    // Sin pagina cargada: directo a MercadoLibre, si esta conectado.
    const ml = await enMercadoLibre("la marca no tiene cargada su página web");
    if (ml) return ml;
    return {
      encontrado: false,
      sinPagina: true,
      motivo: "la marca no tiene cargada su página web (se carga en Marcas) y MercadoLibre no está conectado",
      fabricante: "la marca",
    };
  }

  const d = await buscarArticuloDeLaMarca({
    web: marca.web,
    marca: marca.name,
    codigos: codigosDelArticulo(`${p.memo ?? ""} ${p.title}`, itemId),
    titulo: p.title,
  });
  return {
    encontrado: d.encontrado,
    motivo: d.motivo,
    ficha: d.ficha,
    foto: d.foto ?? null,
    fotos: d.fotos,
    descripcion: d.descripcion ?? null,
    fabricante: d.fuente === "mercadolibre" ? `${marca.name} (MercadoLibre)` : marca.name,
    web: marca.web,
  };
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
  | {
      ok: true;
      principal: boolean;
      agregadas: number;
      discontinuado?: boolean;
      ficha?: string;
      /** Con "reemplazar": la descripcion de la pagina, para el cuadro. */
      descripcion?: string | null;
      /** Con "reemplazar": cuantas fotos se sacaron. */
      reemplazadas?: number;
    }
  | {
      ok: false;
      motivo: string;
      /** FV la tiene, pero en otra terminacion: se puede pedir igual. */
      deOtraTerminacion?: boolean;
      ficha?: string;
    };

export async function agregarFotoDeFV(
  itemId: string,
  opciones: { aunqueSeaDeOtraTerminacion?: boolean; reemplazar?: boolean } = {},
): Promise<ResultadoFotoFV> {
  const producto = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true, images: { select: { data: true } } },
  });
  if (!producto) return { ok: false, motivo: "no está el artículo" };
  if (!opciones.reemplazar && producto.images.length >= MAX_FOTOS)
    return { ok: false, motivo: `ya tiene ${MAX_FOTOS} fotos, el máximo` };

  const d = await fichaDelFabricante(itemId);
  if (!d.encontrado) return { ok: false, motivo: d.motivo ?? `${d.fabricante} no lo tiene` };
  if (!d.foto)
    return { ok: false, motivo: `${d.fabricante} no tiene foto de este modelo`, ficha: d.ficha };
  if (d.fotoDeOtraTerminacion && !opciones.aunqueSeaDeOtraTerminacion)
    return {
      ok: false,
      motivo: `${d.fabricante} tiene la foto de este modelo pero en otra terminación`,
      deOtraTerminacion: true,
      ficha: d.ficha,
    };

  // Todas las del modelo, no solo la primera (Damian, 17/11/2026: "podes
  // hacer que traiga mas de 1 foto del modelo?"). Hasta llenar la galeria.
  const lista = [...new Set([d.foto, ...(d.fotos ?? [])].filter((f): f is string => !!f))].slice(0, 6);
  // "Reemplazar con lo de la web" (Damian, 17/11/2026: "me trajo un producto
  // que no es, se puede ... buscar nuevamente el producto"). Primero se bajan
  // las nuevas; recien si hay alguna se sacan las que tenia. Si no encuentra
  // el producto exacto o no baja nada, no se toca nada.
  if (opciones.reemplazar) {
    const nuevas: { data: Buffer; contentType: string }[] = [];
    let fallaron = 0;
    for (const url of lista) {
      if (nuevas.length >= MAX_FOTOS) break;
      const foto = await bajarFotoDeFV(url, d.web);
      if (!foto) {
        fallaron++;
        continue;
      }
      if (!nuevas.some((n) => n.data.equals(foto.data))) nuevas.push(foto);
    }
    if (nuevas.length === 0)
      return {
        ok: false,
        motivo: fallaron ? `las fotos de ${d.fabricante} no se pudieron bajar` : `${d.fabricante} no tiene fotos de este modelo`,
        ficha: d.ficha,
      };
    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: producto.id } }),
      ...nuevas.map((f, i) =>
        prisma.productImage.create({
          data: { productId: producto.id, data: f.data, contentType: f.contentType, position: i },
        }),
      ),
      prisma.product.update({ where: { itemId }, data: { imageUrl: rutaFoto(itemId, Date.now()) } }),
    ]);
    return {
      ok: true,
      principal: true,
      agregadas: nuevas.length,
      discontinuado: d.discontinuado,
      ficha: d.ficha,
      descripcion: d.descripcion ?? null,
      reemplazadas: producto.images.length,
    };
  }

  const yaTiene: Buffer[] = producto.images.map((i) => Buffer.from(i.data));
  let posicion = producto.images.length;
  let agregadas = 0;
  let fallidas = 0;
  for (const url of lista) {
    if (posicion >= MAX_FOTOS) break;
    const foto = await bajarFotoDeFV(url, d.web);
    if (!foto) {
      fallidas++;
      continue;
    }
    // Apretar dos veces no las carga dos veces: la misma foto, achicada
    // igual, da exactamente los mismos bytes.
    if (yaTiene.some((b) => b.equals(foto.data))) continue;
    await prisma.productImage.create({
      data: { productId: producto.id, data: foto.data, contentType: foto.contentType, position: posicion++ },
    });
    yaTiene.push(foto.data);
    agregadas++;
  }
  if (agregadas === 0)
    return {
      ok: false,
      motivo: fallidas
        ? `las fotos de ${d.fabricante} no se pudieron bajar`
        : `ya tiene las fotos de ${d.fabricante}`,
      ficha: d.ficha,
    };

  const principal = producto.images.length === 0;
  if (principal)
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: rutaFoto(itemId, Date.now()) },
    });
  return { ok: true, principal, agregadas, discontinuado: d.discontinuado, ficha: d.ficha };
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

  const d = await fichaDelFabricante(itemId);
  if (!d.encontrado) return { ok: false, motivo: d.motivo ?? `${d.fabricante} no lo tiene` };
  if (!d.descripcion)
    return { ok: false, motivo: `la ficha de ${d.fabricante} no trae descripción`, ficha: d.ficha };

  await prisma.product.update({
    where: { itemId },
    data: { description: d.descripcion },
  });
  return { ok: true, descripcion: d.descripcion, ficha: d.ficha };
}

// ---------------------------------------------------------------------------
// Fotos de un link pegado a mano (src/lib/web-de-marca.ts, leerLink). Se
// SUMAN a la galeria como las de la pagina de la marca: sin repetir, hasta
// llenarla, la primera de principal si no tenia ninguna.
// ---------------------------------------------------------------------------

export async function agregarFotosDeUnLink(
  itemId: string,
  fotos: string[],
  web: string,
): Promise<{ agregadas: number; principal: boolean; fallidas: number }> {
  const producto = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true, images: { select: { data: true } } },
  });
  if (!producto) return { agregadas: 0, principal: false, fallidas: 0 };
  const yaTiene: Buffer[] = producto.images.map((i) => Buffer.from(i.data));
  let posicion = producto.images.length;
  let agregadas = 0;
  let fallidas = 0;
  for (const url of fotos.slice(0, 6)) {
    if (posicion >= MAX_FOTOS) break;
    const foto = await bajarFotoDeFV(url, web);
    if (!foto) {
      fallidas++;
      continue;
    }
    if (yaTiene.some((b) => b.equals(foto.data))) continue;
    await prisma.productImage.create({
      data: { productId: producto.id, data: foto.data, contentType: foto.contentType, position: posicion++ },
    });
    yaTiene.push(foto.data);
    agregadas++;
  }
  const principal = producto.images.length === 0 && agregadas > 0;
  if (principal)
    await prisma.product.update({ where: { itemId }, data: { imageUrl: rutaFoto(itemId, Date.now()) } });
  return { agregadas, principal, fallidas };
}
