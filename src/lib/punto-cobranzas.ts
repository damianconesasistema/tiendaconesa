import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { siguienteRecibo } from "@/lib/punto-documentos";
import type { Cuenta } from "@/lib/punto-cuentas-reglas";
import {
  type CobranzaArmada,
  type FormaCobro,
  type Imputacion,
  type PedidoCobranza,
  type Pendiente,
  armarCobranza,
  calcularDeudas,
  detalleCobranza,
  docCCDe,
  TIPOS_DEUDA,
  TIPOS_NOTA,
} from "@/lib/punto-cobranzas-reglas";

// La cuenta corriente de los clientes y sus cobranzas en la base (migracion
// 63, V.0.11.289). Las reglas (que se debe, que se acepta) estan en
// src/lib/punto-cobranzas-reglas.ts; aca solo se lee y se escribe.
//
// - Lo que se debe se calcula cada vez desde los comprobantes (forma de pago
//   cuenta corriente) y las cobranzas no anuladas: no hay un saldo guardado
//   que se pueda desfasar.
// - Cobrar es una sola transaccion: el recibo con su numero, la cobranza y
//   el movimiento en la cuenta. O se guarda todo o nada.
// - El mismo pedido repetido (doble clic, corte) devuelve lo ya guardado.
// - Nada se borra: anular marca la cobranza y su movimiento.

export type Cobranza = {
  id: string;
  idLocal: string;
  numero: number;
  sucursal: string;
  dia: string;
  creadoEn: string;
  usuario: string;
  clienteId: string;
  cliente: string;
  clienteDoc: string;
  forma: FormaCobro;
  cuentaId: string | null;
  cuentaNombre: string;
  operacion: string;
  nota: string;
  monto: number;
  imputaciones: Imputacion[];
  anulado: boolean;
  anuladoEn: string | null;
  anuladoPor: string | null;
  motivo: string | null;
  /** V.0.11.292: el comprobante de pago adjunto (el archivo va aparte). */
  adjuntoTipo: string | null;
  adjuntoNombre: string | null;
  adjuntoEn: string | null;
  adjuntoPor: string | null;
};

/** Todo menos el archivo adjunto: las listas no lo leen. */
const CAMPOS = {
  id: true, idLocal: true, numero: true, sucursal: true, dia: true, creadoEn: true, usuario: true, clienteId: true, cliente: true,
  clienteDoc: true, forma: true, cuentaId: true, cuentaNombre: true, operacion: true, nota: true, monto: true, imputaciones: true,
  anuladoEn: true, anuladoPor: true, motivo: true, adjuntoTipo: true, adjuntoNombre: true, adjuntoEn: true, adjuntoPor: true,
} as const;
type FilaCobranza = Prisma.PuntoCobranzaGetPayload<{ select: typeof CAMPOS }>;

const imputacionesDe = (x: Prisma.JsonValue): Imputacion[] =>
  Array.isArray(x)
    ? x
        .filter((i): i is Prisma.JsonObject => !!i && typeof i === "object" && !Array.isArray(i))
        .map((i) => ({ docId: String(i.docId ?? ""), nro: String(i.nro ?? ""), monto: Number(i.monto) || 0 }))
    : [];

const cobranzaDe = (c: FilaCobranza): Cobranza => ({
  id: c.id,
  idLocal: c.idLocal,
  numero: c.numero,
  sucursal: c.sucursal,
  dia: c.dia,
  creadoEn: c.creadoEn.toISOString(),
  usuario: c.usuario,
  clienteId: c.clienteId,
  cliente: c.cliente,
  clienteDoc: c.clienteDoc,
  forma: c.forma as FormaCobro,
  cuentaId: c.cuentaId,
  cuentaNombre: c.cuentaNombre,
  operacion: c.operacion,
  nota: c.nota,
  monto: c.monto,
  imputaciones: imputacionesDe(c.imputaciones),
  anulado: c.anuladoEn != null,
  anuladoEn: c.anuladoEn ? c.anuladoEn.toISOString() : null,
  anuladoPor: c.anuladoPor,
  motivo: c.motivo,
  adjuntoTipo: c.adjuntoTipo,
  adjuntoNombre: c.adjuntoNombre,
  adjuntoEn: c.adjuntoEn ? c.adjuntoEn.toISOString() : null,
  adjuntoPor: c.adjuntoPor,
});

type Cliente = Prisma.TransactionClient | typeof prisma;

/** Todo lo que se vendio en cuenta corriente (sin eliminados) y lo que ya se
 *  cobro: cuanto debe cada venta. */
