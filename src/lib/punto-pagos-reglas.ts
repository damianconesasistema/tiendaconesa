// La agenda de pagos a proveedores de Punto (V.0.11.257, migracion 60).
//
// Damian, 24/11/2026: "NECESITO EN PROVEEDORES AGENDAS DE PAGO Y SETEARLAS
// CON FECHAS Y QUE ME AVISE EL SISTEMA QUE TENGO QUE REALIZAR PAGOS". Se
// cargan a mano (no salen solos del pedido a proveedor): a quien, cuanto,
// cuando vence y, si va en cuotas, cada cuantos dias. Al pagarlo se anota en
// la cuenta de donde sale la plata (Gerencia → Cuentas y gastos) como "pago a
// proveedor"; si sale del efectivo, la caja lo descuenta.
//
// Aca solo las reglas: que se acepta, las cuotas, que vence y el aviso. La
// base esta en src/lib/punto-pagos.ts. Sin ningun import a proposito: lo usan
// la ruta, el servidor de prueba y las pruebas con node solo.

export const SUCURSALES_PAGO = ["srl", "cnc", "tsl"] as const;
/** Como se piensa pagar ("" = sin decir). */
export const FORMAS_PAGO = ["transferencia", "efectivo", "cheque", "echeq", "otro"] as const;
export type FormaPago = (typeof FORMAS_PAGO)[number] | "";
export type EstadoPago = "pendiente" | "pagado" | "anulado";

export const MONTO_MAXIMO = 1e10;
export const CUOTAS_MAXIMO = 36;
/** Si no se dice otra cosa, empieza a avisar 3 dias antes. */
export const AVISAR_DEFAULT = 3;
export const AVISAR_MAXIMO = 60;

export type Pago = {
  id: string;
  /** El de la carga: las cuotas de una misma carga lo comparten. */
  grupo: string;
  cuota: number;
  cuotas: number;
  proveedorId: string | null;
  proveedor: string;
  /** La razon social que paga: srl | cnc | tsl. */
  sucursal: string;
  concepto: string;
  monto: number;
  /** YYYY-MM-DD. */
  vence: string;
  forma: FormaPago;
  /** Cuantos dias antes empieza a avisar. */
  avisar: number;
  nota: string;
  estado: EstadoPago;
  version: number;
  creadoPor: string;
  creadoEn: string;
  /** YYYY-MM-DD en que se pago. */
  pagadoDia: string | null;
  pagadoPor: string | null;
  montoPagado: number | null;
  /** De donde salio la plata (null = se marco sin anotarlo en una cuenta). */
  cuentaId: string | null;
  /** La marca del pago: el grupo del movimiento en la cuenta. */
  marcaPago: string | null;
  anuladoPor: string | null;
  motivo: string | null;
};

/** Lo que llega de la pagina para cargar uno (o varios, en cuotas). */
export type PedidoPago = {
  idLocal: string;
  proveedorId: string | null;
  proveedor: string;
  sucursal: string;
  concepto: string;
  /** El total: en cuotas se reparte. */
  monto: number;
  /** El vencimiento de la primera. */
  vence: string;
  forma: FormaPago;
  avisar: number;
  nota: string;
  cuotas: number;
  /** Cada cuantos dias vence la siguiente cuota. */
  cada: number;
};

/** Lo que se puede cambiar de uno pendiente. */
export type CambioPago = {
  id: string;
  version: number;
  proveedorId: string | null;
  proveedor: string;
  sucursal: string;
  concepto: string;
  monto: number;
  vence: string;
  forma: FormaPago;
  avisar: number;
  nota: string;
};

/** Lo que llega de la pagina para marcarlo pagado. */
export type PedidoPagar = {
  id: string;
  version: number;
  /** La marca del pago: el mismo pedido repetido no paga dos veces. */
  idLocal: string;
  /** null = sin anotarlo en una cuenta. */
  cuentaId: string | null;
  monto: number;
  /** YYYY-MM-DD, o null = hoy. */
  dia: string | null;
  detalle: string;
};

