import { Prisma, type PuntoCuenta, type PuntoMovimiento } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  type Cuenta,
  type ClaseBanco,
  type Movimiento,
  type PedidoMovimiento,
  type TipoCuenta,
  type TipoMovimiento,
  diaAR,
  mismoPedido,
  RUBROS_BASE,
  signoOrigen,
} from "@/lib/punto-cuentas-reglas";

// Las cuentas y los movimientos de plata de Punto en la base (migracion 57).
// Las reglas (que se acepta, el saldo, quien puede) estan en
// src/lib/punto-cuentas-reglas.ts; aca solo se lee y se escribe.
//
// - El mismo pedido repetido (doble clic, corte de conexion) no se guarda dos
//   veces: el idLocal con la cuenta es unico, y si ya esta se devuelve lo
//   guardado (yaEstaba).
// - Un pase entre cuentas son dos filas con el mismo grupo, en una sola
//   transaccion: o se guardan las dos o ninguna.
// - Nada se borra: anular marca todo el grupo; anular de nuevo no cambia nada.

const CLAVE_RUBROS = "punto.gastos.rubros";

const cuentaDe = (c: PuntoCuenta): Cuenta => ({
  id: c.id,
  sucursal: c.sucursal,
  tipo: c.tipo as TipoCuenta,
  nombre: c.nombre,
  banco: c.banco,
  clase: (c.clase as ClaseBanco | null) ?? null,
  saldoInicial: c.saldoInicial,
  desde: c.desde,
  activa: c.activa,
});

const repartoDe = (x: Prisma.JsonValue | null): Record<string, number> | null => {
  if (!x || typeof x !== "object" || Array.isArray(x)) return null;
  const r: Record<string, number> = {};
  for (const [k, v] of Object.entries(x)) if (typeof v === "number") r[k] = v;
  return Object.keys(r).length ? r : null;
};

const movimientoDe = (m: PuntoMovimiento): Movimiento => ({
  id: m.id,
  grupo: m.grupo,
  fecha: m.fecha.toISOString(),
  cuentaId: m.cuentaId,
  sucursal: m.sucursal,
  tipo: m.tipo as TipoMovimiento,
  monto: m.monto,
  rubro: m.rubro,
  detalle: m.detalle,
  iva: m.iva,
  reparto: repartoDe(m.reparto),
  usuario: m.usuario,
  anulado: m.anuladoEn != null,
  eliminado: m.eliminadoEn != null,
});

export async function listarCuentas(): Promise<Cuenta[]> {
  const filas = await prisma.puntoCuenta.findMany({ orderBy: [{ sucursal: "asc" }, { creadoEn: "asc" }] });
  return filas.map(cuentaDe);
}

/** Crea (id null) o cambia una cuenta. String = el error para la pantalla. */
export async function guardarCuenta(id: string | null, datos: Omit<Cuenta, "id">, quien: string): Promise<Cuenta | string> {
  try {
    if (id) {
      const ya = await prisma.puntoCuenta.findUnique({ where: { id } });
      if (!ya) return "Esa cuenta ya no está.";
      // La razon social de una cuenta no cambia: sus movimientos son de esa.
      if (ya.sucursal !== datos.sucursal) return "Una cuenta no cambia de razón social: dala de baja y creá otra.";
      const c = await prisma.puntoCuenta.update({
        where: { id },
        data: { tipo: datos.tipo, nombre: datos.nombre, banco: datos.banco, clase: datos.clase,
          saldoInicial: datos.saldoInicial, desde: datos.desde, activa: datos.activa },
      });
      return cuentaDe(c);
    }
    const c = await prisma.puntoCuenta.create({ data: { ...datos, creadoPor: quien } });
    return cuentaDe(c);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return "Ya hay una cuenta con ese nombre en esa razón social.";
    throw e;
  }
}

/** Instantes de comienzo y fin (exclusivo) de esos dias de Argentina. */
function rangoAR(desdeDia: string, hastaDia: string): { gte: Date; lt: Date } {
  const gte = new Date(Date.parse(desdeDia + "T03:00:00.000Z"));
  const lt = new Date(Date.parse(hastaDia + "T03:00:00.000Z") + 24 * 60 * 60 * 1000);
  return { gte, lt };
}