export async function deudasCC(db: Cliente = prisma): Promise<Pendiente[]> {
  const tipos = [...TIPOS_DEUDA, ...TIPOS_NOTA];
  const filas = await db.$queryRaw<
    {
      id: string;
      tipo: string;
      letra: string | null;
      pv: string;
      numero: number | null;
      pedido: number;
      sucursal: string;
      createdAt: Date;
      total: number;
      cliente: string;
      datos: Prisma.JsonValue;
    }[]
  >`
    SELECT "id", "tipo", "letra", "pv", "numero", "pedido", "sucursal", "createdAt", "total", "cliente",
           jsonb_build_object(
             'cliente', "datos"->'cliente',
             'forma', "datos"->'forma',
             'facturaId', "datos"->'facturaId'
           ) AS "datos"
      FROM "PuntoDocumento"
     WHERE "eliminadoEn" IS NULL
       AND "tipo" = ANY(${tipos}::text[])
       AND ("datos"->>'forma' LIKE '08%' OR "datos"->>'forma' ILIKE '%cuenta corriente%')
       -- V.0.11.302: la factura de un pedido no es otra deuda: se debe el pedido.
       AND "datos"->'dePedido' IS NULL`;
  const docs = filas.map((f) =>
    docCCDe({ ...f, numero: f.numero == null ? null : Number(f.numero), pedido: Number(f.pedido), total: Number(f.total), createdAt: f.createdAt.toISOString() }),
  );
  const cobs = await db.puntoCobranza.findMany({ where: { anuladoEn: null }, select: { imputaciones: true } });
  return calcularDeudas(
    docs.filter((d) => TIPOS_DEUDA.includes(d.tipo)),
    docs.filter((d) => TIPOS_NOTA.includes(d.tipo)),
    cobs.map((c) => ({ imputaciones: imputacionesDe(c.imputaciones), anulado: false })),
  );
}

export const TOPE_COBRANZAS = 300;

/** Las cobranzas de un cliente (por su id o su CUIT o DNI), o las de los
 *  ultimos dias. La mas nueva primero. */
export async function listarCobranzas(f: { clienteId?: string; clienteDoc?: string; dias?: number }): Promise<Cobranza[]> {
  const o: Prisma.PuntoCobranzaWhereInput[] = [];
  if (f.clienteId) o.push({ clienteId: f.clienteId });
  if (f.clienteDoc && f.clienteDoc.length >= 7) o.push({ clienteDoc: f.clienteDoc });
  const where: Prisma.PuntoCobranzaWhereInput = o.length
    ? { OR: o }
    : { creadoEn: { gte: new Date(Date.now() - Math.max(1, f.dias ?? 30) * 86_400_000) } };
  const filas = await prisma.puntoCobranza.findMany({ where, orderBy: { creadoEn: "desc" }, take: TOPE_COBRANZAS, select: CAMPOS });
  return filas.map(cobranzaDe);
}

export async function cobranzaPorId(id: string): Promise<Cobranza | null> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  const c = await prisma.puntoCobranza.findUnique({ where: { id }, select: CAMPOS });
  return c ? cobranzaDe(c) : null;
}

/** V.0.11.292: guarda (o cambia) el comprobante de pago de una cobranza. */
export async function guardarAdjunto(
  id: string,
  a: { tipo: string; nombre: string; datos: Buffer },
  quien: string,
): Promise<Cobranza | string> {
  const r = await prisma.puntoCobranza.updateMany({
    where: { id },
    data: { adjunto: a.datos, adjuntoTipo: a.tipo, adjuntoNombre: a.nombre, adjuntoEn: new Date(), adjuntoPor: quien },
  });
  if (r.count !== 1) return "Esa cobranza ya no está.";
  return (await cobranzaPorId(id)) ?? "Esa cobranza ya no está.";
}

/** El archivo adjunto, para verlo. */
export async function adjuntoDe(id: string): Promise<{ tipo: string; nombre: string; datos: Buffer; sucursal: string } | null> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  const c = await prisma.puntoCobranza.findUnique({
    where: { id },
    select: { adjunto: true, adjuntoTipo: true, adjuntoNombre: true, sucursal: true },
  });
  if (!c || !c.adjunto || !c.adjuntoTipo) return null;
  return { tipo: c.adjuntoTipo, nombre: c.adjuntoNombre || "comprobante", datos: Buffer.from(c.adjunto), sucursal: c.sucursal };
}

class NoSePudo extends Error {}

const mismoCobro = (c: Cobranza, p: PedidoCobranza): boolean =>
  c.imputaciones.length === p.imputaciones.length &&
  p.imputaciones.every((i) => c.imputaciones.some((x) => x.docId === i.docId && Math.round(x.monto * 100) === Math.round(i.monto * 100)));

