// Las opiniones de Google de cada local, para la portada. Damian, 19/11/2026:
// "podriamos agregar las opinion de google positivas en la pagina home" y,
// entre traerlas a mano o automatico: "Automatico de Google".
//
// Salen de Places API (New) de Google, con una clave que carga Damian en
// Panel -> Opiniones (como la de MercadoLibre: se guarda en Setting y nunca
// se vuelve a mostrar).
//
// LAS CONDICIONES DE GOOGLE, que no son opcionales
// (developers.google.com/maps/documentation/places/web-service/policies):
// - Las opiniones NO se guardan en la base. Se guarda solo el codigo del local
//   en Google (place ID), que si se puede guardar para siempre. Las opiniones
//   se piden y quedan en memoria un rato (CADA), que es el "cache temporal
//   para rendimiento" que permiten.
// - Cada opinion va con el nombre, la foto y el link del que la escribio, un
//   link para verla en Google y otro para denunciarla.
// - Va "Google Maps" escrito al lado, y un aviso de como se eligen: aca, solo
//   las de MINIMO estrellas o mas, de las que Google da como mas relevantes
//   (Google da hasta 5 por local).
//
// Costo: cada pedido de un local con opiniones es de la categoria mas cara de
// Places, pero Google da un cupo gratis por mes. Con CADA en 12 horas son unos
// 4 pedidos por local por dia (2 servidores), muy por debajo del cupo.

import { getSetting, setSetting } from "@/lib/settings";

const S_CLAVE = "google_places_key";
const S_CONFIG = "opiniones_google";
const CADA = 12 * 60 * 60 * 1000;
const API = "https://places.googleapis.com/v1";

export type ConfigOpiniones = {
  /** Que local de Google es cada sucursal: slug de Branch -> place ID. */
  lugares: Record<string, string>;
  /** Desde cuantas estrellas se muestran (4 = las de 4 y 5). */
  minimo: number;
  /** Si se muestran en la portada. */
  mostrar: boolean;
};

const PREDETERMINADA: ConfigOpiniones = { lugares: {}, minimo: 4, mostrar: true };

export async function leerConfig(): Promise<ConfigOpiniones> {
  try {
    const c = JSON.parse((await getSetting(S_CONFIG)) || "{}") as Partial<ConfigOpiniones>;
    return {
      lugares: c.lugares && typeof c.lugares === "object" ? c.lugares : {},
      minimo: [3, 4, 5].includes(Number(c.minimo)) ? Number(c.minimo) : 4,
      mostrar: c.mostrar !== false,
    };
  } catch {
    return { ...PREDETERMINADA };
  }
}

export async function guardarConfig(c: ConfigOpiniones) {
  await setSetting(S_CONFIG, JSON.stringify(c));
  enMemoria.clear();
}

async function clave(): Promise<string | null> {
  const k = (await getSetting(S_CLAVE))?.trim();
  return k ? k : null;
}

export async function hayClave(): Promise<boolean> {
  return !!(await clave());
}

export async function guardarClave(k: string) {
  await setSetting(S_CLAVE, k.trim());
  enMemoria.clear();
}

/** Lo que devuelve Google cuando algo sale mal, en castellano. */
function motivo(status: number, cuerpo: string): string {
  if (/API_KEY_INVALID|API key not valid/i.test(cuerpo)) return "Google dice que la clave no es válida. Revisá que esté completa.";
  if (/SERVICE_DISABLED|has not been used|is disabled/i.test(cuerpo))
    return "Falta habilitar \"Places API (New)\" en el proyecto de Google Cloud de esa clave.";
  if (/BILLING|billing/i.test(cuerpo)) return "El proyecto de Google Cloud de esa clave no tiene la facturación activada.";
  if (/referer|IP address|blocked|PERMISSION_DENIED/i.test(cuerpo))
    return "Google rechazó la clave: revisá las restricciones (tiene que permitir Places API (New)).";
  return `Google contestó con un error (${status}).`;
}

