// El comparador de precios. Damian, 18/11/2026: "armame un comparador de
// precios con los publicados, para buscar a cuanto los venden ... busque por
// internet el mismo modelo ... ya sea por titulo, codigo de fabricante,
// descripcion".
//
// Donde se busca:
//   - Easy, Blaisten y Carrefour: tiendas hechas con VTEX, que dejan
//     consultar su catalogo con precios (/api/catalog_system/pub/products/search).
//   - Santagal: tienda hecha con WooCommerce, que deja consultar su catalogo
//     con precios (/wp-json/wc/store/v1/products). Damian, 19/11/2026: "tenes
//     Santagal tambien ... muchos lugares para buscar el codigo, titulo,
//     modelo". Su SKU es el codigo de fabrica (FV "0295/D7-CR").
//   - Mas casas de sanitarios (Damian, 19/11/2026: "pone todas las casas de
//     sanitarios que encuentres y busca en ellas los productos por codigo,
//     marca, titulo"): las que dejan consultar su catalogo con precios,
//     segun como esten hechas: VTEX, WooCommerce, PrestaShop (busqueda en
//     JSON), Tiendanube (la busqueda trae cada producto como dato
//     estructurado) y Sodimac (los datos de su pagina de busqueda). Probadas
//     una por una el 19/11/2026. Las que no dejan ver precios, no estan.
//   - Google no: no tiene una forma permitida de pedirle resultados con
//     precios desde un programa.
//   - MercadoLibre: la ficha de catalogo EXACTA (marca + codigo), con los
//     precios de quienes la venden. Solo con la cuenta de Conesa conectada.
//
// Con que se busca: el codigo de fabricante del producto; si no tiene, los
// codigos que se leen en el titulo y la ayuda memoria (la descripcion de GBP);
// y si no hay ningun codigo, las palabras del titulo.
//
// Solo cuenta el MISMO modelo: el resultado nombra el codigo, es de la misma
// marca y el precio tiene sentido (la misma regla que para traer fotos:
// "tiene que ser exacto"). Lo demas no se guarda ni se muestra: Damian,
// 18/11/2026, "los parecidos no esta bueno que aparezcan porque trae
// cualquier cosa". Las palabras del titulo sirven solo para ENCONTRARLO
// cuando la tienda no lo encuentra por el codigo; igual tiene que nombrarlo.
// Un producto sin ningun codigo de modelo no se puede comparar: se avisa
// para que se le cargue el codigo de fabricante.
//
// Los resultados se guardan (tabla Setting) para ver la pantalla sin volver a
// buscar todo.

import { getSetting, setSetting } from "@/lib/settings";
import { codigosDelArticulo, nombraElCodigo } from "@/lib/web-de-marca";
import { preciosEnMercadoLibre, publicacionesEnMercadoLibre } from "@/lib/mercadolibre";

const S_COMPARADOR = "comparador_precios";
// Cuanto se espera a cada tienda. Era 10 s y con 37 tiendas varias quedaban
// como "no contesto" (Damian, 19/11/2026: "hay productos que antes me traias
// de Easy y ahora no").
const ESPERA = 15_000;
/** Cuantas tiendas se consultan a la vez por producto: todas juntas
 *  saturaban la maquina chica del servidor y las respuestas llegaban tarde. */
const A_LA_VEZ = 8;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export const TIENDAS_VTEX = [
  { nombre: "Easy", base: "https://www.easy.com.ar" },
  { nombre: "Blaisten", base: "https://www.blaisten.com.ar" },
  { nombre: "Carrefour", base: "https://www.carrefour.com.ar" },
  { nombre: "Edificor", base: "https://www.edificor.com.ar" },
] as const;

