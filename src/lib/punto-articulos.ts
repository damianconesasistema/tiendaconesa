import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  type CambioExcel,
  type ColumnasProveedor,
  type FotoArticulo,
  aplicarAlArticulo,
  fotoDe,
  igualPlata,
  mismaFoto,
} from "@/lib/punto-cambios-excel";

// Los articulos de verdad del sistema Punto: los que se traen del Excel que
// exporta GlobalBluePoint (codigo, descripcion, costo, Lista 1, Lista 2,
// stock). Damian, 21/11/2026: "en el sistema que estamos armando me podes
// agregar todos los productos de PIAZZA, te mando el Excel de GBP con los
// costos, Lista 1 y Lista 2".
//
// NO van en el codigo de Punto (src/app/sistema/punto.ts): el
// repositorio es publico y ahi cualquiera leeria los costos. Se guardan en la
// base, en la tabla Setting, y los entrega /sistema/articulos solo a quien
// entro con usuario y permiso de "Sistema Punto". Asi los ve cualquier puesto.
//
// Un solo renglon con todos (JSON). Alcanza de sobra para el catalogo entero
// de GBP; si algun dia no alcanza, se pasa a una tabla propia.
//
// V.0.99.82: cada articulo puede tener un flete FIJO en pesos por unidad
// (flete). Damian, 22/11/2026: "un tanque que tiene que ir a buscar le sale
// 50 mil pesos y el costo del producto son 80 mil ... si cambia mañana, pasa
// a salir 100 mil pesos ese tanque, que el costo del envio ... se siga
// manteniendo". Se carga en Punto (PATCH /sistema/articulos) y volver a
// importar el Excel de GBP NUNCA lo pisa. Como el import y el cambio de un
// flete leen y vuelven a escribir el mismo renglon, los dos van en una
// transaccion que lo bloquea (FOR UPDATE): uno espera al otro y ninguno
// pierde lo que guardo el otro.
//
// Tambien V.0.99.82, con la misma regla que el flete (se carga en Punto, el
// import nunca lo pisa):
// - otroCosto / otroNombre: cualquier otro costo por unidad, con IVA, que se
//   suma al precio. Damian: "agregar un campo vacio ... cualquier cosa que
//   quiera agregar como un costo ... para sumar en el precio".
// - bulto: el proveedor lo vende solo en bultos cerrados de N. Daniel: "en
//   Piazza ... ese articulo se vende en combo de 6 unidades ... por mas que
//   yo necesite 2, van a pedir 6". El pedido al proveedor redondea a eso.

export const CLAVE_ARTICULOS = "punto.articulos.v1";
export const MAXIMO_ARTICULOS = 30000;

export type ArticuloPunto = {
  /** El codigo de GBP (item_code). */
  cod: string;
  tit: string;
  /** La marca (PIAZZA, HYDROS...). */
  prov: string;
  /** El rubro y el subrubro como estan en GBP (cat_desc, subcat_desc). */
  cat: string;
  subrub: string;
  /** La columna "Costo" de GBP: es la LISTA del proveedor, sin IVA (en
   *  Piazza, el "Precio de lista" del papel). El costo de verdad sale de la
   *  Lista 1. */
  lista: number;
  lista1: number;
  lista2: number;
  iva: number;
  stockBA: number;
  /** "Dep Cordoba" tal cual viene: el stock de Traslasierra. Hay muchos en
   *  150 y parecen raros, pero son reales (Damian, 21/11/2026: "Si, son
   *  reales"). */
  stockTS: number;
  /** El ID interno de GBP. */
  gbpId: number | null;
  /** "USD" si el Costo de GBP viene en dolares (V.0.99.85: GUNDIN, GENEBRE,
   *  ABRAGOM...). La pagina lo pasa a pesos con el dolar del formador. No
   *  esta = pesos. La Lista 1 y la 2 siempre van en pesos. */
  mon?: "USD";
  /** V.0.99.93: con que dolar vinieron la Lista 1 y la 2 de un articulo con
   *  Costo en USD (el del formador el dia del import). Con otro dolar, la
   *  pagina las sube o baja en la misma proporcion. Es del import. */
  dolarRef?: number;
  /** Flete fijo en pesos por unidad (V.0.99.82). No esta = sin flete. */
  flete?: number;
  /** Otro costo en pesos por unidad, con IVA (V.0.99.82). No esta = nada. */
  otroCosto?: number;
  /** Que es ese otro costo ("embalaje", "seguro"...), hasta 40. */
  otroNombre?: string;
  /** Se compra solo de a N unidades (2 a 10.000). No esta = suelto. */
  bulto?: number;
  /** V.0.99.92: el dolar de ESTE articulo (Costo en USD). No esta = el del
   *  formador, el mismo para todos. Se carga en Punto; el import no lo pisa. */
  dolar?: number;
  /** V.0.99.95: es un combo armado en Punto con articulos que ya estan. El
   *  import de GBP no lo toca; null al guardar lo saca. */
  combo?: ComboArticulo | null;
  /** V.0.100.0: el precio por mayor. La lista mayorista (costo + pct %)
   *  reemplaza a la Lista 1 desde "desde" unidades, y la Lista 2 sale de
   *  ella con el mismo % de siempre. De Punto: el import no lo toca; null lo
   *  saca. */
  mayor?: { pct: number; desde: number } | null;
  /** V.0.11.207: el subrubro de Punto (LAVATORIO, DUCHA, BIDET...). Damian,
   *  23/11/2026: "en subrubro deberia aparecer ... son categorias lavatorio,
   *  ducha, bidet". No es el "subrub" de GBP (que es la linea del
   *  proveedor). De Punto: el import no lo toca; null lo saca. */
  subrubro?: string | null;
  /** V.0.11.209: el descuento por pago contado del proveedor y a cuántos
   *  días (Damián: "en qué cantidad de días es esa promoción, por default
   *  60 días"). Va en el costo. Antes no se guardaba y al recargar el costo
   *  salía sin él. De Punto: el import no lo toca; null lo saca.
   *  V.0.11.270: "cheques" si se le paga con varios (Damián: "son 3 cheques
   *  que se hacen", 30-60-90); "dias" es el último. */
  contado?: { pct: number; dias: number; cheques?: number[] } | null;
  /** V.0.11.210: el stock mínimo de Punto en cada sucursal (Damián:
   *  "necesito setearle el stock mínimo del artículo por sucursal"). No es
   *  el "min" del Excel de GBP. De Punto: el import no lo toca; null lo saca. */
  minimo?: { BA: number; TS: number } | null;
  /** V.0.11.213: cuándo se creó el artículo en el servidor (Damián: "cuando
   *  busco me tendría que aparecer últimos creados"). Lo pone el servidor la
   *  primera vez que guarda ese código; no viene de la página ni de GBP. Los
   *  que ya estaban antes de esta versión no lo tienen. */
  creado?: string;
  /** V.0.11.217: cómo se vende (Damián: "vender en combo o vender suelto;
   *  si pongo solo combo no me deja venderlo individual, y si tengo los 2
   *  me deja de los 2 modos"). Sin esto: de las dos formas. De Punto: el
   *  import no lo toca; null vuelve a las dos formas. */
  vende?: { suelto: boolean; combo: boolean } | null;
  // V.0.99.85: lo que GBP exporta en OTROS dos Excel, que no son el de
  // listas. Damian, 23/11/2026: "estos son los descuentos que tienen los
  // articulos, uno por uno ... entrando en cada articulo deberia ver los
  // descuentos que tiene el costo, lista 1, lista 2". Son de GBP (cada
  // import de ese Excel los reemplaza), pero importar el Excel de LISTAS no
  // los borra: vienen de otro archivo.
  /** "Descuento #1..#4" de GBP, en %, uno sobre otro, sin los ceros. No
   *  esta = todavia no se importo el Excel de descuentos; [] = no tiene. */
  dtos?: number[];
  /** "Recargo #1..#4" de GBP, en %, igual que los descuentos. */
  recs?: number[];
  /** "Codigo del Proveedor / Fabricante" (Excel de estructura). */
  fab?: string;
  /** "UPB - Unidades por Bulto" de GBP, cuando es 2 o mas. */
  upb?: number;
  /** "Cantidad Minima" y "Cantidad Optima" de stock de GBP. */
  min?: number;
  opt?: number;
};