/** Los que se muestran como lista: los mas nuevos primero, hasta este tope. */
export const TOPE_LISTA = 5000;

/** Los movimientos entre esos dos dias de Argentina (inclusive), para la
 *  lista. truncado = habia mas que el tope (se avisa en la pantalla). */
export async function listarMovimientos(f: {
  desdeDia: string;
  hastaDia: string;
  cuentaIds?: string[] | null;
}): Promise<{ movimientos: Movimiento[]; truncado: boolean }> {
  const filas = await prisma.puntoMovimiento.findMany({
    where: { fecha: rangoAR(f.desdeDia, f.hastaDia), ...(f.cuentaIds ? { cuentaId: { in: f.cuentaIds } } : {}) },
    orderBy: { fecha: "desc" },
    take: TOPE_LISTA + 1,
  });
  return { movimientos: filas.slice(0, TOPE_LISTA).map(movimientoDe), truncado: filas.length > TOPE_LISTA };
}

/** Todos los gastos de esos dias, sin tope: de aca salen los totales (la
 *  lista puede venir cortada; los totales no). */
export async function listarGastos(desdeDia: string, hastaDia: string): Promise<Movimiento[]> {
  const filas = await prisma.puntoMovimiento.findMany({
    where: { fecha: rangoAR(desdeDia, hastaDia), tipo: "gasto", anuladoEn: null },
  });
  return filas.map(movimientoDe);
}

/** Todos los movimientos de esas cuentas (para los saldos). Solo monto,
 *  fecha y si esta anulado: es lo unico que pide saldoDe. */
export async function todosLosMovimientosDe(cuentaIds: string[]): Promise<Movimiento[]> {
  if (!cuentaIds.length) return [];
  const filas = await prisma.puntoMovimiento.findMany({ where: { cuentaId: { in: cuentaIds } } });
  return filas.map(movimientoDe);
}

export async function cuentaPorId(id: string): Promise<Cuenta | null> {
  const c = await prisma.puntoCuenta.findUnique({ where: { id } });
  return c ? cuentaDe(c) : null;
}

/** Guarda el movimiento (y la pata de destino de un pase). El mismo pedido
 *  otra vez devuelve lo que ya estaba. */
export async function anotarMovimiento(
  p: PedidoMovimiento,
  origen: Cuenta,
  destino: Cuenta | null,
  quien: string,
): Promise<{ movimientos: Movimiento[]; yaEstaba: boolean } | string> {
  const yaEstaban = async () =>
    (await prisma.puntoMovimiento.findMany({ where: { idLocal: p.idLocal }, orderBy: { monto: "asc" } })).map(movimientoDe);
  // El mismo pedido otra vez (doble clic, corte): lo guardado. Con otros
  // datos (cambiaron el monto y volvieron a tocar Guardar) no es el mismo.
  const otroPedido = "Ese movimiento ya se había guardado con otros datos: cerrá el formulario y anotalo de nuevo.";
  const antes = await yaEstaban();
  if (antes.length) return mismoPedido(antes, p) ? { movimientos: antes, yaEstaba: true } : otroPedido;
  const fecha = p.fecha ? new Date(p.fecha) : new Date();
  const base = {
    idLocal: p.idLocal,
    grupo: p.idLocal,
    fecha,
    usuario: quien,
    tipo: p.tipo,
    rubro: p.rubro,
    detalle: p.detalle,
    iva: p.iva,
    reparto: p.reparto ?? Prisma.DbNull,
  };
  try {
    const filas = await prisma.$transaction(async (tx) => {
      const out = [
        await tx.puntoMovimiento.create({
          data: { ...base, cuentaId: origen.id, sucursal: origen.sucursal, monto: signoOrigen(p) * p.monto },
        }),
      ];
      if (p.tipo === "transferencia" && destino)
        out.push(
          await tx.puntoMovimiento.create({
            data: { ...base, cuentaId: destino.id, sucursal: destino.sucursal, monto: p.monto, iva: 0 },
          }),
        );
      return out;
    });
    return { movimientos: filas.map(movimientoDe), yaEstaba: false };
  } catch (e) {
    // Dos pedidos iguales a la vez: el segundo choca con el unico y devuelve
    // lo del primero.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const ya = await yaEstaban();
      if (ya.length) return mismoPedido(ya, p) ? { movimientos: ya, yaEstaba: true } : otroPedido;
    }
    throw e;
  }
}