/** Cobra: el recibo, la cobranza y la "cobranza" en la cuenta, todo junto.
 *  `ve` deja solo lo que ese usuario puede cobrar (sus razones sociales, el
 *  Recibo X). Lo vuelve a revisar adentro de la transaccion, con lo que se
 *  debe en ese momento. */
export async function cobrar(
  p: PedidoCobranza,
  cuenta: Cuenta | null,
  quien: string,
  hoy: string,
  ve: (x: readonly Pendiente[]) => Pendiente[],
): Promise<{ cobranza: Cobranza; yaEstaba: boolean } | string> {
  const otro = "Ese cobro ya se había guardado con otros datos: cerrá la ventana y cobralo de nuevo.";
  const antes = await prisma.puntoCobranza.findUnique({ where: { idLocal: p.idLocal }, select: CAMPOS });
  if (antes) return mismoCobro(cobranzaDe(antes), p) ? { cobranza: cobranzaDe(antes), yaEstaba: true } : otro;
  const previo = armarCobranza(p, ve(await deudasCC()));
  if (typeof previo === "string") return previo;
  const dia = p.dia ?? hoy;
  // Con otro dia, el movimiento va al mediodia de ese dia en Argentina.
  const fecha = p.dia ? new Date(p.dia + "T15:00:00Z") : new Date();
  try {
    const fila = await prisma.$transaction(
      async (tx) => {
        // El numero primero: deja en fila a otro cobro de la misma razon social.
        const numero = await siguienteRecibo(tx, previo.sucursal);
        const a: CobranzaArmada | string = armarCobranza(p, ve(await deudasCC(tx)));
        if (typeof a === "string") throw new NoSePudo(a);
        if (a.sucursal !== previo.sucursal) throw new NoSePudo("Cambió lo que se debe mientras cobrabas: recargá la ventana.");
        const c = await tx.puntoCobranza.create({
          select: CAMPOS,
          data: {
            idLocal: p.idLocal,
            sucursal: a.sucursal,
            numero,
            dia,
            usuario: quien,
            clienteId: a.clienteId,
            cliente: a.cliente,
            clienteDoc: a.clienteDoc,
            forma: p.forma,
            cuentaId: cuenta?.id ?? null,
            cuentaNombre: cuenta ? cuenta.nombre : "",
            operacion: p.operacion,
            nota: p.nota,
            monto: a.monto,
            imputaciones: a.imputaciones as unknown as Prisma.InputJsonValue,
          },
        });
        if (cuenta)
          await tx.puntoMovimiento.create({
            data: {
              idLocal: p.idLocal,
              grupo: p.idLocal,
              fecha,
              usuario: quien,
              sucursal: cuenta.sucursal,
              tipo: "cobranza",
              cuentaId: cuenta.id,
              monto: a.monto,
              detalle: detalleCobranza(a, numero, p.forma, p.operacion),
            },
          });
        return c;
      },
      { maxWait: 15_000, timeout: 60_000 },
    );
    return { cobranza: cobranzaDe(fila), yaEstaba: false };
  } catch (e) {
    if (e instanceof NoSePudo) return e.message;
    // El mismo pedido a la vez: el segundo choca con el unico y devuelve lo del primero.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const ya = await prisma.puntoCobranza.findUnique({ where: { idLocal: p.idLocal }, select: CAMPOS });
      if (ya) return mismoCobro(cobranzaDe(ya), p) ? { cobranza: cobranzaDe(ya), yaEstaba: true } : otro;
    }
    throw e;
  }
}

/** Anula la cobranza (vuelve a deberse) y su movimiento en la cuenta. Si ya
 *  estaba anulada, la devuelve igual. */
export async function anularCobranza(id: string, quien: string, motivo: string): Promise<Cobranza | string> {
  const c = await prisma.puntoCobranza.findUnique({ where: { id }, select: CAMPOS });
  if (!c) return "Esa cobranza ya no está.";
  if (c.anuladoEn) return cobranzaDe(c);
  const ahora = new Date();
  await prisma.$transaction([
    prisma.puntoCobranza.updateMany({ where: { id, anuladoEn: null }, data: { anuladoEn: ahora, anuladoPor: quien, motivo } }),
    prisma.puntoMovimiento.updateMany({
      where: { grupo: c.idLocal, anuladoEn: null },
      data: { anuladoEn: ahora, anuladoPor: quien, motivo: ("Se anuló la cobranza: " + motivo).slice(0, 200) },
    }),
  ]);
  const ahoraC = await prisma.puntoCobranza.findUniqueOrThrow({ where: { id }, select: CAMPOS });
  return cobranzaDe(ahoraC);
}
