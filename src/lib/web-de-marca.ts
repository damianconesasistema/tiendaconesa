import { decodificar } from "@/lib/fv-ficha";
import { buscarLinksEnGoogle } from "@/lib/gemini";

// Buscar un articulo en la pagina web de SU MARCA, sea cual sea.
//
// Damian, 17/11/2026: "aca deberia ser no FV o Piazza, podes buscar en la web
// de la marca que buscamos con el modelo, hacelo mas generico" y "estaria
// bueno poner la web de la marca para ver si puede sacar info de ahi". La web
// de cada marca se carga en el panel, en Marcas (src/lib/marcas-server.ts).
//
// Cada fabricante tiene su pagina hecha distinto. Se prueba, en orden:
// 1. Las tiendas armadas con WooCommerce (FV, Piazza, Peirano, Masecor):
//    tienen un buscador publico que contesta en JSON.
// 2. VTEX (Roca) y Shopify: tambien contestan en JSON.
// 3. Cualquier otra: su buscador comun (el de WordPress "?s=", el de Magento,
//    el formulario de la pagina) y se entra a los resultados que nombran el
//    codigo.
// De la pagina del producto se lee la ficha que dejan para Google (JSON-LD
// "Product") o, si no, las etiquetas para compartir (og:title, og:image).
//
// Un resultado vale SOLO si nombra el codigo: con el nombre del modelo solo
// ("Bari") se puede traer otro producto de la misma linea.
//
// Seguridad: se le pide unicamente a la direccion de la marca que cargo el
// admin, nunca a una que venga del navegador; los links de los resultados se
// siguen solo si son del mismo sitio, y las fotos solo de ese sitio o de los
// servidores de fotos conocidos de esas plataformas (fotoDeLaMarca).

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";
const ESPERA_MAX = 15_000;
const TOPE_PAGINA = 3 * 1024 * 1024;

export type DatosDeLaWeb = {
  encontrado: boolean;
  motivo?: string;
  /** El nombre que le da la marca: "Monocomando Lavatorio Bari". */
  nombre?: string;
  foto?: string | null;
  descripcion?: string | null;
  /** La pagina del producto. */
  ficha?: string;
  /** Con que codigo aparecio. */
  codigo?: string;
};

// ------------------------------------------------------------- utilidades

/** La direccion de la marca, limpia: "https://ferrum.com". null si no sirve. */
export function origenDeLaWeb(web: string | null | undefined): URL | null {
  const t = String(web ?? "").trim();
  if (!t) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!hostPublico(u.hostname)) return null;
    return new URL(u.origin);
  } catch {
    return null;
  }
}

/** Nada de direcciones internas: ni localhost, ni IPs sueltas, ni nombres sin
 *  punto. Una web de marca es siempre un dominio publico. */
function hostPublico(host: string): boolean {
  const h = host.toLowerCase();
  if (!h.includes(".")) return false;
  if (/^[\d.]+$/.test(h) || h.includes(":")) return false;
  if (/(^|\.)(localhost|local|internal|lan|home|corp)$/.test(h)) return false;
  return true;
}

const sinWww = (h: string) => h.toLowerCase().replace(/^www\./, "");

/** Mismo sitio: ferrum.com, www.ferrum.com y tienda.ferrum.com cuentan. */
function mismoSitio(host: string, base: URL): boolean {
  const a = sinWww(host);
  const b = sinWww(base.hostname);
  return a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);
}

/** Servidores de fotos de las plataformas: ahi guardan las fotos las tiendas
 *  VTEX, Shopify y los WordPress con el CDN de WordPress. */
const CDN_DE_FOTOS = ["vteximg.com.br", "vtexassets.com", "cdn.shopify.com", "wp.com"];

/** Una foto se baja solo si es del sitio de la marca o del servidor de
 *  fotos de su plataforma. */
