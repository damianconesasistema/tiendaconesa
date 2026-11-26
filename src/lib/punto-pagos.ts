import { Prisma, type PuntoPago } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Cuenta } from "@/lib/punto-cuentas-reglas";
import {
  type CambioPago,
  type EstadoPago,
  type FormaPago,
  type Pago,
  type PedidoPagar,
  type PedidoPago,
  aCentavos,
  armarCuotas,
  detalleMovimiento,
  hoyAR,
  pesosTxt,
  restoDe,
} from "@/lib/punto-pagos-reglas";

// La agenda de pagos a proveedores en la base (migracion 60, V.0.11.257).
// Las reglas (que se acepta, las cuotas, que vence) estan en
// src/lib/punto-pagos-reglas.ts; aca solo se lee y se escribe.
//
// - La misma carga repetida (doble clic, corte) no se guarda dos veces: el
//   grupo con la cuota es unico, y si ya esta se devuelve lo guardado.
// - Cambiar, pagar y anular piden la version que se vio: si otro lo toco en el
//   medio, no se pisa (se avisa que recargue).
// - Pagar es una sola transaccion: el pago queda pagado, el movimiento entra
//   en la cuenta y, si se pago menos, el resto queda pendiente. O todo o nada.
// - Nada se borra: anular marca; deshacer un pago anula su movimiento.

const pagoDe = (p: PuntoPago): Pago => ({
  id: p.id,
  grupo: p.grupo,
  cuota: p.cuota,
  cuotas: p.cuotas,
  proveedorId: p.proveedorId,
  proveedor: p.proveedor,
  sucursal: p.sucursal,
  concepto: p.concepto,
  monto: p.monto,
  vence: p.vence,
  forma: p.forma as FormaPago,
  avisar: p.avisar,
  nota: p.nota,
  estado: p.estado as EstadoPago,
  version: p.version,
  creadoPor: p.creadoPor,
  creadoEn: p.creadoEn.toISOString(),
  pagadoDia: p.pagadoDia,
  pagadoPor: p.pagadoPor,
  montoPagado: p.montoPagado,
  cuentaId: p.cuentaId,
  marcaPago: p.marcaPago,
  anuladoPor: p.anuladoPor,
  motivo: p.motivo,
});

/** Si el usuario tiene sucursales fijas, solo las de esas razones sociales. */
const deSucursales = (sucursales: readonly string[] | null): Prisma.PuntoPagoWhereInput =>
  sucursales ? { sucursal: { in: [...sucursales] } } : {};

export const TOPE_PENDIENTES = 3000;
export const TOPE_CERRADOS = 1000;

/** Lo pendiente (todo) y lo pagado o anulado en los ultimos `dias`. */
export async function listarPagos(f: { sucursales: readonly string[] | null; dias: number }): Promise<{ pagos: Pago[]; truncado: boolean }> {
  const desde = new Date(Date.now() - f.dias * 24 * 60 * 60 * 1000);
  const [pend, cerr] = await Promise.all([
    prisma.puntoPago.findMany({
      where: { estado: "pendiente", ...deSucursales(f.sucursales) },
      orderBy: [{ vence: "asc" }, { creadoEn: "asc" }],
      take: TOPE_PENDIENTES + 1,
    }),
    prisma.puntoPago.findMany({
      where: { estado: { in: ["pagado", "anulado"] }, actualizadoEn: { gte: desde }, ...deSucursales(f.sucursales) },
      orderBy: { actualizadoEn: "desc" },
      take: TOPE_CERRADOS + 1,
    }),
  ]);
  const truncado = pend.length > TOPE_PENDIENTES || cerr.length > TOPE_CERRADOS;
  return { pagos: [...pend.slice(0, TOPE_PENDIENTES), ...cerr.slice(0, TOPE_CERRADOS)].map(pagoDe), truncado };
}

/** Lo pendiente, solo lo que hace falta para el aviso. */
export async function pendientesParaAviso(sucursales: readonly string[] | null) {
  return prisma.puntoPago.findMany({
    where: { estado: "pendiente", ...deSucursales(sucursales) },
    // V.0.11.284: con el proveedor, para nombrarlo en el aviso.
    select: { estado: true, vence: true, avisar: true, monto: true, proveedor: true },
  }) as Promise<{ estado: EstadoPago; vence: string; avisar: number; monto: number; proveedor: string }[]>;
}

export async function pagoPorId(id: string): Promise<Pago | null> {
  const p = await prisma.puntoPago.findUnique({ where: { id } });
  return p ? pagoDe(p) : null;
}

/** Guarda la carga (una fila por cuota). La misma carga otra vez devuelve lo
 *  que ya estaba. */
