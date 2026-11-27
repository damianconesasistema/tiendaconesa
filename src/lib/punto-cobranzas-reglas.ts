// Las reglas de la cuenta corriente de los clientes y sus cobranzas
// (V.0.11.289). Damian, 27/11/2026: "nos pagaron la venta a cuenta corriente
// de ayer, ahora hay que confirmar el pago"; "la transferencia fue a banco
// santander"; "tambien deberiamos anotarlo".
//
// Sin ningun import a proposito: lo usan la ruta /sistema/cobranzas, la capa
// de base (src/lib/punto-cobranzas.ts), el simulador y las pruebas con node
// solo (scripts/pruebas/punto-cobranzas.test.ts).
//
// Reglas que salen de aca:
// - Lo que debe un cliente son sus ventas con forma de pago "Cuenta
//   corriente" (factura, pedido interno y Recibo X; el remito no, porque
//   acompaña una venta que ya cuenta), menos sus notas de credito, mas sus
//   notas de debito, menos lo que ya se cobro. Lo eliminado y lo anulado no
//   cuenta.
// - Una cobranza salda una o varias ventas del mismo cliente y de la misma
//   razon social (la plata entra a una cuenta de esa razon social). Puede
//   pagar una parte: el resto sigue debiendose. Nunca mas de lo que se debe.
// - La plata se suma en centavos enteros.

export const FORMAS_COBRO = ["transferencia", "efectivo", "mercadopago", "cheque"] as const;
export type FormaCobro = (typeof FORMAS_COBRO)[number];
export const NOMBRE_FORMA: Record<FormaCobro, string> = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  mercadopago: "Mercado Pago",
  cheque: "Cheque",
};
/** A que tipo de cuenta entra cada forma. El cheque puede quedar sin cuenta
 *  (todavia no se deposito). */
export const CUENTAS_DE_FORMA: Record<FormaCobro, readonly string[]> = {
  transferencia: ["banco", "mercadopago"],
  efectivo: ["efectivo"],
  mercadopago: ["mercadopago"],
  cheque: ["banco"],
};

/** Los comprobantes que pueden quedar debiendose. */
export const TIPOS_DEUDA: readonly string[] = ["factura", "pedido-interno", "sin-comprobante"];
/** Los que corrigen a una factura (datos.facturaId). */
export const TIPOS_NOTA: readonly string[] = ["nota-credito", "nota-debito"];

export const MONTO_MAXIMO = 1e10;
export const MAX_IMPUTACIONES = 60;

/** "08-Cuenta corriente 30 días" (como la guarda la venta). */
export function esCuentaCorriente(forma: unknown): boolean {
  return typeof forma === "string" && (/^\s*08\s*[-.]/.test(forma) || /cuenta\s+corriente/i.test(forma));
}

const cent = (n: number): number => Math.round((Number(n) || 0) * 100);
const pesos = (c: number): number => Math.round(c) / 100;
const soloNum = (s: unknown): string => String(s ?? "").replace(/\D/g, "");
const ID = /^[A-Za-z0-9_-]{8,40}$/;

/** "$ 1.234,50", para los avisos. */
export function pesosTxt(n: number): string {
  const c = cent(n);
  const s = (Math.abs(c) / 100).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (c < 0 ? "−" : "") + "$ " + s;
}

/** Un comprobante de cuenta corriente, como lo lee la base. */
export type DocCC = {
  id: string;
  tipo: string;
  nro: string;
  sucursal: string;
  /** ISO. */
  fecha: string;
  total: number;
  forma: string;
  cliente: { id: string; n: string; doc: string };
  /** En una nota: la factura que corrige. */
  facturaId: string | null;
};

/** "Factura B 0006-00000120", "Recibo X P-3001": como se nombra la venta. */
export function nroVenta(d: { tipo: string; letra: string | null; pv: string; numero: number | null; pedido: number }): string {
  const n = d.letra && d.numero != null ? `${d.letra} ${d.pv}-${String(d.numero).padStart(8, "0")}` : `P-${d.pedido}`;
  const t: Record<string, string> = {
    factura: "Factura",
    "pedido-interno": "Pedido interno",
    "sin-comprobante": "Recibo X",
    "nota-credito": "Nota de crédito",
    "nota-debito": "Nota de débito",
  };
  return `${t[d.tipo] ?? "Comprobante"} ${n}`;
}

/** Un comprobante guardado (la fila de la base, con datos) como lo usa la
 *  cuenta corriente. */
