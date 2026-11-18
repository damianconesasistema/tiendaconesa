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
// "Mismo modelo" solo si el resultado nombra el codigo (la misma regla que
// para traer fotos: "tiene que ser exacto"). Lo que se encontro por palabras
// queda como "parecido", aparte: sirve para mirar, no para comparar.
//
// Los resultados se guardan (tabla Setting) para ver la pantalla sin volver a
// buscar todo.

import { getSetting, setSetting } from "@/lib/settings";
import { codigosDelArticulo, nombraElCodigo } from "@/lib/web-de-marca";
import { preciosEnMercadoLibre } from "@/lib/mercadolibre";

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
};

type ProductoVtex = {
  productName?: string;
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

/** Nombra la marca como palabra ("FV", no "pvc" ni "fvx"). */
function nombraLaMarca(texto: string, marca: string): boolean {
  return ` ${plano(texto)} `.includes(` ${plano(marca)} `);
}

export async function preciosAfuera(p: {
  itemId: string;
  titulo: string;
  memo: string | null;
  codigoFabricante: string | null;
  marca: string | null;
}): Promise<Comparacion> {
  const propio = p.itemId.toUpperCase();
  const codigos = p.codigoFabricante?.trim()
    ? [p.codigoFabricante.trim()]
    : codigosDelArticulo(`${p.memo ?? ""} ${p.titulo}`, p.itemId)
        .filter((c) => c !== propio)
        .slice(0, 2);
  const clave = palabrasClave(p.titulo, p.marca);
  const buscado = [...codigos, ...(clave ? [clave] : [])];
  const esExacto = (texto: string) => codigos.some((c) => variantes(c).some((v) => nombraElCodigo(texto, v)));

  // Para los "parecidos": cuantas palabras del titulo comparten.
  const nuestras = new Set(palabrasDelTitulo(p.titulo, p.marca));
  const comunes = (titulo: string) => palabrasDelTitulo(titulo, p.marca).filter((w) => nuestras.has(w)).length;
  const minimoComun = Math.min(2, nuestras.size);

  // Las tiendas a la vez (cada una tarda lo suyo). Adentro de cada una: el
  // codigo como lo escriba ella; si no aparece el mismo modelo, por palabras,
  // para tener al menos parecidos.
  const porTienda = await Promise.all(
    TIENDAS_VTEX.map(async (t) => {
      const deEsta: (PrecioAfuera & { comun: number })[] = [];
      let contesto = false;
      const preguntas = [...terminos(codigos), ...(clave ? [clave] : [])];
      for (const termino of preguntas) {
        const lista = await buscarEnVtex(t.base, termino);
        if (lista === null) continue;
        contesto = true;
        for (const v of lista) {
          const item = v.items?.[0];
          const precio = item?.sellers?.[0]?.commertialOffer?.Price ?? 0;
          if (!(precio > 0) || !v.productName || !v.link) continue;
          const texto = [
            v.productName,
            v.productReference,
            item?.name,
            ...(item?.referenceId ?? []).map((x) => x.Value),
            v.description?.slice(0, 2000),
          ]
            .filter(Boolean)
            .join(" ");
          const exacto = esExacto(texto);
          const comun = comunes(v.productName);
          // Lo que no es el mismo modelo: de la misma marca y que se parezca
          // de verdad (las tiendas devuelven cualquier cosa cuando no tienen).
          if (!exacto && ((p.marca && !nombraLaMarca(texto, p.marca)) || comun < minimoComun || minimoComun === 0)) continue;
          const link = v.link.startsWith("http") ? v.link : `${t.base}${v.link}`;
          if (deEsta.some((r) => r.link === link)) continue;
          deEsta.push({ tienda: t.nombre, titulo: v.productName, precio: Math.round(precio), link, exacto, comun });
        }
        if (deEsta.some((r) => r.exacto)) break;
      }
      // De los parecidos, los tres que mas se parecen.
      const exactos = deEsta.filter((r) => r.exacto);
      const parecidos = deEsta
        .filter((r) => !r.exacto)
        .sort((x, y) => y.comun - x.comun || x.precio - y.precio)
        .slice(0, exactos.length ? 0 : 3);
      return {
        tienda: t.nombre,
        deEsta: [...exactos, ...parecidos].map((r) => ({
          tienda: r.tienda,
          titulo: r.titulo,
          precio: r.precio,
          link: r.link,
          exacto: r.exacto,
        })),
        contesto,
      };
    }),
  );
  const resultados: PrecioAfuera[] = porTienda.flatMap((x) => x.deEsta);
  const fallaron = buscado.length ? porTienda.filter((x) => !x.contesto).map((x) => x.tienda) : [];

  // MercadoLibre: solo exacto (marca + codigo), con la cuenta conectada.
  if (p.marca)
    for (const codigo of codigos) {
      const ml = (await preciosEnMercadoLibre({ marca: p.marca, codigo }).catch(() => []))
        // Los tres mas baratos: todos venden la misma ficha.
        .sort((a, b) => a.precio - b.precio)
        .slice(0, 3);
      for (const m of ml) resultados.push({ tienda: "MercadoLibre", titulo: m.titulo, precio: m.precio, link: m.link, exacto: true });
      if (ml.length) break;
    }

  resultados.sort((a, b) => Number(b.exacto) - Number(a.exacto) || a.precio - b.precio);
  return { fecha: new Date().toISOString(), buscado, resultados: resultados.slice(0, 15), fallaron };
}

// ------------------------------------------------------------ guardado

export async function comparacionesGuardadas(): Promise<Record<string, Comparacion>> {
  try {
    const o = JSON.parse((await getSetting(S_COMPARADOR)) || "{}");
    return o && typeof o === "object" && !Array.isArray(o) ? (o as Record<string, Comparacion>) : {};
  } catch {
    return {};
  }
}

export async function guardarComparaciones(nuevas: Record<string, Comparacion>): Promise<void> {
  const todas = await comparacionesGuardadas();
  await setSetting(S_COMPARADOR, JSON.stringify({ ...todas, ...nuevas }));
}