export const aCentavos = (n: number): number => Math.round((Number(n) || 0) * 100);
export const dePesos = (c: number): number => Math.round(c) / 100;
/** "$ 1.234,50", para los avisos y la Actividad. */
export const pesosTxt = (n: number): string =>
  `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TRES_HORAS = 3 * 60 * 60 * 1000;
const UN_DIA = 24 * 60 * 60 * 1000;
/** El dia (YYYY-MM-DD) de ese instante en Argentina. */
export function diaAR(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  return new Date(t - TRES_HORAS).toISOString().slice(0, 10);
}
export const hoyAR = (): string => diaAR(new Date().toISOString());

export const esDia = (x: unknown): x is string =>
  typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && new Date(x + "T12:00:00Z").toISOString().slice(0, 10) === x;

/** Ese dia mas n dias (n puede ser negativo). */
export function sumarDias(dia: string, n: number): string {
  return new Date(Date.parse(dia + "T12:00:00Z") + Math.round(n) * UN_DIA).toISOString().slice(0, 10);
}
/** Cuantos dias van de un dia al otro (negativo si el segundo es antes). */
export function diasEntre(desde: string, hasta: string): number {
  return Math.round((Date.parse(hasta + "T12:00:00Z") - Date.parse(desde + "T12:00:00Z")) / UN_DIA);
}

/** Texto para la pagina: va adentro de innerHTML, sin < ni >. */
const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";
const idDe = (x: unknown): string | null => {
  const s = typeof x === "string" ? x.trim().slice(0, 40) : "";
  return /^[A-Za-z0-9_-]+$/.test(s) ? s : null;
};
const montoDe = (x: unknown): number | string => {
  const m = typeof x === "number" ? x : typeof x === "string" && x.trim() ? Number(x) : Number.NaN;
  if (!Number.isFinite(m) || m <= 0) return "El monto tiene que ser mayor que cero.";
  if (m > MONTO_MAXIMO) return "El monto es demasiado grande.";
  const c = aCentavos(m);
  return c > 0 ? dePesos(c) : "El monto tiene que ser mayor que cero.";
};
const enteroDe = (x: unknown, def: number): number => {
  if (x == null || x === "") return def;
  const n = Number(x);
  return Number.isFinite(n) ? Math.round(n) : Number.NaN;
};

/** Lo comun a cargar y a cambiar. String = el error. */
function limpiarDatos(o: Record<string, unknown>): Omit<CambioPago, "id" | "version"> | string {
  const proveedor = texto(o.proveedor, 120);
  if (!proveedor) return "Decí a qué proveedor hay que pagarle.";
  const proveedorId = o.proveedorId == null || o.proveedorId === "" ? null : idDe(o.proveedorId);
  if (o.proveedorId != null && o.proveedorId !== "" && !proveedorId) return "No reconozco ese proveedor: elegilo de nuevo.";
  const sucursal = String(o.sucursal ?? "");
  if (!(SUCURSALES_PAGO as readonly string[]).includes(sucursal)) return "Elegí qué razón social paga.";
  const monto = montoDe(o.monto);
  if (typeof monto === "string") return monto;
  if (!esDia(o.vence)) return "Poné la fecha en que vence.";
  const vence = o.vence;
  if (vence < "2020-01-01" || vence > "2099-12-31") return "La fecha de vencimiento no se entiende.";
  const forma = String(o.forma ?? "") as FormaPago;
  if (forma && !(FORMAS_PAGO as readonly string[]).includes(forma)) return "Elegí cómo se paga.";
  const avisar = enteroDe(o.avisar, AVISAR_DEFAULT);
  if (!Number.isInteger(avisar) || avisar < 0 || avisar > AVISAR_MAXIMO)
    return `Los días de aviso van de 0 (el mismo día) a ${AVISAR_MAXIMO}.`;
  return { proveedorId, proveedor, sucursal, concepto: texto(o.concepto, 120), monto, vence, forma, avisar, nota: texto(o.nota, 300) };
}

/** Lo que viene de la pagina para cargar un pago. String = el error. */
export function limpiarPedidoPago(x: unknown): PedidoPago | string {
  if (!x || typeof x !== "object") return "No entendí el pago.";
  const o = x as Record<string, unknown>;
  const idLocal = typeof o.idLocal === "string" ? o.idLocal : "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(idLocal)) return "Falta la marca del pago: recargá la página.";
  const d = limpiarDatos(o);
  if (typeof d === "string") return d;
  const cuotas = enteroDe(o.cuotas, 1);
  if (!Number.isInteger(cuotas) || cuotas < 1 || cuotas > CUOTAS_MAXIMO) return `Las cuotas van de 1 a ${CUOTAS_MAXIMO}.`;
  const cada = enteroDe(o.cada, 30);
  if (cuotas > 1 && (!Number.isInteger(cada) || cada < 1 || cada > 366)) return "Decí cada cuántos días vence la siguiente cuota (de 1 a 366).";
  if (aCentavos(d.monto) < cuotas) return "El monto no alcanza para tantas cuotas.";
  return { idLocal, ...d, cuotas, cada: cuotas > 1 ? cada : 30 };
}

/** Lo que viene de la pagina para cambiar uno pendiente. String = el error. */
export function limpiarCambioPago(x: unknown): CambioPago | string {
  if (!x || typeof x !== "object") return "No entendí el cambio.";
  const o = x as Record<string, unknown>;
  const id = idDe(o.id);
  if (!id) return "Falta qué pago cambiar.";
  const version = Number(o.version);
  if (!Number.isInteger(version) || version < 1) return "Falta la versión del pago: recargá la página.";
  const d = limpiarDatos(o);
  if (typeof d === "string") return d;
  return { id, version, ...d };
}

/** Lo que viene de la pagina para marcarlo pagado. String = el error. */
export function limpiarPedidoPagar(x: unknown, hoy: string): PedidoPagar | string {
  if (!x || typeof x !== "object") return "No entendí el pago.";
  const o = x as Record<string, unknown>;
  const id = idDe(o.id);
  if (!id) return "Falta qué pago marcar.";
  const version = Number(o.version);
  if (!Number.isInteger(version) || version < 1) return "Falta la versión del pago: recargá la página.";
  const idLocal = typeof o.idLocal === "string" ? o.idLocal : "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(idLocal)) return "Falta la marca del pago: recargá la página.";
  const cuentaId = o.cuentaId == null || o.cuentaId === "" ? null : idDe(o.cuentaId);
  if (o.cuentaId != null && o.cuentaId !== "" && !cuentaId) return "No reconozco esa cuenta: elegila de nuevo.";
  const monto = montoDe(o.monto);
  if (typeof monto === "string") return monto;
  let dia: string | null = null;
  if (o.dia != null && o.dia !== "") {
    if (!esDia(o.dia)) return "La fecha del pago no se entiende.";
    if (o.dia > hoy) return "La fecha del pago no puede ser de más adelante.";
    dia = o.dia === hoy ? null : o.dia;
  }
  return { id, version, idLocal, cuentaId, monto, dia, detalle: texto(o.detalle, 200) };
}

/** Las cuotas de una carga: el total repartido en centavos (lo que sobra va
 *  en la ultima) y cada una "cada" dias despues de la anterior. */
export function armarCuotas(p: Pick<PedidoPago, "monto" | "vence" | "cuotas" | "cada">): { cuota: number; monto: number; vence: string }[] {
  const total = aCentavos(p.monto);
  const base = Math.floor(total / p.cuotas);
  return Array.from({ length: p.cuotas }, (_, i) => ({
    cuota: i + 1,
    monto: dePesos(i === p.cuotas - 1 ? total - base * (p.cuotas - 1) : base),
    vence: sumarDias(p.vence, i * p.cada),
  }));
}

export type Situacion = "vencido" | "hoy" | "pronto" | "despues" | "pagado" | "anulado";

/** Donde esta ese pago hoy: vencido, vence hoy, pronto (ya entro en los dias
 *  de aviso), despues, o ya pagado / anulado. */
export function situacion(p: Pick<Pago, "estado" | "vence" | "avisar">, hoy: string): Situacion {
  if (p.estado !== "pendiente") return p.estado;
  const faltan = diasEntre(hoy, p.vence);
  if (faltan < 0) return "vencido";
  if (faltan === 0) return "hoy";
  return faltan <= p.avisar ? "pronto" : "despues";
}

export type Resumen = Record<"vencido" | "hoy" | "pronto" | "despues", { n: number; total: number }>;

/** Cuantos y cuanto en cada situacion (solo los pendientes). */
export function resumenAgenda(pagos: readonly Pick<Pago, "estado" | "vence" | "avisar" | "monto">[], hoy: string): Resumen {
  const r: Resumen = { vencido: { n: 0, total: 0 }, hoy: { n: 0, total: 0 }, pronto: { n: 0, total: 0 }, despues: { n: 0, total: 0 } };
  const cent: Record<string, number> = { vencido: 0, hoy: 0, pronto: 0, despues: 0 };
  for (const p of pagos) {
    const s = situacion(p, hoy);
    if (s === "pagado" || s === "anulado") continue;
    r[s].n++;
    cent[s] += aCentavos(p.monto);
  }
  for (const k of Object.keys(r) as (keyof Resumen)[]) r[k].total = dePesos(cent[k]);
  return r;
}

/** Lo que queda pendiente si se paga menos de lo agendado (0 si se pago todo
 *  o mas: un recargo o intereses). */
export const restoDe = (agendado: number, pagado: number): number => dePesos(Math.max(0, aCentavos(agendado) - aCentavos(pagado)));

/** El detalle del movimiento en la cuenta: "PROVEEDOR · concepto · cuota 2/3". */
export function detalleMovimiento(p: Pick<Pago, "proveedor" | "concepto" | "cuota" | "cuotas">, extra: string): string {
  return [p.proveedor, p.concepto, p.cuotas > 1 ? `cuota ${p.cuota}/${p.cuotas}` : "", extra]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 200);
}
