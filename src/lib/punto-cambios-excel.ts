// Cambios de precios por Excel (V.0.11.258): las reglas, sin base.
//
// Damian, 24/11/2026:
// - "el excel de los precios de FV ... tenes el precio del costo sin iva, y
//   los descuentos que tiene, ahi tenes que sacar el precio que va de costo
//   en el sistema" / "solo tenemos que modificar los que tenemos cargados ...
//   no cargar nuevos" / "si hay algun error me lo tenes que hacer saber".
// - "si yo hago una modificacion de este Excel [el de Articulos que exporta
//   Punto], que despues se pueda subir para que tome los cambios".
//
// Los dos caminos terminan igual: la pagina lee el Excel, arma la revision
// (que cambia, que no esta, que parece mal) y manda solo lo que se tildo. El
// servidor (src/lib/punto-articulos.ts, aplicarCambiosExcel) lo pone en los
// articulos que YA estan: nunca crea uno. Cada cambio trae lo que se vio
// ("antes"): si otro lo cambio en el medio, ese no se pisa. Lo de antes queda
// guardado para poder deshacer.
//
// Sin ningun import a proposito: lo usan la ruta, el servidor de prueba y
// las pruebas con node solo.

/** Lo que se puede cambiar de un articulo desde un Excel. */
export type DespuesExcel = {
  /** La lista del proveedor, sin IVA (en la moneda del articulo). */
  lista?: number;
  /** Los descuentos, uno sobre otro, en el orden del Excel (hasta 8). */
  cadena?: number[];
  /** Los recargos (hasta 4). Sin esto, quedan los que tenia. */
  recargos?: number[];
  lista1?: number;
  lista2?: number;
  iva?: number;
  tit?: string;
  fab?: string;
  // V.0.11.282: lo que se cambia en masa desde Artículos (Damián: "cambios
  // masivos, seleccionando artículos y elegir qué le quiero modificar").
  // null lo saca (vuelve a lo de siempre).
  /** El subrubro de Punto (LAVATORIO, DUCHA...). */
  subrubro?: string | null;
  /** El flete fijo por unidad, en pesos con IVA. */
  flete?: number | null;
  /** El descuento por pago contado del proveedor y a cuántos días. */
  contado?: ContadoArticulo | null;
  /** Se compra solo de a N unidades. */
  bulto?: number | null;
  /** Cómo se vende: suelto, en combo o de las dos formas (null). */
  vende?: VendeArticulo | null;
};
export type ContadoArticulo = { pct: number; dias: number; cheques?: number[] };
export type VendeArticulo = { suelto: boolean; combo: boolean };
/** Los campos de los cambios masivos (V.0.11.282), en el orden de la foto. */
export const CAMPOS_MASIVOS = ["subrubro", "flete", "contado", "bulto", "vende"] as const;
/** Los de siempre (los del Excel). */
export const CAMPOS_FOTO = ["lista", "dtos", "recs", "lista1", "lista2", "iva", "tit", "fab"] as const;

export type CambioExcel = {
  cod: string;
  /** Lo que se vio al armar la revision: si el servidor tiene otra cosa, no
   *  se pisa. */
  antes: { lista: number; lista1: number; lista2: number };
  despues: DespuesExcel;
};

/** Lo que guarda el articulo de todo eso (para deshacer). */
export type FotoArticulo = {
  lista?: number;
  dtos?: number[];
  recs?: number[];
  lista1?: number;
  lista2?: number;
  iva?: number;
  tit?: string;
  fab?: string;
  /** V.0.11.282: 1 = la foto trae tambien los campos masivos. Las de antes
   *  no los traen: para esas no se miran (si no, ninguna se podria deshacer). */
  x?: 1;
  subrubro?: string;
  flete?: number;
  contado?: ContadoArticulo;
  bulto?: number;
  vende?: VendeArticulo;
};