/** Lo que se carga en Punto y el import de GBP no pisa nunca. */
export const CAMPOS_DE_PUNTO = ["flete", "otroCosto", "otroNombre", "bulto", "dolar"] as const;
type CampoDePunto = (typeof CAMPOS_DE_PUNTO)[number];
/** Lo de GBP que llega en los Excel de descuentos y de estructura: el Excel
 *  de listas no los trae, asi que importarlo no los toca. */
export const CAMPOS_DE_OTRO_EXCEL = ["dtos", "recs", "fab", "upb", "min", "opt"] as const;
/** Un renglon del Excel de descuentos, ya limpio. */
export type DescuentosArticulo = { cod: string; gbpId?: number; dtos: number[]; recs: number[] };
/** Un renglon del Excel de estructura, ya limpio. */
export type EstructuraArticulo = { cod: string; gbpId?: number; fab?: string; upb?: number; min?: number; opt?: number };
/** Lo que se cambia con PATCH: null saca el valor. */
export type CostosArticulo = {
  flete?: number | null;
  otroCosto?: number | null;
  otroNombre?: string | null;
  bulto?: number | null;
  dolar?: number | null;
};

export type Guardados = {
  articulos: ArticuloPunto[];
  /** El ultimo import del Excel de LISTAS (los precios). */
  fecha: string | null;
  por: string | null;
  /** El ultimo import del Excel de descuentos (V.0.99.85). */
  fechaDescuentos?: string | null;
};

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const plata = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? Math.round(n * 100) / 100 : NaN;
};
const entero = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(-1e7, Math.min(1e7, Math.round(n))) : 0;
};

/** Un combo: sus piezas (codigo y cuantas de cada una) y el % de la Lista 1
 *  sobre lo que suman los costos de las piezas, y el de la Lista 2 sobre la 1.
 *  Al venderlo sale del stock cada pieza; el stock del combo es el que
 *  alcanza para armarlo (lo cuenta la pantalla). */
export type ComboArticulo = { piezas: Array<{ cod: string; cant: number }>; l1: number; l2: number };

/** El combo que llega: undefined si no vino, null para sacarlo (o si no
 *  queda ninguna pieza buena). Hasta 20 piezas; el articulo no es pieza de
 *  si mismo. */
function limpiarCombo(v: unknown, cod: string): ComboArticulo | null | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const piezas: Array<{ cod: string; cant: number }> = [];
  for (const x of Array.isArray(o.piezas) ? o.piezas.slice(0, 20) : []) {
    if (!x || typeof x !== "object") continue;
    const r = x as Record<string, unknown>;
    const pc = texto(r.cod, 40);
    const cant = Number(r.cant);
    if (!pc || pc === cod || !Number.isInteger(cant) || cant < 1 || cant > 1000) continue;
    const ya = piezas.find((p) => p.cod === pc);
    if (ya) ya.cant = Math.min(1000, ya.cant + cant);
    else piezas.push({ cod: pc, cant });
  }
  if (!piezas.length) return null;
  const pct = (n: unknown) => {
    const x = Number(n);
    return Number.isFinite(x) ? Math.max(-99, Math.min(1000, Math.round(x * 100) / 100)) : 0;
  };
  return { piezas, l1: pct(o.l1), l2: pct(o.l2) };
}

/** El subrubro que llega: undefined si no vino, null (o vacio) para sacarlo. */
function limpiarSubrubro(v: unknown): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const t = texto(v, 40).replace(/[<>]/g, "").toUpperCase();
  return t || null;
}

