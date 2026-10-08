// GET /api/admin/pedidos/nuevos?desde=<ISO>
//
// Devuelve los pedidos creados DESPUÉS de esa fecha. Lo usa el panel para
// avisar cuando entra una venta sin tener que recargar la página.
//
// Si no viene `desde`, solo informa cuál es el último pedido: sirve para que
// el panel fije el punto de partida sin disparar una alerta de entrada.
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const desdeRaw = req.nextUrl.searchParams.get("desde");
  const desde = desdeRaw ? new Date(desdeRaw) : null;
  const desdeValido = desde && !Number.isNaN(desde.getTime()) ? desde : null;

  const ultimo = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (!desdeValido) {
    return NextResponse.json({
      ok: true,
      nuevos: [],
      ultimaFecha: ultimo?.createdAt.toISOString() ?? null,
    });
  }

  const nuevos = await prisma.order.findMany({
    where: { createdAt: { gt: desdeValido } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      number: true,
      total: true,
      createdAt: true,
      paymentMethod: true,
      customer: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({
    ok: true,
    nuevos: nuevos.map((o) => ({
      number: o.number,
      total: o.total,
      cliente: `${o.customer.firstName} ${o.customer.lastName}`.trim(),
      pago: o.paymentMethod ?? "",
      fecha: o.createdAt.toISOString(),
    })),
    ultimaFecha: ultimo?.createdAt.toISOString() ?? null,
  });
}