export const IVAS = [0, 10.5, 21, 27] as const;
export const MAX_CADENA = 8;
export const MAX_RECARGOS = 4;
/** GBP guarda 4 descuentos y 4 recargos; un recargo negativo es un descuento
 *  mas. Asi se guarda tambien aca (como lo arma la pagina al guardar). */
const LUGARES = 4;

const plata = (x: unknown): number | null => {
  const n = typeof x === "number" ? x : Number.NaN;
  return Number.isFinite(n) && n > 0 && n < 1e12 ? Math.round(n * 100) / 100 : null;
};
const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Una lista de porcentajes: sin los ceros, con dos decimales. null = mal. */
export function porcentajes(x: unknown, max: number, tope: number): number[] | null {
  if (!Array.isArray(x) || x.length > max) return null;
  const out: number[] = [];
  for (const v of x) {
    const n = typeof v === "number" ? v : Number.NaN;
    if (!Number.isFinite(n) || n < 0 || n > tope) return null;
    const r = Math.round(n * 100) / 100;
    if (r > 0) out.push(r);
  }
  return out;
}

/** La cadena de descuentos y los recargos como los guarda el articulo: los 4
 *  primeros descuentos en dtos; los que siguen, como recargos negativos
 *  despues de los recargos de verdad. String = no entra. */
export function cadenaAGuardar(cadena: number[], recargos: number[]): { dtos: number[]; recs: number[] } | string {
  const dtos = cadena.slice(0, LUGARES);
  const recs = [...recargos, ...cadena.slice(LUGARES).map((d) => -d)];
  if (recs.length > LUGARES) return "Tiene demasiados descuentos y recargos juntos (entran 4 recargos, contando los descuentos después del cuarto).";
  return { dtos, recs };
}

/** Al reves: la cadena (los descuentos, con los recargos negativos al final)
 *  y los recargos de verdad, de lo que guarda el articulo. Igual que
 *  dtosGbp() de la pagina. */
export function cadenaDe(dtos: unknown, recs: unknown): { cadena: number[]; recargos: number[] } {
  const num = (x: unknown) => (typeof x === "number" && Number.isFinite(x) ? x : 0);
  const ds = Array.isArray(dtos) ? dtos.map(num) : [];
  const rs = Array.isArray(recs) ? recs.map(num) : [];
  return {
    cadena: [...ds.filter((d) => d > 0), ...rs.filter((r) => r < 0).map((r) => -r)],
    recargos: [...rs.filter((r) => r > 0), ...ds.filter((d) => d < 0).map((d) => -d)],
  };
}

/** Lo que multiplica a la lista: cada descuento uno sobre otro y los recargos. */
export function factorDe(cadena: readonly number[], recargos: readonly number[]): number {
  return cadena.reduce((f, d) => f * (1 - d / 100), 1) * recargos.reduce((f, r) => f * (1 + r / 100), 1);
}