/** El pago contado que llega: undefined si no vino, null para sacarlo. */
function limpiarContado(v: unknown): { pct: number; dias: number; cheques?: number[] } | null | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const pct = Number(o.pct);
  const dias = Number(o.dias);
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return null;
  const limpio = { pct: Math.round(pct * 100) / 100, dias: Number.isInteger(dias) && dias >= 0 && dias <= 365 ? dias : 60 };
  // V.0.11.270: los cheques (30-60-90): de 2 a 6, enteros de 0 a 365, de menor a mayor y sin repetir.
  if (Array.isArray(o.cheques)) {
    const cs = [...new Set(o.cheques.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 365))].sort((a, b) => a - b).slice(0, 6);
    if (cs.length > 1) return { ...limpio, dias: cs[cs.length - 1], cheques: cs };
  }
  return limpio;
}

/** El stock mínimo que llega: undefined si no vino, null (o los dos en 0) para sacarlo. */
function limpiarMinimo(v: unknown): { BA: number; TS: number } | null | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const n = (x: unknown) => {
    const k = Number(x);
    return Number.isInteger(k) && k >= 0 && k <= 1_000_000 ? k : 0;
  };
  const BA = n(o.BA), TS = n(o.TS);
  return BA || TS ? { BA, TS } : null;
}

/** Cómo se vende: undefined si no vino; null (o las dos formas) para sacarlo. */
function limpiarVende(v: unknown): { suelto: boolean; combo: boolean } | null | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const suelto = o.suelto !== false, combo = o.combo !== false;
  // Las dos formas es lo de siempre; ninguna no tiene sentido (no se vendería).
  return (suelto && combo) || (!suelto && !combo) ? null : { suelto, combo };
}

/** El por mayor que llega: undefined si no vino, null para sacarlo. */
function limpiarMayor(v: unknown): { pct: number; desde: number } | null | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const pct = Number(o.pct);
  const desde = Number(o.desde);
  if (!Number.isFinite(pct) || pct < -50 || pct > 1000) return null;
  if (!Number.isInteger(desde) || desde < 1 || desde > 100_000) return null;
  return { pct: Math.round(pct * 100) / 100, desde };
}

/** Solo pasa lo que tiene forma de articulo. Lo demas se descarta. */
export function limpiarArticulo(x: unknown): ArticuloPunto | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const cod = texto(o.cod, 40);
  const tit = texto(o.tit, 200);
  const lista1 = plata(o.lista1);
  const lista2 = plata(o.lista2);
  if (!cod || !tit || !(lista1 > 0) || !(lista2 > 0)) return null;
  const lista = plata(o.lista);
  const iva = Number(o.iva);
  const gbpId = Number(o.gbpId);
  const flete = plata(o.flete);
  // Como el flete: solo cuentan para un articulo que todavia no los tiene.
  // Si no tienen forma, se ignoran (no se descarta el articulo por eso).
  const otroCosto = limpiarOtroCosto(o.otroCosto);
  const otroNombre = limpiarOtroNombre(o.otroNombre);
  const bulto = limpiarBulto(o.bulto);
  const dolar = plata(o.dolar);
  const dolarRef = plata(o.dolarRef);
  const combo = limpiarCombo(o.combo, cod);
  const mayor = limpiarMayor(o.mayor);
  const subrubro = limpiarSubrubro(o.subrubro);
  const contado = limpiarContado(o.contado);
  const minimo = limpiarMinimo(o.minimo);
  const vende = limpiarVende(o.vende);
  return {
    cod,
    tit,
    prov: texto(o.prov, 40).toUpperCase() || "VARIOS",
    cat: texto(o.cat, 80),
    subrub: texto(o.subrub, 80),
    lista: lista >= 0 ? lista : 0,
    lista1,
    lista2,
    iva: iva === 10.5 || iva === 21 || iva === 27 || iva === 0 ? iva : 21,
    stockBA: entero(o.stockBA),
    stockTS: entero(o.stockTS),
    gbpId: Number.isInteger(gbpId) ? gbpId : null,
    ...(o.mon === "USD" ? { mon: "USD" as const } : {}),
    ...(o.mon === "USD" && dolarRef > 0 ? { dolarRef } : {}),
    // Solo cuenta para un articulo que todavia no tiene: el que ya tiene lo
    // conserva (guardarArticulos).
    ...(flete > 0 ? { flete } : {}),
    ...(typeof otroCosto === "number" ? { otroCosto } : {}),
    ...(typeof otroNombre === "string" ? { otroNombre } : {}),
    ...(typeof bulto === "number" ? { bulto } : {}),
    ...(dolar > 0 ? { dolar } : {}),
    ...(combo !== undefined ? { combo } : {}),
    ...(mayor !== undefined ? { mayor } : {}),
    ...(subrubro !== undefined ? { subrubro } : {}),
    ...(contado !== undefined ? { contado } : {}),
    ...(minimo !== undefined ? { minimo } : {}),
    ...(vende !== undefined ? { vende } : {}),
    ...deOtroExcel(o),
  };
}

/** Porcentajes de GBP (descuentos o recargos): hasta 4, cada uno entre
 *  `rango[0]` y `rango[1]`, con dos decimales, en el orden en que vienen y
 *  sin los ceros (no cambian la cuenta). En GBP hay recargos negativos
 *  (-35%, -20%): son descuentos y se aceptan. null = no tiene forma. */
export function limpiarPorcentajes(v: unknown, rango: readonly [number, number]): number[] | null {
  if (!Array.isArray(v) || v.length > 4) return null;
  const out: number[] = [];
  for (const x of v) {
    const n = typeof x === "number" ? x : Number(typeof x === "string" ? x.trim().replace(",", ".") : NaN);
    if (!Number.isFinite(n) || n < rango[0] || n > rango[1]) return null;
    const r = Math.round(n * 100) / 100;
    if (r !== 0) out.push(r);
  }
  return out;
}
/** Un descuento del 100% o un recargo de -100% dejarian el costo en cero. */
export const RANGO_DESCUENTO = [-1000, 99.99] as const;
export const RANGO_RECARGO = [-99.99, 1000] as const;

