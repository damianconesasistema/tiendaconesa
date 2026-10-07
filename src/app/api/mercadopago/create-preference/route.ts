// POST /api/mercadopago/create-preference
// Body: { orderNumber: number }
// Crea una preferencia de Checkout Pro para la orden y devuelve el init_point.
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createPreference, MP_CONFIGURED } from "@/lib/mercadopago";

export async function POST(req: NextRequest) {
  if (!MP_CONFIGURED) {
    return NextResponse.json(
      { ok: false, error: "El pago online no está habilitado todavía." },
      { status: 503 },
    );
  }

  let body: { orderNumber?: number };
  try {
    body = (await req.json()) as { orderNumber?: number };
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!body.orderNumber)
    return NextResponse.json(
      { ok: false, error: "Falta el número de orden" },
      { status: 400 },
    );

  const order = await prisma.order.findUnique({
    where: { number: body.orderNumber },
    include: { customer: true, items: true },
  });
  if (!order)
    return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });
  if (order.paidAt)
    return NextResponse.json({ ok: false, error: "La orden ya está pagada" }, { status: 409 });

  const items = order.items.map((it) => ({
    id: it.productId,
    title: it.title,
    quantity: it.qty,
    unitPrice: it.price,
  }));

  // OJO: los precios de los items YA incluyen la comision segun la forma de
  // pago elegida (ver checkout/actions.ts). No hay que sumar nada aparte, o se
  // cobraria dos veces.

  const modo =
    order.paymentMethod === "mp_cuotas"
      ? ("cuotas" as const)
      : order.paymentMethod === "mp_1pago"
        ? ("1pago" as const)
        : undefined;

  const { getRecargosMp } = await import("@/lib/settings");
  const recargos = await getRecargosMp();

  const pref = await createPreference({
    orderNumber: order.number,
    items,
    modo,
    cuotasMax: recargos.cuotasMax,
    payer: {
      name: order.customer.firstName,
      surname: order.customer.lastName,
      email: order.customer.email,
    },
  });

  if (!pref.ok || !pref.initPoint) {
    return NextResponse.json(
      { ok: false, error: pref.error ?? "No se pudo crear el pago" },
      { status: 502 },
    );
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: "mercadopago",
      mpPreferenceId: pref.preferenceId,
    },
  });

  return NextResponse.json({ ok: true, initPoint: pref.initPoint });
}
