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
//   - Mas tiendas por marca (Damian, 19/11/2026, con los que no traian
//     precio: "asi hace con todos", "sumala cuando termines"): casas que
//     venden Dogo, Fluvial, Hydros, Heineken, TST, Mi Pileta, Piazza,
//     Pringles, Ariel. Ademas de las de arriba: Odoo (CER), Magento (Rodo,
//     Somos Rex), la tienda oficial de Dogo, Centro de Materiales y la
//     plataforma de Foschia y Grupo Gemme, cada una leida de su pagina de
//     busqueda.
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
// Los resultados se guardan, uno por producto (tabla ComparacionPrecio), para
// ver la pantalla sin volver a buscar todo. Son de la tienda, no de quien
// busco: todos los usuarios ven lo mismo.

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { codigosDelArticulo, nombraElCodigo, precioDeUnaPagina } from "@/lib/web-de-marca";
import { preciosEnMercadoLibre, publicacionesEnMercadoLibre } from "@/lib/mercadolibre";

/** Donde se guardaba todo junto hasta V.0.99.54 (ver pasarLoViejo). */
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
  { nombre: "MAQPRO", base: "https://www.maqpro.com.ar" },
  { nombre: "Gastromak", base: "https://gastromak.com.ar" },
  { nombre: "Punto Parrilla", base: "https://puntoparrilla.com" },
] as const;

export const TIENDAS_PRESTA = [
  { nombre: "DePlano", base: "https://www.deplano.com.ar" },
  { nombre: "Sanitarios Axantra", base: "https://www.sanitariosaxantra.com" },
  { nombre: "Ferrocons", base: "https://www.ferrocons.com.ar" },
  { nombre: "SaniPlast", base: "https://www.saniplast.com.ar" },
  { nombre: "Abelson", base: "https://abelson.com.ar" },
  { nombre: "Mukdise", base: "https://www.mukdise.com.ar" },
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
  // Ferreterias: herramientas (Dogo y otras). Damian, 19/11/2026, con la
  // amoladora Dogo 900 W sin datos: "buscalo ahi mismo y traeme un precio".
  { nombre: "Pideweb", base: "https://www.pideweb.com.ar" },
  { nombre: "Delta Ferretería", base: "https://www.deltaferreteriaindustrial.com" },
] as const;

/** Tiendanube que se encontraron buscando una marca (Damian, 19/11/2026,
 *  con los que no traian precio: "asi hace con todos", "sumala cuando
 *  termines"). Se les pregunta solo por esas marcas: Tiendanube corta si se
 *  le pide mucho (ver turnoTiendanube) y preguntarle a una casa de parrillas
 *  por una griferia FV gasta turnos de las que si la tienen. `marcas` va
 *  junto y sin espacios ("mipileta"). */
export const TIENDAS_TIENDANUBE_POR_MARCA: { nombre: string; base: string; marcas: string[] }[] = [
  { nombre: "Pinturerías MM", base: "https://www.pintureriasmm.com.ar", marcas: ["dogo"] },
  { nombre: "Proyectar Materiales", base: "https://www.proyectarmateriales.com.ar", marcas: ["hydros", "ariel", "piazza", "daccord"] },
  { nombre: "Casa Andy", base: "https://www.casa-andy.com.ar", marcas: ["heineken"] },
  { nombre: "Val-Mar Sanitarios", base: "https://valmarsanitarios.mitiendanube.com", marcas: ["heineken"] },
  { nombre: "Artef", base: "https://www.artef.com.ar", marcas: ["tst"] },
  { nombre: "Grill West", base: "https://www.grillwest.com.ar", marcas: ["tst"] },
  { nombre: "Casa Martínez", base: "https://www.casamartinezsa.com.ar", marcas: ["tst"] },
  { nombre: "Sanitarios Campana", base: "https://sanitarioscampana.com.ar", marcas: ["tst"] },
  { nombre: "Domia Home", base: "https://domiahome.com.ar", marcas: ["tst"] },
  { nombre: "Deco Miracema", base: "https://decomiracema.com.ar", marcas: ["mipileta", "piazza"] },
  { nombre: "2448 Materiales", base: "https://2448materiales.com.ar", marcas: ["piazza"] },
  { nombre: "Intermarble", base: "https://www.intermarble.com.ar", marcas: ["pringles"] },
  { nombre: "Sanitarios Vera", base: "https://www.sanitariosvera.com.ar", marcas: ["ariel", "piazza"] },
  { nombre: "Saniclick", base: "https://saniclick.com.ar", marcas: ["mipileta", "flowater", "peirano", "ferrum"] },
];

/** Magento: la busqueda trae producto por producto con el precio. */
export const TIENDAS_MAGENTO = [
  { nombre: "Rodo", base: "https://www.rodo.com.ar" },
  { nombre: "Somos Rex", base: "https://somosrex.com" },
] as const;

/** La plataforma de Foschia y Grupo Gemme (tarjetas con marca y precio). */
export const TIENDAS_DESIGN8 = [
  { nombre: "Foschia", base: "https://foschia.com.ar" },
  { nombre: "Grupo Gemme", base: "https://grupogemme.com.ar" },
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
  /** Lo agrego Damian pegando el link (lo encontro buscando en Google):
   *  queda en las busquedas siguientes, con el precio al dia. */
  manual?: boolean;
  /** Un combo: lo que cobra esa tienda por todas sus piezas sueltas. Estas
   *  son las piezas (ver sumarPiezas). */
  suma?: PiezaSumada[];
};

