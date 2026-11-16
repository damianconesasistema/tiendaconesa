// Leer la pagina de FV y armar el titulo. Solo texto: aca no hay red ni base,
// asi se puede probar con las paginas guardadas.
//
// Por que la pagina de FV y no un buscador: en un buscador comun los codigos
// FV casi no aparecen (buscando "Malena 0109/16-CCC" salian barcos). La web
// de FV tiene buscador por codigo y cada ficha trae el nombre oficial, la
// linea y una foto POR TERMINACION, con el codigo completo de cada una
// ("0310/L2-CR"). Son datos del fabricante: no hay nada que inventar.
//
// Lo que se armo con Damian el 16/11/2026:
//   - el titulo arranca con el rubro y el subrubro, como titulan las tiendas
//     grandes, y NUNCA lleva el nombre de otra tienda;
//   - el codigo va COMPLETO, como lo escribe FV ("0109/16-CCC": el CCC es
//     parte del codigo, no se traduce);
//   - si la terminacion es una que se conoce con certeza, se agrega la
//     palabra al lado ("Cromo"), sin sacar nada del codigo.

import { nombreSubrubro, subrubrosDe } from "@/lib/subrubros";

export const FV_HOST = "fvsa.com";

/** FV no borra lo que deja de fabricar: lo deja con "DISCONTINUADO –"
 *  adelante del nombre. Siguen teniendo nombre y foto, y Conesa todavia tiene
 *  stock de varios (de los 121 FV de noviembre, unos 25). Se leen igual; la
 *  palabra no va al titulo, pero se avisa en pantalla: es stock que no se
 *  repone. */
const DISCONTINUADO = /^DISCONTINUAD[OA]\b\s*[–-]?\s*/i;

/** Terminaciones que se traducen. Solo las confirmadas en material de FV;
 *  las demas quedan como codigo, que es lo que pidio Damian. */
const TERMINACIONES: Readonly<Record<string, string>> = {
  CR: "Cromo",
  NG: "Negro mate",
};

export type ResultadoFV = {
  /** "0310/L2 Epuyén – Juego monocomando para bañera y ducha" */
  titulo: string;
  ficha: string;
  /** La foto de la tarjeta, en tamaño completo. */
  foto: string | null;
  /** Producto con varias terminaciones: la foto de cada una esta en la ficha. */
  variable: boolean;
  /** FV ya no lo fabrica. */
  discontinuado: boolean;
};

export type TituloFV = { codigo: string; linea: string; tipo: string };

/** "0310/L2-CR" -> "0310/L2". Lo que FV usa para buscar. */
export function codigoBase(codigo: string): string {
  return String(codigo || "").trim().split("-")[0].trim();
}

/** "0207/C3-CR" -> "Cromo". Null si la ultima parte no es una que se conoce. */
export function terminacionDe(codigo: string): string | null {
  const partes = String(codigo || "").trim().toUpperCase().split("-");
  if (partes.length < 2) return null;
  return TERMINACIONES[partes[partes.length - 1].trim()] ?? null;
}

