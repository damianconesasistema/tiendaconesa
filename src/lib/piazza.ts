import { decodificar } from "@/lib/fv-ficha";

// La pagina de Piazza (piazzagriferia.com), para traer nombre, foto y
// descripcion de un articulo por el codigo del fabricante.
//
// Damian, 16/11/2026, subiendo "pagina srl piazza.xlsx": "deberia buscar bien
// en la web, como se puede hacer para que la carga sea mas facil". Igual que
// FV (src/lib/fv.ts), pero con dos diferencias:
// - En GBP el codigo de Piazza NO es el item_code: es un numero interno del
//   sistema ("10001", "9935"). El del fabricante viene adentro de la
//   descripcion: "(10330)", "21006", "B0900", "10016BL". Se prueban esos.
// - Cada producto tiene su pagina fija por codigo:
//   https://www.piazzagriferia.com/producto/21006/  (en minuscula). No hace
//   falta buscar: se pide esa y si existe, es el.
//
// Se le pide a una sola direccion, fija. Nunca a una que venga del
// navegador: la foto elegida se vuelve a validar contra este dominio antes
// de bajarla (src/lib/fv.ts, esFotoDeFabricante).

export const PIAZZA_HOST = "www.piazzagriferia.com";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)";
const ESPERA_MAX = 20_000;

export type DatosPiazza = {
  encontrado: boolean;
  motivo?: string;
  /** El codigo como lo escribe Piazza ("21006", "B0900", "10016BL"). */
  codigo?: string;
  /** El nombre de la ficha: "Novara Bañera De Embutir C/ Transf." */
  nombre?: string;
  ficha?: string;
  foto?: string | null;
  /** Todas las fotos de la galeria del producto, la principal primero. */
  fotos?: string[];
  /** La categoria de la pagina: "Grifería", "Inodoros", "Bidet"... */
  categoria?: string | null;
  descripcion?: string | null;
};

const texto = (html: string) =>
  decodificar(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();

/** Los codigos de fabricante que puede tener una descripcion de GBP, del
 *  mas probable al menos. Primero lo que esta entre parentesis ("(10330)"),
 *  despues las palabras con numeros, empezando por el final. No: medidas
 *  ("47.5X40.5X15.5", "120X70X39"), ni el item_code de GBP. */
export function codigosCandidatos(descripcion: string, itemCode: string): string[] {
  const t = String(descripcion || "").toUpperCase();
  const propio = String(itemCode || "").trim().toUpperCase();
  const salida: string[] = [];
  const sumar = (c: string) => {
    const limpio = c.replace(/^[.\-/]+|[.\-/]+$/g, "");
    if (
      limpio.length >= 4 &&
      limpio.length <= 12 &&
      /\d/.test(limpio) &&
      /^[A-Z0-9][A-Z0-9.\-/]*$/.test(limpio) &&
      !/\d+(\.\d+)?X\d+/.test(limpio) &&
      !salida.includes(limpio)
    )
      salida.push(limpio);
  };
  for (const m of t.matchAll(/\(([^)]+)\)/g)) sumar(m[1].trim());
  const palabras = t.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of palabras.reverse()) sumar(w);
  // Algunos codigos de GBP llevan el de Piazza adentro: "P03-31400T".
  const enElCodigo = propio.match(/^[A-Z]\d{2}-(.+)$/);
  if (enElCodigo) sumar(enElCodigo[1]);
  // "BO904" escrito con la letra O en vez del cero: los de loza son "B0...".
  for (const c of [...salida]) if (/^BO\d/.test(c)) sumar("B0" + c.slice(2));
  // El item_code de GBP va al final: a veces coincide con el del fabricante
  // ("10001", "10016BL"), pero si no, es un numero interno.
  return [...salida.filter((c) => c !== propio), ...(salida.includes(propio) ? [propio] : [])].slice(0, 3);
}

/** La ficha de un producto de Piazza. null si la pagina no es de un
 *  producto (Piazza contesta "¡Oops! No se encontró la página."). */
