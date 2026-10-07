// Wrapper del SDK de MercadoPago (Checkout Pro).
// https://www.mercadopago.com.ar/developers
//
// Variables de entorno (Railway):
//   MP_ACCESS_TOKEN   Access Token (TEST o PROD). SOLO server, es secreto.
//   SITE_URL          Base publica del sitio (default https://conesa.com.ar)
//
// Checkout Pro: creamos una "preferencia" con el pedido y redirigimos al
// cliente al init_point de MercadoPago. MP maneja tarjetas, cuotas, billetera,
// efectivo, etc. Los datos de pago nunca pasan por nuestro server.

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN ?? "";

export const MP_CONFIGURED = MP_ACCESS_TOKEN.length > 0;

// Las credenciales de prueba arrancan con "TEST-". Lo usamos para elegir el
// link de pago correcto (sandbox vs produccion).
export const MP_IS_TEST = MP_ACCESS_TOKEN.startsWith("TEST-");

export const SITE_URL = (
  process.env.SITE_URL || "https://conesa.com.ar"
).replace(/\/$/, "");

function client() {
  return new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
}

export type PrefItem = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type CreatePrefInput = {
  orderNumber: number;
  items: PrefItem[];
  payer: { name: string; surname: string; email: string };
};

export async function createPreference(
  input: CreatePrefInput,
): Promise<{ ok: boolean; initPoint?: string; preferenceId?: string; error?: string }> {
  if (!MP_CONFIGURED)
    return { ok: false, error: "MercadoPago no está configurado (falta MP_ACCESS_TOKEN)." };

  try {
    const pref = new Preference(client());
    const res = await pref.create({
      body: {
        items: input.items.map((it) => ({
          id: it.id,
          title: it.title.slice(0, 250),
          quantity: it.quantity,
          unit_price: it.unitPrice,
          currency_id: "ARS",
        })),
        external_reference: String(input.orderNumber),
        payer: {
          name: input.payer.name,
          surname: input.payer.surname,
          email: input.payer.email,
        },
        back_urls: {
          success: `${SITE_URL}/tienda/checkout/exito?orden=${input.orderNumber}`,
          pending: `${SITE_URL}/tienda/checkout/pendiente?orden=${input.orderNumber}`,
          failure: `${SITE_URL}/tienda/checkout/error?orden=${input.orderNumber}`,
        },
        auto_return: "approved",
        notification_url: `${SITE_URL}/api/mercadopago/webhook`,
        statement_descriptor: "SANITARIOS CONESA",
      },
    });

    // MercadoPago devuelve DOS links y hay que usar el que corresponde al
    // tipo de credencial:
    //   - token TEST-...  => sandbox_init_point
    //   - token productivo => init_point
    // Mandar un pago de prueba al checkout de produccion da el error
    // "Una de las partes con la que intentás hacer el pago es de prueba".
    const initPoint = MP_IS_TEST
      ? res.sandbox_init_point || res.init_point
      : res.init_point || res.sandbox_init_point;

    if (!initPoint)
      return { ok: false, error: "MercadoPago no devolvió el link de pago." };
    return { ok: true, initPoint, preferenceId: res.id };
  } catch (e) {
    return { ok: false, error: `Error al crear la preferencia: ${(e as Error).message}` };
  }
}

export type MpPaymentInfo = {
  id: string;
  status: string; // approved | pending | in_process | rejected | refunded | cancelled
  statusDetail: string;
  paymentType?: string;
  externalReference?: string;
  raw: unknown;
};

export async function getPayment(
  paymentId: string,
): Promise<{ ok: boolean; payment?: MpPaymentInfo; error?: string }> {
  if (!MP_CONFIGURED) return { ok: false, error: "MercadoPago no configurado" };
  try {
    const payment = new Payment(client());
    const p = await payment.get({ id: paymentId });
    return {
      ok: true,
      payment: {
        id: String(p.id),
        status: p.status ?? "unknown",
        statusDetail: p.status_detail ?? "",
        paymentType: p.payment_type_id ?? undefined,
        externalReference: p.external_reference ?? undefined,
        raw: p,
      },
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Config publica para el cliente (no incluye el access token).
export function publicMpConfig() {
  return { configured: MP_CONFIGURED };
}