async function pedir(ruta: string, init: RequestInit & { campos: string }): Promise<unknown> {
  const k = await clave();
  if (!k) throw new Error("Falta cargar la clave de Google.");
  const r = await fetch(`${API}${ruta}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": k,
      "X-Goog-FieldMask": init.campos,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const cuerpo = await r.text();
  if (!r.ok) throw new Error(motivo(r.status, cuerpo));
  return JSON.parse(cuerpo);
}

export type LugarEncontrado = { id: string; nombre: string; direccion: string };

/** Para elegir el local en el panel: lo que Google encuentra con ese texto. */
export async function buscarLugares(texto: string): Promise<LugarEncontrado[]> {
  const r = (await pedir("/places:searchText", {
    method: "POST",
    body: JSON.stringify({ textQuery: texto, languageCode: "es", regionCode: "AR" }),
    campos: "places.id,places.displayName,places.formattedAddress",
  })) as { places?: { id: string; displayName?: { text?: string }; formattedAddress?: string }[] };
  return (r.places ?? []).slice(0, 8).map((p) => ({
    id: p.id,
    nombre: p.displayName?.text ?? "",
    direccion: p.formattedAddress ?? "",
  }));
}

export type Opinion = {
  autor: string;
  autorLink: string | null;
  autorFoto: string | null;
  estrellas: number;
  texto: string;
  cuando: string;
  link: string | null;
  denunciar: string | null;
  traducida: boolean;
};

export type OpinionesDelLugar = {
  placeId: string;
  nombre: string;
  promedio: number | null;
  total: number;
  linkMaps: string | null;
  linkOpiniones: string | null;
  opiniones: Opinion[];
};

type Respuesta = {
  displayName?: { text?: string };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  googleMapsLinks?: { reviewsUri?: string };
  reviews?: {
    rating?: number;
    relativePublishTimeDescription?: string;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    googleMapsUri?: string;
    flagContentUri?: string;
  }[];
};

// En memoria, nunca en la base (ver arriba).
const enMemoria = new Map<string, { hasta: number; datos: OpinionesDelLugar }>();

/** Las opiniones de un local, todas (sin filtrar por estrellas). */
export async function opinionesDe(placeId: string, { fresco = false } = {}): Promise<OpinionesDelLugar> {
  const ya = enMemoria.get(placeId);
  if (!fresco && ya && ya.hasta > Date.now()) return ya.datos;
  try {
    const r = (await pedir(`/places/${encodeURIComponent(placeId)}?languageCode=es&regionCode=AR`, {
      method: "GET",
      campos: "displayName,rating,userRatingCount,googleMapsUri,googleMapsLinks,reviews",
    })) as Respuesta;
    const datos: OpinionesDelLugar = {
      placeId,
      nombre: r.displayName?.text ?? "",
      promedio: typeof r.rating === "number" ? r.rating : null,
      total: r.userRatingCount ?? 0,
      linkMaps: r.googleMapsUri ?? null,
      linkOpiniones: r.googleMapsLinks?.reviewsUri ?? r.googleMapsUri ?? null,
      opiniones: (r.reviews ?? []).map((o) => ({
        autor: o.authorAttribution?.displayName ?? "Cliente de Google",
        autorLink: o.authorAttribution?.uri ?? null,
        autorFoto: o.authorAttribution?.photoUri ?? null,
        estrellas: Math.round(o.rating ?? 0),
        texto: (o.text?.text ?? o.originalText?.text ?? "").trim(),
        cuando: o.relativePublishTimeDescription ?? "",
        link: o.googleMapsUri ?? null,
        denunciar: o.flagContentUri ?? null,
        traducida:
          !!o.originalText?.languageCode && !!o.text?.languageCode && o.originalText.languageCode !== o.text.languageCode,
      })),
    };
    enMemoria.set(placeId, { hasta: Date.now() + CADA, datos });
    return datos;
  } catch (e) {
    // Si Google no contesta, lo que habia (aunque este vencido) antes que nada.
    if (ya) return ya.datos;
    throw e;
  }
}

export type PortadaOpiniones = {
  minimo: number;
  locales: (OpinionesDelLugar & { sucursal: string })[];
};

/** Lo que va en la portada, o null si no hay nada que mostrar. Nunca tira
 *  error: si Google falla, la portada sale igual, sin este bloque. */
export async function opinionesParaLaPortada(
  sucursales: { slug: string; nombre: string }[],
): Promise<PortadaOpiniones | null> {
  try {
    const c = await leerConfig();
    if (!c.mostrar || !(await hayClave())) return null;
    const locales = (
      await Promise.all(
        sucursales
          .filter((s) => c.lugares[s.slug])
          .map(async (s) => {
            const d = await opinionesDe(c.lugares[s.slug]).catch(() => null);
            if (!d) return null;
            const buenas = d.opiniones.filter((o) => o.estrellas >= c.minimo && o.texto);
            return buenas.length ? { ...d, opiniones: buenas, sucursal: s.nombre } : null;
          }),
      )
    ).filter((x): x is OpinionesDelLugar & { sucursal: string } => !!x);
    return locales.length ? { minimo: c.minimo, locales } : null;
  } catch {
    return null;
  }
}