export const TIENDAS_WOO = [
  { nombre: "Santagal", base: "https://santagal.com.ar" },
  { nombre: "Sanitarios Alvarez", base: "https://sanitariosalvarez.com.ar" },
  { nombre: "Daddona", base: "https://www.daddona.com.ar" },
  { nombre: "Accesaniga", base: "https://accesaniga.com.ar" },
  { nombre: "Suriani Bedetti", base: "https://sanitariossuriani.com.ar" },
  { nombre: "Sanitarios José C. Paz", base: "https://sanitariosjosecpaz.com.ar" },
  { nombre: "Rakú", base: "https://raku.store" },
  { nombre: "Soles Pergamino", base: "https://solespergamino.com" },
  { nombre: "Ruco Hogar", base: "https://rucohogar.com.ar" },
  { nombre: "Moro Revestimientos", base: "https://mororevestimientos.com" },
] as const;

export const TIENDAS_PRESTA = [
  { nombre: "DePlano", base: "https://www.deplano.com.ar" },
  { nombre: "Sanitarios Axantra", base: "https://www.sanitariosaxantra.com" },
  { nombre: "Ferrocons", base: "https://www.ferrocons.com.ar" },
  { nombre: "SaniPlast", base: "https://www.saniplast.com.ar" },
] as const;

export const TIENDAS_TIENDANUBE = [
  { nombre: "Casapick", base: "https://casapick.com.ar" },
  { nombre: "Sanige", base: "https://www.sanige.com.ar" },
  { nombre: "Ricardo Ospital", base: "https://ricardoospital.com.ar" },
  { nombre: "Cañoplast", base: "https://canoplast.com" },
  { nombre: "Filhos", base: "https://www.filhossrl.com" },
  { nombre: "Banchero", base: "https://tienda.bancherosanitarios.com.ar" },
  { nombre: "Brufau", base: "https://brufausanitarios.com.ar" },
  { nombre: "Comar Design", base: "https://tienda.comardesign.com.ar" },
  { nombre: "Creta Disegno", base: "https://tienda.cretadisegno.com.ar" },
  { nombre: "Anacleto", base: "https://tienda.grupoanacleto.com.ar" },
  { nombre: "Sanitarios Hogar", base: "https://www.sanitarioshogar.com.ar" },
  { nombre: "Tecnofast", base: "https://www.tecnofast.com.ar" },
  { nombre: "Sanitarios San Martín", base: "https://sanitariossanmartin.mitiendanube.com" },
  { nombre: "Sanitarios Larralde", base: "https://sanitarioslarralde.com.ar" },
  { nombre: "GM Sanitarios", base: "https://www.gmsanitarios.com" },
  { nombre: "Sanicentro", base: "https://sanicentro.com.ar" },
  { nombre: "Cerymat La Plata", base: "https://www.cerymatlaplata.com.ar" },
  { nombre: "Totos Cerámicos", base: "https://www.totosceramicos.com.ar" },
] as const;

export type PrecioAfuera = {
  tienda: string;
  titulo: string;
  precio: number;
  link: string;
  /** Nombra el mismo codigo: es el mismo modelo. */
  exacto: boolean;
  /** Sin codigo de modelo: es el mismo por el nombre (todas sus medidas y
   *  casi todas sus palabras), la marca y un precio cercano. */
  porNombre?: boolean;
  /** Esa tienda no contesto en la ultima busqueda: es lo que habia traido
   *  la vez anterior (ISO). */
  anterior?: string;
};

export type Comparacion = {
  /** ISO. */
  fecha: string;
  /** Con que se busco. */
  buscado: string[];
  resultados: PrecioAfuera[];
  /** Las tiendas que no contestaron. */
  fallaron: string[];
  /** No tiene codigo de modelo: sin eso no hay "mismo modelo" que buscar. */
  sinCodigo?: boolean;
};

type ProductoVtex = {
  productName?: string;
  brand?: string;
  productReference?: string;
  description?: string;
  link?: string;
  items?: {
    name?: string;
    referenceId?: { Value?: string }[];
    sellers?: { commertialOffer?: { Price?: number; AvailableQuantity?: number } }[];
  }[];
};

async function buscarEnVtex(base: string, termino: string): Promise<ProductoVtex[] | null> {
  try {
    const r = await fetch(
      `${base}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(termino)}&_from=0&_to=9`,
      {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(ESPERA),
        cache: "no-store",
      },
    );
    if (!r.ok && r.status !== 206) return null;
    const j = (await r.json()) as unknown;
    return Array.isArray(j) ? (j as ProductoVtex[]) : [];
  } catch {
    return null;
  }
}

