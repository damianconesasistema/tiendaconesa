// POST /api/mercadopago/create-preference
// Body: { orderNumber: number }
// Crea una preferencia de Checkout Pro para la orden y devuelve el init_point.
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createPreference, mpConfigurado, SITE_URL } from "@/lib/mercadopago";
import { sucursalQueVende } from "@/lib/sucursal";

export async function POST(req: NextRequest) {
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
    include: { customer: true, items: true, branch: true },
  });
  if (!order)
    return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });
  if (order.paidAt)
    return NextResponse.json({ ok: false, error: "La orden ya está pagada" }, { status: 409 });

  // En que cuenta entra esta plata. Sale del pedido, que lo guardo cuando el
  // cliente lo hizo. Los pedidos anteriores a esa columna no lo tienen: para
  // esos vale la sucursal que vende, que es de donde salieron.
  const sucursal = order.branch ?? (await sucursalQueVende());

  if (!mpConfigurado(sucursal?.slug)) {
    return NextResponse.json(
      { ok: false, error: "El pago online no está habilitado todavía." },
      { status: 503 },
    );
  }

  // A donde vuelve el cliente cuando termina de pagar: al dominio por el que
  // entro. Se lee del pedido que llego, no de una variable fija, porque la
  // misma maquina atiende las dos tiendas.
  //
  // Con pinzas: el dominio viene en un encabezado y un encabezado lo puede
  // escribir cualquiera. Se acepta solo si es de casa; si no, se usa el de
  // siempre. Peor que mandar al cliente al dominio general es mandarlo a uno
  // ajeno despues de que pago.
  // Envuelto porque new URL() tira si SITE_URL viniera mal cargada, y esto
  // corre en el camino de la plata: si se cae, nadie puede pagar. Sin casa,
  // no se acepta ningun dominio del pedido y se usa el de siempre.
  let casa = "";
  try {
    casa = new URL(SITE_URL).hostname.toLowerCase();
  } catch {
    casa = "";
  }
  const pedido = (
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    ""
  )
    .toLowerCase()
    .split(":")[0];
  const host =
    casa && (pedido === casa || pedido.endsWith(`.${casa}`)) ? pedido : "";
  const proto = req.headers.get("x-forwarded-proto") ?? "https";

  const items = order.items.map((it) => ({
    id: it.productId,
    title: it.title,
    quantity: it.qty,
    unitPrice: it.price,
  }));

  // OJO: los precios de los items YA incluyen la comision segun la forma de
  // pago elegida (ver checkout/actions.ts). No hay que sumar nada aparte, o se
  // cobraria dos veces.

  // paymentMethod guarda "mp_cuotas_12" para saber el plan exacto
  const esCuotas = (order.paymentMethod ?? "").startsWith("mp_cuotas");
  const modo = esCuotas
    ? ("cuotas" as const)
    : order.paymentMethod === "mp_1pago"
      ? ("1pago" as const)
      : undefined;

  // Las cuotas que se habilitan en MercadoPago tienen que ser EXACTAMENTE
  // las que el cliente eligió: si pagó el recargo de 6 y pudiera elegir 18,
  // el costo extra lo comería el negocio.
  const cuotasDelPedido = Number(
    (order.paymentMethod ?? "").replace("mp_cuotas_", ""),
  );
  const { getRecargosMp } = await import("@/lib/settings");
  const recargos = await getRecargosMp();

  const pref = await createPreference({
    orderNumber: order.number,
    items,
    sucursal: sucursal?.slug ?? null,
    siteUrl: host ? `${proto}://${host}` : undefined,
    modo,
    cuotasMax: Number.isFinite(cuotasDelPedido) && cuotasDelPedido > 0
      ? cuotasDelPedido
      : recargos.cuotasMax,
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