const enteroEntre = (v: unknown, min: number, max: number): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v.trim()) : NaN;
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
};

/** Lo del Excel de estructura, limpio: lo que no tiene forma no esta. */
export function limpiarEstructura(o: Record<string, unknown>): Omit<EstructuraArticulo, "cod"> {
  const fab = texto(o.fab, 40).replace(/[<>]/g, "");
  const upb = enteroEntre(o.upb, 2, 100_000);
  const min = enteroEntre(o.min, 0, 10_000_000);
  const opt = enteroEntre(o.opt, 0, 10_000_000);
  return {
    ...(fab ? { fab } : {}),
    ...(upb !== undefined ? { upb } : {}),
    ...(min !== undefined ? { min } : {}),
    ...(opt !== undefined ? { opt } : {}),
  };
}

/** Lo de los otros dos Excel que venga adentro de un articulo (si alguna
 *  vez llega todo junto). Lo que no tiene forma se ignora. */
function deOtroExcel(o: Record<string, unknown>): Partial<ArticuloPunto> {
  const out: Partial<ArticuloPunto> = {};
  if ("dtos" in o) {
    const d = limpiarPorcentajes(o.dtos, RANGO_DESCUENTO);
    if (d) out.dtos = d;
  }
  if ("recs" in o) {
    const r = limpiarPorcentajes(o.recs, RANGO_RECARGO);
    if (r) out.recs = r;
  }
  return { ...out, ...limpiarEstructura(o) };
}

/** Saca del articulo lo que se carga en Punto, para volver a ponerlo como
 *  corresponde. */
function sinLoDePunto(a: ArticuloPunto): Omit<ArticuloPunto, CampoDePunto> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { flete, otroCosto, otroNombre, bulto, dolar, ...resto } = a;
  return resto;
}

/** Lo de Punto que tiene que quedar: un valor vacio (0, "", 1 en el bulto)
 *  no se guarda, asi "no esta" quiere decir siempre "no tiene". */
function conLoDePunto(base: Omit<ArticuloPunto, CampoDePunto>, c: CostosArticulo): ArticuloPunto {
  const a: ArticuloPunto = { ...base };
  if (c.flete && c.flete > 0) a.flete = c.flete;
  if (c.otroCosto && c.otroCosto > 0) a.otroCosto = c.otroCosto;
  if (c.otroNombre) a.otroNombre = c.otroNombre;
  if (c.bulto && c.bulto > 1) a.bulto = c.bulto;
  if (c.dolar && c.dolar > 0) a.dolar = c.dolar;
  return a;
}

/** Copia un campo de los otros Excel de un articulo a otro. */
function copiar<K extends (typeof CAMPOS_DE_OTRO_EXCEL)[number]>(a: ArticuloPunto, de: ArticuloPunto, k: K): void {
  a[k] = de[k];
}

/** Lo que hay en el renglon de la base, tal cual. */
type Crudo = {
  articulos?: unknown;
  fecha?: string | null;
  por?: string | null;
  fechaDescuentos?: string | null;
  fechaEstructura?: string | null;
};

async function leerCrudo(db: Pick<Prisma.TransactionClient, "setting">): Promise<{ d: Crudo; updatedAt: Date } | null> {
  const fila = await db.setting.findUnique({ where: { key: CLAVE_ARTICULOS } });
  if (!fila) return null;
  try {
    return { d: JSON.parse(fila.value) as Crudo, updatedAt: fila.updatedAt };
  } catch {
    return { d: {}, updatedAt: fila.updatedAt };
  }
}

/** Bloquea el renglon de los articulos hasta el COMMIT. Si todavia no
 *  existe no hay nada que bloquear: el primer import lo crea. */
async function bloquearArticulos(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$queryRaw`SELECT "key" FROM "Setting" WHERE "key" = ${CLAVE_ARTICULOS} FOR UPDATE`;
}

/** Leer, cambiar y escribir 30.000 articulos puede pasar los 5 segundos que
 *  Prisma le da a una transaccion. */
const TIEMPO = { maxWait: 15_000, timeout: 60_000 };

export async function leerArticulos(): Promise<Guardados> {
  const c = await leerCrudo(prisma);
  if (!c) return { articulos: [], fecha: null, por: null };
  return {
    articulos: Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [],
    fecha: c.d.fecha ?? c.updatedAt.toISOString(),
    por: c.d.por ?? null,
    fechaDescuentos: c.d.fechaDescuentos ?? null,
  };
}

/** Suma los que llegan a los guardados: el mismo codigo se reemplaza, los
 *  demas quedan como estaban (importar Piazza no borra FV). El flete fijo
 *  del que ya estaba se conserva siempre: GBP no lo conoce. */
