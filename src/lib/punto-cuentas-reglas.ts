// Las reglas de las cuentas y los movimientos de plata de Punto (Gerencia,
// parte 1: cuentas y gastos). Ver
// docs/superpowers/specs/2026-11-24-gerencia-cuentas-gastos-design.md.
//
// Damian, 24/11/2026: "en gerencia necesito que tenga un lugar donde sea los
// gastos diarios y los gastos mensuales de cada sucursal"; "puede ser
// efectivo, la caja de mercado pago, la caja de los bancos: eso debemos
// asociarlo y que vos ya lo computes". Cada razon social (srl, cnc, tsl)
// tiene sus cuentas; cada movimiento dice de que cuenta sale o entra.
//
// Sin ningun import a proposito: lo usan la ruta /sistema/cuentas, la capa de
// base (src/lib/punto-cuentas.ts) y las pruebas con node solo
// (scripts/pruebas/punto-cuentas.test.ts).
//
// Reglas que salen de aca:
// - La plata se suma en centavos enteros; vuelve en pesos con 2 decimales.
// - Los dias y los meses son de Argentina (UTC-3 fijo, sin horario de
//   verano): un gasto a las 22:30 del 24 es del 24.
// - Un movimiento anulado no suma en ningun lado (se ve, tachado).
// - El cajero (permiso "caja" sin "cuentas") solo mueve el efectivo de su
//   sucursal; gerencia ("cuentas"), cualquier cuenta.

export type TipoCuenta = "efectivo" | "mercadopago" | "banco";
export type ClaseBanco = "ca" | "cc";
export type TipoMovimiento = "gasto" | "pago-proveedor" | "retiro" | "cobranza" | "sena" | "transferencia" | "ajuste";

export const SUCURSALES_CUENTAS = ["srl", "cnc", "tsl"] as const;
export const TIPOS_CUENTA: readonly TipoCuenta[] = ["efectivo", "mercadopago", "banco"];
export const TIPOS_MOVIMIENTO: readonly TipoMovimiento[] = [
  "gasto", "pago-proveedor", "retiro", "cobranza", "sena", "transferencia", "ajuste",
];

/** Los rubros de gasto con los que arranca (se pueden cambiar en Gerencia). */
export const RUBROS_BASE: readonly string[] = [
  "Alquiler", "Luz", "Gas", "Agua", "Internet y teléfono", "Sueldos", "Cargas sociales", "Impuestos",
  "Gastos bancarios", "Honorarios del contador", "Publicidad", "Fletes", "Combustible", "Limpieza",
  "Librería", "Mantenimiento", "Varios",
];

/** El monto mas grande que se acepta en un movimiento (diez mil millones). */
export const MONTO_MAXIMO = 1e10;

export type Cuenta = {
  id: string;
  sucursal: string;
  tipo: TipoCuenta;
  nombre: string;
  banco: string;
  clase: ClaseBanco | null;
  saldoInicial: number;
  /** YYYY-MM-DD: desde que dia cuentan los movimientos. */
  desde: string;
  activa: boolean;
};

export type Movimiento = {
  id: string;
  grupo: string;
  /** ISO. */
  fecha: string;
  cuentaId: string;
  sucursal: string;
  tipo: TipoMovimiento;
  /** + entra a la cuenta, - sale. */
  monto: number;
  rubro: string;
  detalle: string;
  iva: number;
  reparto: Record<string, number> | null;
  usuario: string;
  anulado: boolean;
};

export type PedidoMovimiento = {
  idLocal: string;
  tipo: TipoMovimiento;
  cuentaId: string;
  cuentaDestinoId: string | null;
  /** Siempre mayor que cero: el signo lo pone el tipo (signoOrigen). */
  monto: number;
  /** Solo en un ajuste. */
  sentido: "entra" | "sale" | null;
  rubro: string;
  detalle: string;
  iva: number;
  reparto: Record<string, number> | null;
  /** ISO, o null = ahora. */
  fecha: string | null;
};

export type ResumenGastos = {
  porSucursal: Record<string, { total: number; porRubro: Record<string, number>; porDia: Record<string, number> }>;
};

export const aCentavos = (n: number): number => Math.round((Number(n) || 0) * 100);
export const dePesos = (c: number): number => Math.round(c) / 100;

const TRES_HORAS = 3 * 60 * 60 * 1000;
/** El dia (YYYY-MM-DD) de ese instante en Argentina. */
export function diaAR(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t - TRES_HORAS).toISOString().slice(0, 10);
}
/** El mes (YYYY-MM) de ese instante en Argentina. */
export const mesAR = (iso: string): string => diaAR(iso).slice(0, 7);

/** Texto para la pagina: va adentro de innerHTML, sin < ni >. */
const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

const esDia = (x: unknown): x is string => typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && diaAR(x + "T12:00:00Z") === x;

