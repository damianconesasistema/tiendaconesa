// Las facturas de cada proveedor (V.0.11.285): las reglas, sin base.
//
// Damián, 26/11/2026, con "Agendar un pago" abierto: "acá que se pueda elegir
// las facturas que tenga cargadas del proveedor, la idea es que en cada
// proveedor podamos cargar el número de factura para tener en la agenda de
// pagos" y "hay [proveedores] que en la factura, en el total, me hacen
// descuento por pago en término: ahí tendría que aparecer para agregar un
// descuento por pago".
//
// Se cargan en la ficha del proveedor o solas al agendar un pago con un
// número de factura en el concepto. Al agendar se eligen de la lista: el
// concepto, el monto, el vencimiento y el descuento por pago en término
// salen de la factura.
//
// Sin ningún import a propósito: lo usan la ruta, el servidor de prueba y
// las pruebas con node solo.

export type FacturaPrv = {
  id: string;
  /** El proveedor de la lista, si se eligió de ahí. */
  proveedorId: string | null;
  proveedor: string;
  /** A, B, C, M, E, X o "" (sin decir). */
  tipo: string;
  /** "0001-00001234" (o como venga, si no tiene esa forma). */
  nro: string;
  /** YYYY-MM-DD o "". */
  fecha: string;
  vence: string;
  /** El total de la factura. 0 = no se dijo. */
  monto: number;
  /** Descuento por pago en término, en %. 0 = no tiene. */
  dtoPago: number;
  nota: string;
  por: string;
  creado: string;
};

export const TIPOS_FACTURA = ["A", "B", "C", "M", "E", "X"] as const;
export const MAX_FACTURAS_PRV = 5000;

const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";
const dia = (x: unknown): string | null => {
  if (x == null || x === "") return "";
  return typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x + "T12:00:00Z")) ? x : null;
};

/** La clave del proveedor: sin acentos, mayúsculas, solo letras y números
 *  ("FV S.A." = "fv sa" = "FV SA"). */
export function clavePrv(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** El número como lo escriben las facturas: punto de venta de 4 (o 5) y
 *  número de 8. "1-1234" = "0001-00001234"; "0001000001234" también. Si no
 *  tiene esa forma, como vino (mayúsculas, sin espacios de más). */
export function nroFactura(x: unknown): string {
  const s = texto(x, 40).toUpperCase();
  if (!s) return "";
  const m = /(\d{1,5})\s*[-/]\s*(\d{1,8})(?!\d)/.exec(s);
  if (m) return m[1].padStart(m[1].length > 4 ? 5 : 4, "0") + "-" + m[2].padStart(8, "0");
  const d = s.replace(/\D/g, "");
  if (d.length >= 9 && d.length <= 13 && d.length === s.replace(/[\s.]/g, "").length)
    return d.slice(0, d.length - 8).padStart(4, "0") + "-" + d.slice(-8);
  return s.slice(0, 30);
}

/** El número de factura que aparece en un texto ("Factura A 0001-00001234,
 *  saldo..."). "" si no hay. */
export function nroEnTexto(t: unknown): string {
  const m = /(\d{1,5})\s*-\s*(\d{1,8})(?!\d)/.exec(String(t ?? ""));
  return m ? nroFactura(m[0]) : "";
}

/** El tipo que aparece en un texto ("Factura A ...", "FC B ..."). */
export function tipoEnTexto(t: unknown): string {
  const m = /\b(?:factura|fact|fc|f)\.?\s*([ABCMEX])\b/i.exec(String(t ?? ""));
  return m ? m[1].toUpperCase() : "";
}

/** Cómo va en el concepto del pago. */
export const conceptoDeFactura = (f: Pick<FacturaPrv, "tipo" | "nro">): string => `Factura ${f.tipo ? f.tipo + " " : ""}${f.nro}`;

/** La misma factura: mismo proveedor, tipo y número. */
export const mismaFactura = (a: Pick<FacturaPrv, "proveedor" | "tipo" | "nro">, b: Pick<FacturaPrv, "proveedor" | "tipo" | "nro">): boolean =>
  clavePrv(a.proveedor) === clavePrv(b.proveedor) && a.nro === b.nro && (a.tipo === b.tipo || !a.tipo || !b.tipo);

export type PedidoFactura = Omit<FacturaPrv, "id" | "por" | "creado">;

/** Una factura que llega de la página, limpia. String = el error. */
export function limpiarFactura(x: unknown): PedidoFactura | string {
  if (!x || typeof x !== "object") return "No entendí la factura.";
  const o = x as Record<string, unknown>;
  const proveedor = texto(o.proveedor, 120);
  if (!proveedor) return "Decí de qué proveedor es la factura.";
  const nro = nroFactura(o.nro);
  if (!nro) return "Poné el número de la factura (por ejemplo 0001-00001234).";
  const tipo = texto(o.tipo, 2).toUpperCase();
  if (tipo && !(TIPOS_FACTURA as readonly string[]).includes(tipo)) return "El tipo de factura es A, B, C, M, E o X.";
  const fecha = dia(o.fecha), vence = dia(o.vence);
  if (fecha == null) return "La fecha de la factura no se entiende.";
  if (vence == null) return "El vencimiento de la factura no se entiende.";
  const monto = o.monto == null || o.monto === "" ? 0 : typeof o.monto === "number" ? o.monto : Number.NaN;
  if (!Number.isFinite(monto) || monto < 0 || monto >= 1e12) return "El total de la factura tiene que ser un número (o nada).";
  const dtoPago = o.dtoPago == null || o.dtoPago === "" ? 0 : typeof o.dtoPago === "number" ? o.dtoPago : Number.NaN;
  if (!Number.isFinite(dtoPago) || dtoPago < 0 || dtoPago >= 100) return "El descuento por pago en término va de 0 a 99,99 %.";
  const pid = texto(o.proveedorId, 60);
  return {
    proveedorId: pid || null,
    proveedor,
    tipo,
    nro,
    fecha,
    vence,
    monto: Math.round(monto * 100) / 100,
    dtoPago: Math.round(dtoPago * 100) / 100,
    nota: texto(o.nota, 200),
  };
}

/** Lo que se paga con el descuento por pago en término (al centavo). */
export const conDescuentoPago = (monto: number, dto: number): number =>
  Math.round(Math.round(monto * 100) * (1 - (dto > 0 && dto < 100 ? dto : 0) / 100)) / 100;