export async function movimientoPorId(id: string): Promise<Movimiento | null> {
  const m = await prisma.puntoMovimiento.findUnique({ where: { id } });
  return m ? movimientoDe(m) : null;
}

/** Anula todo el grupo (las dos patas de un pase). Si ya estaba anulado, lo
 *  devuelve igual. */
export async function anularMovimiento(id: string, quien: string, motivo: string): Promise<Movimiento[] | string> {
  const m = await prisma.puntoMovimiento.findUnique({ where: { id } });
  if (!m) return "Ese movimiento ya no está.";
  await prisma.puntoMovimiento.updateMany({
    where: { grupo: m.grupo, anuladoEn: null },
    data: { anuladoEn: new Date(), anuladoPor: quien, motivo },
  });
  const filas = await prisma.puntoMovimiento.findMany({ where: { grupo: m.grupo } });
  return filas.map(movimientoDe);
}

/** V.0.11.262. Damian: "ademas de anular dame la posibilidad de eliminar para
 *  que no aparezca pero tambien deja la posibilidad de ver los eliminados".
 *  Saca el movimiento (y su otra pata) de la lista. Si no estaba anulado, lo
 *  anula tambien: lo que no se ve no puede seguir contando en los saldos. */
export async function eliminarMovimiento(id: string, quien: string, motivo: string): Promise<Movimiento[] | string> {
  const m = await prisma.puntoMovimiento.findUnique({ where: { id } });
  if (!m) return "Ese movimiento ya no está.";
  const ahora = new Date();
  await prisma.$transaction([
    prisma.puntoMovimiento.updateMany({
      where: { grupo: m.grupo, anuladoEn: null },
      data: { anuladoEn: ahora, anuladoPor: quien, motivo: motivo || "Eliminado" },
    }),
    prisma.puntoMovimiento.updateMany({
      where: { grupo: m.grupo, eliminadoEn: null },
      data: { eliminadoEn: ahora, eliminadoPor: quien },
    }),
  ]);
  return (await prisma.puntoMovimiento.findMany({ where: { grupo: m.grupo } })).map(movimientoDe);
}

/** Lo vuelve a mostrar en la lista (sigue anulado). */
export async function mostrarMovimiento(id: string): Promise<Movimiento[] | string> {
  const m = await prisma.puntoMovimiento.findUnique({ where: { id } });
  if (!m) return "Ese movimiento ya no está.";
  await prisma.puntoMovimiento.updateMany({ where: { grupo: m.grupo }, data: { eliminadoEn: null, eliminadoPor: null } });
  return (await prisma.puntoMovimiento.findMany({ where: { grupo: m.grupo } })).map(movimientoDe);
}

/** Los rubros de gasto: los guardados, o los de arranque. */
export async function leerRubros(): Promise<string[]> {
  const f = await prisma.setting.findUnique({ where: { key: CLAVE_RUBROS } });
  if (!f) return [...RUBROS_BASE];
  try {
    const l = JSON.parse(f.value);
    return Array.isArray(l) && l.every((x) => typeof x === "string") && l.length ? l : [...RUBROS_BASE];
  } catch {
    return [...RUBROS_BASE];
  }
}

/** Guarda la lista de rubros (sin repetidos ni vacios, sin < >, hasta 60). */
export async function guardarRubros(lista: unknown[]): Promise<string[] | string> {
  const vistos = new Set<string>();
  const limpia: string[] = [];
  for (const x of lista) {
    const t = typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 40) : "";
    const k = t.toLowerCase();
    if (!t || vistos.has(k)) continue;
    vistos.add(k);
    limpia.push(t);
  }
  if (!limpia.length) return "Dejá al menos un rubro.";
  const value = JSON.stringify(limpia.slice(0, 60));
  await prisma.setting.upsert({ where: { key: CLAVE_RUBROS }, create: { key: CLAVE_RUBROS, value }, update: { value } });
  return limpia.slice(0, 60);
}

/** El dia de hoy en Argentina. */
export const hoyAR = (): string => diaAR(new Date().toISOString());