/** Lo que viene de la pagina para una cuenta. String = el error. */
export function limpiarCuenta(x: unknown): Omit<Cuenta, "id"> | string {
  if (!x || typeof x !== "object") return "No entendí la cuenta.";
  const o = x as Record<string, unknown>;
  const sucursal = String(o.sucursal ?? "");
  if (!(SUCURSALES_CUENTAS as readonly string[]).includes(sucursal)) return "Elegí de qué razón social es la cuenta.";
  const tipo = String(o.tipo ?? "") as TipoCuenta;
  if (!TIPOS_CUENTA.includes(tipo)) return "Elegí si es efectivo, Mercado Pago o un banco.";
  const nombre = texto(o.nombre, 60);
  if (!nombre) return "Ponele un nombre a la cuenta.";
  const banco = tipo === "banco" ? texto(o.banco, 60) : "";
  if (tipo === "banco" && !banco) return "Poné de qué banco es.";
  const clase = tipo === "banco" ? (o.clase === "cc" ? "cc" : o.clase === "ca" ? "ca" : null) : null;
  if (tipo === "banco" && !clase) return "Elegí si es caja de ahorro o cuenta corriente.";
  const saldo = Number(o.saldoInicial ?? 0);
  if (!Number.isFinite(saldo) || Math.abs(saldo) > MONTO_MAXIMO) return "El saldo con el que arranca no es un número válido.";
  const desde = o.desde;
  if (!esDia(desde)) return "Poné desde qué día cuenta el saldo.";
  return { sucursal, tipo, nombre, banco, clase, saldoInicial: dePesos(aCentavos(saldo)), desde, activa: o.activa !== false };
}

/** Lo que viene de la pagina para un movimiento. String = el error. */
export function limpiarPedidoMovimiento(x: unknown): PedidoMovimiento | string {
  if (!x || typeof x !== "object") return "No entendí el movimiento.";
  const o = x as Record<string, unknown>;
  const idLocal = typeof o.idLocal === "string" ? o.idLocal : "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(idLocal)) return "Falta la marca del movimiento: recargá la página.";
  const tipo = String(o.tipo ?? "") as TipoMovimiento;
  if (!TIPOS_MOVIMIENTO.includes(tipo)) return "Elegí qué es: gasto, pago a proveedor, retiro, cobranza, seña o pasar a otra cuenta.";
  const cuentaId = typeof o.cuentaId === "string" ? o.cuentaId.trim().slice(0, 40) : "";
  if (!cuentaId) return "Elegí de qué cuenta.";
  const m = typeof o.monto === "number" ? o.monto : Number.NaN;
  if (!Number.isFinite(m) || m <= 0) return "El monto tiene que ser mayor que cero.";
  if (m > MONTO_MAXIMO) return "El monto es demasiado grande.";
  const monto = dePesos(aCentavos(m));
  if (!(monto > 0)) return "El monto tiene que ser mayor que cero.";
  let cuentaDestinoId: string | null = null;
  if (tipo === "transferencia") {
    cuentaDestinoId = typeof o.cuentaDestinoId === "string" ? o.cuentaDestinoId.trim().slice(0, 40) : "";
    if (!cuentaDestinoId) return "Elegí a qué cuenta pasa la plata.";
    if (cuentaDestinoId === cuentaId) return "La cuenta de destino tiene que ser otra.";
  }
  let sentido: "entra" | "sale" | null = null;
  if (tipo === "ajuste") {
    if (o.sentido !== "entra" && o.sentido !== "sale") return "En un ajuste, decí si la plata entra o sale.";
    sentido = o.sentido;
  }
  const rubro = tipo === "gasto" ? texto(o.rubro, 40) : "";
  if (tipo === "gasto" && !rubro) return "Elegí el rubro del gasto.";
  const detalle = texto(o.detalle, 200);
  const ivaN = o.iva == null || o.iva === "" ? 0 : Number(o.iva);
  if (!Number.isFinite(ivaN) || ivaN < 0) return "El IVA no es un número válido.";
  const iva = dePesos(aCentavos(ivaN));
  if (iva >= monto && iva > 0) return "El IVA tiene que ser menor que el monto.";
  let reparto: Record<string, number> | null = null;
  if (o.reparto != null) {
    if (tipo !== "gasto") return "Solo un gasto se puede repartir entre razones sociales.";
    if (typeof o.reparto !== "object") return "No entendí el reparto.";
    const r: Record<string, number> = {};
    let suma = 0;
    for (const [k, v] of Object.entries(o.reparto as Record<string, unknown>)) {
      if (!(SUCURSALES_CUENTAS as readonly string[]).includes(k)) return "El reparto tiene una razón social que no existe.";
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 100) return "Cada parte del reparto es un porcentaje entero de 1 a 100.";
      r[k] = n;
      suma += n;
    }
    if (suma !== 100) return "El reparto tiene que sumar 100%.";
    reparto = r;
  }
  let fecha: string | null = null;
  if (o.fecha != null && o.fecha !== "") {
    const t = typeof o.fecha === "string" ? Date.parse(o.fecha) : Number.NaN;
    if (!Number.isFinite(t)) return "La fecha no se entiende.";
    if (t > Date.now() + 24 * 60 * 60 * 1000) return "La fecha no puede ser de más adelante.";
    fecha = new Date(t).toISOString();
  }
  return { idLocal, tipo, cuentaId, cuentaDestinoId, monto, sentido, rubro, detalle, iva, reparto, fecha };
}

