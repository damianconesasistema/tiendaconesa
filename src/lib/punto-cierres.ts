import { Prisma, type PuntoCierre } from "@prisma/client";
import { prisma } from "@/lib/db";
import { cuentaCierre, limpiarBilletes, pesos, type Billetes } from "@/lib/punto-cierres-reglas";

// El cierre de la caja de efectivo (V.0.11.255). Las reglas estan en
// src/lib/punto-cierres-reglas.ts; aca se lee y se guarda.
//
// - Lo cobrado en efectivo sale de los comprobantes (PuntoDocumento): los de
//   esa sucursal con forma de pago "01-Efectivo" (datos.forma), factura,
//   Recibo X ("sin-comprobante") y nota de debito suman; la nota de credito
//   resta. Lo eliminado no cuenta; si se elimina en este tiempo algo cobrado
//   antes (se devolvio la plata), resta.
// - Los movimientos salen de las cuentas de efectivo de esa sucursal
//   (PuntoMovimiento, Gerencia parte 1): gastos, retiros, depositos.
// - Un cierre a la vez por sucursal (lock de Postgres hasta el COMMIT).

export type CierreGuardado = {
  id: string;
  sucursal: string;
  tipo: "apertura" | "cierre";
  desde: string | null;
  hasta: string;
  apertura: number;
  ventas: number;
  movimientos: number;
  esperado: number;
  contado: number;
  diferencia: number;
  retiro: number;
  destino: string;
  queda: number;
  billetes: Billetes;
  nota: string;
  usuario: string;
};

export type EstadoCaja = {
  sucursal: string;
  /** El ultimo cierre (o la apertura). null = nunca se abrio. */
  ultimo: CierreGuardado | null;
  /** Desde cuando corre la caja (el ultimo cierre). */
  desde: string | null;
  apertura: number;
  ventas: number;
  movimientos: number;
  /** Lo que tendria que haber ahora. */
  esperado: number;
  ahora: string;
};

