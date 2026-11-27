// La Lista 2 (precio de 1 pago) de un articulo de Punto, calculada en el
// servidor (V.0.11.295). Es la MISMA cuenta que hace la pantalla de Punto
// (productoDeGbp en src/app/sistema/punto.ts): si se cambia alla, se cambia
// aca. La usa la tienda web para tomar sus precios de Punto. Damian,
// 27/11/2026: "los productos de la pagina web tienen que estar conectados con
// el sistema punto y tomar la lista 2 que es la de 1 pago".
//
// Sin ningun import a proposito: lo usan la capa de base
// (src/lib/tienda-desde-punto.ts) y las pruebas con node solo
// (scripts/pruebas/punto-precio.test.ts).
//
// La cuenta:
// - Un articulo con la lista del proveedor en dolares lleva sus Listas 1 y 2
//   al dolar de hoy: Lista x (dolar del articulo / dolar con que se armo,
//   dolarRef). El dolar del articulo: uno fijo si tiene; si no, la compra
//   del Blue o del BNA (V.0.11.291); sin cotizacion, el del formador.
// - El flete (fijo del articulo, o el % de su proveedor) y el otro costo se
//   suman al costo y la Lista 2 sube en la misma proporcion: el margen queda
//   igual y el flete lo paga el precio.

/** El dolar con que se importaron de GBP las listas en dolares, antes de que
 *  existiera dolarRef (23/11/2026, BNA venta de ese dia). */
export const DOLAR_REF_INICIAL = 1600;
/** Cuantos descuentos entran en la cadena (como en la pantalla). */
export const N_DTOS = 8;

/** Lo que hace falta de un articulo guardado (ArticuloPunto). */
export type ArticuloPrecio = {
  cod: string;
  cat?: string;
  lista?: number;
  lista1?: number;
  lista2?: number;
  iva?: number;
  mon?: string;
  dolar?: number;
  dolarRef?: number;
  dolarTipo?: string;
  dtos?: unknown;
  recs?: unknown;
  contado?: { pct?: number } | null;
  flete?: number;
  otroCosto?: number;
  combo?: { piezas?: unknown[] } | null;
};

export type ContextoPrecio = {
  /** La compra del dia; 0 si no hay. */
  blue: number;
  bna: number;
  /** El dolar del formador (el de antes, cargado a mano); 0 si no hay. */
  formador: number;
  /** El flete % del proveedor del articulo (su "cat"), 0 si no tiene. */
  fletePct: (cat: string) => number;
};

const num = (x: unknown): number => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};
/** Redondeo a centavos, como la pantalla. */
export const cent = (n: number): number => Math.round((Number(n) || 0) * 100) / 100;
const facIva = (i: number | null | undefined): number => 1 + (i == null ? 21 : Number(i)) / 100;

/** La razon social como clave del flete %: sin acentos, minusculas, un solo
 *  espacio (la misma que usa la pantalla). */
