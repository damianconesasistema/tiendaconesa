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

/** Subrubros cuyo titulo NO lleva "Rubro Subrubro –" adelante. Damian,
 *  16/11/2026, sobre "Grifería Accesorios – Jabonera Mikka FV 0168/31-CR
 *  Cromo": "eso de Grifería Accesorios no deberia estar en el titulo, sino
 *  el resto como sigue". Una jabonera no es griferia: el titulo arranca por
 *  lo que es. En las canillas ("Grifería Lavatorio – ...") si va. */
const SIN_RUBRO_ADELANTE = new Set(["accesorios"]);

/** "Grifería Lavatorio – Juego Triades FV 0207/C3-CR Cromo"; en accesorios,
 *  "Jabonera Mikka FV 0168/31-CR Cromo". */
export function armarTitulo(a: ArmarTitulo): string {
  const sub = nombreSubrubro(a.rubro, a.subrubro);
  const sinAdelante = SIN_RUBRO_ADELANTE.has(a.subrubro ?? "");
  // Sin el subrubro adelante no hay nada que se repita: el tipo va entero.
  const tipo = sinAdelante ? a.fv.tipo : sinRepetirSubrubro(a.fv.tipo, a.rubro, a.subrubro);
  const adelante = sinAdelante ? "" : [a.rubroNombre, sub].filter(Boolean).join(" ");
  const atras = [
    tipo,
    // Tambien mira la linea: el titulo armado desde GBP ya los pone ahi
    // ("Malena para embutir") y no tienen que salir dos veces.
    ...calificativos(`${a.fv.tipo} ${a.fv.linea}`, a.descripcionGBP),
    lineaSinRepetir(a.fv.linea, a.fv.tipo),
    "FV",
    a.codigo.trim(),
    terminacionDe(a.codigo),
  ]
    .filter(Boolean)
    .join(" ");
  // Mayuscula al arrancar: sin tipo, puede empezar por "para embutir".
  const atrasCap = atras.charAt(0).toUpperCase() + atras.slice(1);
  return (adelante ? `${adelante} – ${atrasCap}` : atrasCap).replace(/\s+/g, " ").trim();
}

/** El titulo con el nombre de la ficha oficial de otro fabricante (Piazza),
 *  con el mismo formato que FV: "Grifería Ducha y bañera – Novara Bañera De
 *  Embutir C/ Transf. Piazza 21006". Los accesorios, sin rubro adelante. */