export function decodificar(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/** La foto grande: WordPress agrega "-300x300" a las chicas. */
export function sinTamano(url: string): string {
  return url.replace(/-\d{2,4}x\d{2,4}(\.[a-z]{3,4})(\?.*)?$/i, "$1");
}

/** Los productos de la pagina de busqueda de FV. */
export function leerResultados(html: string): ResultadoFV[] {
  const salida: ResultadoFV[] = [];
  for (const bloque of html.split(/<article\s/i).slice(1)) {
    const art = bloque.split(/<\/article>/i)[0];
    const clase = art.match(/class="([^"]*)"/)?.[1] ?? "";
    // Solo productos: la busqueda tambien devuelve notas y paginas.
    if (!/\bproduct\b/.test(clase)) continue;
    const enlace = art.match(
      /<h3[^>]*class="[^"]*entry-title[^"]*"[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    );
    if (!enlace) continue;
    const titulo = decodificar(enlace[2].replace(/<[^>]+>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    const img = art.match(/<img[^>]*\ssrc="([^"]+)"/i)?.[1] ?? null;
    salida.push({
      titulo,
      ficha: enlace[1],
      foto: img ? sinTamano(decodificar(img)) : null,
      variable: /\bproduct-type-variable\b/.test(clase),
      discontinuado: DISCONTINUADO.test(titulo),
    });
  }
  return salida;
}

/** "0119 – Duchamatic – Ducha de pared" y "0310/L2 Epuyén – Juego ..." son
 *  las dos formas en que FV titula. */
export function partirTitulo(titulo: string): TituloFV {
  const t = titulo.replace(/\s+/g, " ").trim().replace(DISCONTINUADO, "");
  const m = t.match(/^(\d[\dA-Za-z./]*)\s*(.*)$/);
  if (!m) return { codigo: "", linea: "", tipo: t };
  const resto = m[2].replace(/^[–-]\s*/, "").trim();
  const partes = resto.split(/\s+[–-]\s+/).map((p) => p.trim()).filter(Boolean);
  if (partes.length >= 2)
    return { codigo: m[1], linea: partes[0], tipo: partes.slice(1).join(" – ") };
  return { codigo: m[1], linea: "", tipo: partes[0] ?? "" };
}

/** El producto que es, entre los que devolvio la busqueda.
 *
 *  Tiene que coincidir el codigo entero: buscando "0119" FV devuelve tambien
 *  el "0119.02", que es otra ducha. Si no hay uno exacto, no se elige
 *  ninguno: un titulo de otro producto es peor que el titulo de siempre. */
export function elegirResultado(
  resultados: ResultadoFV[],
  codigo: string,
): ResultadoFV | null {
  const base = codigoBase(codigo).toUpperCase();
  return (
    resultados.find((r) => partirTitulo(r.titulo).codigo.toUpperCase() === base) ??
    null
  );
}

const normCodigo = (s: string) => String(s || "").toUpperCase().replace(/\s+/g, "");

/** La foto de la terminacion de ESTE codigo, sacada de la ficha.
 *
 *  Cada terminacion es una variante con su codigo completo ("0310/L2-CR") y
 *  su foto. La foto de la tarjeta de busqueda puede ser de otra: la del
 *  Epuyen es la negra, y el que vende Conesa es cromo. */
export function fotoDeVariante(html: string, codigo: string): string | null {
  const attr = html.match(/data-product_variations="([^"]*)"/);
  if (!attr) return null;
  let variantes: unknown;
  try {
    variantes = JSON.parse(decodificar(attr[1]));
  } catch {
    return null;
  }
  if (!Array.isArray(variantes)) return null;
  const buscado = normCodigo(codigo);
  for (const v of variantes as { sku?: string; image?: { full_src?: string; src?: string } }[]) {
    if (normCodigo(v?.sku ?? "") !== buscado) continue;
    const u = v.image?.full_src || v.image?.src;
    if (u) return sinTamano(u);
  }
  return null;
}

const plano = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** "Juego para lavatorio" dentro del subrubro Lavatorio dice dos veces lo
 *  mismo: queda "Juego". Solo se saca el "para ..." si TODAS sus palabras ya
 *  estan en el subrubro; "para mesada de cocina" se queda entero.
 *
 *  Se compara contra el nombre del subrubro Y sus palabras: FV escribe
 *  "bidé" y el subrubro se llama "Bidet". */
function sinRepetirSubrubro(
  tipo: string,
  rubro: string,
  subrubro: string | null,
): string {
  const s = subrubrosDe(rubro).find((x) => x.slug === subrubro);
  if (!s) return tipo;
  const del = new Set([...plano(s.name).split(" "), ...s.palabras]);
  const todas = (txt: string) => plano(txt).split(" ").every((p) => del.has(p));

  const m = tipo.match(/^(.*?)\s+para\s+(.+)$/i);
  if (m && m[1].trim() && todas(m[2])) return m[1].trim();

  // "Juego para mesada de cocina" en Cocina: queda "Juego para mesada". Solo
  // detras de un "para": "Kit de accesorios" se queda como esta, porque sin
  // el "de accesorios" no se entiende que es.
  const d = tipo.match(/^(.*\bpara\b.*?)\s+de\s+(.+)$/i);
  if (d && todas(d[2])) return d[1].trim();
  return tipo;
}

/** FV llama "Libby Monocomando" a la linea, y el tipo ya dice "Juego
 *  monocomando": saldria dos veces. Se sacan de la linea las palabras que ya
 *  dijo el tipo, dejando siempre la primera, que es el nombre. */
function lineaSinRepetir(linea: string, tipo: string): string {
  const palabras = linea.split(" ").filter(Boolean);
  if (palabras.length <= 1) return linea;
  const enTipo = new Set(plano(tipo).split(" "));
  return [
    palabras[0],
    ...palabras.slice(1).filter((p) => !enTipo.has(plano(p))),
  ].join(" ");
}

/** Lo que el sistema dice y FV no: "EMBUTIR" o "EXTERIOR" distinguen dos
 *  juegos de la misma linea, y en la ficha de FV no siempre aparece. */
function calificativos(tipo: string, descripcionGBP: string): string[] {
  const t = plano(tipo);
  const gbp = ` ${plano(descripcionGBP)} `;
  const extra: string[] = [];
  if (/ embuti/.test(gbp) && !t.includes("embutir")) extra.push("para embutir");
  if (/ exterior /.test(gbp) && !t.includes("exterior")) extra.push("exterior");
  return extra;
}

export type ArmarTitulo = {
  rubroNombre: string;
  rubro: string;
  subrubro: string | null;
  fv: TituloFV;
  /** El codigo completo, como viene del sistema. */
  codigo: string;
  descripcionGBP: string;
};

/** "Grifería Lavatorio – Juego Triades FV 0207/C3-CR Cromo" */
export function armarTitulo(a: ArmarTitulo): string {
  const sub = nombreSubrubro(a.rubro, a.subrubro);
  const tipo = sinRepetirSubrubro(a.fv.tipo, a.rubro, a.subrubro);
  const adelante = [a.rubroNombre, sub].filter(Boolean).join(" ");
  const atras = [
    tipo,
    ...calificativos(a.fv.tipo, a.descripcionGBP),
    lineaSinRepetir(a.fv.linea, a.fv.tipo),
    "FV",
    a.codigo.trim(),
    terminacionDe(a.codigo),
  ]
    .filter(Boolean)
    .join(" ");
  return `${adelante} – ${atras}`.replace(/\s+/g, " ").trim();
}
