// El logo de una marca, traido de su propia pagina web.
//
// Damian, 17/11/2026, mirando la lista de Marcas con varias "sin logo": "a
// estas marcas le podes agregar el logo de la misma pagina automaticamente".
// Se busca en la pagina de inicio de la marca (la que esta cargada en
// Marcas): primero el logo que la empresa declara para Google (JSON-LD
// "Organization"), despues las imagenes que dicen "logo" en el encabezado.
// Se baja, se recorta el borde vacio, se pasa a PNG de 160 px de alto y se
// guarda en la tabla Setting (no hay disco propio: la tienda vive en una
// maquina que se reemplaza en cada publicacion). Se sirve en
// /api/marcas/logo/<id>.

import sharp from "sharp";
import { decodificar } from "@/lib/fv-ficha";
import { setSetting } from "@/lib/settings";
import { claveDelLogo, rutaDelLogo, SETTING_MARCAS_LOGO, versionesDeLogos } from "@/lib/marcas-server";
import {
  absoluta,
  json,
  origenDeLaWeb,
  pedir,
  primeraImagen,
  urlPublica,
} from "@/lib/web-de-marca";

const ESPERA = 15_000;
const TOPE_BYTES = 3 * 1024 * 1024;

/** Donde puede estar el logo en el HTML de una pagina, del mas seguro al
 *  menos. */
export function logosDeLaPagina(html: string, url: string): string[] {
  const candidatos: { src: string; puntos: number }[] = [];
  const sumar = (src: string | null | undefined, puntos: number) => {
    const crudo = decodificar(String(src ?? "")).trim();
    // Un JSON que no se pudo leer no es una direccion.
    if (/[{}"]/.test(crudo)) return;
    const a = absoluta(crudo, url);
    if (!a || /^data:/i.test(a)) return;
    const ya = candidatos.find((c) => c.src === a);
    if (ya) ya.puntos = Math.max(ya.puntos, puntos);
    else candidatos.push({ src: a, puntos });
  };

  // 1. El logo que la empresa le declara a Google.
  const juntar = (x: unknown): void => {
    if (Array.isArray(x)) return x.forEach(juntar);
    if (!x || typeof x !== "object") return;
    const o = x as Record<string, unknown>;
    if (Array.isArray(o["@graph"])) (o["@graph"] as unknown[]).forEach(juntar);
    if (o.logo) sumar(primeraImagen(o.logo), 10);
    if (o.publisher) juntar(o.publisher);
  };
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ))
    juntar(json(m[1].trim()));

  // 2. Las imagenes que dicen "logo" (clase, id, texto alternativo o nombre
  //    del archivo). Valen mas si estan en el encabezado; las del pie suelen
  //    ser de medios de pago o de otras empresas.
  const finDelEncabezado = (() => {
    const i = html.search(/<\/header>/i);
    return i > 0 ? i : Math.min(html.length, 40_000);
  })();
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (n: string) =>
      tag.match(new RegExp(`\\s${n}\\s*=\\s*["']([^"']+)["']`, "i"))?.[1] ?? null;
    // Algunas paginas (Roca) ponen en el atributo un JSON con la direccion
    // adentro: {"name":"roca-logo.svg",...,"url":"/documents/d/roca/roca-logo"}.
    const direccion = (v: string | null): string | null => {
      if (!v) return null;
      const t = decodificar(v).trim();
      if (!t.startsWith("{")) return t;
      const o = json<{ url?: unknown }>(t);
      return typeof o?.url === "string" ? o.url : null;
    };
    const src =
      [attr("data-src"), attr("data-lazy-src"), attr("src"), attr("srcset")?.split(/[\s,]+/)[0] ?? null]
        .map(direccion)
        .find((x): x is string => !!x) ?? null;
    if (!src) continue;
    const textos = `${attr("class") ?? ""} ${attr("id") ?? ""} ${attr("alt") ?? ""} ${decodificar(tag).match(/"name":"([^"]+)"/)?.[1] ?? ""}`.toLowerCase();
    // El nombre del archivo, y la carpeta de arriba: Roca lo guarda como
    // ".../roca-logo.svg/4dc29d13-...".
    const archivo = src.toLowerCase().split("?")[0].split("/").slice(-2).join("/");
    let puntos = 0;
    if (/logo/.test(textos)) puntos += 4;
    if (/logo/.test(archivo)) puntos += 3;
    if (puntos === 0) continue;
    if ((m.index ?? 0) < finDelEncabezado) puntos += 2;
    if (/footer|pie|partner|cliente|pago|payment|mercado|visa|master|afip|fiscal|qr|whatsapp/.test(`${textos} ${archivo}`))
      puntos -= 5;
    // Con fondo transparente se ve bien en cualquier lado; un JPG trae su
    // fondo (Peirano: letras blancas sobre negro). Y la version blanca del
    // logo, sobre la tienda blanca, no se ve.
    if (/\.(svg|png|webp)$/.test(archivo)) puntos += 1;
    if (/\.jpe?g$/.test(archivo)) puntos -= 1;
    if (/blanco|white|negativo|inverse|(^|[-_])w\.\w+$/.test(archivo)) puntos -= 2;
    sumar(src, puntos);
  }
  return candidatos
    .filter((c) => c.puntos > 0)
    .sort((a, b) => b.puntos - a.puntos)
    .map((c) => c.src)
    .slice(0, 5);
}