export async function guardarArticulos(
  llegan: ArticuloPunto[],
  por: string,
  /** V.0.99.94: los codigos que trajeron stock. Un articulo guardado desde
   *  Punto sin tocarle el stock no lo trae: queda el del servidor, que pudo
   *  haber bajado con una venta en otra compu. Sin esto, todos lo traen (el
   *  import de GBP: "manda GBP"). */
  conStock?: Set<string>,
): Promise<{ nuevos: number; actualizados: number; total: number }> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    const c = await leerCrudo(tx);
    const antes: ArticuloPunto[] = c && Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [];
    const porCodigo = new Map(antes.map((a) => [a.cod, a]));
    let nuevos = 0;
    let actualizados = 0;
    for (const a of llegan) {
      const ya = porCodigo.get(a.cod);
      if (ya) actualizados++;
      else nuevos++;
      // Lo que se cargo en Punto queda el que estaba; lo del Excel solo
      // cuenta si el articulo no tenia.
      const nuevo = conLoDePunto(sinLoDePunto(a), {
        flete: ya?.flete ?? a.flete,
        otroCosto: ya?.otroCosto ?? a.otroCosto,
        otroNombre: ya?.otroNombre ?? a.otroNombre,
        bulto: ya?.bulto ?? a.bulto,
        dolar: ya?.dolar ?? a.dolar,
      });
      // Los descuentos y lo de la estructura vienen de otros Excel: si este
      // no los trae, quedan los que ya tenia.
      if (ya) for (const k of CAMPOS_DE_OTRO_EXCEL) if (nuevo[k] === undefined && ya[k] !== undefined) copiar(nuevo, ya, k);
      // El combo es de Punto: el import de GBP no lo trae y queda el que
      // estaba; guardarlo desde Punto lo cambia, y null lo saca.
      if (a.combo === undefined && ya?.combo) nuevo.combo = ya.combo;
      if (nuevo.combo === null) delete nuevo.combo;
      // El por mayor, igual: de Punto.
      if (a.mayor === undefined && ya?.mayor) nuevo.mayor = ya.mayor;
      if (nuevo.mayor === null) delete nuevo.mayor;
      // El subrubro (V.0.11.207), igual: de Punto.
      if (a.subrubro === undefined && ya?.subrubro) nuevo.subrubro = ya.subrubro;
      if (nuevo.subrubro === null) delete nuevo.subrubro;
      // El pago contado (V.0.11.209), igual: de Punto.
      if (a.contado === undefined && ya?.contado) nuevo.contado = ya.contado;
      if (nuevo.contado === null) delete nuevo.contado;
      // El stock mínimo (V.0.11.210), igual: de Punto.
      if (a.minimo === undefined && ya?.minimo) nuevo.minimo = ya.minimo;
      if (nuevo.minimo === null) delete nuevo.minimo;
      // Cómo se vende (V.0.11.217), igual: de Punto.
      if (a.vende === undefined && ya?.vende) nuevo.vende = ya.vende;
      if (nuevo.vende === null) delete nuevo.vende;
      // Cuándo se creó (V.0.11.213): el que ya estaba conserva el suyo (o
      // ninguno); el código nuevo, ahora.
      delete nuevo.creado;
      if (ya) {
        if (ya.creado) nuevo.creado = ya.creado;
      } else nuevo.creado = new Date().toISOString();
      if (ya && conStock && !conStock.has(a.cod)) {
        nuevo.stockBA = ya.stockBA;
        nuevo.stockTS = ya.stockTS;
      }
      porCodigo.set(a.cod, nuevo);
    }
    const articulos = [...porCodigo.values()];
    if (articulos.length > MAXIMO_ARTICULOS)
      throw new Error(`Son más de ${MAXIMO_ARTICULOS} artículos: no entran en un solo guardado.`);
    // Lo demas del renglon (la fecha de los descuentos...) queda como estaba.
    const value = JSON.stringify({ ...(c?.d ?? {}), articulos, fecha: new Date().toISOString(), por });
    await tx.setting.upsert({
      where: { key: CLAVE_ARTICULOS },
      update: { value },
      create: { key: CLAVE_ARTICULOS, value },
    });
    return { nuevos, actualizados, total: articulos.length };
  }, TIEMPO);
}

/** Pone lo del Excel de descuentos o el de estructura en los articulos que
 *  ya estan (por codigo). Reemplaza lo que tenian de ese Excel: es de GBP.
 *  Los codigos que no estan guardados no se crean (un articulo sin Lista 2
 *  no entra): vuelven contados, con algunos de ejemplo. */
export async function guardarDeOtroExcel(
  filas: Array<DescuentosArticulo | EstructuraArticulo>,
  tipo: "descuentos" | "estructura",
  por: string,
): Promise<{ actualizados: number; noEstan: number; ejemplos: string[]; total: number }> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    const c = await leerCrudo(tx);
    const articulos: ArticuloPunto[] = c && Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [];
    const porCodigo = new Map(articulos.map((a, i) => [a.cod, i]));
    // Si el codigo no esta, por el ID de GBP: 58 de SIGAS y DEMA cambiaron
    // de codigo entre un Excel y otro, con el mismo ID.
    const porId = new Map<number, number>();
    articulos.forEach((a, i) => {
      if (typeof a.gbpId === "number" && !porId.has(a.gbpId)) porId.set(a.gbpId, i);
    });
    let actualizados = 0;
    const faltan: string[] = [];
    for (const f of filas) {
      const i = porCodigo.get(f.cod) ?? (typeof f.gbpId === "number" ? porId.get(f.gbpId) : undefined);
      if (i === undefined) {
        faltan.push(f.cod);
        continue;
      }
      const a = { ...articulos[i] };
      if (tipo === "descuentos") {
        const d = f as DescuentosArticulo;
        a.dtos = d.dtos;
        a.recs = d.recs;
      } else {
        const e = f as EstructuraArticulo;
        delete a.fab;
        delete a.upb;
        delete a.min;
        delete a.opt;
        if (e.fab) a.fab = e.fab;
        if (e.upb !== undefined) a.upb = e.upb;
        if (e.min !== undefined) a.min = e.min;
        if (e.opt !== undefined) a.opt = e.opt;
      }
      articulos[i] = a;
      actualizados++;
    }
    if (actualizados) {
      // La fecha y el usuario del ultimo import de LISTAS no se tocan: con
      // ella cada compu decide si un precio corregido a mano ya quedo viejo,
      // y este Excel no trae precios. Cada uno guarda la suya aparte.
      const ahora = new Date().toISOString();
      const value = JSON.stringify({
        ...c?.d,
        articulos,
        ...(tipo === "descuentos" ? { fechaDescuentos: ahora } : { fechaEstructura: ahora }),
      });
      await tx.setting.update({ where: { key: CLAVE_ARTICULOS }, data: { value } });
    }
    return { actualizados, noEstan: faltan.length, ejemplos: faltan.slice(0, 8), total: articulos.length };
  }, TIEMPO);
}