export function leerFichaPiazza(html: string, url: string): DatosPiazza | null {
  const sku = html.match(/<span class="sku">([\s\S]*?)<\/span>/i);
  if (!sku) return null;
  const nombre = texto(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  const foto =
    html.match(/data-large_image="([^"]+)"/i)?.[1] ??
    html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ??
    null;
  const categoria = texto(
    html.match(/<span class="posted_in">([\s\S]*?)<\/span>/i)?.[1] ?? "",
  ).replace(/^Categor(í|i)as?:\s*/i, "");

  // El parrafo de la pestaña "Descripción".
  const panel = html.match(/id="tab-description"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ?? "";
  const parrafos = [...panel.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => texto(m[1]))
    .filter(Boolean);

  // Las caracteristicas. La linea no va: ya esta en el nombre.
  const tabla = html.match(/<table[^>]*shop_attributes[^>]*>([\s\S]*?)<\/table>/i)?.[1] ?? "";
  const filas = [...tabla.matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((m) => [texto(m[1]), texto(m[2])] as [string, string])
    .filter(([r, v]) => r && v && !/^l(í|i)nea$/i.test(r));

  const codigo = texto(sku[1]);
  const lineas = [
    ...filas.map(([r, v]) => `• ${r}: ${v.charAt(0).toUpperCase()}${v.slice(1).toLowerCase()}`),
    `• Código Piazza: ${codigo}`,
  ];
  const descripcion = [parrafos.join("\n"), `Características:\n${lineas.join("\n")}`]
    .filter(Boolean)
    .join("\n\n");

  return {
    encontrado: true,
    codigo,
    nombre,
    ficha: url,
    foto: foto ? decodificar(foto) : null,
    // La galeria entera: cada foto grande viene en un data-large_image.
    fotos: [
      ...new Set(
        [...html.matchAll(/data-large_image="([^"]+)"/gi)].map((m) => decodificar(m[1])),
      ),
    ].slice(0, 6),
    categoria: categoria || null,
    descripcion,
  };
}

/** La pagina, "" si Piazza contesto que no existe (404), null si no
 *  contesto (sin conexion, caida). Son cosas distintas: lo primero es "no lo
 *  tiene"; lo segundo conviene reintentarlo. */
async function pedir(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    if (r.status === 404) return "";
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

/** Lo ya buscado, para no volver a pedirlo. Memoria del proceso. */
const memoria = new Map<string, { cuando: number; datos: DatosPiazza }>();
const VIGENCIA = 60 * 60 * 1000;

/** Busca el articulo en la pagina de Piazza con los codigos que aparecen en
 *  su descripcion de GBP. */
export async function buscarEnPiazza(
  descripcion: string,
  itemCode: string,
): Promise<DatosPiazza> {
  const candidatos = codigosCandidatos(descripcion, itemCode);
  if (candidatos.length === 0)
    return { encontrado: false, motivo: "la descripción no trae un código de Piazza" };

  const clave = candidatos.join("|");
  const guardado = memoria.get(clave);
  if (guardado && Date.now() - guardado.cuando < VIGENCIA) return guardado.datos;

  let contesto = false;
  for (const c of candidatos) {
    const url = `https://${PIAZZA_HOST}/producto/${encodeURIComponent(c.toLowerCase())}/`;
    const html = await pedir(url);
    if (html === null) continue;
    contesto = true;
    const ficha = leerFichaPiazza(html, url);
    if (ficha) {
      memoria.set(clave, { cuando: Date.now(), datos: ficha });
      return ficha;
    }
  }
  const datos: DatosPiazza = {
    encontrado: false,
    motivo: contesto
      ? `Piazza no lo tiene en su página (probé ${candidatos.join(", ")})`
      : "la página de Piazza no contestó",
  };
  // Si no contesto, no se guarda: conviene reintentar.
  if (contesto) memoria.set(clave, { cuando: Date.now(), datos });
  return datos;
}

/** El rubro y subrubro que dice la categoria de Piazza, cuando lo dice
 *  claro. "Bidet" mezcla bidets de loza ("B0104", con agujeros) y griferia
 *  de bidet ("10404"): se distinguen por el codigo. */
export function rubroDePiazza(
  categoria: string | null | undefined,
  codigo: string,
  nombre = "",
): { rubro: string; subrubro: string | null } | null {
  const r = rubroDeCategoria(categoria, codigo);
  if (!r || r.rubro !== "griferia" || r.subrubro) return r;
  return { rubro: "griferia", subrubro: subrubroDelNombre(nombre) };
}

/** El subrubro de griferia por el nombre de Piazza. "Lavatorio" va antes
 *  que "mesada": "Temporizado Lavatorio Mesada" es de lavatorio, no de
 *  cocina ("mesada" lo dicen las dos). */
function subrubroDelNombre(nombre: string): string | null {
  const n = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/\blavatorio\b/.test(n)) return "lavatorio";
  if (/\bbide(t)?\b/.test(n)) return "bidet";
  if (/\bcocina\b/.test(n)) return "cocina";
  if (/\b(banera|ducha|duchas)\b/.test(n)) return "ducha-banera";
  if (/\blavarropas\b/.test(n)) return "lavarropas";
  return null;
}

function rubroDeCategoria(
  categoria: string | null | undefined,
  codigo: string,
): { rubro: string; subrubro: string | null } | null {
  const c = (categoria ?? "").toLowerCase();
  const esLoza = /^B0/i.test(codigo);
  if (c.includes("inodoro")) return { rubro: "sanitarios", subrubro: null };
  if (c.includes("receptáculo") || c.includes("receptaculo") || c.includes("platos"))
    return { rubro: "banera", subrubro: null };
  if (c.includes("bidet"))
    return esLoza ? { rubro: "sanitarios", subrubro: null } : { rubro: "griferia", subrubro: "bidet" };
  if (c.includes("bacha")) return { rubro: "piletas", subrubro: null };
  // "Lavatorio mesada": la griferia de lavatorio (los de loza son "B0...").
  if (c.includes("lavatorio"))
    return esLoza ? { rubro: "sanitarios", subrubro: null } : { rubro: "griferia", subrubro: "lavatorio" };
  if (c.includes("bañeras/duchas") || c.includes("banas/duchas") || c.includes("duchas"))
    return { rubro: "griferia", subrubro: "ducha-banera" };
  if (c.includes("accesorio")) return { rubro: "griferia", subrubro: "accesorios" };
  if (c.includes("grifer") || c.includes("temporizado") || c.includes("cocina"))
    return { rubro: "griferia", subrubro: null };
  return null;
}