export async function cargarPagos(p: PedidoPago, quien: string): Promise<{ pagos: Pago[]; yaEstaba: boolean } | string> {
  const yaEstaban = async () =>
    (await prisma.puntoPago.findMany({ where: { grupo: p.idLocal }, orderBy: { cuota: "asc" } })).map(pagoDe);
  const mismo = (ya: Pago[]) =>
    ya.length === p.cuotas && ya[0].proveedor === p.proveedor && ya.reduce((s, x) => s + aCentavos(x.monto), 0) === aCentavos(p.monto);
  const otro = "Ese pago ya se había guardado con otros datos: cerrá el formulario y cargalo de nuevo.";
  const antes = await yaEstaban();
  if (antes.length) return mismo(antes) ? { pagos: antes, yaEstaba: true } : otro;
  try {
    const filas = await prisma.$transaction(
      armarCuotas(p).map((c) =>
        prisma.puntoPago.create({
          data: {
            grupo: p.idLocal,
            cuota: c.cuota,
            cuotas: p.cuotas,
            proveedorId: p.proveedorId,
            proveedor: p.proveedor,
            sucursal: p.sucursal,
            concepto: p.concepto,
            monto: c.monto,
            vence: c.vence,
            forma: p.forma,
            avisar: p.avisar,
            nota: p.nota,
            creadoPor: quien,
          },
        }),
      ),
    );
    return { pagos: filas.map(pagoDe), yaEstaba: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const ya = await yaEstaban();
      if (ya.length) return mismo(ya) ? { pagos: ya, yaEstaba: true } : otro;
    }
    throw e;
  }
}

/** Por que no se pudo tocar (lo cambio otro, ya se pago...). */
async function porQueNo(id: string, quiere: "pendiente" | "pagado"): Promise<string> {
  const p = await prisma.puntoPago.findUnique({ where: { id }, select: { estado: true } });
  if (!p) return "Ese pago ya no está.";
  if (p.estado !== quiere)
    return p.estado === "pagado" ? "Ese pago ya figura pagado: recargá la agenda." :
      p.estado === "anulado" ? "Ese pago está anulado: recargá la agenda." : "Ese pago ya no figura pagado: recargá la agenda.";
  return "Ese pago lo cambió otro mientras lo mirabas: recargá la agenda y fijate.";
}

/** Cambia uno pendiente (fecha, monto, a quien...). */
export async function cambiarPago(c: CambioPago): Promise<Pago | string> {
  const r = await prisma.puntoPago.updateMany({
    where: { id: c.id, estado: "pendiente", version: c.version },
    data: {
      proveedorId: c.proveedorId,
      proveedor: c.proveedor,
      sucursal: c.sucursal,
      concepto: c.concepto,
      monto: c.monto,
      vence: c.vence,
      forma: c.forma,
      avisar: c.avisar,
      nota: c.nota,
      version: { increment: 1 },
    },
  });
  if (r.count !== 1) return porQueNo(c.id, "pendiente");
  return (await pagoPorId(c.id)) ?? "Ese pago ya no está.";
}

/** Anula uno pendiente (no se paga). */
export async function anularPago(id: string, version: number, quien: string, motivo: string): Promise<Pago | string> {
  const r = await prisma.puntoPago.updateMany({
    where: { id, estado: "pendiente", version },
    data: { estado: "anulado", anuladoEn: new Date(), anuladoPor: quien, motivo, version: { increment: 1 } },
  });
  if (r.count !== 1) return porQueNo(id, "pendiente");
  return (await pagoPorId(id)) ?? "Ese pago ya no está.";
}

class NoSePudo extends Error {}

/** Lo marca pagado: el movimiento en la cuenta (si se eligio una) y, si se
 *  pago menos, el resto pendiente con el mismo vencimiento. El mismo pedido
 *  otra vez devuelve lo que ya estaba. */