export function claveProv(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** El dolar de un articulo con la lista en dolares. */
export function dolarDelArticulo(a: ArticuloPrecio, ctx: ContextoPrecio): number {
  if (num(a.dolar) > 0) return num(a.dolar);
  const v = a.dolarTipo === "blue" ? ctx.blue : ctx.bna;
  return v > 0 ? v : ctx.formador;
}

/** Los descuentos de GBP (cuatro lugares y los recargos negativos), como
 *  factor. Null si no tiene. */
function factorGbp(a: ArticuloPrecio): number | null {
  if (!Array.isArray(a.dtos)) return null;
  const ds = a.dtos.map(num);
  const rs = (Array.isArray(a.recs) ? a.recs : []).map(num);
  const cadena = ds
    .filter((d) => d > 0)
    .concat(rs.filter((r) => r < 0).map((r) => -r))
    .slice(0, N_DTOS);
  const recs = rs.filter((r) => r > 0).concat(ds.filter((d) => d < 0).map((d) => -d));
  const f = cadena.reduce((x, d) => x * (1 - d / 100), 1) * recs.reduce((x, r) => x * (1 + r / 100), 1);
  return f > 0 ? f : null;
}

export const esComboPunto = (a: ArticuloPrecio): boolean =>
  !!(a.combo && Array.isArray(a.combo.piezas) && a.combo.piezas.length);

/** La Lista 2 (1 pago) de ese articulo, en pesos con centavos. Null si es un
 *  combo de Punto (la web arma los suyos con sus piezas) o no tiene precio. */
export function listaDosDePunto(a: ArticuloPrecio, ctx: ContextoPrecio): number | null {
  if (esComboPunto(a)) return null;
  const iva = num(a.iva) || 21;
  const usd = a.mon === "USD";
  const dol = usd ? dolarDelArticulo(a, ctx) : 0;
  const ref = usd ? (num(a.dolarRef) > 0 ? num(a.dolarRef) : DOLAR_REF_INICIAL) : 0;
  const facDol = usd && ref > 0 && dol > 0 ? dol / ref : 1;
  const L1 = cent(num(a.lista1) * facDol);
  const L2 = cent(num(a.lista2) * facDol);
  if (!(L2 > 0)) return null;
  const listaArs = usd ? (dol > 0 ? cent(num(a.lista) * dol) : 0) : num(a.lista);
  // La cadena de GBP cuenta si hay lista del proveedor (como dtosGbp con lista 1).
  const fGbp = factorGbp(a);
  const gd = listaArs > 0 ? fGbp : null;
  const contPct = a.contado && num(a.contado.pct) > 0 && num(a.contado.pct) < 100 ? num(a.contado.pct) : 0;
  const costoProd = gd ? cent(listaArs * gd * (1 - contPct / 100) * facIva(iva)) : cent(L1 / 1.25);
  const fleteFijo = num(a.flete) > 0 ? cent(num(a.flete)) : 0;
  const fletePct = fleteFijo ? 0 : ctx.fletePct(String(a.cat ?? ""));
  const flete = fleteFijo || cent((costoProd * fletePct) / 100);
  const otro = num(a.otroCosto) > 0 ? cent(num(a.otroCosto)) : 0;
  const costo = cent(costoProd + flete + otro);
  const factor = (flete > 0 || otro > 0) && costoProd > 0 ? costo / costoProd : 1;
  return cent(L2 * factor);
}

// ------------------------------------------------ la web toma estos precios
/** Lo que hace falta de un producto de la tienda web. */
export type ProductoWeb = {
  itemId: string;
  sku: string | null;
  title: string;
  category: string;
  brand: string | null;
  codigoSistema: string | null;
  locked: boolean;
  salePrice: number | null;
};

export type CruceWeb = {
  /** Las filas para la importacion (columnas del importador). */
  raw: Record<string, unknown>[];
  noEstan: number;
  sinPrecio: number;
  conOferta: number;
  conCandado: number;
};

/** Una fila por producto de la web que esta en Punto con Lista 2: el precio
 *  de 1 pago en pesos enteros ("numeros redondos siempre sin decimales").
 *  El cruce: el codigo de Punto en codigoSistema; si no, el SKU, el codigo
 *  del sitio, o lo que va despues del ultimo guion (MARCA-1234). */
export function cruzarWebConPunto(
  productos: readonly ProductoWeb[],
  articulos: readonly ArticuloPrecio[],
  ctx: ContextoPrecio,
): CruceWeb {
  const porCod = new Map<string, ArticuloPrecio>();
  for (const a of articulos) if (a && typeof a.cod === "string") porCod.set(a.cod.trim(), a);
  const out: CruceWeb = { raw: [], noEstan: 0, sinPrecio: 0, conOferta: 0, conCandado: 0 };
  const vistos = new Set<string>();
  for (const p of productos) {
    if (vistos.has(p.itemId)) continue;
    vistos.add(p.itemId);
    const cod = [p.codigoSistema, p.sku, p.itemId, p.itemId.split("-").pop()]
      .map((c) => (c ?? "").trim())
      .find((c) => c && porCod.has(c));
    if (!cod) {
      out.noEstan++;
      continue;
    }
    const precio = listaDosDePunto(porCod.get(cod)!, ctx);
    if (precio == null || !(precio > 0)) {
      out.sinPrecio++;
      continue;
    }
    if (p.salePrice != null) out.conOferta++;
    if (p.locked) out.conCandado++;
    out.raw.push({
      codigo: p.itemId,
      codigo_sistema: cod,
      titulo: p.title,
      categoria: p.category,
      marca: p.brand,
      precio: Math.round(precio),
    });
  }
  return out;
}