export type PiezaSumada = { itemId: string; tienda: string; titulo: string; precio: number; link: string };

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
  /** Las palabras que escribio Damian para buscarlo ("Buscar con otras
   *  palabras"): se usan tambien en las busquedas siguientes. */
  palabras?: string;
  /** Un combo: como le fue a cada pieza (cuantas tiendas la venden; sin
   *  titulo, no esta cargada en el sistema). */
  combo?: { piezas: { itemId: string; titulo: string | null; tiendas: number }[] };
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

async function pedirTexto(url: string, siFalla?: (status: number) => void): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/json;q=0.9,*/*;q=0.8", "Accept-Language": "es-AR,es;q=0.9" },
      signal: AbortSignal.timeout(ESPERA),
      cache: "no-store",
    });
    if (!r.ok) siFalla?.(r.status);
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

// Tiendanube corta (contesta 429, "demasiados pedidos") cuando se le pide
// mucho desde la misma maquina, a TODAS sus tiendas juntas: probado el
// 19/11/2026, aguanta unos 30 pedidos de golpe y despues alrededor de uno
// por segundo. Antes se le pedia todo junto y muchas quedaban como "no
// contesto". Ahora cada pedido espera su turno; si el turno tarda demasiado,
// esa tienda queda para la proxima busqueda (y se conserva lo que habia
// traido antes).
const TN_DE_GOLPE = 25;
const TN_POR_SEGUNDO = 1.1;
const TN_TURNO_MAXIMO = 20_000;
let tnFichas = TN_DE_GOLPE;
let tnDesde = Date.now();

async function turnoTiendanube(): Promise<boolean> {
  const ahora = Date.now();
  tnFichas = Math.min(TN_DE_GOLPE, tnFichas + ((ahora - tnDesde) / 1000) * TN_POR_SEGUNDO);
  tnDesde = ahora;
  const espera = tnFichas >= 1 ? 0 : ((1 - tnFichas) / TN_POR_SEGUNDO) * 1000;
  if (espera > TN_TURNO_MAXIMO) return false;
  // Se reserva el turno (puede quedar en negativo: los de atras esperan mas).
  tnFichas -= 1;
  if (espera > 0) await new Promise((r) => setTimeout(r, espera));
  return true;
}

/** Tiendanube: la pagina de busqueda trae cada producto como dato
 *  estructurado (JSON-LD), con nombre, marca y precio. */