/** El flete fijo de un articulo, en pesos por unidad, con centavos. Vacio o
 *  0 = sin flete (null). "mal" = no es un monto. */
export function limpiarFleteArticulo(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = plata(typeof v === "string" ? v.replace(",", ".") : v);
  if (!Number.isFinite(n)) return "mal";
  return n === 0 ? null : n;
}

/** Otro costo en pesos por unidad, con centavos, hasta 1.000 millones.
 *  Vacio o 0 = no tiene (null). "mal" = no es un monto. */
export function limpiarOtroCosto(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = plata(typeof v === "string" ? v.replace(",", ".") : v);
  if (!Number.isFinite(n) || n > 1e9) return "mal";
  return n === 0 ? null : n;
}

/** El nombre del otro costo: sin < > (va a innerHTML), sin caracteres de
 *  control, hasta 40 y sin mitades de emoji. Vacio = no tiene (null). */
export function limpiarOtroNombre(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = Array.from(
    v
      .replace(/[<>]/g, "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, 40)
    .join("")
    .toWellFormed()
    .trim();
  return s || null;
}

/** De a cuantas unidades se compra: entero de 1 a 10.000. Vacio, 0 o 1 =
 *  suelto (null): el 0 es lo que manda la pagina cuando se borra el numero
 *  del campo, y quiere decir "sacalo", como en el flete. "mal" = no es eso. */
export function limpiarBulto(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (n === 0 || n === 1) return null;
  if (!Number.isInteger(n) || n < 1 || n > 10_000) return "mal";
  return n;
}

/** Cambia solo lo que vino de lo que se carga en Punto (flete, otro costo,
 *  su nombre, bulto): lo que no vino queda como estaba, y lo demas del
 *  articulo (y la fecha y el usuario del ultimo import) tambien. null en un
 *  campo lo saca. Null si ese codigo no esta. */
export async function cambiarCostosArticulo(cod: string, cambios: CostosArticulo): Promise<ArticuloPunto | null> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    const c = await leerCrudo(tx);
    if (!c || !Array.isArray(c.d.articulos)) return null;
    const articulos = c.d.articulos as ArticuloPunto[];
    const i = articulos.findIndex((a) => a && a.cod === cod);
    if (i < 0) return null;
    const antes = articulos[i];
    const valor = <K extends CampoDePunto>(k: K) => (k in cambios ? cambios[k] : antes[k]);
    const nuevo = conLoDePunto(sinLoDePunto(antes), {
      flete: valor("flete"),
      otroCosto: valor("otroCosto"),
      otroNombre: valor("otroNombre"),
      bulto: valor("bulto"),
      dolar: valor("dolar"),
    });
    articulos[i] = nuevo;
    const value = JSON.stringify({ ...c.d, articulos });
    await tx.setting.update({ where: { key: CLAVE_ARTICULOS }, data: { value } });
    return nuevo;
  }, TIEMPO);
}

// ------------------------------------------------------------------ STOCK
// V.0.99.94. Damian, 23/11/2026: el stock lo manda GBP (cada import lo pisa)
// y en el medio lo mueve Punto: lo que se cobra sale, lo que llega de una
// compra entra.

export type MovimientoStock = { cod: string; cant: number };
/** Como quedo el stock de un articulo despues de moverlo. */
export type StockArticulo = { cod: string; BA: number; TS: number };

/** Suma (cant > 0) o resta (cant < 0) stock de un deposito, dentro de la
 *  transaccion del que lo llama: cambia junto con la venta o la compra, o no
 *  cambia. Un codigo que no esta (un renglon cargado a mano) no se toca. Un
 *  combo "3480+3641" mueve cada pieza; si alguna pieza no esta, se mueve el
 *  combo como articulo, si esta. Puede quedar negativo: se vendio mas de lo
 *  que GBP decia. Devuelve como quedo cada articulo que cambio. */
export async function moverStockEnTx(
  tx: Prisma.TransactionClient,
  dep: "BA" | "TS",
  movs: MovimientoStock[],
): Promise<StockArticulo[]> {
  const suma = new Map<string, number>();
  for (const m of movs) {
    const cant = Number(m?.cant);
    if (!m || typeof m.cod !== "string" || !m.cod.trim() || !Number.isFinite(cant) || !cant) continue;
    const cod = m.cod.trim();
    suma.set(cod, (suma.get(cod) ?? 0) + cant);
  }
  if (!suma.size) return [];
  await bloquearArticulos(tx);
  const c = await leerCrudo(tx);
  if (!c || !Array.isArray(c.d.articulos)) return [];
  const articulos = c.d.articulos as ArticuloPunto[];
  const porCodigo = new Map<string, number>();
  articulos.forEach((a, i) => {
    if (a && typeof a.cod === "string") porCodigo.set(a.cod, i);
  });
  const campo = dep === "TS" ? "stockTS" : "stockBA";
  const cambiados = new Set<number>();
  const mover = (i: number, cant: number) => {
    const a = articulos[i];
    articulos[i] = { ...a, [campo]: Math.round(((Number(a[campo]) || 0) + cant) * 100) / 100 };
    cambiados.add(i);
  };
  for (const [cod, cant] of suma) {
    const i0 = porCodigo.get(cod);
    const combo = i0 !== undefined ? articulos[i0].combo : undefined;
    if (combo && Array.isArray(combo.piezas) && combo.piezas.length) {
      for (const pz of combo.piezas) {
        const j = porCodigo.get(pz.cod);
        if (j !== undefined && j !== i0) mover(j, cant * (Number(pz.cant) || 1));
      }
      continue;
    }
    const piezas = cod.includes("+") ? cod.split("+").map((p) => p.trim()).filter(Boolean) : [];
    const lugares = piezas.map((p) => porCodigo.get(p));
    if (piezas.length > 1 && lugares.every((i) => i !== undefined)) {
      for (const i of lugares) mover(i as number, cant);
      continue;
    }
    const i = porCodigo.get(cod);
    if (i !== undefined) mover(i, cant);
  }
  if (!cambiados.size) return [];
  const value = JSON.stringify({ ...c.d, articulos });
  await tx.setting.update({ where: { key: CLAVE_ARTICULOS }, data: { value } });
  return [...cambiados].map((i) => ({
    cod: articulos[i].cod,
    BA: Number(articulos[i].stockBA) || 0,
    TS: Number(articulos[i].stockTS) || 0,
  }));
}