/** Si la cuenta de origen recibe o pierde plata. La pata de destino de una
 *  transferencia siempre recibe (+1). */
export function signoOrigen(p: PedidoMovimiento): 1 | -1 {
  if (p.tipo === "cobranza" || p.tipo === "sena") return 1;
  if (p.tipo === "ajuste") return p.sentido === "entra" ? 1 : -1;
  return -1;
}

/** Reparte centavos por porcentaje (mayor resto): las partes suman el total.
 *  El centavo que sobra va a la de mayor resto; empatadas, en el orden de
 *  SUCURSALES_CUENTAS. */
export function repartir(montoCent: number, reparto: Record<string, number>): Record<string, number> {
  const total = Math.round(montoCent);
  const claves = Object.keys(reparto).sort(
    (a, b) => (SUCURSALES_CUENTAS as readonly string[]).indexOf(a) - (SUCURSALES_CUENTAS as readonly string[]).indexOf(b),
  );
  const out: Record<string, number> = {};
  const restos: { k: string; resto: number; i: number }[] = [];
  let usado = 0;
  claves.forEach((k, i) => {
    const exacto = (total * reparto[k]) / 100;
    const base = Math.floor(exacto);
    out[k] = base;
    usado += base;
    restos.push({ k, resto: exacto - base, i });
  });
  restos.sort((a, b) => b.resto - a.resto || a.i - b.i);
  for (let j = 0; usado < total && j < restos.length; j++, usado++) out[restos[j].k] += 1;
  return out;
}

/** El saldo de la cuenta: lo inicial mas sus movimientos no anulados desde
 *  `desde` (y hasta `hastaDia`, si viene). */
export function saldoDe(cuenta: Cuenta, movs: readonly Movimiento[], hastaDia?: string): number {
  let c = aCentavos(cuenta.saldoInicial);
  for (const m of movs) {
    if (m.cuentaId !== cuenta.id || m.anulado) continue;
    const d = diaAR(m.fecha);
    if (d < cuenta.desde || (hastaDia && d > hastaDia)) continue;
    c += aCentavos(m.monto);
  }
  return dePesos(c);
}

/** Los gastos entre esos dos dias (inclusive), por razon social, rubro y
 *  dia. Solo los de tipo gasto: un pago a proveedor no es gasto (la
 *  mercaderia ya esta en el costo) y un retiro tampoco. */
export function resumenGastos(
  movs: readonly Movimiento[],
  cuentas: readonly Cuenta[],
  desdeDia: string,
  hastaDia: string,
): ResumenGastos {
  const suc = new Map(cuentas.map((c) => [c.id, c.sucursal]));
  const cent: Record<string, { total: number; porRubro: Record<string, number>; porDia: Record<string, number> }> = {};
  const sumar = (s: string, rubro: string, dia: string, c: number) => {
    const x = (cent[s] ??= { total: 0, porRubro: {}, porDia: {} });
    x.total += c;
    x.porRubro[rubro] = (x.porRubro[rubro] ?? 0) + c;
    x.porDia[dia] = (x.porDia[dia] ?? 0) + c;
  };
  for (const m of movs) {
    if (m.tipo !== "gasto" || m.anulado) continue;
    const dia = diaAR(m.fecha);
    if (dia < desdeDia || dia > hastaDia) continue;
    const importe = -aCentavos(m.monto);
    const rubro = m.rubro || "Varios";
    if (m.reparto) {
      for (const [s, c] of Object.entries(repartir(importe, m.reparto))) sumar(s, rubro, dia, c);
    } else {
      sumar(suc.get(m.cuentaId) ?? m.sucursal, rubro, dia, importe);
    }
  }
  const porSucursal: ResumenGastos["porSucursal"] = {};
  for (const [s, x] of Object.entries(cent)) {
    const enPesos = (r: Record<string, number>) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, dePesos(v)]));
    porSucursal[s] = { total: dePesos(x.total), porRubro: enPesos(x.porRubro), porDia: enPesos(x.porDia) };
  }
  return { porSucursal };
}

/** Si ese usuario puede hacer ese movimiento. null = puede; si no, el motivo. */
export function puedeMover(
  yo: { permisos: readonly string[]; sucursal: string | null },
  pedido: PedidoMovimiento,
  origen: Cuenta,
  destino: Cuenta | null,
): string | null {
  if (!origen.activa || (destino && !destino.activa)) return "Esa cuenta está dada de baja.";
  if (yo.permisos.includes("cuentas")) return null;
  if (!yo.permisos.includes("caja")) return "Tu usuario no puede anotar movimientos de plata.";
  if (origen.tipo !== "efectivo") return "Desde la caja solo se anota lo que sale o entra del efectivo.";
  if (yo.sucursal && origen.sucursal !== yo.sucursal) return "Esa caja es de otra sucursal.";
  if (pedido.reparto) return "Repartir un gasto entre razones sociales se hace desde Gerencia.";
  if (pedido.tipo === "transferencia" && (!destino || destino.sucursal !== origen.sucursal))
    return "Desde la caja solo se pasa plata a una cuenta de la misma sucursal.";
  return null;
}