export function docCCDe(d: {
  id: string;
  tipo: string;
  letra: string | null;
  pv: string;
  numero: number | null;
  pedido: number;
  sucursal: string;
  createdAt: string;
  total: number;
  cliente?: string;
  datos: unknown;
}): DocCC {
  const dt = (d.datos && typeof d.datos === "object" && !Array.isArray(d.datos) ? d.datos : {}) as Record<string, unknown>;
  const c = (dt.cliente && typeof dt.cliente === "object" ? dt.cliente : {}) as Record<string, unknown>;
  return {
    id: d.id,
    tipo: d.tipo,
    nro: nroVenta(d),
    sucursal: d.sucursal,
    fecha: d.createdAt,
    total: Number(d.total) || 0,
    forma: typeof dt.forma === "string" ? dt.forma : "",
    cliente: {
      id: typeof c.id === "string" ? c.id : "",
      n: typeof c.n === "string" && c.n ? c.n : d.cliente || "",
      doc: typeof c.doc === "string" ? c.doc : "",
    },
    facturaId: typeof dt.facturaId === "string" ? dt.facturaId : null,
  };
}

export type Imputacion = { docId: string; nro: string; monto: number };

/** Lo que importa de una cobranza para la cuenta (la base tiene mas). */
export type CobranzaCC = { imputaciones: readonly Imputacion[]; anulado: boolean };

export type Pendiente = {
  docId: string;
  tipo: string;
  nro: string;
  sucursal: string;
  fecha: string;
  total: number;
  /** Lo que movieron las notas: negativo la de credito, positivo la de debito. */
  notas: number;
  cobrado: number;
  /** Lo que falta (0 = pagada). */
  debe: number;
  /** De quien es: el mismo cliente tiene la misma clave en todas sus ventas. */
  clave: string;
  cliente: string;
  clienteId: string;
  clienteDoc: string;
};

export type Deudor = {
  clave: string;
  cliente: string;
  clienteId: string;
  clienteDoc: string;
  debe: number;
  /** Cuantas ventas tiene sin pagar del todo. */
  ventas: number;
  /** La venta sin pagar mas vieja (ISO). */
  desde: string;
};