const MAX_HISTORIAL = 60;
const texto = (v: unknown, max: number) =>
  (typeof v === "string" ? v : "").replace(/[<>]/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

function aGuardado(c: PuntoCierre): CierreGuardado {
  return {
    id: c.id,
    sucursal: c.sucursal,
    tipo: c.tipo === "apertura" ? "apertura" : "cierre",
    desde: c.desde ? c.desde.toISOString() : null,
    hasta: c.hasta.toISOString(),
    apertura: c.apertura,
    ventas: c.ventas,
    movimientos: c.movimientos,
    esperado: c.esperado,
    contado: c.contado,
    diferencia: c.diferencia,
    retiro: c.retiro,
    destino: c.destino,
    queda: c.queda,
    billetes: (c.billetes && typeof c.billetes === "object" ? c.billetes : {}) as Billetes,
    nota: c.nota,
    usuario: c.usuario,
  };
}

type Db = Prisma.TransactionClient | typeof prisma;

const TIPOS_PLATA = Prisma.sql`('factura', 'sin-comprobante', 'nota-debito', 'nota-credito')`;
const SIGNO = Prisma.sql`CASE WHEN "tipo" = 'nota-credito' THEN -"total" ELSE "total" END`;

/** Lo cobrado en efectivo y los movimientos del efectivo entre (desde, hasta]. */
async function efectivoEntre(db: Db, sucursal: string, desde: Date, hasta: Date): Promise<{ ventas: number; movimientos: number }> {
  const [cobrado] = await db.$queryRaw<{ v: number }[]>`
    SELECT COALESCE(SUM(${SIGNO}), 0)::float8 AS "v" FROM "PuntoDocumento"
     WHERE "sucursal" = ${sucursal} AND "tipo" IN ${TIPOS_PLATA}
       AND COALESCE("datos"->>'forma', '') LIKE '01-Efectivo%'
       AND "eliminadoEn" IS NULL AND "createdAt" > ${desde} AND "createdAt" <= ${hasta}`;
  // Cobrado antes y eliminado en este tiempo: la plata se devolvio.
  const [devuelto] = await db.$queryRaw<{ v: number }[]>`
    SELECT COALESCE(SUM(${SIGNO}), 0)::float8 AS "v" FROM "PuntoDocumento"
     WHERE "sucursal" = ${sucursal} AND "tipo" IN ${TIPOS_PLATA}
       AND COALESCE("datos"->>'forma', '') LIKE '01-Efectivo%'
       AND "createdAt" <= ${desde} AND "eliminadoEn" > ${desde} AND "eliminadoEn" <= ${hasta}`;
  const [movs] = await db.$queryRaw<{ v: number }[]>`
    SELECT COALESCE(SUM(m."monto"), 0)::float8 AS "v"
      FROM "PuntoMovimiento" m JOIN "PuntoCuenta" c ON c."id" = m."cuentaId"
     WHERE c."sucursal" = ${sucursal} AND c."tipo" = 'efectivo' AND m."anuladoEn" IS NULL
       AND m."fecha" > ${desde} AND m."fecha" <= ${hasta}`;
  return {
    ventas: pesos(Number(cobrado?.v ?? 0) - Number(devuelto?.v ?? 0)),
    movimientos: pesos(Number(movs?.v ?? 0)),
  };
}

async function ultimoDe(db: Db, sucursal: string): Promise<PuntoCierre | null> {
  return db.puntoCierre.findFirst({ where: { sucursal }, orderBy: [{ hasta: "desc" }, { creadoEn: "desc" }] });
}

/** Como esta la caja ahora: con cuanto abrio y cuanto tendria que haber. */
export async function estadoCaja(sucursal: string): Promise<EstadoCaja> {
  const ahora = new Date();
  const ult = await ultimoDe(prisma, sucursal);
  if (!ult)
    return { sucursal, ultimo: null, desde: null, apertura: 0, ventas: 0, movimientos: 0, esperado: 0, ahora: ahora.toISOString() };
  const { ventas, movimientos } = await efectivoEntre(prisma, sucursal, ult.hasta, ahora);
  const c = cuentaCierre({ apertura: ult.queda, ventas, movimientos, contado: 0, retiro: 0 });
  return {
    sucursal,
    ultimo: aGuardado(ult),
    desde: ult.hasta.toISOString(),
    apertura: ult.queda,
    ventas,
    movimientos,
    esperado: "error" in c ? 0 : c.esperado,
    ahora: ahora.toISOString(),
  };
}

/** Los ultimos cierres, de una sucursal o de todas (null). */
export async function listarCierres(sucursales: string[] | null): Promise<CierreGuardado[]> {
  const filas = await prisma.puntoCierre.findMany({
    where: sucursales ? { sucursal: { in: sucursales } } : {},
    orderBy: [{ hasta: "desc" }, { creadoEn: "desc" }],
    take: MAX_HISTORIAL,
  });
  return filas.map(aGuardado);
}

/** Abre la caja la primera vez, o la cierra. Lo contado y lo esperado los
 *  calcula el servidor en ese momento (no lo que mando la pantalla). */
export async function cerrarCaja(p: {
  accion: "abrir" | "cerrar";
  sucursal: string;
  idLocal: unknown;
  billetes: unknown;
  retiro: unknown;
  destino: unknown;
  nota: unknown;
  usuario: string;
}): Promise<{ cierre: CierreGuardado; repetido: boolean } | { error: string }> {
  const idLocal = typeof p.idLocal === "string" ? p.idLocal.trim() : "";
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(idLocal)) return { error: "Falta la marca del cierre: recargá la página y probá de nuevo." };
  const b = limpiarBilletes(p.billetes);
  if ("error" in b) return b;
  const retiro = p.accion === "cerrar" ? Number(p.retiro) || 0 : 0;
  return prisma.$transaction(
    async (tx) => {
      // Un cierre a la vez por sucursal: dos compus que cierran juntas no
      // cuentan la misma plata dos veces.
      await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-cierre:" + p.sucursal}))`;
      const ya = await tx.puntoCierre.findUnique({ where: { idLocal } });
      if (ya) return { cierre: aGuardado(ya), repetido: true };
      const ult = await ultimoDe(tx, p.sucursal);
      if (p.accion === "abrir" && ult) return { error: "Esa caja ya está abierta: lo que corresponde es cerrarla." };
      if (p.accion === "cerrar" && !ult) return { error: "Esa caja todavía no se abrió: primero contá con cuánto arranca." };
      const hasta = new Date();
      const plata = ult ? await efectivoEntre(tx, p.sucursal, ult.hasta, hasta) : { ventas: 0, movimientos: 0 };
      const apertura = ult ? ult.queda : b.contado;
      const c = cuentaCierre({ apertura, ventas: plata.ventas, movimientos: plata.movimientos, contado: b.contado, retiro });
      if ("error" in c) return c;
      const nuevo = await tx.puntoCierre.create({
        data: {
          idLocal,
          sucursal: p.sucursal,
          tipo: p.accion === "abrir" ? "apertura" : "cierre",
          desde: ult ? ult.hasta : null,
          hasta,
          apertura: p.accion === "abrir" ? 0 : apertura,
          ventas: plata.ventas,
          movimientos: plata.movimientos,
          esperado: p.accion === "abrir" ? b.contado : c.esperado,
          contado: b.contado,
          diferencia: p.accion === "abrir" ? 0 : c.diferencia,
          retiro,
          destino: retiro > 0 ? texto(p.destino, 120) : "",
          queda: c.queda,
          billetes: b.billetes as Prisma.InputJsonValue,
          nota: texto(p.nota, 300),
          usuario: p.usuario,
        },
      });
      return { cierre: aGuardado(nuevo), repetido: false };
    },
    { maxWait: 10_000, timeout: 20_000 },
  );
}