export function fotoDeLaMarca(url: string | null | undefined, web: string | null | undefined): boolean {
  const base = origenDeLaWeb(web);
  if (!url || !base) return false;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (!hostPublico(u.hostname)) return false;
    if (mismoSitio(u.hostname, base)) return true;
    const h = u.hostname.toLowerCase();
    return CDN_DE_FOTOS.some((c) => h === c || h.endsWith(`.${c}`));
  } catch {
    return false;
  }
}

/** El codigo como patron: "0207/C3-CR" encuentra "0207-C3-CR" y "0207 C3 CR",
 *  pero "21006" no encuentra "121006". */
function patronDelCodigo(codigo: string): RegExp {
  const partes = codigo
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(^|[^A-Z0-9])${partes.join("[^A-Z0-9]?")}([^A-Z0-9]|$)`);
}

function nombraElCodigo(texto: string | null | undefined, codigo: string): boolean {
  return !!texto && patronDelCodigo(codigo).test(decodificar(texto).toUpperCase());
}

/** HTML a texto con renglones: los parrafos y los items de lista se respetan. */
export function htmlATexto(html: string): string {
  return decodificar(
    String(html || "")
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function pedir(
  url: string,
  opciones: { json?: boolean; metodo?: "GET" | "POST"; cuerpo?: string } = {},
): Promise<{ status: number; url: string; texto: string } | null> {
  try {
    const r = await fetch(url, {
      method: opciones.metodo ?? "GET",
      headers: {
        "User-Agent": UA,
        Accept: opciones.json ? "application/json" : "text/html,application/xhtml+xml",
        ...(opciones.cuerpo ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      },
      body: opciones.cuerpo,
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
      redirect: "follow",
    });
    // Si una redireccion lo llevo a otro sitio, no se lee.
    let final: URL;
    try {
      final = new URL(r.url || url);
    } catch {
      return null;
    }
    if (!mismoSitio(final.hostname, new URL(url))) return null;
    const texto = (await r.text()).slice(0, TOPE_PAGINA);
    return { status: r.status, url: final.toString(), texto };
  } catch {
    return null;
  }
}

function json<T>(texto: string): T | null {
  try {
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

// ------------------------------------------- la ficha de una pagina de producto

type Atributos = Record<string, string>;

function atributos(tag: string): Atributos {
  const a: Atributos = {};
  for (const m of tag.matchAll(/([a-zA-Z_:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g))
    a[m[1].toLowerCase()] = m[3] ?? m[4] ?? "";
  return a;
}

function meta(html: string, nombre: string): string | null {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = atributos(m[0]);
    if ((a.property ?? a.name ?? "").toLowerCase() === nombre && a.content)
      return decodificar(a.content).trim();
  }
  return null;
}

type ProductoLd = {
  "@type"?: string | string[];
  name?: string;
  image?: unknown;
  description?: string;
  sku?: string;
  mpn?: string;
  "@graph"?: unknown[];
};

function productosLd(html: string): ProductoLd[] {
  const salida: ProductoLd[] = [];
  const juntar = (x: unknown) => {
    if (Array.isArray(x)) return x.forEach(juntar);
    if (!x || typeof x !== "object") return;
    const o = x as ProductoLd;
    if (Array.isArray(o["@graph"])) o["@graph"].forEach(juntar);
    const tipo = o["@type"];
    if (tipo === "Product" || (Array.isArray(tipo) && tipo.includes("Product"))) salida.push(o);
  };
  for (const m of html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ))
    juntar(json(m[1].trim()));
  return salida;
}

function primeraImagen(img: unknown): string | null {
  if (!img) return null;
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return primeraImagen(img[0]);
  if (typeof img === "object") {
    const o = img as { url?: unknown; contentUrl?: unknown };
    return primeraImagen(o.url ?? o.contentUrl);
  }
  return null;
}

function absoluta(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  try {
    return new URL(decodificar(url), base).toString();
  } catch {
    return null;
  }
}

/** Corta lo que no es del producto: el bloque de "Productos similares" o
 *  "relacionados" que algunas paginas meten adentro de la descripcion (Peirano
 *  lo hace), y los renglones vacios de mas. */
export function limpiarDescripcion(texto: string | null | undefined): string {
  const renglones = String(texto ?? "").split("\n");
  const corte = renglones.findIndex((l) =>
    /^\s*(productos?\s+(similares|relacionados)|tambi[eé]n\s+te\s+(puede|podr)|te\s+puede\s+interesar|relacionados)\b/i.test(l),
  );
  return (corte >= 0 ? renglones.slice(0, corte) : renglones)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** El texto del bloque de descripcion de la pagina (la pestaña
 *  "Descripcion" de WooCommerce y Magento, o lo marcado como descripcion).
 *  Se corta antes de la tabla de caracteristicas y de la pestaña siguiente,
 *  que van aparte. */
function bloqueDeDescripcion(html: string): string | null {
  const inicios = [
    /id=["'](tab-)?description["'][^>]*>/i,
    /itemprop=["']description["'][^>]*>/i,
    /class=["'][^"']*(product[-_]?description|descripcion)[^"']*["'][^>]*>/i,
  ];
  let mejor = "";
  for (const re of inicios) {
    const m = re.exec(html);
    if (!m) continue;
    const desde = m.index + m[0].length;
    const trozo = html.slice(desde, desde + 12000);
    const corte = trozo.search(
      /<table|<\/section>|<h[2-4][\s>]|id=["'][^"']*(spec|attribute|review|tab-label|additional)/i,
    );
    const texto = htmlATexto(corte >= 0 ? trozo.slice(0, corte) : trozo).slice(0, 1500).trim();
    if (texto.length > mejor.length) mejor = texto;
  }
  return mejor || null;
}

/** La tabla de caracteristicas, renglon por renglon: "• Material: Porcelana".
 *  Solo tablas marcadas como de especificaciones (Magento, WooCommerce y la
 *  mayoria de las fichas). */
function especificaciones(html: string): string[] {
  const filas: string[] = [];
  for (const t of html.matchAll(/<table\b([^>]*)>([\s\S]*?)<\/table>/gi)) {
    if (!/spec|attribute|caracter|ficha|tecnic|additional|shop_attributes/i.test(t[1])) continue;
    for (const r of t[2].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const celdas = [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)]
        .map((c) => htmlATexto(c[1]).replace(/\s+/g, " ").trim())
        .filter(Boolean);
      if (celdas.length === 2 && celdas[0].length <= 40 && celdas[1].length <= 120) {
        const fila = `• ${celdas[0]}: ${celdas[1]}`;
        if (!filas.includes(fila)) filas.push(fila);
      }
    }
  }
  return filas.slice(0, 30);
}

/** La descripcion para la tienda: el texto de la marca y, abajo, sus
 *  caracteristicas. */
function armarDescripcion(texto: string | null, caracteristicas: string[]): string | null {
  const partes = [limpiarDescripcion(texto)];
  if (caracteristicas.length) partes.push(`Características:\n${caracteristicas.join("\n")}`);
  const d = partes.filter(Boolean).join("\n\n").trim();
  return d ? d.slice(0, 4000) : null;
}

/** Lo que dice de si misma una pagina de producto. null si no parece una. */
export function leerPaginaDeProducto(
  html: string,
  url: string,
): { nombre: string; foto: string | null; descripcion: string | null; sku: string | null } | null {
  const ld = productosLd(html)[0];
  const nombre =
    htmlATexto(ld?.name ?? "") ||
    meta(html, "og:title") ||
    htmlATexto(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "");
  if (!nombre) return null;

  // El texto mas completo de los que haya: el de la ficha para Google suele
  // ser una linea ("Versatil y atemporal."); el de la pestaña, el parrafo.
  const textos = [
    htmlATexto(ld?.description ?? ""),
    bloqueDeDescripcion(html) ?? "",
    meta(html, "og:description") ?? "",
    meta(html, "description") ?? "",
  ]
    .map(limpiarDescripcion)
    .filter(Boolean);
  const texto = textos.sort((a, b) => b.length - a.length)[0] ?? null;

  return {
    nombre,
    foto: absoluta(primeraImagen(ld?.image) ?? meta(html, "og:image"), url),
    descripcion: armarDescripcion(texto, especificaciones(html)),
    sku: ld?.sku ?? ld?.mpn ?? null,
  };
}

/** Que la pagina sea la de UN producto y no una lista: lo dice su ficha para
 *  Google (JSON-LD "Product") o su etiqueta og:type. */
function pareceProducto(html: string): boolean {
  if (productosLd(html).length > 0) return true;
  return /product/i.test(meta(html, "og:type") ?? "");
}

// ------------------------------------------------------- por plataforma

type Hallazgo = Omit<DatosDeLaWeb, "encontrado" | "motivo">;

type WooProducto = {
  name?: string;
  permalink?: string;
  sku?: string;
  description?: string;
  short_description?: string;
  images?: { src?: string }[];
  attributes?: { name?: string; terms?: { name?: string }[] }[];
};

async function porWooCommerce(base: URL, codigo: string): Promise<Hallazgo | null> {
  const r = await pedir(
    `${base.origin}/wp-json/wc/store/v1/products?search=${encodeURIComponent(codigo)}&per_page=20`,
    { json: true },
  );
  const lista = r && r.status === 200 ? json<WooProducto[]>(r.texto) : null;
  if (!Array.isArray(lista)) return null;
  const p =
    lista.find((x) => nombraElCodigo(x.sku, codigo)) ??
    lista.find((x) => nombraElCodigo(x.name, codigo) || nombraElCodigo(x.permalink, codigo));
  if (!p?.name) return null;
  return {
    nombre: htmlATexto(p.name),
    foto: p.images?.[0]?.src ?? null,
    descripcion: armarDescripcion(
      [...new Set([p.short_description, p.description].map((x) => limpiarDescripcion(htmlATexto(x ?? ""))))]
        .filter(Boolean)
        .join("\n\n") || null,
      (p.attributes ?? [])
        .map((x) => [htmlATexto(x.name ?? ""), (x.terms ?? []).map((t) => htmlATexto(t.name ?? "")).filter(Boolean).join(", ")])
        .filter(([n, v]) => n && v)
        .map(([n, v]) => `• ${n}: ${v}`),
    ),
    ficha: p.permalink,
    codigo,
  };
}

type VtexProducto = {
  productName?: string;
  link?: string;
  description?: string;
  productReference?: string;
  items?: { referenceId?: { Value?: string }[]; images?: { imageUrl?: string }[] }[];
};

async function porVtex(base: URL, codigo: string): Promise<Hallazgo | null> {
  const r = await pedir(
    `${base.origin}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(codigo)}&_from=0&_to=19`,
    { json: true },
  );
  const lista = r && (r.status === 200 || r.status === 206) ? json<VtexProducto[]>(r.texto) : null;
  if (!Array.isArray(lista)) return null;
  const refs = (p: VtexProducto) => [
    p.productReference,
    ...(p.items ?? []).flatMap((i) => (i.referenceId ?? []).map((x) => x.Value)),
  ];
  const p =
    lista.find((x) => refs(x).some((v) => nombraElCodigo(v, codigo))) ??
    lista.find((x) => nombraElCodigo(x.productName, codigo));
  if (!p?.productName) return null;
  return {
    nombre: htmlATexto(p.productName),
    foto: p.items?.[0]?.images?.[0]?.imageUrl ?? null,
    descripcion: htmlATexto(p.description ?? "") || null,
    ficha: p.link,
    codigo,
  };
}

type ShopifySugerencias = {
  resources?: { results?: { products?: { title?: string; url?: string }[] } };
};
type ShopifyProducto = {
  title?: string;
  description?: string;
  images?: string[];
  variants?: { sku?: string }[];
};

async function porShopify(base: URL, codigo: string): Promise<Hallazgo | null> {
  const r = await pedir(
    `${base.origin}/search/suggest.json?q=${encodeURIComponent(codigo)}&resources[type]=product&resources[limit]=10`,
    { json: true },
  );
  const s = r && r.status === 200 ? json<ShopifySugerencias>(r.texto) : null;
  const lista = s?.resources?.results?.products;
  if (!Array.isArray(lista)) return null;
  for (const item of lista.slice(0, 5)) {
    if (!item.url) continue;
    const ruta = item.url.split("?")[0];
    const d = await pedir(`${base.origin}${ruta}.js`, { json: true });
    const p = d && d.status === 200 ? json<ShopifyProducto>(d.texto) : null;
    if (!p?.title) continue;
    const coincide =
      (p.variants ?? []).some((v) => nombraElCodigo(v.sku, codigo)) || nombraElCodigo(p.title, codigo);
    if (!coincide) continue;
    const foto = p.images?.[0] ?? null;
    return {
      nombre: htmlATexto(p.title),
      foto: foto ? (foto.startsWith("//") ? `https:${foto}` : foto) : null,
      descripcion: htmlATexto(p.description ?? "") || null,
      ficha: `${base.origin}${ruta}`,
      codigo,
    };
  }
  return null;
}

/** Los links de una pagina de resultados que nombran el codigo, del mismo
 *  sitio. */
function linksQueNombran(html: string, url: string, base: URL, codigo: string): string[] {
  const salida: string[] = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = atributos(`<a ${m[1]}>`).href;
    const destino = absoluta(href, url);
    if (!destino) continue;
    let u: URL;
    try {
      u = new URL(destino);
    } catch {
      continue;
    }
    if (!mismoSitio(u.hostname, base) || !/^https?:$/.test(u.protocol)) continue;
    if (/\.(pdf|jpe?g|png|webp|gif|zip|docx?|xlsx?)$/i.test(u.pathname)) continue;
    // Lo que vale es el nombre del link o la RUTA de la pagina: no lo que va
    // despues del "?", que en una pagina de resultados repite lo buscado
    // ("?p=2&q=BAR-IN-011-BL" es la pagina 2 de la busqueda, no el producto).
    if (u.searchParams.toString() && nombraElCodigo(decodeURIComponent(u.search), codigo)) continue;
    const texto = htmlATexto(m[2]);
    let ruta = u.pathname;
    try {
      ruta = decodeURIComponent(u.pathname);
    } catch {
      /* queda la ruta tal cual */
    }
    if (!nombraElCodigo(texto, codigo) && !nombraElCodigo(ruta, codigo)) continue;
    u.hash = "";
    const limpio = u.toString();
    if (limpio !== url && !salida.includes(limpio)) salida.push(limpio);
  }
  return salida;
}

/** Los links a productos de una pagina de resultados, aunque no nombren el
 *  codigo: el de Ferrum "IKLM-B" no esta ni en el nombre ni en la direccion,
 *  solo adentro de la ficha. Se reconocen por como los marcan las
 *  plataformas (Magento, WooCommerce) o por la forma de la direccion. */
function linksAProductos(html: string, url: string, base: URL): string[] {
  const salida: string[] = [];
  for (const m of html.matchAll(/<a\b([^>]*)>/gi)) {
    const a = atributos(`<a ${m[1]}>`);
    const destino = absoluta(a.href, url);
    if (!destino) continue;
    let u: URL;
    try {
      u = new URL(destino);
    } catch {
      continue;
    }
    if (!mismoSitio(u.hostname, base) || u.search) continue;
    const porClase = /product-item-link|LoopProduct-link|product-link|product-name|product__link/i.test(
      a.class ?? "",
    );
    const porRuta = /\/(producto|product|productos|products|ficha|articulo)\/[^/]+|\.html$|\/p\/?$/i.test(
      u.pathname,
    );
    if (!porClase && !porRuta) continue;
    u.hash = "";
    const limpio = u.toString();
    if (limpio !== url && !salida.includes(limpio)) salida.push(limpio);
  }
  return salida;
}

/** El formulario de busqueda de la pagina, si tiene uno: a donde va, como se
 *  manda y como se llama el campo. */
function formularioDeBusqueda(
  html: string,
  url: string,
): { accion: string; metodo: "GET" | "POST"; campo: string } | null {
  for (const f of html.matchAll(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi)) {
    const a = atributos(`<form ${f[1]}>`);
    const campo = [...f[2].matchAll(/<input\b[^>]*>/gi)]
      .map((i) => atributos(i[0]))
      .find(
        (i) =>
          i.name &&
          ((i.type ?? "").toLowerCase() === "search" ||
            /^(q|s|search|buscar|busqueda|query|keyword|keywords|term|texto|json)$/i.test(i.name)),
      );
    if (!campo?.name) continue;
    const accion = absoluta(a.action || url, url);
    if (!accion) continue;
    return { accion, metodo: /post/i.test(a.method ?? "") ? "POST" : "GET", campo: campo.name };
  }
  return null;
}

async function porBuscadorComun(base: URL, codigo: string, hasta: number): Promise<Hallazgo | null> {
  const q = encodeURIComponent(codigo);
  const busquedas: { url: string; metodo?: "GET" | "POST"; cuerpo?: string }[] = [
    { url: `${base.origin}/?s=${q}` },
    { url: `${base.origin}/catalogsearch/result/?q=${q}` },
    { url: `${base.origin}/search?q=${q}` },
  ];
  // Y el formulario de la portada, que es el que usa la gente.
  const portada = await pedir(base.origin);
  const form = portada ? formularioDeBusqueda(portada.texto, portada.url) : null;
  if (form) {
    const accion = new URL(form.accion);
    if (mismoSitio(accion.hostname, base)) {
      if (form.metodo === "POST")
        busquedas.unshift({ url: form.accion, metodo: "POST", cuerpo: `${encodeURIComponent(form.campo)}=${q}` });
      else {
        accion.searchParams.set(form.campo, codigo);
        busquedas.unshift({ url: accion.toString() });
      }
    }
  }

  const vistas = new Set<string>();
  for (const b of busquedas) {
    if (Date.now() > hasta) break;
    const r = await pedir(b.url, { metodo: b.metodo, cuerpo: b.cuerpo });
    if (!r || r.status !== 200) continue;
    // A veces la busqueda con un solo resultado ya abre la pagina del producto.
    const directa = leerPaginaDeProducto(r.texto, r.url);
    if (directa && productosLd(r.texto).length > 0 && nombraElCodigo(htmlATexto(r.texto), codigo))
      return { ...directa, ficha: r.url, codigo };
    // Primero los resultados que nombran el codigo. Si ninguno lo nombra y la
    // busqueda trajo pocos productos, se entra a esos a ver si alguno lo
    // tiene en su ficha.
    let links = linksQueNombran(r.texto, r.url, base, codigo).slice(0, 3);
    if (links.length === 0) {
      const productos = linksAProductos(r.texto, r.url, base);
      if (productos.length > 0 && productos.length <= 6) links = productos.slice(0, 4);
    }
    for (const link of links) {
      if (vistas.has(link)) continue;
      vistas.add(link);
      const p = await pedir(link);
      if (!p || p.status !== 200 || !pareceProducto(p.texto)) continue;
      if (!nombraElCodigo(htmlATexto(p.texto), codigo)) continue;
      const datos = leerPaginaDeProducto(p.texto, p.url);
      if (datos) return { ...datos, ficha: p.url, codigo };
    }
  }
  return null;
}

// ----------------------------------------------------------- la busqueda

type Plataforma = "woo" | "vtex" | "shopify" | "otra";
const plataformas = new Map<string, { cuando: number; cual: Plataforma }>();
const memoria = new Map<string, { cuando: number; datos: DatosDeLaWeb }>();
const VIGENCIA = 60 * 60 * 1000;

/** Con que esta hecha la pagina. Se averigua una vez por hora por sitio. */
async function plataformaDe(base: URL): Promise<Plataforma> {
  const g = plataformas.get(base.origin);
  if (g && Date.now() - g.cuando < 6 * VIGENCIA) return g.cual;
  let cual: Plataforma = "otra";
  const woo = await pedir(`${base.origin}/wp-json/wc/store/v1/products?per_page=1`, { json: true });
  if (woo?.status === 200 && Array.isArray(json(woo.texto))) cual = "woo";
  else {
    const vtex = await pedir(`${base.origin}/api/catalog_system/pub/products/search?_from=0&_to=0`, {
      json: true,
    });
    if (vtex && (vtex.status === 200 || vtex.status === 206) && Array.isArray(json(vtex.texto))) cual = "vtex";
    else {
      const shop = await pedir(`${base.origin}/products.json?limit=1`, { json: true });
      const s = shop?.status === 200 ? json<{ products?: unknown }>(shop.texto) : null;
      if (Array.isArray(s?.products)) cual = "shopify";
    }
  }
  plataformas.set(base.origin, { cuando: Date.now(), cual });
  return cual;
}

/** Busca el articulo en la pagina de su marca, probando los codigos en orden
 *  (el mas probable primero). */
export async function buscarEnWebDeMarca(
  web: string,
  codigos: string[],
): Promise<DatosDeLaWeb> {
  const base = origenDeLaWeb(web);
  if (!base) return { encontrado: false, motivo: "la página web cargada para la marca no es válida" };
  const lista = [...new Set(codigos.map((c) => c.trim()).filter((c) => c.length >= 3))].slice(0, 3);
  if (lista.length === 0) return { encontrado: false, motivo: "no tiene un código para buscar" };

  const clave = `${base.origin}|${lista.join("|")}`;
  const g = memoria.get(clave);
  if (g && Date.now() - g.cuando < VIGENCIA) return g.datos;

  // Un articulo no puede llevarse mas de 40 segundos: la pantalla los pide
  // de a dos y el servidor corta cada pedido a los 120.
  const hasta = Date.now() + 40_000;
  const plataforma = await plataformaDe(base);
  for (const codigo of lista) {
    if (Date.now() > hasta) break;
    let h: Hallazgo | null = null;
    if (plataforma === "woo") h = await porWooCommerce(base, codigo);
    else if (plataforma === "vtex") h = await porVtex(base, codigo);
    else if (plataforma === "shopify") h = await porShopify(base, codigo);
    if (!h) h = await porBuscadorComun(base, codigo, hasta);
    if (h) {
      const datos: DatosDeLaWeb = {
        encontrado: true,
        ...h,
        foto: h.foto && fotoDeLaMarca(h.foto, web) ? h.foto : null,
      };
      memoria.set(clave, { cuando: Date.now(), datos });
      return datos;
    }
  }
  const datos: DatosDeLaWeb = {
    encontrado: false,
    motivo: `no está en ${sinWww(base.hostname)} (probé ${lista.join(", ")})`,
  };
  memoria.set(clave, { cuando: Date.now(), datos });
  return datos;
}

/** Sigue un link de Google (la redireccion de la busqueda) sin entrar: solo
 *  para saber a donde lleva. Si lleva al sitio de la marca, se lee esa pagina. */
export async function leerPaginaDeLaMarca(
  url: string,
  web: string,
  codigos: string[],
): Promise<DatosDeLaWeb | null> {
  const base = origenDeLaWeb(web);
  if (!base) return null;
  let destino = url;
  try {
    // Hasta 3 saltos, mirando cada uno: nunca se entra a un sitio ajeno.
    for (let i = 0; i < 3; i++) {
      const u = new URL(destino);
      if (mismoSitio(u.hostname, base)) break;
      if (!/(^|\.)google\.com$|vertexaisearch\.cloud\.google\.com$/i.test(u.hostname)) return null;
      const r = await fetch(destino, {
        redirect: "manual",
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(ESPERA_MAX),
      });
      const loc = r.headers.get("location");
      if (!loc) return null;
      destino = new URL(loc, destino).toString();
    }
    if (!mismoSitio(new URL(destino).hostname, base)) return null;
  } catch {
    return null;
  }
  const p = await pedir(destino);
  if (!p || p.status !== 200 || !pareceProducto(p.texto)) return null;
  const texto = htmlATexto(p.texto);
  const codigo = codigos.find((c) => nombraElCodigo(texto, c));
  if (!codigo) return null;
  const datos = leerPaginaDeProducto(p.texto, p.url);
  if (!datos) return null;
  return {
    encontrado: true,
    nombre: datos.nombre,
    foto: datos.foto && fotoDeLaMarca(datos.foto, web) ? datos.foto : null,
    descripcion: datos.descripcion,
    ficha: p.url,
    codigo,
  };
}

// ------------------------------------------------- el articulo, de punta a punta

/** Los codigos con que buscar un articulo: los que nombra su descripcion de
 *  GBP o su titulo (el del fabricante suele estar ahi: "(10330)", "BAR-IN-011")
 *  y, al final, su SKU, que en algunas marcas es el del fabricante. */
export function codigosDelArticulo(texto: string, sku: string): string[] {
  const t = String(texto || "").toUpperCase();
  const encontrados: string[] = [];
  const sumar = (c: string) => {
    const limpio = c.replace(/^[.\-/]+|[.\-/]+$/g, "");
    if (
      limpio.length >= 4 &&
      limpio.length <= 24 &&
      /\d/.test(limpio) &&
      /^[A-Z0-9][A-Z0-9.\-/]*$/.test(limpio) &&
      // Medidas, no codigos: "57X37X15", "150MM", "1/2", "3.5LTS".
      !/\d+([.,]\d+)?X\d+/.test(limpio) &&
      !/^\d+([.,/]\d+)?(MM|CM|MTS?|M|LTS?|L|KG|GR|W|V|HZ|")$/.test(limpio) &&
      !encontrados.includes(limpio)
    )
      encontrados.push(limpio);
  };
  // Primero lo que esta entre parentesis ("(BAR-CL-001-BL)"), despues las
  // palabras con numeros, empezando por el final, que es donde GBP lo pone.
  for (const m of t.matchAll(/\(([^)]+)\)/g)) sumar(m[1].trim());
  for (const w of t.replace(/[()]/g, " ").split(/\s+/).filter(Boolean).reverse()) sumar(w);
  const propio = String(sku || "").trim().toUpperCase();
  const salida = encontrados.filter((c) => c !== propio).slice(0, 2);
  if (propio) salida.push(propio);
  return salida;
}

const memoriaGoogle = new Map<string, { cuando: number; datos: DatosDeLaWeb }>();

/** Busca el articulo en la pagina de su marca y, si ahi no esta, en Google
 *  (solo paginas de ese mismo sitio). */
export async function buscarArticuloDeLaMarca(a: {
  web: string;
  marca: string;
  codigos: string[];
  titulo: string;
}): Promise<DatosDeLaWeb> {
  const enLaPagina = await buscarEnWebDeMarca(a.web, a.codigos);
  if (enLaPagina.encontrado) return enLaPagina;

  // La foto y la descripcion del mismo articulo piden lo mismo: a Google se
  // le pregunta una vez (su cupo es chico).
  const clave = `${a.web}|${a.codigos.join("|")}`;
  const g0 = memoriaGoogle.get(clave);
  if (g0 && Date.now() - g0.cuando < VIGENCIA) return g0.datos;
  const datos = await conGoogle(a, enLaPagina);
  memoriaGoogle.set(clave, { cuando: Date.now(), datos });
  return datos;
}

async function conGoogle(
  a: { web: string; marca: string; codigos: string[]; titulo: string },
  enLaPagina: DatosDeLaWeb,
): Promise<DatosDeLaWeb> {

  const base = origenDeLaWeb(a.web);
  if (!base || a.codigos.length === 0) return enLaPagina;
  const dominio = sinWww(base.hostname);
  const g = await buscarLinksEnGoogle(`site:${dominio} ${a.marca} ${a.codigos[0]} ${a.titulo}`.slice(0, 200));
  for (const link of g.links) {
    const d = await leerPaginaDeLaMarca(link, a.web, a.codigos);
    if (d) return d;
  }
  return {
    encontrado: false,
    motivo: `${enLaPagina.motivo ?? `no está en ${dominio}`}; en Google ${
      g.error ?? "tampoco apareció"
    }`,
  };
}