export async function pagarPago(
  pp: PedidoPagar,
  cuenta: Cuenta | null,
  quien: string,
): Promise<{ pago: Pago; resto: Pago | null; yaEstaba: boolean } | string> {
  const antes = await prisma.puntoPago.findUnique({ where: { id: pp.id } });
  if (!antes) return "Ese pago ya no está.";
  const grupoResto = "r-" + pp.idLocal;
  if (antes.estado === "pagado" && antes.marcaPago === pp.idLocal) {
    const resto = await prisma.puntoPago.findFirst({ where: { grupo: grupoResto } });
    return { pago: pagoDe(antes), resto: resto ? pagoDe(resto) : null, yaEstaba: true };
  }
  const hoy = hoyAR();
  const dia = pp.dia ?? hoy;
  // Con otro dia, el movimiento va al mediodia de ese dia en Argentina.
  const fecha = pp.dia ? new Date(pp.dia + "T15:00:00Z") : new Date();
  const resto = restoDe(antes.monto, pp.monto);
  try {
    return await prisma.$transaction(async (tx) => {
      const r = await tx.puntoPago.updateMany({
        where: { id: pp.id, estado: "pendiente", version: pp.version },
        data: {
          estado: "pagado",
          pagadoDia: dia,
          pagadoEn: new Date(),
          pagadoPor: quien,
          montoPagado: pp.monto,
          cuentaId: cuenta?.id ?? null,
          marcaPago: pp.idLocal,
          version: { increment: 1 },
        },
      });
      if (r.count !== 1) throw new NoSePudo(await porQueNo(pp.id, "pendiente"));
      if (cuenta)
        await tx.puntoMovimiento.create({
          data: {
            idLocal: pp.idLocal,
            grupo: pp.idLocal,
            fecha,
            usuario: quien,
            sucursal: cuenta.sucursal,
            tipo: "pago-proveedor",
            cuentaId: cuenta.id,
            monto: -pp.monto,
            detalle: detalleMovimiento(antes, pp.detalle),
          },
        });
      let nuevo: PuntoPago | null = null;
      if (resto > 0)
        nuevo = await tx.puntoPago.create({
          data: {
            grupo: grupoResto,
            cuota: antes.cuota,
            cuotas: antes.cuotas,
            proveedorId: antes.proveedorId,
            proveedor: antes.proveedor,
            sucursal: antes.sucursal,
            concepto: antes.concepto,
            monto: resto,
            vence: antes.vence,
            forma: antes.forma,
            avisar: antes.avisar,
            nota: (`Resto: de ${pesosTxt(antes.monto)} se pagaron ${pesosTxt(pp.monto)} el ${dia.split("-").reverse().join("/")}. ` + antes.nota).slice(0, 300),
            creadoPor: quien,
          },
        });
      const ahora = await tx.puntoPago.findUniqueOrThrow({ where: { id: pp.id } });
      return { pago: pagoDe(ahora), resto: nuevo ? pagoDe(nuevo) : null, yaEstaba: false };
    });
  } catch (e) {
    if (e instanceof NoSePudo) return e.message;
    // El mismo pedido a la vez: el segundo choca y devuelve lo del primero.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const ya = await prisma.puntoPago.findUnique({ where: { id: pp.id } });
      if (ya && ya.estado === "pagado" && ya.marcaPago === pp.idLocal) {
        const r2 = await prisma.puntoPago.findFirst({ where: { grupo: grupoResto } });
        return { pago: pagoDe(ya), resto: r2 ? pagoDe(r2) : null, yaEstaba: true };
      }
    }
    throw e;
  }
}

/** Vuelve a pendiente uno pagado: anula su movimiento en la cuenta y el resto
 *  que habia quedado (si no se pago todavia). */
export async function deshacerPago(id: string, version: number, quien: string, motivo: string): Promise<Pago | string> {
  const antes = await prisma.puntoPago.findUnique({ where: { id } });
  if (!antes) return "Ese pago ya no está.";
  if (antes.estado !== "pagado") return "Ese pago no figura pagado: recargá la agenda.";
  const marca = antes.marcaPago;
  try {
    return await prisma.$transaction(async (tx) => {
      if (marca) {
        const resto = await tx.puntoPago.findFirst({ where: { grupo: "r-" + marca } });
        if (resto && resto.estado === "pagado")
          throw new NoSePudo("Lo que quedaba de este pago ya se pagó: deshacé primero ese pago.");
        if (resto && resto.estado === "pendiente")
          await tx.puntoPago.update({
            where: { id: resto.id },
            data: { estado: "anulado", anuladoEn: new Date(), anuladoPor: quien, motivo: "Se deshizo el pago del que era el resto.", version: { increment: 1 } },
          });
        await tx.puntoMovimiento.updateMany({
          where: { grupo: marca, anuladoEn: null },
          data: { anuladoEn: new Date(), anuladoPor: quien, motivo: ("Se deshizo el pago a proveedor: " + motivo).slice(0, 200) },
        });
      }
      const r = await tx.puntoPago.updateMany({
        where: { id, estado: "pagado", version },
        data: {
          estado: "pendiente",
          pagadoDia: null,
          pagadoEn: null,
          pagadoPor: null,
          montoPagado: null,
          cuentaId: null,
          marcaPago: null,
          version: { increment: 1 },
        },
      });
      if (r.count !== 1) throw new NoSePudo(await porQueNo(id, "pagado"));
      return pagoDe(await tx.puntoPago.findUniqueOrThrow({ where: { id } }));
    });
  } catch (e) {
    if (e instanceof NoSePudo) return e.message;
    throw e;
  }
}