const nombreClave = (n: string) =>
  "n:" + String(n || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");

/** Cuanto debe cada venta de cuenta corriente (las pagadas tambien, con
 *  debe 0). Cada una lleva la clave de su cliente: el id del cliente; si la
 *  venta no lo tiene (se escribio a mano), su CUIT o DNI, que se junta con
 *  el cliente guardado que tiene ese documento. Ordenadas de la mas vieja a
 *  la mas nueva. */
export function calcularDeudas(
  docs: readonly DocCC[],
  notas: readonly DocCC[],
  cobranzas: readonly CobranzaCC[],
): Pendiente[] {
  const ventas = docs.filter((d) => TIPOS_DEUDA.includes(d.tipo) && esCuentaCorriente(d.forma));
  const ajuste = new Map<string, number>();
  for (const n of notas) {
    if (!n.facturaId || !TIPOS_NOTA.includes(n.tipo)) continue;
    ajuste.set(n.facturaId, (ajuste.get(n.facturaId) ?? 0) + (n.tipo === "nota-credito" ? -cent(n.total) : cent(n.total)));
  }
  const cobrado = new Map<string, number>();
  for (const c of cobranzas) {
    if (c.anulado) continue;
    for (const i of c.imputaciones) cobrado.set(i.docId, (cobrado.get(i.docId) ?? 0) + cent(i.monto));
  }
  // Las claves: primero los que tienen id (y su documento queda atado a ese
  // id), despues los que solo tienen documento, despues solo el nombre.
  const deDoc = new Map<string, string>();
  for (const d of ventas) {
    const doc = soloNum(d.cliente.doc);
    if (ID.test(d.cliente.id) && doc.length >= 7 && !deDoc.has(doc)) deDoc.set(doc, d.cliente.id);
  }
  const claveDe = (d: DocCC): string => {
    if (ID.test(d.cliente.id)) return d.cliente.id;
    const doc = soloNum(d.cliente.doc);
    if (doc.length >= 7) return deDoc.get(doc) ?? "doc:" + doc;
    return nombreClave(d.cliente.n);
  };
  return ventas
    .map((d) => {
      const t = cent(d.total), a = ajuste.get(d.id) ?? 0, c = cobrado.get(d.id) ?? 0;
      return {
        docId: d.id,
        tipo: d.tipo,
        nro: d.nro,
        sucursal: d.sucursal,
        fecha: d.fecha,
        total: pesos(t),
        notas: pesos(a),
        cobrado: pesos(c),
        debe: pesos(Math.max(0, t + a - c)),
        clave: claveDe(d),
        cliente: d.cliente.n,
        clienteId: ID.test(d.cliente.id) ? d.cliente.id : "",
        clienteDoc: soloNum(d.cliente.doc),
      };
    })
    .sort((x, y) => (x.fecha < y.fecha ? -1 : x.fecha > y.fecha ? 1 : 0));
}

/** Los que deben algo, el que mas debe primero. */
export function deudores(pend: readonly Pendiente[]): Deudor[] {
  const g = new Map<string, { d: Deudor; c: number }>();
  for (const p of pend) {
    if (!(p.debe > 0)) continue;
    let x = g.get(p.clave);
    if (!x) {
      x = { d: { clave: p.clave, cliente: p.cliente, clienteId: p.clienteId, clienteDoc: p.clienteDoc, debe: 0, ventas: 0, desde: p.fecha }, c: 0 };
      g.set(p.clave, x);
    }
    x.c += cent(p.debe);
    x.d.ventas++;
    if (p.fecha < x.d.desde) x.d.desde = p.fecha;
    // El nombre y los datos de la venta mas nueva (el cliente pudo cambiar de nombre).
    x.d.cliente = p.cliente || x.d.cliente;
    if (p.clienteId) x.d.clienteId = p.clienteId;
    if (p.clienteDoc) x.d.clienteDoc = p.clienteDoc;
  }
  return [...g.values()].map((x) => ({ ...x.d, debe: pesos(x.c) })).sort((a, b) => b.debe - a.debe || a.cliente.localeCompare(b.cliente, "es"));
}

/** Si esa venta es de ese cliente: por su clave (la de la lista de los que
 *  deben), por su id o por su CUIT o DNI. */
export function esDelCliente(p: Pendiente, c: { clave?: string; id?: string; doc?: string }): boolean {
  const clave = String(c.clave ?? ""), id = String(c.id ?? ""), doc = soloNum(c.doc);
  return (!!clave && p.clave === clave) || (ID.test(id) && (p.clave === id || p.clienteId === id)) || (doc.length >= 7 && p.clienteDoc === doc);
}

export type PedidoCobranza = {
  idLocal: string;
  forma: FormaCobro;
  cuentaId: string | null;
  /** YYYY-MM-DD del pago, o null = hoy. */
  dia: string | null;
  operacion: string;
  nota: string;
  imputaciones: { docId: string; monto: number }[];
};

const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/[\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "";

const esDia = (x: unknown): x is string => {
  if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const t = Date.parse(x + "T12:00:00Z");
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, 10) === x;
};

/** Lo que manda la pagina para cobrar. String = el error. */
export function limpiarPedidoCobranza(x: unknown, hoy: string): PedidoCobranza | string {
  if (!x || typeof x !== "object") return "No entendí el cobro.";
  const o = x as Record<string, unknown>;
  const idLocal = typeof o.idLocal === "string" ? o.idLocal : "";
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idLocal)) return "Falta la marca del cobro: recargá la página.";
  const forma = String(o.forma ?? "") as FormaCobro;
  if (!FORMAS_COBRO.includes(forma)) return "Elegí cómo pagó: transferencia, efectivo, Mercado Pago o cheque.";
  const cuentaId = typeof o.cuentaId === "string" && o.cuentaId.trim() ? o.cuentaId.trim().slice(0, 40) : null;
  if (!cuentaId && forma !== "cheque") return "Elegí a qué cuenta entró la plata.";
  let dia: string | null = null;
  if (o.dia != null && o.dia !== "") {
    if (!esDia(o.dia)) return "La fecha del pago no se entiende.";
    if (o.dia > hoy) return "La fecha del pago no puede ser de más adelante.";
    if (Date.parse(hoy + "T12:00:00Z") - Date.parse(o.dia + "T12:00:00Z") > 400 * 86_400_000)
      return "La fecha del pago es de hace más de un año: revisala.";
    dia = o.dia === hoy ? null : o.dia;
  }
  if (!Array.isArray(o.imputaciones) || !o.imputaciones.length) return "Tildá qué venta paga.";
  if (o.imputaciones.length > MAX_IMPUTACIONES) return `Se cobran hasta ${MAX_IMPUTACIONES} ventas de una vez.`;
  const imputaciones: { docId: string; monto: number }[] = [];
  const vistos = new Set<string>();
  for (const i of o.imputaciones as unknown[]) {
    const r = (i && typeof i === "object" ? i : {}) as Record<string, unknown>;
    const docId = typeof r.docId === "string" ? r.docId : "";
    if (!ID.test(docId)) return "Una de las ventas no se entiende: recargá la página.";
    if (vistos.has(docId)) return "La misma venta vino dos veces.";
    vistos.add(docId);
    const m = typeof r.monto === "number" ? r.monto : Number.NaN;
    if (!Number.isFinite(m) || m <= 0) return "Lo que paga cada venta tiene que ser mayor que cero.";
    if (m > MONTO_MAXIMO) return "El monto es demasiado grande.";
    const monto = pesos(cent(m));
    if (!(monto > 0)) return "Lo que paga cada venta tiene que ser mayor que cero.";
    imputaciones.push({ docId, monto });
  }
  return {
    idLocal,
    forma,
    cuentaId,
    dia,
    operacion: texto(o.operacion, 120),
    nota: texto(o.nota, 200),
    imputaciones,
  };
}