async function bajar(url: string): Promise<Buffer | null> {
  if (!(await urlPublica(url))) return null;
  try {
    const r = await fetch(url, {
      headers: { Accept: "image/*" },
      signal: AbortSignal.timeout(ESPERA),
      cache: "no-store",
      redirect: "follow",
    });
    if (!r.ok) return null;
    const tipo = r.headers.get("content-type") ?? "";
    if (!/^image\//i.test(tipo) && !/\.(png|jpe?g|webp|gif|svg|avif)(\?|$)/i.test(url)) return null;
    const largo = Number(r.headers.get("content-length") ?? 0);
    if (largo > TOPE_BYTES) return null;
    const b = Buffer.from(await r.arrayBuffer());
    return b.length > 0 && b.length <= TOPE_BYTES ? b : null;
  } catch {
    return null;
  }
}

/** La imagen lista para la tienda: sin borde vacio, PNG, 160 px de alto.
 *  `blanco`: lo que se ve es casi todo blanco (la version para fondos
 *  oscuros), que sobre la tienda blanca no se veria. */
async function prolijo(b: Buffer): Promise<{ png: Buffer; blanco: boolean } | null> {
  try {
    const { data, info } = await sharp(b, { density: 300 })
      .trim({ threshold: 10 })
      .resize({ height: 160, width: 640, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    // Un pixel de seguimiento o un icono diminuto no es un logo.
    if (info.width < 40 || info.height < 16) return null;
    const crudo = await sharp(data).ensureAlpha().raw().toBuffer();
    let luz = 0;
    let vistos = 0;
    for (let i = 0; i < crudo.length; i += 4) {
      if (crudo[i + 3] < 128) continue;
      luz += 0.299 * crudo[i] + 0.587 * crudo[i + 1] + 0.114 * crudo[i + 2];
      vistos++;
    }
    return { png: data, blanco: vistos > 0 && luz / vistos > 235 };
  } catch {
    return null;
  }
}

export type LogoTraido = { ok: true; ruta: string; desde: string } | { ok: false; motivo: string };

/** Busca el logo en la pagina de la marca y lo guarda. */
export async function traerLogoDeLaWeb(id: string, web: string): Promise<LogoTraido> {
  const base = origenDeLaWeb(web);
  if (!base) return { ok: false, motivo: "la marca no tiene página web cargada" };
  const r = await pedir(base.toString());
  if (!r || r.status !== 200) return { ok: false, motivo: `${base.hostname} no contestó` };
  const candidatos = logosDeLaPagina(r.texto, r.url);
  if (candidatos.length === 0) return { ok: false, motivo: `no encontré el logo en ${base.hostname}` };
  let blanco: { png: Buffer; url: string } | null = null;
  for (const url of candidatos) {
    const crudo = await bajar(url);
    const listo = crudo ? await prolijo(crudo) : null;
    if (!listo) continue;
    if (listo.blanco) {
      blanco ??= { png: listo.png, url };
      continue;
    }
    return { ok: true, ruta: await guardarLogo(id, listo.png), desde: url };
  }
  if (blanco) return { ok: true, ruta: await guardarLogo(id, blanco.png), desde: blanco.url };
  return { ok: false, motivo: `encontré imágenes en ${base.hostname} pero ninguna sirve como logo` };
}

async function guardarLogo(id: string, png: Buffer): Promise<string> {
  await setSetting(claveDelLogo(id), png.toString("base64"));
  const v = await versionesDeLogos();
  v[id] = Date.now();
  await setSetting(SETTING_MARCAS_LOGO, JSON.stringify(v));
  return rutaDelLogo(id, v[id]);
}

/** El logo que sube Damian desde la compu. Damian, 18/11/2026: "en marcas
 *  dejame editar los logos trayendo yo la imagen del logo, porque a veces
 *  carga cualquier cosa". Mismo tratamiento que el traido de la web: sin
 *  borde vacio, PNG de 160 px de alto. */
export async function guardarLogoSubido(
  id: string,
  imagen: Buffer,
): Promise<{ ok: true; ruta: string } | { ok: false; motivo: string }> {
  const listo = await prolijo(imagen);
  if (!listo) return { ok: false, motivo: "esa imagen no se pudo leer o es demasiado chica" };
  return { ok: true, ruta: await guardarLogo(id, listo.png) };
}

/** Saca el logo traido de la web (vuelve al del codigo, si tenia). */
export async function quitarLogo(id: string): Promise<void> {
  const v = await versionesDeLogos();
  delete v[id];
  await setSetting(SETTING_MARCAS_LOGO, JSON.stringify(v));
  await setSetting(claveDelLogo(id), "");
}