/** Un cambio que llega de la pagina, limpio. String = el error. */
export function limpiarCambioExcel(x: unknown): CambioExcel | string {
  if (!x || typeof x !== "object") return "No entendí un renglón.";
  const o = x as Record<string, unknown>;
  const cod = typeof o.cod === "string" ? o.cod.trim().slice(0, 40) : "";
  if (!cod) return "Un renglón no tiene código.";
  const a = (o.antes ?? {}) as Record<string, unknown>;
  const num0 = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v * 100) / 100 : 0);
  const antes = { lista: num0(a.lista), lista1: num0(a.lista1), lista2: num0(a.lista2) };
  const d = (o.despues ?? {}) as Record<string, unknown>;
  if (!d || typeof d !== "object") return `${cod}: no dice qué cambiar.`;
  const despues: DespuesExcel = {};
  if (d.lista !== undefined) {
    const v = plata(d.lista);
    if (v == null) return `${cod}: la lista del proveedor tiene que ser un número mayor que cero.`;
    despues.lista = v;
  }
  if (d.cadena !== undefined) {
    const v = porcentajes(d.cadena, MAX_CADENA, 99.99);
    if (!v) return `${cod}: los descuentos van de 0 a 99,99 % (hasta ${MAX_CADENA}).`;
    despues.cadena = v;
  }
  if (d.recargos !== undefined) {
    const v = porcentajes(d.recargos, MAX_RECARGOS, 1000);
    if (!v) return `${cod}: los recargos van de 0 a 1000 % (hasta ${MAX_RECARGOS}).`;
    despues.recargos = v;
  }
  for (const k of ["lista1", "lista2"] as const) {
    if (d[k] === undefined) continue;
    const v = plata(d[k]);
    if (v == null) return `${cod}: la ${k === "lista1" ? "Lista 1" : "Lista 2"} tiene que ser un número mayor que cero.`;
    despues[k] = v;
  }
  if (d.iva !== undefined) {
    const v = typeof d.iva === "number" ? d.iva : Number.NaN;
    if (!(IVAS as readonly number[]).includes(v)) return `${cod}: el IVA tiene que ser 0, 10,5, 21 o 27.`;
    despues.iva = v;
  }
  if (d.tit !== undefined) {
    const v = texto(d.tit, 200);
    if (!v) return `${cod}: la descripción no puede quedar vacía.`;
    despues.tit = v;
  }
  if (d.fab !== undefined) despues.fab = texto(d.fab, 40);
  // V.0.11.282: los de los cambios masivos.
  if (d.subrubro !== undefined) despues.subrubro = d.subrubro === null ? null : texto(d.subrubro, 40).toUpperCase() || null;
  if (d.flete !== undefined) {
    if (d.flete === null || d.flete === 0) despues.flete = null;
    else {
      const v = plata(d.flete);
      if (v == null) return `${cod}: el flete tiene que ser un monto mayor que cero (o nada).`;
      despues.flete = v;
    }
  }
  if (d.contado !== undefined) {
    if (d.contado === null) despues.contado = null;
    else {
      const v = limpiarContado(d.contado);
      if (!v) return `${cod}: el descuento por pago contado va de 0 a 99,99 %, a 0 a 365 días.`;
      despues.contado = v;
    }
  }
  if (d.bulto !== undefined) {
    if (d.bulto === null || d.bulto === 1) despues.bulto = null;
    else {
      const n = typeof d.bulto === "number" ? d.bulto : Number.NaN;
      if (!Number.isInteger(n) || n < 2 || n > 10000) return `${cod}: "se compra de a" va de 1 a 10.000 unidades.`;
      despues.bulto = n;
    }
  }
  if (d.vende !== undefined) {
    if (d.vende === null) despues.vende = null;
    else {
      const o = d.vende as Record<string, unknown>;
      if (!o || typeof o !== "object" || typeof o.suelto !== "boolean" || typeof o.combo !== "boolean" || (!o.suelto && !o.combo))
        return `${cod}: se tiene que poder vender suelto, en combo o de las dos formas.`;
      despues.vende = o.suelto && o.combo ? null : { suelto: o.suelto, combo: o.combo };
    }
  }
  if (!Object.keys(despues).length) return `${cod}: no dice qué cambiar.`;
  return { cod, antes, despues };
}

/** El pago contado: 0 a 99,99 %, a 0 a 365 días; los cheques (30-60-90),
 *  de 2 a 6. null = mal. */
function limpiarContado(x: unknown): ContadoArticulo | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const pct = typeof o.pct === "number" ? Math.round(o.pct * 100) / 100 : Number.NaN;
  const dias = typeof o.dias === "number" ? o.dias : Number.NaN;
  if (!(pct > 0 && pct < 100) || !Number.isInteger(dias) || dias < 0 || dias > 365) return null;
  const c: ContadoArticulo = { pct, dias };
  if (o.cheques !== undefined) {
    const ch = o.cheques;
    if (!Array.isArray(ch) || ch.length < 2 || ch.length > 6 || !ch.every((n) => Number.isInteger(n) && n >= 0 && n <= 365)) return null;
    c.cheques = (ch as number[]).slice();
  }
  return c;
}

