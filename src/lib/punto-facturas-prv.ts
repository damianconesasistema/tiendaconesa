import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CLAVE_INGRESOS } from "@/lib/punto-articulos";
import {
  type FacturaPrv,
  MAX_FACTURAS_PRV,
  type PedidoFactura,
  clavePrv,
  mismaFactura,
  nroEnTexto,
  nroFactura,
} from "@/lib/punto-facturas-prv-reglas";

// Las facturas de cada proveedor (V.0.11.285; reglas en
// src/lib/punto-facturas-prv-reglas.ts). En un renglón de Setting, como el
// historial de los cambios: son pocas por proveedor y no hace falta tabla.

export const CLAVE_FACTURAS_PRV = "punto.proveedores.facturas";

type Guardado = { facturas: FacturaPrv[] };

async function leer(db: Pick<Prisma.TransactionClient, "setting">): Promise<Guardado> {
  const fila = await db.setting.findUnique({ where: { key: CLAVE_FACTURAS_PRV } });
  try {
    const d = fila ? (JSON.parse(fila.value) as Partial<Guardado>) : {};
    return { facturas: Array.isArray(d.facturas) ? d.facturas : [] };
  } catch {
    return { facturas: [] };
  }
}

/** Una factura con lo que ya se agendó o pagó de ella. */
export type FacturaVista = FacturaPrv & {
  /** "compra" = la cargada en Artículos → Adjuntar (sin el total). */
  origen?: "compra";
  /** Lo agendado con ese número en el concepto: pendiente, pagado o nada. */
  agenda: "" | "pendiente" | "pagado";
};

/** Las facturas de un proveedor, la más nueva primero. Suma las facturas de
 *  compra subidas en Adjuntar que todavía no están, y marca las que ya
 *  tienen un pago agendado (con su número en el concepto). */
export async function listarFacturasPrv(proveedor: string): Promise<FacturaVista[]> {
  const k = clavePrv(proveedor);
  if (!k) return [];
  const [g, ing, pagos] = await Promise.all([
    leer(prisma),
    prisma.setting.findUnique({ where: { key: CLAVE_INGRESOS } }),
    prisma.puntoPago.findMany({
      where: { proveedor: { equals: proveedor, mode: "insensitive" }, estado: { not: "anulado" } },
      select: { concepto: true, estado: true },
    }),
  ]);
  const propias: FacturaVista[] = g.facturas.filter((f) => clavePrv(f.proveedor) === k).map((f) => ({ ...f, agenda: "" }));
  let compras: { factura?: string; proveedor?: string; fecha?: string; por?: string }[] = [];
  try {
    const d: unknown = ing ? JSON.parse(ing.value) : [];
    if (Array.isArray(d)) compras = d as typeof compras;
  } catch {
    compras = [];
  }
  for (const c of compras) {
    if (!c || clavePrv(c.proveedor) !== k) continue;
    const nro = nroFactura(c.factura);
    if (!nro || propias.some((f) => f.nro === nro)) continue;
    propias.push({
      id: "compra:" + nro,
      proveedorId: null,
      proveedor: String(c.proveedor),
      tipo: "",
      nro,
      fecha: typeof c.fecha === "string" ? c.fecha.slice(0, 10) : "",
      vence: "",
      monto: 0,
      dtoPago: 0,
      nota: "subida en Adjuntar",
      por: String(c.por || ""),
      creado: String(c.fecha || ""),
      origen: "compra",
      agenda: "",
    });
  }
  for (const f of propias) {
    const de = pagos.filter((p) => p.concepto.includes(f.nro) || nroEnTexto(p.concepto) === f.nro);
    f.agenda = !de.length ? "" : de.every((p) => p.estado === "pagado") ? "pagado" : "pendiente";
  }
  return propias.sort((a, b) => (b.fecha || b.creado).localeCompare(a.fecha || a.creado));
}

/** Carga una factura. La misma otra vez (proveedor, tipo y número) no se
 *  repite: completa lo que le faltaba (total, vencimiento, descuento). */
export async function cargarFacturaPrv(p: PedidoFactura, por: string): Promise<{ factura: FacturaPrv; yaEstaba: boolean }> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${CLAVE_FACTURAS_PRV}))`;
    const g = await leer(tx);
    const ya = g.facturas.find((f) => mismaFactura(f, p));
    let factura: FacturaPrv;
    if (ya) {
      if (!ya.tipo && p.tipo) ya.tipo = p.tipo;
      if (!ya.monto && p.monto) ya.monto = p.monto;
      if (!ya.vence && p.vence) ya.vence = p.vence;
      if (!ya.fecha && p.fecha) ya.fecha = p.fecha;
      if (!ya.dtoPago && p.dtoPago) ya.dtoPago = p.dtoPago;
      if (!ya.proveedorId && p.proveedorId) ya.proveedorId = p.proveedorId;
      factura = ya;
    } else {
      factura = { ...p, id: "fp" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7), por, creado: new Date().toISOString() };
      g.facturas.push(factura);
      if (g.facturas.length > MAX_FACTURAS_PRV) g.facturas = g.facturas.slice(-MAX_FACTURAS_PRV);
    }
    const value = JSON.stringify(g);
    await tx.setting.upsert({ where: { key: CLAVE_FACTURAS_PRV }, update: { value }, create: { key: CLAVE_FACTURAS_PRV, value } });
    return { factura, yaEstaba: !!ya };
  });
}

/** Saca una factura cargada (las de Adjuntar no se sacan de acá). */
export async function borrarFacturaPrv(id: string): Promise<FacturaPrv | null> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${CLAVE_FACTURAS_PRV}))`;
    const g = await leer(tx);
    const i = g.facturas.findIndex((f) => f.id === id);
    if (i < 0) return null;
    const [f] = g.facturas.splice(i, 1);
    const value = JSON.stringify(g);
    await tx.setting.upsert({ where: { key: CLAVE_FACTURAS_PRV }, update: { value }, create: { key: CLAVE_FACTURAS_PRV, value } });
    return f;
  });
}
