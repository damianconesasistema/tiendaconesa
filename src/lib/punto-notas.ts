import { Prisma, type PuntoNotaCliente } from "@prisma/client";
import { prisma } from "@/lib/db";
import { type EstadoNota, type NotaCliente, type PedidoNota } from "@/lib/punto-notas-reglas";

// Lo que piden los clientes y no tenemos, en la base (migracion 61,
// V.0.11.260). Las reglas (que se acepta, como se agrupa) estan en
// src/lib/punto-notas-reglas.ts.
// - La misma nota repetida (doble clic, corte) no se guarda dos veces: el
//   idLocal es unico y, si ya esta, se devuelve la guardada.
// - Nada se borra: se marca pedida o descartada.

const notaDe = (n: PuntoNotaCliente): NotaCliente => ({
  id: n.id,
  texto: n.texto,
  porVoz: n.porVoz,
  cantidad: n.cantidad,
  cliente: n.cliente,
  sucursal: n.sucursal,
  usuario: n.usuario,
  creadoEn: n.creadoEn.toISOString(),
  estado: n.estado as EstadoNota,
  resueltoEn: n.resueltoEn ? n.resueltoEn.toISOString() : null,
  resueltoPor: n.resueltoPor,
  motivo: n.motivo,
});

const deSucursales = (sucursales: readonly string[] | null): Prisma.PuntoNotaClienteWhereInput =>
  sucursales ? { sucursal: { in: [...sucursales] } } : {};

export async function anotarNota(p: PedidoNota, quien: string): Promise<{ nota: NotaCliente; yaEstaba: boolean }> {
  const ya = await prisma.puntoNotaCliente.findUnique({ where: { idLocal: p.idLocal } });
  if (ya) return { nota: notaDe(ya), yaEstaba: true };
  try {
    const n = await prisma.puntoNotaCliente.create({
      data: { idLocal: p.idLocal, texto: p.texto, porVoz: p.porVoz, cantidad: p.cantidad, cliente: p.cliente, sucursal: p.sucursal, usuario: quien },
    });
    return { nota: notaDe(n), yaEstaba: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const otra = await prisma.puntoNotaCliente.findUnique({ where: { idLocal: p.idLocal } });
      if (otra) return { nota: notaDe(otra), yaEstaba: true };
    }
    throw e;
  }
}

export const TOPE_NOTAS = 3000;

/** Todo lo que no se resolvio y lo resuelto en los ultimos `dias`. */
export async function listarNotas(f: { sucursales: readonly string[] | null; dias: number }): Promise<NotaCliente[]> {
  const desde = new Date(Date.now() - f.dias * 24 * 60 * 60 * 1000);
  const filas = await prisma.puntoNotaCliente.findMany({
    where: { ...deSucursales(f.sucursales), OR: [{ estado: "nueva" }, { resueltoEn: { gte: desde } }] },
    orderBy: { creadoEn: "desc" },
    take: TOPE_NOTAS,
  });
  return filas.map(notaDe);
}

/** Cuantas sin resolver, para el aviso de arriba. */
export async function contarNuevas(sucursales: readonly string[] | null): Promise<{ nuevas: number; ultima: string | null }> {
  const where = { estado: "nueva", ...deSucursales(sucursales) };
  const [nuevas, ultima] = await Promise.all([
    prisma.puntoNotaCliente.count({ where }),
    prisma.puntoNotaCliente.findFirst({ where, orderBy: { creadoEn: "desc" }, select: { creadoEn: true } }),
  ]);
  return { nuevas, ultima: ultima ? ultima.creadoEn.toISOString() : null };
}

/** Marca varias notas como pedidas, descartadas o de vuelta nuevas. */
export async function resolverNotas(
  ids: string[],
  estado: EstadoNota,
  motivo: string,
  quien: string,
  sucursales: readonly string[] | null,
): Promise<number> {
  const r = await prisma.puntoNotaCliente.updateMany({
    where: { id: { in: ids }, ...deSucursales(sucursales) },
    data:
      estado === "nueva"
        ? { estado, resueltoEn: null, resueltoPor: null, motivo: "" }
        : { estado, resueltoEn: new Date(), resueltoPor: quien, motivo },
  });
  return r.count;
}