/** Un producto de cualquier tienda, en un mismo formato. `fuerte`: donde
 *  tiene que estar el codigo (nombre, referencia, SKU); `texto`: eso mas la
 *  marca y el detalle, para ver que sea de la misma marca. */
type Candidato = { titulo: string; fuerte: string; texto: string; precio: number; link: string };

function deVtex(base: string, lista: ProductoVtex[]): Candidato[] {
  const salida: Candidato[] = [];
  for (const v of lista) {
    const item = v.items?.[0];
    const precio = item?.sellers?.[0]?.commertialOffer?.Price ?? 0;
    if (!(precio > 0) || !v.productName || !v.link) continue;
    const fuerte = [v.productName, v.productReference, item?.name, ...(item?.referenceId ?? []).map((x) => x.Value)]
      .filter(Boolean)
      .join(" ");
    salida.push({
      titulo: v.productName,
      fuerte,
      texto: [fuerte, v.brand, v.description?.slice(0, 2000)].filter(Boolean).join(" "),
      precio,
      link: v.link.startsWith("http") ? v.link : `${base}${v.link}`,
    });
  }
  return salida;
}

type ProductoWoo = {
  name?: string;
  sku?: string;
  permalink?: string;
  is_in_stock?: boolean;
  short_description?: string;
  prices?: { price?: string; currency_minor_unit?: number };
  categories?: { name?: string }[];
  tags?: { name?: string }[];
  brands?: { name?: string }[];
};