/** Dos montos iguales al centavo. */
export const igualPlata = (a: unknown, b: unknown): boolean =>
  Math.round((Number(a) || 0) * 100) === Math.round((Number(b) || 0) * 100);

const igualLista = (a: unknown, b: unknown): boolean => {
  const x = Array.isArray(a) ? a : [];
  const y = Array.isArray(b) ? b : [];
  return x.length === y.length && x.every((v, i) => igualPlata(v, y[i]));
};

/** Lo de un articulo que cambia un Excel, para guardarlo y poder volver. */
export function fotoDe(a: Record<string, unknown>): FotoArticulo {
  const f: FotoArticulo = {};
  for (const k of ["lista", "lista1", "lista2", "iva"] as const) if (typeof a[k] === "number") f[k] = a[k] as number;
  for (const k of ["dtos", "recs"] as const) if (Array.isArray(a[k])) f[k] = (a[k] as number[]).slice();
  for (const k of ["tit", "fab"] as const) if (typeof a[k] === "string") f[k] = a[k] as string;
  // V.0.11.282: los campos masivos.
  f.x = 1;
  if (typeof a.subrubro === "string" && a.subrubro) f.subrubro = a.subrubro;
  if (typeof a.flete === "number" && a.flete > 0) f.flete = a.flete;
  const c = a.contado as ContadoArticulo | null | undefined;
  if (c && typeof c === "object" && typeof c.pct === "number")
    f.contado = { pct: c.pct, dias: c.dias, ...(Array.isArray(c.cheques) ? { cheques: c.cheques.slice() } : {}) };
  if (typeof a.bulto === "number" && a.bulto > 1) f.bulto = a.bulto;
  const v = a.vende as VendeArticulo | null | undefined;
  if (v && typeof v === "object") f.vende = { suelto: v.suelto !== false, combo: v.combo !== false };
  return f;
}

const igualContado = (a?: ContadoArticulo, b?: ContadoArticulo): boolean =>
  (!a && !b) || (!!a && !!b && igualPlata(a.pct, b.pct) && a.dias === b.dias && igualLista(a.cheques, b.cheques));
const vendeTxt = (v?: VendeArticulo): string => (v ? `${v.suelto !== false}|${v.combo !== false}` : "true|true");

/** Un articulo vuelto a como estaba en la foto (para deshacer). Con una foto
 *  de antes de V.0.11.282 (sin x), solo los campos del Excel. */
export function volverAFoto<T extends Record<string, unknown>>(a: T, antes: FotoArticulo): T {
  const n: Record<string, unknown> = { ...a };
  const ks: readonly string[] = antes.x ? [...CAMPOS_FOTO, ...CAMPOS_MASIVOS] : CAMPOS_FOTO;
  for (const k of ks) {
    const v = (antes as Record<string, unknown>)[k];
    if (v === undefined) delete n[k];
    else n[k] = Array.isArray(v) ? v.slice() : v && typeof v === "object" ? { ...(v as object) } : v;
  }
  return n as T;
}

/** Si el articulo sigue como quedo despues del cambio (para deshacer sin
 *  pisar lo que se toco despues). */
export function mismaFoto(a: FotoArticulo, b: FotoArticulo): boolean {
  return (
    igualPlata(a.lista, b.lista) &&
    igualPlata(a.lista1, b.lista1) &&
    igualPlata(a.lista2, b.lista2) &&
    igualPlata(a.iva, b.iva) &&
    igualLista(a.dtos, b.dtos) &&
    igualLista(a.recs, b.recs) &&
    (a.tit ?? "") === (b.tit ?? "") &&
    (a.fab ?? "") === (b.fab ?? "") &&
    // V.0.11.282: los masivos, solo si las dos fotos los traen.
    (!(a.x && b.x) ||
      ((a.subrubro ?? "") === (b.subrubro ?? "") &&
        igualPlata(a.flete, b.flete) &&
        igualContado(a.contado, b.contado) &&
        (a.bulto ?? 0) === (b.bulto ?? 0) &&
        vendeTxt(a.vende) === vendeTxt(b.vende)))
  );
}