// ---------------------------------------------------------------------------
// V.0.11.272: el stock que entra con una factura de compra (Articulos →
// Adjuntar). Damian, 26/11/2026: "si ya estan deberian actualizarse al stock
// de la que ya esta creada". Cada factura queda anotada (proveedor + numero):
// subirla otra vez no suma dos veces.

export const CLAVE_INGRESOS = "punto.articulos.ingresos";
const INGRESOS_MAXIMO = 500;
export type IngresoFactura = {
  clave: string;
  factura: string;
  proveedor: string;
  dep: "BA" | "TS";
  fecha: string;
  por: string;
  /** Cuantos articulos que ya estaban sumaron stock. */
  n: number;
};

/** Suma el stock de una factura de compra, una sola vez por factura. Con
 *  movs vacio igual la anota (la factura solo traia articulos nuevos, que
 *  se crean con su cantidad). */
export async function ingresarStockFactura(
  info: { clave: string; factura: string; proveedor: string; dep: "BA" | "TS" },
  movs: MovimientoStock[],
  usuario: string,
): Promise<{ ya: IngresoFactura } | { stock: StockArticulo[] }> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${CLAVE_INGRESOS}))`;
    const fila = await tx.setting.findUnique({ where: { key: CLAVE_INGRESOS } });
    let lista: IngresoFactura[] = [];
    try {
      const d: unknown = fila ? JSON.parse(fila.value) : [];
      if (Array.isArray(d)) lista = d as IngresoFactura[];
    } catch {
      lista = [];
    }
    const ya = lista.find((x) => x && x.clave === info.clave);
    if (ya) return { ya };
    const stock = movs.length ? await moverStockEnTx(tx, info.dep, movs) : [];
    lista.push({ ...info, fecha: new Date().toISOString(), por: usuario, n: stock.length });
    const value = JSON.stringify(lista.slice(-INGRESOS_MAXIMO));
    await tx.setting.upsert({ where: { key: CLAVE_INGRESOS }, update: { value }, create: { key: CLAVE_INGRESOS, value } });
    return { stock };
  }, TIEMPO);
}

// ---------------------------------------------------------------------------
// V.0.11.258: cambios de precios por Excel (el de Articulos de Punto editado,
// o la lista de un proveedor). Las reglas: src/lib/punto-cambios-excel.ts.
// Solo para los que YA estan (nunca crea); cada cambio trae lo que se vio y,
// si otro lo cambio en el medio, no se pisa. Lo de antes queda en el
// historial (las ultimas subidas) para poder deshacer.

/** El historial de las subidas y las columnas de la lista de cada
 *  proveedor (otro renglon de Setting: el de los articulos ya es grande). */
export const CLAVE_CAMBIOS = "punto.articulos.cambios";
/** V.0.11.272: "factura" = los precios que cambiaron en una factura de
 *  compra subida en Artículos → Adjuntar (y se tildaron para actualizar). */
export type OrigenCambios = "excel" | "proveedor" | "masivo" | "factura";
const HISTORIAL_MAXIMO = 6;

export type RenglonHistorial = { cod: string; antes: FotoArticulo; despues: FotoArticulo };
export type SubidaHistorial = {
  id: string;
  fecha: string;
  por: string;
  /** "excel" (el de Articulos de Punto) | "proveedor" (su lista) | "masivo"
   *  (V.0.11.259: el cambio de margen o de precios de lo filtrado). */
  origen: OrigenCambios;
  marca: string;
  archivo: string;
  n: number;
  deshecho?: { fecha: string; por: string; n: number };
  renglones: RenglonHistorial[];
};
type GuardadoCambios = { historial: SubidaHistorial[]; columnas: Record<string, ColumnasProveedor> };

async function leerCambios(db: Pick<Prisma.TransactionClient, "setting">): Promise<GuardadoCambios> {
  const fila = await db.setting.findUnique({ where: { key: CLAVE_CAMBIOS } });
  try {
    const d = fila ? (JSON.parse(fila.value) as Partial<GuardadoCambios>) : {};
    return {
      historial: Array.isArray(d.historial) ? d.historial : [],
      columnas: d.columnas && typeof d.columnas === "object" ? d.columnas : {},
    };
  } catch {
    return { historial: [], columnas: {} };
  }
}
async function escribirCambios(db: Pick<Prisma.TransactionClient, "setting">, g: GuardadoCambios): Promise<void> {
  const value = JSON.stringify(g);
  await db.setting.upsert({ where: { key: CLAVE_CAMBIOS }, update: { value }, create: { key: CLAVE_CAMBIOS, value } });
}
/** Uno a la vez con el historial (hasta el COMMIT). */
async function bloquearCambios(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${CLAVE_CAMBIOS}))`;
}

/** Una subida sin sus renglones (para la pantalla). */
const sinRenglones = (s: SubidaHistorial): Omit<SubidaHistorial, "renglones"> => ({
  id: s.id, fecha: s.fecha, por: s.por, origen: s.origen, marca: s.marca, archivo: s.archivo, n: s.n,
  ...(s.deshecho ? { deshecho: s.deshecho } : {}),
});

/** Las ultimas subidas (sin los renglones) y las columnas guardadas. */
export async function leerHistorialCambios(): Promise<{
  historial: Omit<SubidaHistorial, "renglones">[];
  columnas: Record<string, ColumnasProveedor>;
}> {
  const g = await leerCambios(prisma);
  return { historial: g.historial.map(sinRenglones), columnas: g.columnas };
}

