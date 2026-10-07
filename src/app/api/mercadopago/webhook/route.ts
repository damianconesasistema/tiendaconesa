// POST /api/mercadopago/webhook
// MercadoPago notifica aquí cuando hay novedades de un pago.
// Formato: query ?type=payment&data.id=XXX  (o body { type, data: { id } })
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getPayment, MP_CONFIGURED } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

async function applyPayment(paymentId: string) {
  const r = await getPayment(paymentId);
  if (!r.ok || !r.payment) return;
  const p = r.payment;

  const orderNumber = Number(p.externalReference);
  if (!Number.isFinite(orderNumber)) return;

  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    select: { id: true, paidAt: true },
  });
  if (!order) return;

  const approved = p.status === "approved";
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: "mercadopago",
      mpPaymentId: p.id,
      mpStatus: p.status,
      mpStatusDetail: p.statusDetail,
      mpPaymentType: p.paymentType,
      mpRawResponse: JSON.stringify(p.raw ?? {}),
      ...(approved && !order.paidAt
        ? { paidAt: new Date(), status: "confirmado" }
        : {}),
    },
  });
}

async function handle(req: NextRequest) {
  if (!MP_CONFIGURED) return NextResponse.json({ ok: true });

  const url = req.nextUrl;
  const type =
    url.searchParams.get("type") || url.searchParams.get("topic") || "";
  let paymentId =
    url.searchParams.get("data.id") || url.searchParams.get("id") || "";

  // Algunos avisos vienen en el body
  if (!paymentId || !type) {
    try {
      const body = (await req.json()) as {
        type?: string;
        topic?: string;
        data?: { id?: string | number };
        resource?: string;
      };
      if (body?.data?.id) paymentId = String(body.data.id);
      if (body?.resource && /\d+$/.test(body.resource))
        paymentId = body.resource.match(/\d+$/)?.[0] ?? paymentId;
    } catch {
      /* sin body */
    }
  }

  const isPayment =
    type.includes("payment") || url.searchParams.get("topic") === "payment";

  if (isPayment && paymentId) {
    try {
      await applyPayment(paymentId);
    } catch {
      /* igual respondemos 200 para que MP no reintente en loop */
    }
  }

  // Siempre 200: MP espera 200/201, sino reintenta.
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  return handle(req);
}