export type CobranzaArmada = {
  sucursal: string;
  clave: string;
  cliente: string;
  clienteId: string;
  clienteDoc: string;
  monto: number;
  imputaciones: Imputacion[];
};

/** Revisa el cobro contra lo que se debe hoy. String = el error. */
export function armarCobranza(p: PedidoCobranza, pend: readonly Pendiente[]): CobranzaArmada | string {
  const porId = new Map(pend.map((x) => [x.docId, x]));
  const imputaciones: Imputacion[] = [];
  let sucursal = "", clave = "", total = 0;
  let ultima: Pendiente | null = null;
  for (const i of p.imputaciones) {
    const x = porId.get(i.docId);
    if (!x) return "Una de las ventas ya no figura en cuenta corriente: recargá la ventana.";
    if (!(x.debe > 0)) return `${x.nro}: ya se pagó todo.`;
    if (cent(i.monto) > cent(x.debe)) return `${x.nro}: quedan ${pesosTxt(x.debe)}, no se puede cobrar más que eso.`;
    if (clave && x.clave !== clave) return "Las ventas son de clientes distintos: cobralas por separado.";
    if (sucursal && x.sucursal !== sucursal)
      return "Las ventas son de razones sociales distintas: cobralas por separado (la plata entra a la cuenta de cada una).";
    clave = x.clave;
    sucursal = x.sucursal;
    total += cent(i.monto);
    imputaciones.push({ docId: x.docId, nro: x.nro, monto: pesos(cent(i.monto)) });
    if (!ultima || x.fecha >= ultima.fecha) ultima = x;
  }
  if (!ultima || !(total > 0)) return "Tildá qué venta paga.";
  return {
    sucursal,
    clave,
    cliente: ultima.cliente,
    clienteId: pend.find((x) => x.clave === clave && x.clienteId)?.clienteId ?? "",
    clienteDoc: pend.find((x) => x.clave === clave && x.clienteDoc)?.clienteDoc ?? "",
    monto: pesos(total),
    imputaciones,
  };
}

/** Si la plata puede entrar a esa cuenta. null = puede. */
export function revisarCuenta(
  forma: FormaCobro,
  cuenta: { tipo: string; sucursal: string; activa: boolean } | null,
  sucursal: string,
): string | null {
  if (!cuenta) return forma === "cheque" ? null : "Elegí a qué cuenta entró la plata.";
  if (!cuenta.activa) return "Esa cuenta está dada de baja.";
  if (cuenta.sucursal !== sucursal) return "La cuenta tiene que ser de la misma razón social que la venta.";
  if (!CUENTAS_DE_FORMA[forma].includes(cuenta.tipo))
    return forma === "efectivo"
      ? "El efectivo entra a una caja de efectivo."
      : forma === "mercadopago"
        ? "Lo de Mercado Pago entra a la cuenta de Mercado Pago."
        : forma === "cheque"
          ? "Un cheque se deposita en un banco."
          : "Una transferencia entra a un banco o a Mercado Pago.";
  return null;
}

/** "00000012". */
export const nroRecibo = (n: number): string => String(Math.max(0, Math.round(n))).padStart(8, "0");

/** El detalle del movimiento en la cuenta (Cuentas y gastos). */
export function detalleCobranza(
  a: Pick<CobranzaArmada, "cliente" | "imputaciones">,
  numero: number,
  forma: FormaCobro,
  operacion: string,
): string {
  const ventas = a.imputaciones.map((i) => i.nro).join(", ");
  const s = `${a.cliente} · ${ventas} · recibo ${nroRecibo(numero)} · ${NOMBRE_FORMA[forma]}${operacion ? ` ${operacion}` : ""}`;
  return s.replace(/[<>]/g, "").slice(0, 200);
}
