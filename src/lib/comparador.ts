// El comparador de precios. Damian, 18/11/2026: "armame un comparador de
// precios con los publicados, para buscar a cuanto los venden ... busque por
// internet el mismo modelo ... ya sea por titulo, codigo de fabricante,
// descripcion".
//
// Donde se busca:
//   - Easy y Blaisten: tiendas hechas con VTEX, que dejan consultar su
//     catalogo con precios (/api/catalog_system/pub/products/search).
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
const ESPERA = 10_000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

export const TIENDAS_VTEX = [
  { nombre: "Easy", base: "https://www.easy.com.ar" },
  { nombre: "Blaisten", base: "https://www.blaisten.com.ar" },
] as const;

export type PrecioAfuera = {
  tienda: string;
  titulo: string;
  precio: number;
  link: string;
  /** Nombra el mismo codigo: es el mismo modelo. */
  exacto: boolean;
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
  if (codigos.length === 0)
    return { fecha: new Date().toISOString(), buscado: [], resultados: [], fallaron: [], sinCodigo: true };
  const buscado = [...codigos, ...(conMarca || clave ? [conMarca || clave] : [])];

  // El mismo modelo: nombra el codigo en el nombre, la referencia o el
  // detalle del producto (no en una descripcion larga, donde aparece
  // cualquier cosa); es de la misma marca; y el precio no es disparatado.
  const precioRazonable = (precio: number) => !p.precio || (precio >= p.precio * 0.4 && precio <= p.precio * 2.5);
  const esExacto = (fuerte: string, conMarcaYTodo: string, precio: number) =>
    codigos.some((c) => variantes(c).some((v) => nombraElCodigo(fuerte, v))) &&
    (!p.marca || nombraLaMarca(conMarcaYTodo, p.marca)) &&
    precioRazonable(precio);

  // Las tiendas a la vez (cada una tarda lo suyo). Adentro de cada una: el
  // codigo como lo escriba ella; si no aparece, por marca y palabras, por si
  // la tienda lo tiene pero su buscador no lo encuentra por el codigo.
  const porTienda = await Promise.all(
    TIENDAS_VTEX.map(async (t) => {
      const deEsta: PrecioAfuera[] = [];
      let contesto = false;
      const preguntas = [...new Set([...terminos(codigos), conMarca || clave].filter(Boolean))];
      for (const termino of preguntas) {
        const lista = await buscarEnVtex(t.base, termino);
        if (lista === null) continue;
        contesto = true;
        for (const v of lista) {
          const item = v.items?.[0];
          const precio = item?.sellers?.[0]?.commertialOffer?.Price ?? 0;
          if (!(precio > 0) || !v.productName || !v.link) continue;
          const fuerte = [v.productName, v.productReference, item?.name, ...(item?.referenceId ?? []).map((x) => x.Value)]
            .filter(Boolean)
            .join(" ");
          const texto = [fuerte, v.brand, v.description?.slice(0, 2000)].filter(Boolean).join(" ");
          // Solo el mismo modelo.
          if (!esExacto(fuerte, texto, precio)) continue;
          const link = v.link.startsWith("http") ? v.link : `${t.base}${v.link}`;
          if (deEsta.some((r) => r.link === link)) continue;
          deEsta.push({ tienda: t.nombre, titulo: v.productName, precio: Math.round(precio), link, exacto: true });
        }
        if (deEsta.length) break;
      }
      return { tienda: t.nombre, deEsta, contesto };
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
          if (esExacto(m.titulo, m.titulo, m.precio) && !deML.some((x) => x.link === m.link))
            deML.push({ tienda: "MercadoLibre", titulo: m.titulo, precio: m.precio, link: m.link, exacto: true });
        if (deML.length) break;
      }
    resultados.push(...deML.sort((a, b) => a.precio - b.precio).slice(0, 3));
  }

  resultados.sort((a, b) => Number(b.exacto) - Number(a.exacto) || a.precio - b.precio);
  return { fecha: new Date().toISOString(), buscado, resultados: resultados.slice(0, 15), fallaron };
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
  await setSetting(S_COMPARADOR, JSON.stringify({ ...todas, ...nuevas }));
}