export function armarTituloDeFabricante(a: {
  rubroNombre: string;
  rubro: string;
  subrubro: string | null;
  /** El nombre como lo escribe el fabricante. */
  nombre: string;
  /** "Piazza" */
  marca: string;
  /** El codigo del fabricante ("21006"), no el de GBP. */
  codigo: string;
}): string {
  const sinAdelante = SIN_RUBRO_ADELANTE.has(a.subrubro ?? "");
  const sub = nombreSubrubro(a.rubro, a.subrubro);
  const adelante = sinAdelante ? "" : [a.rubroNombre, sub].filter(Boolean).join(" ");
  // Si el nombre de la pagina ya dice la marca o el codigo ("Inodoro Ferrum
  // Bari BAR-IN-011"), no se repiten.
  const nombre = a.nombre.trim();
  const norm = (x: string) => ` ${x.toUpperCase().replace(/[^A-Z0-9]+/g, " ").trim()} `;
  const dice = (x: string) => !!x.trim() && norm(nombre).includes(norm(x));
  const atras = [nombre, dice(a.marca) ? "" : a.marca, dice(a.codigo) ? "" : a.codigo.trim()]
    .filter(Boolean)
    .join(" ");
  return (adelante ? `${adelante} – ${atras}` : atras).replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// El titulo de un FV SIN la pagina de FV, con lo que dice el sistema.
//
// Damian, 16/11/2026: "no me estas trayendo los SKU y al titulo hay que
// agregarle Griferia, en el caso de FV". El titulo con el rubro y el codigo
// solo se armaba si se apretaba "Traer de FV" y FV lo encontraba; si no,
// quedaba el de GBP sin el codigo ("ALLEGRO LAVARROPAS FV"). Ahora todo FV
// arranca con el mismo formato, armado con la descripcion de GBP:
//   "ALLEGRO LAVARROPAS FV 0401/15-CR"  ->  linea Allegro, tipo (nada: ya
//   lo dice el subrubro)  ->  "Grifería Lavarropas – Allegro FV 0401/15-CR Cromo"
// Si despues FV lo encuentra, se reemplaza por el de la ficha oficial.
// ---------------------------------------------------------------------------

/** Lo que es el articulo cuando el subrubro no alcanza para decirlo. */
const TIPOS_SUELTOS = new Set([
  "jabonera", "jabonero", "percha", "portarrollo", "portarrollos", "portavaso",
  "portacepillo", "toallero", "toallera", "barral", "repisa", "gancho",
  "dispenser", "canilla", "llave", "grifo", "valvula", "sifon", "flor", "brazo",
]);

const enTitulo = (w: string) =>
  w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

export function tituloFVDesdeGBP(
  descripcion: string,
  codigo: string,
  rubro: string,
  subrubro: string | null,
): TituloFV {
  const texto = String(descripcion || "").replace(/\s+/g, " ").trim();
  // El codigo no va en el nombre: armarTitulo lo pone completo despues de
  // "FV". A veces GBP lo escribe partido ("106/L2 CR") o sin "FV" adelante.
  const base = normCodigo(codigoBase(codigo));
  const esCodigo = (w: string) => {
    const n = normCodigo(w);
    return n === normCodigo(codigo) || (n.length >= 4 && base.endsWith(n.replace(/^0+/, "")));
  };
  // GBP escribe "LINEA TIPO FV CODIGO extra": lo de antes de "FV" es el
  // nombre; lo de despues, el codigo y alguna aclaracion.
  const m = texto.match(/^(.*?)\s*\bFV\b\s*(.*)$/i);
  const antes = (m ? m[1] : texto).trim();
  const despues = m ? m[2] : "";

  // Si el titulo no lleva el subrubro adelante (accesorios), no hay nada que
  // se repita: "Kit 5 Accesorios" se queda entero.
  const sub = SIN_RUBRO_ADELANTE.has(subrubro ?? "")
    ? undefined
    : subrubrosDe(rubro).find((x) => x.slug === subrubro);
  const delSub = new Set(
    sub
      ? [...plano(sub.name).split(" "), ...sub.palabras.flatMap((p) => plano(p).split(" "))]
      : [],
  );
  // Lo que dice que es ("Jabonera") se queda aunque el subrubro lo use para
  // reconocerse: "Accesorios – Allegro" no dice que es una jabonera.
  const repiteSub = (w: string) =>
    delSub.has(plano(w)) && !TIPOS_SUELTOS.has(plano(w));
  const califica = (w: string) => /^(EMBUT|EXTERIOR$)/i.test(w);

  const palabras = antes.split(" ").filter((w) => w && !esCodigo(w));
  // El tipo es la cola: las ultimas palabras que dicen que es.
  let corte = palabras.length;
  while (corte > 0) {
    const w = plano(palabras[corte - 1]);
    if (delSub.has(w) || TIPOS_SUELTOS.has(w)) corte--;
    else break;
  }
  // En el nombre tampoco se repite el subrubro ("Newport Cocina ..." en
  // Cocina), salvo la primera palabra, que es el nombre de la linea.
  let linea = palabras
    .slice(0, corte)
    .filter((w, i) => i === 0 || (!repiteSub(w) && !califica(w)));
  // Lo que ya dice el subrubro no se repite ("Lavatorio – Lavatorio ...").
  let tipo = palabras.slice(corte).filter((w) => !repiteSub(w));
  if (linea.length === 0 && palabras.length > 0) {
    // "DUCHAMATIC FV 0119": no hay otra palabra que sea el nombre.
    linea = palabras.slice(0, 1);
    tipo = palabras.slice(1).filter((w) => !repiteSub(w));
  }

  // Aclaraciones despues del codigo: van detras del nombre, como las pone
  // FV ("Arizona Monocomando", "Alerce Pared"). "SIN DUCHA" va entero: solo
  // "Ducha" diria lo contrario. Las abreviadas con barra ("BAÑ/LAVAT/BIDE")
  // no se entienden y quedan afuera.
  const resto = despues.split(" ").filter((w) => w && !esCodigo(w));
  const extras: string[] = [];
  for (let i = 0; i < resto.length; i++) {
    const w = resto[i];
    if (/^(SIN|CON)$/i.test(w) && resto[i + 1]) {
      extras.push(`${w.toLowerCase()} ${resto[i + 1].toLowerCase()}`);
      i++;
    } else if (/^[A-ZÁÉÍÓÚÑ]{4,}$/i.test(w) && !califica(w)) {
      extras.push(enTitulo(w));
    }
  }
  // Para embutir y exterior, tambien detras del nombre ("Malena para
  // embutir"). armarTitulo ve que ya estan y no los repite.
  const calif: string[] = [];
  if (/\bEMBUT/i.test(texto)) calif.push("para embutir");
  if (/\bEXTERIOR\b/i.test(texto)) calif.push("exterior");

  return {
    codigo: codigoBase(codigo),
    linea: [...linea.map(enTitulo), ...extras, ...calif].join(" "),
    tipo: tipo.map(enTitulo).join(" "),
  };
}

// ---------------------------------------------------------------------------
// La descripcion, sacada de la ficha de FV.
//
// Damian, 16/11/2026: "faltaria que me traigas la descripcion de los
// articulos desde la pagina o internet". La ficha de FV tiene un parrafo
// ("Juego monocomando para lavatorio. Desagüe con tapita.") y una tabla de
// caracteristicas. Se arma un texto simple, con saltos de linea, que es como
// la tienda muestra la descripcion (whitespace-pre-line en ProductDetail).
//
// De la tabla NO van:
// - Color: lista los de todas las terminaciones ("Negro Mate, Brushed
//   Brass, Cromo") y el articulo es uno solo. Va la terminacion del codigo.
// - Linea y Estilos: la linea ya esta en el titulo; estilos es de la web.
// ---------------------------------------------------------------------------

/** Los rotulos de la tabla de FV, en el orden en que se muestran. */
const CARACTERISTICAS = [
  "Tipo",
  "Instalación",
  "Diseño",
  "Tecnología",
  "Prestaciones",
  "Caudal",
] as const;

const sinAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

function textoDe(html: string): string {
  return decodificar(html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();
}

/** El parrafo de la pestaña "Descripción". Si no esta, el resumen corto de
 *  arriba de la ficha. */
function parrafoDescripcion(html: string): string | null {
  // El panel de la pestaña "Descripción": se lo encuentra por su titulo
  // (el h4 del panel, no la lista de pestañas de arriba) y se corta en el
  // panel siguiente.
  const titulo = html.match(
    /<h4 class="vc_tta-panel-title">[\s\S]{0,300}?Descripci(ó|o|&oacute;)n[\s\S]*?<\/h4>/i,
  );
  const i = titulo?.index ?? -1;
  if (titulo && i >= 0) {
    const resto = html.slice(i + titulo[0].length);
    const fin = resto.search(/<div class="vc_tta-panel[ "]/);
    const panel = fin >= 0 ? resto.slice(0, fin) : resto.slice(0, 8000);
    // Solo la primera columna de texto: despues vienen "Otros productos de
    // esta linea" y cosas de la web.
    const col = panel.match(/<div class="wpb_text_column[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
    const parrafos = [...(col ? col[1] : "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => textoDe(m[1]))
      .filter(Boolean);
    if (parrafos.length) return parrafos.join("\n");
  }
  const corta = html.match(
    /<div[^>]*woocommerce-product-details__short-description[^>]*>([\s\S]*?)<\/div>/i,
  );
  const t = corta ? textoDe(corta[1]) : "";
  return t || null;
}

/** Las filas de la tabla de caracteristicas: [rotulo, valor]. */
function tablaDeCaracteristicas(html: string): [string, string][] {
  const tabla = html.match(/<table[^>]*shop_attributes[^>]*>([\s\S]*?)<\/table>/i);
  if (!tabla) return [];
  return [...tabla[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)]
    .map((m) => [textoDe(m[1]), textoDe(m[2])] as [string, string])
    .filter(([r, v]) => r && v);
}

/** Primera letra en mayuscula y el resto en minuscula: FV mezcla
 *  ("Cierre Cerámico", "Fácil limpieza") y en la tienda queda desparejo. */
const prolijo = (v: string) => {
  const t = v.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** La descripcion lista para guardar, o null si la ficha no trae nada. */
export function leerDescripcion(html: string, codigo: string): string | null {
  const parrafo = parrafoDescripcion(html);
  const filas = tablaDeCaracteristicas(html);
  const lineas: string[] = [];
  const dichos = new Set<string>();
  for (const rotulo of CARACTERISTICAS) {
    const fila = filas.find(([r]) => sinAcento(r) === sinAcento(rotulo));
    if (!fila) continue;
    // FV pone "Cierre cerámico" en Tipo y en Tecnologia: una vez alcanza.
    const valor = prolijo(fila[1]);
    if (dichos.has(sinAcento(valor))) continue;
    dichos.add(sinAcento(valor));
    lineas.push(`• ${rotulo}: ${valor}`);
  }
  const terminacion = terminacionDe(codigo);
  if (terminacion) lineas.push(`• Terminación: ${terminacion}`);
  if (!parrafo && lineas.length === 0) return null;
  lineas.push(`• Código FV: ${String(codigo || "").trim()}`);
  return [parrafo, lineas.length ? `Características:\n${lineas.join("\n")}` : null]
    .filter(Boolean)
    .join("\n\n");
}
