// POST /api/payway/pay
//
// Recibe un pago tokenizado desde el frontend, lo procesa contra Payway
// y actualiza la Order correspondiente. El token fue generado en el
// navegador del cliente contra la API publica de Payway, por lo que los
// datos de tarjeta NUNCA pasan por nuestro server.
//
// Request body:
// {
//   orderNumber: number,       // numero legible de la orden (#1, #2, ...)
//   token: string,             // token devuelto por decidir.js
//   bin: string,               // primeros 6 digitos de la tarjeta
//   paymentMethodId: number,   // 1=Visa, 15=Master, etc.
//   installments: number,      // cuotas
//   cardBrand?: string,        // "visa" | "master" | ...
//   cardLast4?: string,
// }
//
// Response: { ok: boolean, status: string, orderNumber: number, message?: string }

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  payWithToken,
  PAYWAY_CONFIGURED,
  type PaywayPaymentResult,
} from "@/lib/payway";

type Body = {
  orderNumber?: number;
  token?: string;
  bin?: string;
  paymentMethodId?: number;
  installments?: number;
  cardBrand?: string;
  cardLast4?: string;
};

export async function POST(req: NextRequest) {
  if (!PAYWAY_CONFIGURED) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message:
          "Payway no está configurado en el servidor. Avisale al administrador.",
      },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, status: "error", message: "JSON inválido" },
      { status: 400 },
    );
  }

  const {
    orderNumber,
    token,
    bin,
    paymentMethodId,
    installments,
    cardBrand,
    cardLast4,
  } = body;

  if (
    !orderNumber ||
    !token ||
    !bin ||
    !paymentMethodId ||
    !installments
  ) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Faltan datos obligatorios para procesar el pago.",
      },
      { status: 400 },
    );
  }

  // Buscar la orden
  const order = await prisma.order.findUnique({
    where: { number: orderNumber },
    include: { customer: true },
  });

  if (!order) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Orden no encontrada.",
      },
      { status: 404 },
    );
  }

  if (order.paidAt) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Esta orden ya está pagada.",
      },
      { status: 409 },
    );
  }

  if (order.status === "cancelado") {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Esta orden fue cancelada.",
      },
      { status: 409 },
    );
  }

  // Payway espera el monto en centavos (ej: $100.00 => 10000)
  const amountCents = Math.round(order.total * 100);
  const siteTxId = `conesa_${order.number}_${Date.now()}`;

  const result: PaywayPaymentResult = await payWithToken({
    siteTransactionId: siteTxId,
    token,
    userId: order.customer.dni || order.customer.email,
    paymentMethodId,
    bin,
    amount: amountCents,
    currency: "ARS",
    installments,
    description: `Compra #${order.number} - ${order.customer.firstName} ${order.customer.lastName}`,
    paymentType: "single",
  });

  // Persistir la respuesta en la orden (siempre, para auditoria/soporte)
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: "tarjeta",
      paywayStatus: result.status,
      paywayPaymentId: result.paymentId,
      paywaySiteTxId: siteTxId,
      paywayAuthCode: result.authCode,
      paywayCardBrand: cardBrand || result.cardBrand,
      paywayCardLast4: cardLast4 || result.cardLast4,
      paywayCardInstallments: installments,
      paywayErrorCode: result.errorCode,
      paywayErrorMessage: result.errorMessage,
      paywayRawResponse: JSON.stringify(result.raw ?? {}),
      // Si aprobado, marcar pago y pasar a "confirmado"
      ...(result.ok
        ? {
            paidAt: new Date(),
            status: "confirmado",
          }
        : {}),
    },
  });

  return NextResponse.json(
    {
      ok: result.ok,
      status: result.status,
      orderNumber: order.number,
      message: result.ok
        ? "Pago aprobado"
        : result.errorMessage || "Pago rechazado",
    },
    { status: result.ok ? 200 : 402 },
  );
}