/** Lo poco de HTML que trae WooCommerce en los nombres ("Grifer&iacute;a"). */
function sinHtml(x: string): string {
  return x
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z])(acute|tilde|uml);/gi, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function buscarEnWoo(base: string, termino: string): Promise<Candidato[] | null> {
  try {
    const r = await fetch(`${base}/wp-json/wc/store/v1/products?search=${encodeURIComponent(termino)}&per_page=10`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(ESPERA),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const j = (await r.json()) as unknown;
    if (!Array.isArray(j)) return [];
    const salida: Candidato[] = [];
    for (const w of j as ProductoWoo[]) {
      const decimales = w.prices?.currency_minor_unit ?? 0;
      const precio = Number(w.prices?.price ?? 0) / 10 ** decimales;
      // Sin stock no cuenta: ese precio no lo puede pagar nadie.
      if (!(precio > 0) || !w.name || !w.permalink || w.is_in_stock === false) continue;
      const titulo = sinHtml(w.name);
      const fuerte = [titulo, w.sku].filter(Boolean).join(" ");
      const extra = [...(w.brands ?? []), ...(w.categories ?? []), ...(w.tags ?? [])].map((x) => x.name ?? "");
      salida.push({
        titulo,
        fuerte,
        texto: [fuerte, ...extra, sinHtml(w.short_description ?? "").slice(0, 1000)].filter(Boolean).join(" "),
        precio,
        link: w.permalink,
      });
    }
    return salida;
  } catch {
    return null;
  }
}

async function pedirTexto(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/json;q=0.9,*/*;q=0.8", "Accept-Language": "es-AR,es;q=0.9" },
      signal: AbortSignal.timeout(ESPERA),
      cache: "no-store",
    });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

/** PrestaShop: su buscador contesta en JSON con ajax=1. */
async function buscarEnPresta(base: string, termino: string): Promise<Candidato[] | null> {
  const t = await pedirTexto(`${base}/index.php?controller=search&s=${encodeURIComponent(termino)}&ajax=1&resultsPerPage=20`);
  if (t === null) return null;
  try {
    const j = JSON.parse(t) as {
      products?: { name?: string; reference?: string; price_amount?: string | number; url?: string; link?: string; description_short?: string }[];
    };
    const salida: Candidato[] = [];
    for (const x of j.products ?? []) {
      const precio = Number(x.price_amount ?? 0);
      const link = x.url || x.link;
      if (!(precio > 0) || !x.name || !link) continue;
      const titulo = sinHtml(x.name);
      const fuerte = [titulo, x.reference].filter(Boolean).join(" ");
      salida.push({ titulo, fuerte, texto: [fuerte, sinHtml(x.description_short ?? "").slice(0, 1000)].join(" "), precio, link });
    }
    return salida;
  } catch {
    return [];
  }
}

type ProductoLd = {
  "@type"?: string | string[];
  name?: string;
  sku?: string;
  mpn?: string;
  brand?: { name?: string } | string;
  url?: string;
  mainEntityOfPage?: { "@id"?: string };
  offers?: { price?: string | number; url?: string; availability?: string } | { price?: string | number; url?: string; availability?: string }[];
};

/** Tiendanube: la pagina de busqueda trae cada producto como dato
 *  estructurado (JSON-LD), con nombre, marca y precio. */
async function buscarEnTiendanube(base: string, termino: string): Promise<Candidato[] | null> {
  const html = await pedirTexto(`${base}/search/?q=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const salida: Candidato[] = [];
  for (const m of html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let dato: unknown;
    try {
      dato = JSON.parse(m[1]);
    } catch {
      continue;
    }
    const lista: unknown[] = Array.isArray(dato) ? dato : [dato];
    for (const d of lista) {
      const x = d as ProductoLd;
      const tipo = Array.isArray(x["@type"]) ? x["@type"] : [x["@type"]];
      if (!tipo.includes("Product") || !x.name) continue;
      const oferta = Array.isArray(x.offers) ? x.offers[0] : x.offers;
      const precio = Number(oferta?.price ?? 0);
      if (!(precio > 0) || /OutOfStock/i.test(oferta?.availability ?? "")) continue;
      const link = oferta?.url || x.url || x.mainEntityOfPage?.["@id"];
      if (!link) continue;
      const marca = typeof x.brand === "string" ? x.brand : x.brand?.name;
      const titulo = sinHtml(x.name);
      const fuerte = [titulo, x.mpn].filter(Boolean).join(" ");
      salida.push({ titulo, fuerte, texto: [fuerte, marca].filter(Boolean).join(" "), precio, link });
    }
  }
  return salida;
}

/** Sodimac: su pagina de busqueda trae los resultados en __NEXT_DATA__, con
 *  el codigo de fabrica en "model" ("0189/B1 CR"). */
async function buscarEnSodimac(termino: string): Promise<Candidato[] | null> {
  const html = await pedirTexto(`https://www.sodimac.com.ar/sodimac-ar/search?Ntt=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) return [];
  try {
    const d = JSON.parse(m[1]) as {
      props?: { pageProps?: { searchProps?: { searchData?: { results?: {
        productId?: string; skuId?: string; displayName?: string; brand?: string; model?: string;
        prices?: { type?: string; priceWithoutFormatting?: number }[];
      }[] } } } };
    };
    const salida: Candidato[] = [];
    for (const x of d.props?.pageProps?.searchProps?.searchData?.results ?? []) {
      const precios = (x.prices ?? []).map((p) => p.priceWithoutFormatting ?? 0).filter((n) => n > 0);
      const precio = precios.length ? Math.min(...precios) : 0;
      if (!(precio > 0) || !x.displayName || !x.productId) continue;
      const slug = plano(x.displayName).replace(/ /g, "-");
      const fuerte = [x.displayName, x.model].filter(Boolean).join(" ");
      salida.push({
        titulo: x.displayName,
        fuerte,
        texto: [fuerte, x.brand].filter(Boolean).join(" "),
        precio,
        link: `https://www.sodimac.com.ar/sodimac-ar/product/${x.productId}/${slug}/${x.skuId ?? x.productId}/`,
      });
    }
    return salida;
  } catch {
    return [];
  }
}

/** Todas las tiendas donde se busca, cada una con su forma de preguntar.
 *  `maximo`: cuantas preguntas se le hacen como mucho por producto (a las
 *  chicas, pocas: son muchas tiendas y no hay que cargarlas). */
const FUENTES: { nombre: string; maximo: number; buscar: (termino: string) => Promise<Candidato[] | null> }[] = [
  ...TIENDAS_VTEX.map((t) => ({
    nombre: t.nombre,
    maximo: 5,
    buscar: async (q: string) => {
      const lista = await buscarEnVtex(t.base, q);
      return lista === null ? null : deVtex(t.base, lista);
    },
  })),
  { nombre: "Sodimac", maximo: 3, buscar: (q: string) => buscarEnSodimac(q) },
  ...TIENDAS_WOO.map((t) => ({ nombre: t.nombre, maximo: 2, buscar: (q: string) => buscarEnWoo(t.base, q) })),
  ...TIENDAS_PRESTA.map((t) => ({ nombre: t.nombre, maximo: 2, buscar: (q: string) => buscarEnPresta(t.base, q) })),
  ...TIENDAS_TIENDANUBE.map((t) => ({ nombre: t.nombre, maximo: 2, buscar: (q: string) => buscarEnTiendanube(t.base, q) })),
];

const plano = (x: string) =>
  x
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** El codigo como lo escribe cada uno: FV pone "0207/B1-CR" y Blaisten
 *  "207/B1-CR", sin el cero de adelante. Es el mismo modelo. */
function variantes(codigo: string): string[] {
  return [...new Set([codigo, codigo.replace(/^0+(?=\d)/, "")])];
}

/** Con que se le pregunta a la tienda: el codigo, sin el cero, y sin la
 *  terminacion del color ("-CR"), que algunas escriben aparte ("cromo").
 *  Para decir "mismo modelo" igual se pide el codigo entero. */
function terminos(codigos: string[]): string[] {
  const t: string[] = [];
  for (const c of codigos)
    for (const v of variantes(c)) {
      t.push(v);
      const sinColor = v.replace(/[-\s][A-Z]{1,3}$/i, "");
      if (sinColor !== v && /\d/.test(sinColor) && sinColor.length >= 4) t.push(sinColor);
    }
  return [...new Set(t)].slice(0, 4);
}

const RELLENO = new Set(["de", "del", "para", "con", "sin", "y", "el", "la", "los", "las", "p", "c", "x", "cm", "mm", "mts", "lts", "kg"]);
/** Dicen poco de que modelo es: no sirven para buscar. */
const GENERICAS = new Set(["griferia", "juego", "set", "kit", "cromo", "cromado", "blanco", "negro", "color", "modelo", "linea", "nuevo", "original", "unidad"]);

/** Las palabras del titulo (sin relleno, numeros sueltos ni la marca). */
function palabrasDelTitulo(titulo: string, marca: string | null): string[] {
  const m = new Set(plano(marca ?? "").split(" "));
  return plano(titulo)
    .split(" ")
    .filter((w) => w.length > 2 && !RELLENO.has(w) && !m.has(w) && !/\d/.test(w));
}

/** Para buscar por palabras: las tres que mas dicen. */
function palabrasClave(titulo: string, marca: string | null): string {
  const todas = palabrasDelTitulo(titulo, marca);
  const buenas = todas.filter((w) => !GENERICAS.has(w));
  return (buenas.length >= 2 ? buenas : todas).slice(0, 3).join(" ");
}

/** Un codigo de modelo de verdad: letras y numeros ("410-E", "0207/B1",
 *  "BACH0LOZ 04 02"). Un numero solo es casi siempre una medida: del titulo
 *  "67.5 X 40.5 X 20 CM" salia "40.5" y se tomaba como "mismo modelo" una
 *  lija de grano 40 (Damian, 18/11/2026: "se ve que esta buscando otra cosa
 *  y no el codigo que corresponde"). */
function esCodigoDeModelo(c: string): boolean {
  const u = c.toUpperCase();
  return (
    /[A-Z]/.test(u) &&
    /\d/.test(u) &&
    u.replace(/[^A-Z0-9]/g, "").length >= 3 &&
    !/^\d+([.,]\d+)?\s*[X×]\s*\d/.test(u) &&
    !/^\d+([.,/]\d+)?\s*(MM|CM|MTS?|M|LTS?|L|KG|GR|W|V|HZ|HP|CC|PULG)$/.test(u)
  );
}

/** El codigo cortado tambien entre letras y numeros: "22301TNE" encuentra
 *  "22301 TNE" y "22301-TNE"; "0295/D7-CR" encuentra "295 D7 CR". Cada
 *  tienda lo escribe a su manera. */
function nombraElCodigoFlexible(texto: string, codigo: string): boolean {
  const partes = codigo
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .flatMap((x) => x.match(/[A-Z]+|\d+/g) ?? []);
  if (partes.length === 0) return false;
  const patron = new RegExp(`(^|[^A-Z0-9])${partes.join("[^A-Z0-9]?")}([^A-Z0-9]|$)`);
  return patron.test(plano(texto).toUpperCase());
}

/** Sin codigo de modelo, el mismo producto por el NOMBRE: estan todos sus
 *  numeros (50 litros, 6 pulgadas, 115 mm) y al menos 3 de cada 4 de sus
 *  palabras que dicen algo. Damian, 19/11/2026: "busca en ellas los
 *  productos por codigo, marca, titulo etc", "lo mismo tenes que hacerlo con
 *  todas las marcas". */
function mismoPorNombre(nuestro: string, marca: string, candidato: string): boolean {
  const c = ` ${plano(candidato)} `;
  const numeros = plano(nuestro).match(/\b\d+\b/g) ?? [];
  // El numero entero, solo o pegado a su unidad ("50", "50lts"), no "500".
  if (numeros.some((n) => !new RegExp(`(^| )${n}( |[a-z])`).test(c))) return false;
  const palabras = palabrasDelTitulo(nuestro, marca).filter((w) => !GENERICAS.has(w));
  if (palabras.length < 2) return false;
  const raiz = (w: string) => w.replace(/(es|s)$/, "");
  const estan = palabras.filter((w) => c.includes(` ${raiz(w)}`)).length;
  return estan / palabras.length >= 0.75;
}

// Los colores, por familia. "BL" es como se escribe blanco en los titulos
// de GBP; "CR" y "NG" son los sufijos de color de FV.
const COLORES: Record<string, string[]> = {
  blanco: ["blanco", "blanca", "bl", "white"],
  negro: ["negro", "negra", "ng", "black"],
  arena: ["arena"],
  hueso: ["hueso", "bone"],
  beige: ["beige"],
  gris: ["gris", "grafito"],
  cromo: ["cromo", "cromado", "cromada", "cr"],
  dorado: ["dorado", "dorada", "oro", "gold"],
  cobre: ["cobre"],
  rosa: ["rosa", "rose"],
  azul: ["azul"],
  verde: ["verde"],
  rojo: ["rojo", "roja"],
};

function coloresDe(texto: string): Set<string> {
  const w = new Set(plano(texto).split(" "));
  return new Set(Object.entries(COLORES).filter(([, ps]) => ps.some((x) => w.has(x))).map(([c]) => c));
}

/** El de afuera es de OTRO color: los dos dicen color y no coinciden en
 *  ninguno. El asiento Ariel 509 blanco no es el 509 arena (Easy tiene los
 *  dos, a precios muy distintos). */
function colorDistinto(nuestro: string, deAfuera: string): boolean {
  const a = coloresDe(nuestro);
  const b = coloresDe(deAfuera);
  return a.size > 0 && b.size > 0 && ![...a].some((c) => b.has(c));
}

/** Nombra la marca como palabra ("FV", no "pvc" ni "fvx"). */
function nombraLaMarca(texto: string, marca: string): boolean {
  return ` ${plano(texto)} `.includes(` ${plano(marca)} `);
}

export async function preciosAfuera(p: {
  itemId: string;
  titulo: string;
  memo: string | null;
  /** La descripcion de la ficha. */
  descripcion?: string | null;
  codigoFabricante: string | null;
  marca: string | null;
  /** Nuestro precio: si el de afuera es disparatado, no es el mismo producto. */
  precio?: number | null;
}): Promise<Comparacion> {
  const propio = p.itemId.toUpperCase();
  // El codigo de fabricante manda. Si no hay, los codigos del titulo, despues
  // los de la ayuda memoria y despues los de la descripcion.
  const codigos = p.codigoFabricante?.trim()
    ? [p.codigoFabricante.trim()]
    : codigosDelArticulo(
        [p.titulo, p.memo ?? "", (p.descripcion ?? "").slice(0, 600)].join(" | "),
        p.itemId,
      )
        .filter((c) => c !== propio && esCodigoDeModelo(c))
        .slice(0, 2);
  const clave = palabrasClave(p.titulo, p.marca);
  const conMarca = clave && p.marca ? `${plano(p.marca)} ${clave}` : "";
  // Sin codigo de modelo y sin marca no hay forma de saber que es el mismo.
  const porNombre = codigos.length === 0;
  if (porNombre && (!p.marca || !conMarca))
    return { fecha: new Date().toISOString(), buscado: [], resultados: [], fallaron: [], sinCodigo: true };
  const buscado = [...codigos, ...(conMarca || clave ? [conMarca || clave] : [])];

  // El mismo modelo: nombra el codigo en el nombre, la referencia o el
  // detalle del producto (no en una descripcion larga, donde aparece
  // cualquier cosa); es de la misma marca; y el precio no es disparatado.
  const precioRazonable = (precio: number) => !p.precio || (precio >= p.precio * 0.4 && precio <= p.precio * 2.5);
  const esExacto = (fuerte: string, conMarcaYTodo: string, precio: number) =>
    codigos.some((c) => variantes(c).some((v) => nombraElCodigo(fuerte, v) || nombraElCodigoFlexible(fuerte, v))) &&
    (!p.marca || nombraLaMarca(conMarcaYTodo, p.marca)) &&
    precioRazonable(precio);
  // Por nombre, el precio tiene que estar mas cerca: no hay codigo que avale.
  const esMismoPorNombre = (fuerte: string, conMarcaYTodo: string, precio: number) =>
    !!p.marca &&
    nombraLaMarca(conMarcaYTodo, p.marca) &&
    mismoPorNombre(p.titulo, p.marca, fuerte) &&
    (!p.precio || (precio >= p.precio * 0.6 && precio <= p.precio * 1.6));

  // Las tiendas a la vez (cada una tarda lo suyo). Adentro de cada una: el
  // codigo como lo escriba ella; si no aparece, por marca y palabras, por si
  // la tienda lo tiene pero su buscador no lo encuentra por el codigo.
  const unaTienda = async (t: (typeof FUENTES)[number]) => {
      const deEsta: PrecioAfuera[] = [];
      let contesto = false;
      const todas = [...new Set([...terminos(codigos), conMarca || clave].filter(Boolean))];
      const corto = terminos(codigos).slice(-1)[0];
      const preguntas =
        t.maximo >= todas.length ? todas : [...new Set([corto, conMarca || clave].filter(Boolean) as string[])].slice(0, t.maximo);
      for (const termino of preguntas) {
        const lista = await t.buscar(termino);
        if (lista === null) continue;
        contesto = true;
        for (const c of lista) {
          // Solo el mismo modelo: por el codigo o, si no tiene, por el nombre.
          const mismo =
            !colorDistinto(p.titulo, c.titulo) &&
            (porNombre ? esMismoPorNombre(c.fuerte, c.texto, c.precio) : esExacto(c.fuerte, c.texto, c.precio));
          if (!mismo) continue;
          if (deEsta.some((r) => r.link === c.link)) continue;
          deEsta.push({
            tienda: t.nombre,
            titulo: c.titulo,
            precio: Math.round(c.precio),
            link: c.link,
            exacto: true,
            ...(porNombre ? { porNombre: true } : {}),
          });
        }
        if (deEsta.length) break;
      }
      return { tienda: t.nombre, deEsta, contesto };
  };
  const porTienda: Awaited<ReturnType<typeof unaTienda>>[] = [];
  for (let i = 0; i < FUENTES.length; i += A_LA_VEZ)
    porTienda.push(...(await Promise.all(FUENTES.slice(i, i + A_LA_VEZ).map(unaTienda))));
  const resultados: PrecioAfuera[] = porTienda.flatMap((x) => x.deEsta);
  const fallaron = buscado.length ? porTienda.filter((x) => !x.contesto).map((x) => x.tienda) : [];

  // MercadoLibre, con la cuenta de Conesa conectada (sin ella no deja
  // buscar). Primero la ficha de catalogo exacta (marca + codigo) con los
  // precios de quienes la venden; si no hay, las publicaciones comunes que
  // nombran el mismo codigo y la misma marca. Los tres mas baratos.
  if (p.marca) {
    const deML: PrecioAfuera[] = [];
    for (const codigo of codigos) {
      for (const m of await preciosEnMercadoLibre({ marca: p.marca, codigo }).catch(() => []))
        deML.push({ tienda: "MercadoLibre", titulo: m.titulo, precio: m.precio, link: m.link, exacto: true });
      if (deML.length) break;
    }
    if (!deML.length)
      for (const termino of terminos(codigos)) {
        for (const m of await publicacionesEnMercadoLibre(`${p.marca} ${termino}`).catch(() => []))
          if (esExacto(m.titulo, m.titulo, m.precio) && !deML.some((x) => x.link === m.link))
            deML.push({ tienda: "MercadoLibre", titulo: m.titulo, precio: m.precio, link: m.link, exacto: true });
        if (deML.length) break;
      }
    resultados.push(...deML.sort((a, b) => a.precio - b.precio).slice(0, 3));
  }

  resultados.sort((a, b) => Number(b.exacto) - Number(a.exacto) || a.precio - b.precio);
  return {
    fecha: new Date().toISOString(),
    buscado,
    resultados: resultados.slice(0, 15),
    fallaron,
    // Sin codigo y sin nada por el nombre: que se le cargue el codigo.
    ...(porNombre && resultados.length === 0 ? { sinCodigo: true } : {}),
  };
}

// ------------------------------------------------------------ guardado

/** Lo buscado antes de esto no vale: tomaba medidas, watts y fechas como
 *  codigos ("2000", "14/10/2026") y daba como mismo modelo cualquier cosa
 *  (Damian, 18/11/2026, con una pistola de calor Dogo comparada con clavos:
 *  "eso no tiene nada que ver"). Es cuando se publico V.0.99.17. */
const VALE_DESDE = Date.parse("2026-11-18T20:10:00Z");

export async function comparacionesGuardadas(): Promise<Record<string, Comparacion>> {
  try {
    const o = JSON.parse((await getSetting(S_COMPARADOR)) || "{}");
    if (!o || typeof o !== "object" || Array.isArray(o)) return {};
    const validas: Record<string, Comparacion> = {};
    for (const [id, c] of Object.entries(o as Record<string, Comparacion>))
      if (c && Date.parse(c.fecha) >= VALE_DESDE) validas[id] = c;
    return validas;
  } catch {
    return {};
  }
}

export async function guardarComparaciones(nuevas: Record<string, Comparacion>): Promise<void> {
  const todas = await comparacionesGuardadas();
  // Si una tienda no contesto esta vez, se queda lo que habia traido antes:
  // que no conteste no quiere decir que dejo de venderlo. Damian,
  // 19/11/2026: "hay productos que antes me traias de Easy y ahora no".
  for (const [id, nueva] of Object.entries(nuevas)) {
    const antes = todas[id];
    if (!antes || nueva.fallaron.length === 0) continue;
    const ya = new Set(nueva.resultados.map((r) => r.tienda));
    for (const r of antes.resultados)
      if (nueva.fallaron.includes(r.tienda) && !ya.has(r.tienda))
        nueva.resultados.push({ ...r, anterior: r.anterior ?? antes.fecha });
    nueva.resultados.sort((a, b) => a.precio - b.precio);
  }
  await setSetting(S_COMPARADOR, JSON.stringify({ ...todas, ...nuevas }));
}