async function buscarEnTiendanube(base: string, termino: string): Promise<Candidato[] | null> {
  if (!(await turnoTiendanube())) return null;
  const html = await pedirTexto(`${base}/search/?q=${encodeURIComponent(termino)}`, (status) => {
    // Corto igual: unos segundos sin pedirle nada.
    if (status === 429) tnFichas = Math.min(tnFichas, -3);
  });
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
      // El SKU de la tienda a veces es el codigo de fabrica (Dogo "DOG54015").
      const fuerte = [titulo, x.mpn, x.sku].filter(Boolean).join(" ");
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

/** Un precio escrito a la argentina ("91.589,00", "257.677") o con la coma
 *  de miles ("6,743"): cada tienda lo escribe a su manera. */
function pesosAR(x: string | undefined): number {
  const s = (x ?? "").replace(/[^\d.,]/g, "");
  if (!s) return 0;
  // Coma con uno o dos numeros al final: son los centavos.
  if (/,\d{1,2}$/.test(s)) return Number(s.replace(/\./g, "").replace(",", "."));
  return Number(s.replace(/[.,]/g, ""));
}

/** Magento (Rodo, Somos Rex): la pagina de busqueda, producto por producto
 *  ("product-item-link"), con el precio en data-price-amount. Somos Rex pone
 *  el precio vigente como "defaultPromoPrice" (el de lista es "oldPrice");
 *  Rodo, como "finalPrice". */
async function buscarEnMagento(base: string, termino: string): Promise<Candidato[] | null> {
  const html = await pedirTexto(`${base}/catalogsearch/result/?q=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const partes = html.split('class="product-item-link"');
  const salida: Candidato[] = [];
  for (let i = 1; i < partes.length; i++) {
    const p = partes[i].slice(0, 12000);
    const link = p.match(/^\s*href="([^"]+)"/)?.[1];
    const titulo = sinHtml(p.match(/^[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    const precioDe = (tipo: string) =>
      p.match(new RegExp(`data-price-amount="([\\d.]+)"\\s+data-price-type="${tipo}"`))?.[1];
    const precio = Number(precioDe("defaultPromoPrice") ?? precioDe("finalPrice") ?? 0);
    if (!(precio > 0) || !link || !titulo || /OutOfStock|stock unavailable/i.test(p)) continue;
    // La marca (Somos Rex la pone arriba del nombre).
    const previo = partes[i - 1];
    const desde = previo.lastIndexOf("product-item-info");
    const marca = previo.slice(desde >= 0 ? desde : -1500).match(/brand-name">\s*([^<]+?)\s*</)?.[1];
    salida.push({ titulo, fuerte: titulo, texto: [titulo, marca].filter(Boolean).join(" "), precio, link });
  }
  return salida;
}

/** Odoo (CER, bombas Fluvial): cada producto con su nombre
 *  (itemprop="name"), el codigo entre corchetes en la foto ("[112100]
 *  BOMBA...") y el precio en itemprop="price". */
async function buscarEnOdoo(base: string, termino: string): Promise<Candidato[] | null> {
  const html = await pedirTexto(`${base}/shop?search=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const partes = html.split('itemprop="name"');
  const salida: Candidato[] = [];
  for (let i = 1; i < partes.length; i++) {
    const p = partes[i];
    const href = p.match(/^[^>]*href="(\/shop\/[^"?]+)/)?.[1];
    const titulo = sinHtml(p.match(/^[^>]*content="([^"]+)"/)?.[1] ?? "");
    const precio = Number(p.match(/itemprop="price"[^>]*>\s*([\d.]+)/)?.[1] ?? 0);
    if (!(precio > 0) || !href || !titulo) continue;
    const codigo = [...partes[i - 1].slice(-3000).matchAll(/alt="\[([^\]]+)\]/g)].pop()?.[1];
    const fuerte = [titulo, codigo].filter(Boolean).join(" ");
    salida.push({ titulo, fuerte, texto: fuerte, precio, link: `${base}${href}` });
  }
  return salida;
}

/** Dogo, la tienda oficial. Su buscador encuentra por el codigo de fabrica
 *  ("DOG54015") pero no lo muestra en el nombre: si buscando un codigo trae
 *  UN solo producto, es ese. Sin stock dice "no disponible" y no cuenta. */
async function buscarEnDogo(termino: string): Promise<Candidato[] | null> {
  const base = "https://www.dogoherramientas.com.ar";
  const html = await pedirTexto(`${base}/Busqueda/?term=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const total = Number(html.match(/class="totalprods">\s*<span>\s*(\d+)/)?.[1] ?? 0);
  const esCodigo = /[a-z]/i.test(termino) && /\d/.test(termino) && !/\s/.test(termino.trim());
  const partes = html.split('<h3 itemprop="name">');
  const salida: Candidato[] = [];
  for (let i = 1; i < partes.length; i++) {
    const p = partes[i].split("</article>")[0];
    const href = [...partes[i - 1].slice(-1500).matchAll(/href="(\/tienda\/[^"]+)"/g)].pop()?.[1];
    const titulo = sinHtml(p.match(/^([^<]+)</)?.[1] ?? "");
    const precio = pesosAR(p.match(/class="price"[^>]*>\s*\$?\s*<span>([\d.,]+)</)?.[1]);
    if (!(precio > 0) || !href || !titulo || /no disponible/i.test(p)) continue;
    const fuerte = [titulo, total === 1 && esCodigo ? termino.trim() : ""].filter(Boolean).join(" ");
    salida.push({ titulo, fuerte, texto: `${fuerte} Dogo`, precio, link: `${base}${href}` });
  }
  return salida;
}

/** Centro de Materiales: cada producto trae su codigo de fabrica en
 *  data-code ("DOG54015"), la marca arriba del nombre y el precio en
 *  data-value. */
async function buscarEnCentroDeMateriales(termino: string): Promise<Candidato[] | null> {
  const base = "https://www.centrodemateriales.com.ar";
  const html = await pedirTexto(`${base}/buscar?buscar=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const partes = html.split(' data-code="');
  const salida: Candidato[] = [];
  for (let i = 1; i < partes.length; i++) {
    const p = partes[i].slice(0, 4000);
    const codigo = p.match(/^([^"]*)"/)?.[1] ?? "";
    const href = p.match(/href="(\/producto\/[^"]+)"/)?.[1];
    const marca = p.match(/<p class="mb-1[^"]*">\s*([^<]+?)\s*<\/p>/)?.[1];
    const titulo = sinHtml(p.match(/<h3[^>]*>\s*([^<]+?)\s*<\/h3>/)?.[1] ?? "");
    const precio = Number(p.match(/data-value="([\d.]+)"/)?.[1] ?? 0);
    if (!(precio > 0) || !href || !titulo || /sin stock|agotado/i.test(p)) continue;
    const fuerte = [titulo, codigo].filter(Boolean).join(" ");
    salida.push({ titulo, fuerte, texto: [fuerte, marca].filter(Boolean).join(" "), precio, link: `${base}${href}` });
  }
  return salida;
}

/** Foschia y Grupo Gemme (la misma plataforma): tarjetas con la marca, el
 *  nombre y el precio que muestran grande (el tachado es "prev-price" y no
 *  se toma). La tarjeta viene "vertical" u "horizontal" segun la pagina. */
async function buscarEnDesign8(base: string, termino: string): Promise<Candidato[] | null> {
  const html = await pedirTexto(`${base}/shop?search=${encodeURIComponent(termino)}`);
  if (html === null) return null;
  const partes = html.split(/product-card-design8-(?:vertical|horizontal)__brand/);
  const salida: Candidato[] = [];
  for (let i = 1; i < partes.length; i++) {
    const p = partes[i].slice(0, 8000);
    const marca = sinHtml(p.match(/^[^>]*>([^<]*)</)?.[1] ?? "");
    const href = p.match(/href="(\/p\/[^"]+)"/)?.[1];
    const titulo = sinHtml(p.match(/(?:vertical|horizontal)__name[^>]*>([^<]+)</)?.[1] ?? "");
    const precio = pesosAR(
      p.match(/(?:vertical|horizontal)__price [^>]*>[\s\S]{0,300}?<span[^>]*>(\d[\d.]*)<\/span>/)?.[1],
    );
    if (!(precio > 0) || !href || !titulo || /sin stock|agotado/i.test(p)) continue;
    salida.push({ titulo, fuerte: titulo, texto: `${titulo} ${marca}`, precio, link: `${base}${href}` });
  }
  return salida;
}

/** Todas las tiendas donde se busca, cada una con su forma de preguntar.
 *  `maximo`: cuantas preguntas se le hacen como mucho por producto (a las
 *  chicas, pocas: son muchas tiendas y no hay que cargarlas). */
const FUENTES: {
  nombre: string;
  maximo: number;
  /** Solo para estas marcas, juntas y sin espacios ("mipileta"). */
  marcas?: string[];
  /** Es Tiendanube: comparte los turnos (ver turnoTiendanube). */
  tiendanube?: boolean;
  buscar: (termino: string) => Promise<Candidato[] | null>;
}[] = [
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
  // Tiendanube: una sola pregunta por tienda (el codigo o, si no tiene, el
  // nombre): tiene turnos contados.
  ...TIENDAS_TIENDANUBE.map((t) => ({
    nombre: t.nombre,
    maximo: 1,
    tiendanube: true,
    buscar: (q: string) => buscarEnTiendanube(t.base, q),
  })),
  ...TIENDAS_TIENDANUBE_POR_MARCA.map((t) => ({
    nombre: t.nombre,
    maximo: 1,
    marcas: t.marcas,
    tiendanube: true,
    buscar: (q: string) => buscarEnTiendanube(t.base, q),
  })),
  ...TIENDAS_MAGENTO.map((t) => ({ nombre: t.nombre, maximo: 2, buscar: (q: string) => buscarEnMagento(t.base, q) })),
  ...TIENDAS_DESIGN8.map((t) => ({ nombre: t.nombre, maximo: 2, buscar: (q: string) => buscarEnDesign8(t.base, q) })),
  { nombre: "CER", maximo: 2, buscar: (q: string) => buscarEnOdoo("https://www.cer.com.ar", q) },
  { nombre: "Centro de Materiales", maximo: 2, buscar: (q: string) => buscarEnCentroDeMateriales(q) },
  { nombre: "Dogo (tienda oficial)", maximo: 2, marcas: ["dogo"], buscar: (q: string) => buscarEnDogo(q) },
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

/** Para buscar por palabras: las tres que mas dicen. Si tiene un rasgo que
 *  lo hace otro modelo ("alta recuperacion"), va entero: buscando
 *  "termotanque electrico alta" las tiendas traian el comun. */
function palabrasClave(titulo: string, marca: string | null): string {
  const todas = palabrasDelTitulo(titulo, marca);
  const buenas = todas.filter((w) => !GENERICAS.has(w));
  const elegidas = (buenas.length >= 2 ? buenas : todas).slice(0, 3);
  const rasgos = rasgosDe(titulo);
  if (rasgos.length && elegidas.length)
    return [...new Set([elegidas[0], ...rasgos.flatMap((r) => r.split(" "))])].slice(0, 4).join(" ");
  return elegidas.join(" ");
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
  const esta = (w: string) => c.includes(` ${raiz(w)}`);
  // Lo que es (la primera palabra: termotanque, campana, extractor) tiene
  // que estar si o si; del resto, la mitad. Damian, 19/11/2026: "los
  // termotanques Heineken podes buscar por el titulo tambien y con el resto
  // tambien como TST". Con 3 de cada 4 no encontraba casi nada.
  if (!esta(palabras[0])) return false;
  return palabras.filter(esta).length / palabras.length >= 0.5;
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

// Palabras que se contradicen: si los dos nombran algo del mismo grupo y no
// coinciden, son modelos distintos. El termotanque Heineken 80 L de conexion
// INFERIOR no es el de conexion SUPERIOR (Sodimac tiene el otro).
const CONTRARIOS: string[][] = [
  ["inferior", "superior"],
  ["electrico", "electrica", "gas", "solar"],
  ["izquierda", "izquierdo", "derecha", "derecho"],
  ["simple", "doble"],
  ["interior", "exterior"],
  ["pared", "mesada"],
  ["monocomando", "bimando", "bicomando"],
  // El inodoro largo no es el corto (Piazza Amalfi tiene los dos).
  ["largo", "corto"],
];

function seContradicen(nuestro: string, deAfuera: string): boolean {
  const a = new Set(plano(nuestro).split(" "));
  const b = new Set(plano(deAfuera).split(" "));
  return CONTRARIOS.some((g) => {
    const enA = g.filter((w) => a.has(w));
    const enB = g.filter((w) => b.has(w));
    return enA.length > 0 && enB.length > 0 && !enA.some((w) => enB.includes(w));
  });
}

// Rasgos que hacen OTRO modelo: si uno lo dice y el otro no, no son el
// mismo. El termotanque Heineken 120 L electrico de ALTA RECUPERACION es
// otro (y mas caro) que el comun: Damian, 21/11/2026, "es la misma marca y el
// modelo electrico pero no es el de alta recuperacion que es mas caro, lo
// esta comparando con el comun". Se miran los dos lados: el comun tampoco
// se compara con el de alta recuperacion.
const RASGOS = ["alta recuperacion", "doble servicio"];

function rasgosDe(texto: string): string[] {
  const t = ` ${plano(texto)} `;
  return RASGOS.filter((r) => t.includes(` ${r} `));
}

/** Uno tiene un rasgo (alta recuperacion) que el otro no. */
function rasgoDistinto(nuestro: string, deAfuera: string): boolean {
  const a = rasgosDe(nuestro);
  const b = rasgosDe(deAfuera);
  return a.length !== b.length || a.some((r) => !b.includes(r));
}

/** Un combo o un conjunto: dice "combo" o junta cosas con "+". */
function esConjunto(texto: string): boolean {
  return /\bcombo\b/i.test(texto) || /\+/.test(texto);
}

/** Lo que sale de un modelo distinto por el titulo, sin mirar codigos ni
 *  precio: otro color, algo que se contradice, otra medida u otro rasgo. Con
 *  esto tambien se revisa lo que habia traido una busqueda anterior. Y un
 *  combo de afuera no es nuestro producto suelto (el inodoro solo no se
 *  compara con "Combo inodoro + bidet"); al reves si puede ser, porque las
 *  tiendas escriben el combo de muchas formas ("con deposito y asiento"). */
export function esOtroModelo(nuestro: string, deAfuera: string): boolean {
  return (
    colorDistinto(nuestro, deAfuera) ||
    seContradicen(nuestro, deAfuera) ||
    medidasDistintas(nuestro, deAfuera) ||
    rasgoDistinto(nuestro, deAfuera) ||
    (esConjunto(deAfuera) && !esConjunto(nuestro))
  );
}

// Las medidas con su unidad. El extractor TST S300 de 6 pulgadas no es el
// de 4 (el codigo es el mismo, S300, y Somos Rex vende los dos).
const UNIDADES: Record<string, string[]> = {
  pulgadas: ["pulgadas", "pulgada", "pulg"],
  litros: ["litros", "litro", "lts", "lt", "l"],
  watts: ["watts", "watt", "w"],
  hp: ["hp"],
};
// Los cm y mm no: cada tienda mide distinto (la Mi Pileta 802E figura como
// 64x41x21 y como 70x44x20) y el tamano casi siempre ya esta en el codigo.

function medidasDe(texto: string): Map<string, Set<string>> {
  // 6" es 6 pulgadas (plano se come las comillas).
  const t = plano(texto.replace(/(\d)\s*(?:"|''|”|″)/g, "$1 pulgadas"));
  const salida = new Map<string, Set<string>>();
  for (const m of t.matchAll(/(?:^| )(\d+) ?([a-z]+)(?= |$)/g))
    for (const [u, formas] of Object.entries(UNIDADES))
      if (formas.includes(m[2])) {
        if (!salida.has(u)) salida.set(u, new Set());
        salida.get(u)!.add(m[1]);
      }
  return salida;
}

/** Los dos dicen una medida de la misma clase (pulgadas, litros, watts,
 *  hp) y no coinciden en ninguna: son modelos distintos. */
function medidasDistintas(nuestro: string, deAfuera: string): boolean {
  const a = medidasDe(nuestro);
  const b = medidasDe(deAfuera);
  return [...a].some(([u, nums]) => b.has(u) && ![...nums].some((n) => b.get(u)!.has(n)));
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
  /** Las palabras que escribio Damian para buscarlo ("Buscar con otras
   *  palabras"). Cambian lo que se le pregunta a las tiendas; que sea el
   *  mismo modelo se sigue decidiendo con el titulo (y con un codigo de
   *  modelo, si escribio uno). */
  palabras?: string | null;
}): Promise<Comparacion> {
  const propio = p.itemId.toUpperCase();
  const propias = plano(String(p.palabras ?? "")).slice(0, 120).trim();
  // Un codigo de modelo entre sus palabras ("THE-120AR"): se busca ese.
  const codigosPropios = String(p.palabras ?? "")
    .split(/\s+/)
    .map((x) => x.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ""))
    .filter((x) => x && x.toUpperCase() !== propio && esCodigoDeModelo(x));
  // El codigo de fabricante manda. Si no hay, los codigos del titulo, despues
  // los de la ayuda memoria y despues los de la descripcion.
  const codigos = [
    ...new Set([
      ...codigosPropios,
      ...(p.codigoFabricante?.trim()
        ? [p.codigoFabricante.trim()]
        : codigosDelArticulo(
            [p.titulo, p.memo ?? "", (p.descripcion ?? "").slice(0, 600)].join(" | "),
            p.itemId,
          )
            .filter((c) => c !== propio && esCodigoDeModelo(c))
            .slice(0, 2)),
    ]),
  ].slice(0, 3);
  const clave = palabrasClave(p.titulo, p.marca);
  const conMarca = clave && p.marca ? `${plano(p.marca)} ${clave}` : "";
  // Lo que se le pregunta a las tiendas por palabras: las suyas (con la
  // marca adelante si no la puso) o las del titulo.
  const marcaPlana = plano(p.marca ?? "");
  const porPalabras = propias
    ? marcaPlana && !` ${propias} `.includes(` ${marcaPlana} `)
      ? `${marcaPlana} ${propias}`
      : propias
    : conMarca || clave;
  // Sin codigo de modelo y sin marca no hay forma de saber que es el mismo.
  const porNombre = codigos.length === 0;
  const conPalabras = propias ? { palabras: String(p.palabras).trim().slice(0, 120) } : {};
  if (porNombre && (!p.marca || !porPalabras))
    return { fecha: new Date().toISOString(), buscado: [], resultados: [], fallaron: [], sinCodigo: true, ...conPalabras };
  const buscado = [...codigos, ...(porPalabras ? [porPalabras] : [])];

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
      const todas = [...new Set([...terminos(codigos), porPalabras].filter(Boolean))];
      const corto = terminos(codigos).slice(-1)[0];
      const preguntas =
        t.maximo >= todas.length ? todas : [...new Set([corto, porPalabras].filter(Boolean) as string[])].slice(0, t.maximo);
      for (const termino of preguntas) {
        const lista = await t.buscar(termino);
        if (lista === null) continue;
        contesto = true;
        for (const c of lista) {
          // Solo el mismo modelo: por el codigo o, si no tiene, por el nombre.
          const mismo =
            !esOtroModelo(p.titulo, c.titulo) &&
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
  // Las tiendas de una marca (la oficial de Dogo, las que se encontraron
  // buscando una marca), solo para esa marca.
  const suMarca = plano(p.marca ?? "").replace(/ /g, "");
  const deSuMarca = FUENTES.filter((t) => !t.marcas || (!!suMarca && t.marcas.includes(suMarca)));
  // Orden: primero las Tiendanube que se sabe que tienen la marca (con los
  // turnos contados, que no se queden afuera); despues las que no son
  // Tiendanube; al final las Tiendanube generales, empezando por una
  // distinta en cada producto, asi las que quedan para la proxima no son
  // siempre las mismas.
  const generales = deSuMarca.filter((t) => t.tiendanube && !t.marcas);
  const giro = generales.length ? [...p.itemId].reduce((a, ch) => a + ch.charCodeAt(0), 0) % generales.length : 0;
  const fuentes = [
    ...deSuMarca.filter((t) => t.tiendanube && t.marcas),
    ...deSuMarca.filter((t) => !t.tiendanube),
    ...generales.slice(giro),
    ...generales.slice(0, giro),
  ];
  // De a A_LA_VEZ tiendas: apenas una termina, empieza la siguiente (antes
  // se esperaba a la mas lenta de cada grupo de 8).
  const porTienda: Awaited<ReturnType<typeof unaTienda>>[] = new Array(fuentes.length);
  let siguiente = 0;
  await Promise.all(
    Array.from({ length: Math.min(A_LA_VEZ, fuentes.length) }, async () => {
      while (siguiente < fuentes.length) {
        const i = siguiente++;
        porTienda[i] = await unaTienda(fuentes[i]);
      }
    }),
  );
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
          if (!esOtroModelo(p.titulo, m.titulo) && esExacto(m.titulo, m.titulo, m.precio) && !deML.some((x) => x.link === m.link))
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
    ...conPalabras,
  };
}

// ------------------------------------------------------------ guardado

/** Lo buscado antes de esto no vale: tomaba medidas, watts y fechas como
 *  codigos ("2000", "14/10/2026") y daba como mismo modelo cualquier cosa
 *  (Damian, 18/11/2026, con una pistola de calor Dogo comparada con clavos:
 *  "eso no tiene nada que ver"). Es cuando se publico V.0.99.17. */
const VALE_DESDE = Date.parse("2026-11-18T20:10:00Z");

// Hasta V.0.99.54 todo lo buscado iba junto en un solo Setting: cada
// guardado leia todo, le sumaba lo suyo y lo volvia a escribir, y si dos
// buscaban a la vez el ultimo pisaba lo que habia encontrado el otro.
// Damian, 20/11/2026: "cuando hago una busqueda de compara precios eso puede
// quedar guardado para todos los usuarios" (ya lo estaba) y, sobre que se
// pisen, "si, arreglalo". Ahora va un renglon por producto: cada busqueda
// escribe solo los suyos.

/** Lo que habia en el Setting viejo pasa a la tabla, una sola vez. Si en el
 *  medio alguien ya busco ese producto, queda lo nuevo. */
async function pasarLoViejo(): Promise<void> {
  const viejo = await getSetting(S_COMPARADOR);
  if (!viejo) return;
  let o: unknown = null;
  try {
    o = JSON.parse(viejo);
  } catch {
    /* roto: no hay nada que pasar */
  }
  if (o && typeof o === "object" && !Array.isArray(o)) {
    const filas = Object.entries(o as Record<string, Comparacion>)
      .filter(([, c]) => c && typeof c.fecha === "string" && !Number.isNaN(Date.parse(c.fecha)))
      .map(([itemId, c]) => ({ itemId, fecha: new Date(c.fecha), datos: c as unknown as Prisma.InputJsonValue }));
    for (let i = 0; i < filas.length; i += 500)
      await prisma.comparacionPrecio.createMany({ data: filas.slice(i, i + 500), skipDuplicates: true });
  }
  await prisma.setting.deleteMany({ where: { key: S_COMPARADOR } });
}

// ------------------------------------------------------------ combos

/** Lo que es cada pieza de un combo (el comienzo de la palabra: "deposito"
 *  encuentra "depositos"). */
const TIPOS_DE_PIEZA = [
  "inodoro",
  "deposito",
  "mochila",
  "bidet",
  "asiento",
  "tapa",
  "bacha",
  "lavatorio",
  "pileta",
  "columna",
  "pedestal",
  "vanitory",
  "mueble",
  "espejo",
  "botiquin",
];

/** Un combo, comparado sumando sus piezas. Damian, 21/11/2026 (los combos
 *  Piazza y Pringles salian "No hay datos": las otras tiendas casi nunca
 *  venden el combo armado, venden cada pieza): "Si, hacelo".
 *
 *  - Por tienda: si una tienda vende TODAS las piezas (el mismo modelo de
 *    cada una), lo que cobra por todas juntas. Es lo que pagaria alguien
 *    que arma el combo en esa tienda.
 *  - Si ninguna tiene todas: lo mas barato de cada pieza, aunque sean de
 *    distintas tiendas, para tener una referencia.
 *
 *  Nuestro precio del combo es la suma de la Lista 2 de sus piezas
 *  (src/lib/combos.ts): se compara lo mismo con lo mismo. Si una pieza no
 *  esta cargada en el sistema o ninguna tienda la vende, no hay suma: daria
 *  un total mas barato que el real. */
/** Las piezas que nombra un titulo ("inodoro", "deposito", "bidet"...). La
 *  tapa es el asiento y la mochila es el deposito: cada tienda lo llama a
 *  su manera. */
const MISMA_PIEZA: Record<string, string> = { tapa: "asiento", mochila: "deposito" };
function tiposDe(t: string): Set<string> {
  return new Set(
    TIPOS_DE_PIEZA.filter((w) => ` ${plano(t)} `.includes(` ${w}`)).map((w) => MISMA_PIEZA[w] ?? w),
  );
}

function mismosTipos(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((w) => b.has(w));
}

/** La linea de un combo: lo que va entre la marca y la primera pieza.
 *  "COMBO PIAZZA AMALFI · INODORO + ..." -> amalfi; "COMBO PRINGLES JADE MAX
 *  · INODORO + DEPOSITO" -> jade, max (el Jade Max no es el Jade). */
function lineaDelCombo(titulo: string, marca: string | null): string[] {
  const deMarca = new Set(plano(marca ?? "").split(" ").filter(Boolean));
  const salida: string[] = [];
  for (const w of plano(titulo).split(" ")) {
    if (TIPOS_DE_PIEZA.some((t) => w.startsWith(t))) break;
    if (w === "combo" || deMarca.has(w) || w.length < 3 || /\d/.test(w)) continue;
    if (RELLENO.has(w) || GENERICAS.has(w) || /^piezas?$/.test(w)) continue;
    salida.push(w);
  }
  return salida;
}

export function sumarPiezas(
  propio: Comparacion,
  todas: string[],
  piezas: { itemId: string; titulo: string; precio: number | null; comparacion: Comparacion | null }[],
  /** El combo: su titulo (de ahi sale la linea: Amalfi, Jade Max) y marca. */
  combo: { titulo: string; marca: string | null },
): Comparacion {
  // Lo que se compara tiene que ser de la misma linea: el inodoro Amalfi no
  // es la pieza del combo Padova (por nombre se tomaba, porque coincidian
  // "inodoro" y "largo").
  const linea = lineaDelCombo(combo.titulo, combo.marca);
  const deLaLinea = (t: string) => linea.every((w) => ` ${plano(t)} `.includes(` ${w}`));
  // Una pieza no puede ser algo que trae otra pieza del combo: "Inodoro largo
  // Padova con deposito" no es el deposito solo (se sumaba dos veces).
  const tipos = piezas.map((pz) => tiposDe(pz.titulo));
  const deCadaUna = piezas.map((pz, i) => {
    const deOtras = new Set(tipos.flatMap((t, j) => (j === i ? [] : [...t])).filter((w) => !tipos[i].has(w)));
    return (pz.comparacion?.resultados ?? [])
      .filter(
        (r) =>
          r.exacto &&
          !r.suma &&
          (r.manual || deLaLinea(r.titulo)) &&
          !esConjunto(r.titulo) &&
          // Lo mismo que la pieza: el "inodoro con deposito y asiento" no es
          // el "inodoro con asiento" (le falta el deposito).
          (tipos[i].size ? mismosTipos(tiposDe(r.titulo), tipos[i]) : ![...tiposDe(r.titulo)].some((w) => deOtras.has(w))) &&
          (!pz.precio || (r.precio >= pz.precio * 0.4 && r.precio <= pz.precio * 2.5)),
      )
      .sort((a, b) => a.precio - b.precio);
  });
  const info = {
    piezas: todas.map((id) => {
      const i = piezas.findIndex((pz) => pz.itemId === id);
      return {
        itemId: id,
        titulo: i >= 0 ? piezas[i].titulo : null,
        tiendas: i >= 0 ? new Set(deCadaUna[i].map((r) => r.tienda)).size : 0,
      };
    }),
  };
  const sumas: PrecioAfuera[] = [];
  const completas = piezas.length > 0 && todas.every((id) => piezas.some((pz) => pz.itemId === id));
  const armar = (tienda: string, elegidas: PrecioAfuera[], marca: string): PrecioAfuera => ({
    tienda,
    titulo: `Suma de las ${elegidas.length} piezas`,
    precio: elegidas.reduce((t, r) => t + r.precio, 0),
    // El link de la primera pieza (con una marca para que no se repita).
    link: `${elegidas[0].link}#${marca}`,
    exacto: true,
    ...(elegidas.some((r) => r.porNombre) ? { porNombre: true } : {}),
    ...(elegidas.some((r) => r.anterior) ? { anterior: elegidas.find((r) => r.anterior)!.anterior } : {}),
    suma: elegidas.map((r, i) => ({
      itemId: piezas[i].itemId,
      tienda: r.tienda,
      titulo: r.titulo,
      precio: r.precio,
      link: r.link,
    })),
  });
  if (completas) {
    const tiendas = new Set(deCadaUna.flatMap((l) => l.map((r) => r.tienda)));
    for (const t of tiendas) {
      const elegidas = deCadaUna.map((l) => l.find((r) => r.tienda === t));
      if (elegidas.every((r): r is PrecioAfuera => !!r)) sumas.push(armar(t, elegidas, "suma-de-piezas"));
    }
    if (!sumas.length && deCadaUna.every((l) => l.length > 0))
      sumas.push(armar("Piezas en distintas tiendas", deCadaUna.map((l) => l[0]), "piezas-sueltas"));
  }
  // El combo armado que vende otra tienda: de la misma linea y con las
  // mismas piezas ("inodoro + bidet" no es "inodoro + deposito"). Los que
  // agrego Damian con un link quedan siempre.
  const nuestras = tiposDe(combo.titulo);
  const mismasPiezas = (t: string) => mismosTipos(tiposDe(t), nuestras);
  const propios = propio.resultados.filter((r) => !r.suma && (r.manual || (deLaLinea(r.titulo) && mismasPiezas(r.titulo))));
  const resultados = [...propios, ...sumas].sort((a, b) => a.precio - b.precio);
  const salida: Comparacion = { ...propio, resultados, combo: info };
  if (resultados.length) delete salida.sinCodigo;
  return salida;
}

/** El nombre de la tienda de un link: el de la lista si es una de las que se
 *  revisan ("Casa Andy"); si no, el del sitio ("www.sanitarios-lopez.com.ar"
 *  -> "Sanitarios Lopez"). */
export function nombreDeTienda(link: string): string {
  let host = "";
  try {
    host = new URL(link).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "Otra tienda";
  }
  const conocidas: { nombre: string; base: string }[] = [
    ...TIENDAS_VTEX,
    ...TIENDAS_WOO,
    ...TIENDAS_PRESTA,
    ...TIENDAS_TIENDANUBE,
    ...TIENDAS_TIENDANUBE_POR_MARCA,
    ...TIENDAS_MAGENTO,
    ...TIENDAS_DESIGN8,
  ];
  for (const t of conocidas) {
    try {
      if (new URL(t.base).hostname.toLowerCase().replace(/^www\./, "") === host) return t.nombre;
    } catch {
      /* sigue */
    }
  }
  if (/(^|\.)sodimac\.com\.ar$/.test(host)) return "Sodimac";
  const nombre = host.split(".")[0].replace(/[-_]+/g, " ").trim();
  return nombre ? nombre.replace(/\b\w/g, (l) => l.toUpperCase()) : host;
}

/** Lo que agrego Damian con un link, con el precio de hoy. Si la pagina no
 *  contesta (o da algo disparatado), queda el de antes, marcado. */
async function precioManualAlDia(r: PrecioAfuera, desde: string): Promise<PrecioAfuera> {
  const d = await precioDeUnaPagina(r.link).catch(() => null);
  if (d?.encontrado && d.precio >= r.precio * 0.5 && d.precio <= r.precio * 2)
    return { tienda: r.tienda, titulo: r.titulo, precio: d.precio, link: r.link, exacto: true, manual: true };
  return { ...r, anterior: r.anterior ?? desde };
}

/** Agrega (o actualiza) un precio que Damian trajo con un link. */
export async function agregarPrecioManual(itemId: string, r: PrecioAfuera): Promise<Comparacion> {
  await pasarLoViejo().catch(() => {});
  const fila = await prisma.comparacionPrecio.findUnique({ where: { itemId } });
  const antes = fila && fila.fecha.getTime() >= VALE_DESDE ? (fila.datos as unknown as Comparacion) : null;
  const c: Comparacion = antes
    ? { ...antes, resultados: [...(antes.resultados ?? [])] }
    : { fecha: new Date().toISOString(), buscado: [], resultados: [], fallaron: [] };
  c.resultados = [...c.resultados.filter((x) => x.link !== r.link), { ...r, manual: true, exacto: true }].sort(
    (a, b) => a.precio - b.precio,
  );
  delete c.sinCodigo;
  const fecha = new Date(c.fecha);
  const datos = c as unknown as Prisma.InputJsonValue;
  await prisma.comparacionPrecio.upsert({ where: { itemId }, update: { fecha, datos }, create: { itemId, fecha, datos } });
  return c;
}

/** Saca un precio que se habia agregado con un link. */
export async function quitarPrecioManual(itemId: string, link: string): Promise<Comparacion | null> {
  const fila = await prisma.comparacionPrecio.findUnique({ where: { itemId } });
  if (!fila) return null;
  const c = fila.datos as unknown as Comparacion;
  c.resultados = (c.resultados ?? []).filter((x) => !(x.manual && x.link === link));
  await prisma.comparacionPrecio.update({
    where: { itemId },
    data: { datos: c as unknown as Prisma.InputJsonValue },
  });
  return c;
}

export async function comparacionesGuardadas(): Promise<Record<string, Comparacion>> {
  await pasarLoViejo().catch(() => {});
  try {
    const filas = await prisma.comparacionPrecio.findMany({ where: { fecha: { gte: new Date(VALE_DESDE) } } });
    const validas: Record<string, Comparacion> = {};
    for (const f of filas) validas[f.itemId] = f.datos as unknown as Comparacion;
    return validas;
  } catch {
    return {};
  }
}

export async function guardarComparaciones(
  nuevas: Record<string, Comparacion>,
  /** El titulo de cada producto: lo que se trae de la busqueda anterior se
   *  revisa con las reglas de ahora (que no vuelva el termotanque comun
   *  comparado con el de alta recuperacion). */
  titulos: Record<string, string> = {},
): Promise<void> {
  await pasarLoViejo().catch(() => {});
  const ids = Object.keys(nuevas);
  const previas = new Map(
    (await prisma.comparacionPrecio.findMany({ where: { itemId: { in: ids }, fecha: { gte: new Date(VALE_DESDE) } } })).map(
      (f) => [f.itemId, f.datos as unknown as Comparacion],
    ),
  );
  for (const [id, nueva] of Object.entries(nuevas)) {
    // Si una tienda no contesto esta vez, se queda lo que habia traido antes:
    // que no conteste no quiere decir que dejo de venderlo. Damian,
    // 19/11/2026: "hay productos que antes me traias de Easy y ahora no".
    const antes = previas.get(id);
    // Los que agrego Damian con un link quedan siempre, con el precio al dia.
    const manuales = (antes?.resultados ?? []).filter(
      (r) => r.manual && !nueva.resultados.some((x) => x.link === r.link),
    );
    if (manuales.length) {
      nueva.resultados.push(...(await Promise.all(manuales.map((r) => precioManualAlDia(r, antes!.fecha)))));
      delete nueva.sinCodigo;
    }
    if (antes && nueva.fallaron.length > 0) {
      const ya = new Set(nueva.resultados.map((r) => r.tienda));
      for (const r of antes.resultados ?? [])
        if (
          !r.manual &&
          !r.suma &&
          nueva.fallaron.includes(r.tienda) &&
          !ya.has(r.tienda) &&
          !(titulos[id] && esOtroModelo(titulos[id], r.titulo))
        )
          nueva.resultados.push({ ...r, anterior: r.anterior ?? antes.fecha });
    }
    nueva.resultados.sort((a, b) => a.precio - b.precio);
    const datos = nueva as unknown as Prisma.InputJsonValue;
    const fecha = new Date(nueva.fecha);
    await prisma.comparacionPrecio.upsert({
      where: { itemId: id },
      update: { fecha, datos },
      create: { itemId: id, fecha, datos },
    });
  }
}