/** Aplica un cambio a un articulo (una copia). String = no se pudo. */
export function aplicarAlArticulo<T extends Record<string, unknown>>(a: T, d: DespuesExcel): T | string {
  const n: Record<string, unknown> = { ...a };
  if (d.lista !== undefined) n.lista = d.lista;
  if (d.cadena !== undefined || d.recargos !== undefined) {
    const ya = cadenaDe(a.dtos, a.recs);
    const g = cadenaAGuardar(d.cadena ?? ya.cadena, d.recargos ?? ya.recargos);
    if (typeof g === "string") return g;
    n.dtos = g.dtos;
    n.recs = g.recs;
  }
  if (d.lista1 !== undefined) n.lista1 = d.lista1;
  if (d.lista2 !== undefined) n.lista2 = d.lista2;
  if (d.iva !== undefined) n.iva = d.iva;
  if (d.tit !== undefined) n.tit = d.tit;
  if (d.fab !== undefined) {
    if (d.fab) n.fab = d.fab;
    else delete n.fab;
  }
  // V.0.11.282: null lo saca.
  for (const k of CAMPOS_MASIVOS) {
    const v = d[k];
    if (v === undefined) continue;
    if (v === null) delete n[k];
    else n[k] = typeof v === "object" ? { ...v } : v;
  }
  return n as T;
}

/** Lo que se recuerda de las columnas de la lista de cada proveedor. */
export type ColumnasProveedor = {
  /** La fila de los titulos (desde 1). */
  fila: number;
  cod: number;
  precio: number;
  descuentos: number[];
  conIva: boolean;
  /** Los titulos de esas columnas, para reconocer la misma lista la proxima. */
  titulos: string[];
};

export function limpiarColumnas(x: unknown): ColumnasProveedor | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const ent = (v: unknown, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= max ? v : null);
  const fila = ent(o.fila, 200);
  const cod = ent(o.cod, 200);
  const precio = ent(o.precio, 200);
  if (fila == null || fila < 1 || cod == null || precio == null || cod === precio) return null;
  const descuentos = Array.isArray(o.descuentos)
    ? [...new Set(o.descuentos.map((v) => ent(v, 200)).filter((v): v is number => v != null && v !== cod && v !== precio))].slice(0, MAX_CADENA)
    : [];
  const titulos = Array.isArray(o.titulos) ? o.titulos.slice(0, 60).map((t) => texto(t, 60)) : [];
  return { fila, cod, precio, descuentos, conIva: o.conIva === true, titulos };
}

/** Si la lista parece estar por unidad y el articulo por bolsa (o caja) de
 *  N: lo que tiene el articulo dividido lo nuevo da casi justo N. 0 = no.
 *  Con el N del codigo (FV: "-D5" = bolsa de 5) alcanza con que se acerque
 *  (la lista pudo haber subido): hasta un 25 % de diferencia. */
export function pareceBolsa(listaHoy: number, listaNueva: number, nDelCodigo = 0): number {
  if (!(listaHoy > 0) || !(listaNueva > 0)) return 0;
  const r = listaHoy / listaNueva;
  if (nDelCodigo >= 2 && Math.abs(r / nDelCodigo - 1) <= 0.25) return nDelCodigo;
  const n = Math.round(r);
  if (n < 2 || n > 1000) return 0;
  return Math.abs(r / n - 1) <= 0.006 ? n : 0;
}

/** El N de bolsa que dice el codigo de FV ("0100/49.1-D5" = 5); 0 = no dice. */
export function bolsaDelCodigo(cod: string): number {
  const m = /-D(\d{1,3})$/i.exec(String(cod).trim());
  const n = m ? Number(m[1]) : 0;
  return n >= 2 ? n : 0;
}