/** Guarda las columnas de la lista de un proveedor (por marca). */
export async function guardarColumnasProveedor(marca: string, c: ColumnasProveedor): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await bloquearCambios(tx);
    const g = await leerCambios(tx);
    g.columnas[marca] = c;
    await escribirCambios(tx, g);
  });
}

export type ResultadoCambios = {
  id: string;
  actualizados: number;
  /** Codigos que no estan cargados: no se crean. */
  noEstan: string[];
  /** Cambiaron en el servidor despues de armar la revision: no se pisan. */
  cambiados: string[];
  /** No se pudieron poner (en dolares, combo, demasiados descuentos...). */
  malos: { cod: string; motivo: string }[];
};

/** Pone los cambios en los articulos que ya estan, en una sola transaccion,
 *  y anota la subida en el historial. */
export async function aplicarCambiosExcel(
  cambios: CambioExcel[],
  info: { origen: OrigenCambios; marca: string; archivo: string; columnas: ColumnasProveedor | null },
  por: string,
): Promise<ResultadoCambios> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    await bloquearCambios(tx);
    const c = await leerCrudo(tx);
    const articulos: ArticuloPunto[] = c && Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [];
    const porCodigo = new Map(articulos.map((a, i) => [a.cod, i]));
    const r: ResultadoCambios = { id: "", actualizados: 0, noEstan: [], cambiados: [], malos: [] };
    const renglones: RenglonHistorial[] = [];
    const vistos = new Set<string>();
    for (const cb of cambios) {
      if (vistos.has(cb.cod)) continue;
      vistos.add(cb.cod);
      const i = porCodigo.get(cb.cod);
      if (i === undefined) {
        r.noEstan.push(cb.cod);
        continue;
      }
      const a = articulos[i];
      const tocaPrecio = ["lista", "cadena", "recargos", "lista1", "lista2", "iva"].some((k) => k in cb.despues);
      if (tocaPrecio && a.mon === "USD") {
        r.malos.push({ cod: cb.cod, motivo: "tiene el costo en dólares: cambialo en la ficha" });
        continue;
      }
      if (tocaPrecio && a.combo && Array.isArray(a.combo.piezas) && a.combo.piezas.length) {
        r.malos.push({ cod: cb.cod, motivo: "es un combo: el costo sale de sus piezas" });
        continue;
      }
      if (!igualPlata(a.lista, cb.antes.lista) || !igualPlata(a.lista1, cb.antes.lista1) || !igualPlata(a.lista2, cb.antes.lista2)) {
        r.cambiados.push(cb.cod);
        continue;
      }
      const nuevo = aplicarAlArticulo(a as unknown as Record<string, unknown>, cb.despues);
      if (typeof nuevo === "string") {
        r.malos.push({ cod: cb.cod, motivo: nuevo });
        continue;
      }
      const antes = fotoDe(a as unknown as Record<string, unknown>);
      const despues = fotoDe(nuevo);
      if (mismaFoto(antes, despues)) continue;
      articulos[i] = nuevo as unknown as ArticuloPunto;
      renglones.push({ cod: cb.cod, antes, despues });
      r.actualizados++;
    }
    const g = await leerCambios(tx);
    if (info.origen === "proveedor" && info.marca && info.columnas) g.columnas[info.marca] = info.columnas;
    if (renglones.length) {
      // La fecha del ultimo import de LISTAS de GBP no se toca: esto no es GBP.
      const value = JSON.stringify({ ...c?.d, articulos });
      await tx.setting.update({ where: { key: CLAVE_ARTICULOS }, data: { value } });
      r.id = "sub" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      g.historial = [
        { id: r.id, fecha: new Date().toISOString(), por, origen: info.origen, marca: info.marca, archivo: info.archivo, n: renglones.length, renglones },
        ...g.historial,
      ].slice(0, HISTORIAL_MAXIMO);
    }
    await escribirCambios(tx, g);
    return r;
  }, TIEMPO);
}

/** Vuelve atras una subida: cada articulo vuelve a como estaba, salvo los
 *  que se tocaron despues (esos quedan y se cuentan). */
export async function deshacerCambiosExcel(
  id: string,
  por: string,
): Promise<{ deshechos: number; tocadosDespues: string[]; noEstan: string[]; subida: Omit<SubidaHistorial, "renglones"> } | string> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    await bloquearCambios(tx);
    const g = await leerCambios(tx);
    const s = g.historial.find((h) => h.id === id);
    if (!s) return "Esa subida ya no está en el historial.";
    if (s.deshecho) return "Esa subida ya se deshizo.";
    const c = await leerCrudo(tx);
    const articulos: ArticuloPunto[] = c && Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [];
    const porCodigo = new Map(articulos.map((a, i) => [a.cod, i]));
    let deshechos = 0;
    const tocadosDespues: string[] = [];
    const noEstan: string[] = [];
    for (const rg of s.renglones) {
      const i = porCodigo.get(rg.cod);
      if (i === undefined) {
        noEstan.push(rg.cod);
        continue;
      }
      const a = articulos[i] as unknown as Record<string, unknown>;
      if (!mismaFoto(fotoDe(a), rg.despues)) {
        tocadosDespues.push(rg.cod);
        continue;
      }
      const n: Record<string, unknown> = { ...a };
      for (const k of ["lista", "dtos", "recs", "lista1", "lista2", "iva", "tit", "fab"] as const) {
        const v = rg.antes[k];
        if (v === undefined) delete n[k];
        else n[k] = Array.isArray(v) ? v.slice() : v;
      }
      articulos[i] = n as unknown as ArticuloPunto;
      deshechos++;
    }
    if (deshechos) {
      const value = JSON.stringify({ ...c?.d, articulos });
      await tx.setting.update({ where: { key: CLAVE_ARTICULOS }, data: { value } });
    }
    s.deshecho = { fecha: new Date().toISOString(), por, n: deshechos };
    await escribirCambios(tx, g);
    return { deshechos, tocadosDespues, noEstan, subida: sinRenglones(s) };
  }, TIEMPO);
}
