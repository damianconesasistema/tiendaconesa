// Wrapper del SDK de MercadoPago (Checkout Pro).
// https://www.mercadopago.com.ar/developers
//
// Variables de entorno (en /etc/conesa.env, en la maquina):
//   MP_ACCESS_TOKEN                La de siempre. Se usa de respaldo.
//   MP_ACCESS_TOKEN_TRASLASIERRA   La cuenta de Traslasierra.
//   MP_ACCESS_TOKEN_BSAS           La cuenta de Buenos Aires.
//   SITE_URL                       Base publica (default https://conesa.com.ar)
//
// CADA SUCURSAL COBRA EN SU CUENTA.
//
// Las dos tiendas las atiende el mismo servidor, asi que la clave no puede
// ser una sola. Traslasierra y Buenos Aires son dos contribuyentes
// distintos: cobrar la venta de uno en la cuenta del otro no es un detalle
// de programacion, es plata que entra a nombre de quien no vendio.
//
// La clave de cada una sale de una variable con su nombre adentro:
// MP_ACCESS_TOKEN_ mas el slug de la sucursal en mayuscula. Si esa variable
// no esta cargada se usa MP_ACCESS_TOKEN, que es la que habia antes de
// esto. Ese respaldo es a proposito: mientras no se carguen las claves por
// sucursal, la tienda que ya vende cobra exactamente como venia cobrando.
//
// Por que en el archivo de la maquina y no en la base de datos: es la llave
// de la caja. En la base la ve cualquiera que entre al panel, y queda
// escrita en cada respaldo. En /etc/conesa.env la ve solo quien entra al
// servidor.
//
// Checkout Pro: creamos una "preferencia" con el pedido y redirigimos al
// cliente al init_point de MercadoPago. MP maneja tarjetas, cuotas, billetera,
// efectivo, etc. Los datos de pago nunca pasan por nuestro server.

import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

/** Como se llama la variable de esta sucursal.
 *
 *  La arma el codigo, y el panel muestra lo que devuelve esta misma funcion:
 *  asi el nombre que se lee ahi es exactamente el que el servidor busca, y
 *  no hay forma de que uno diga BSAS y el otro BUENOSAIRES. */
export function mpNombreDeVariable(sucursal: string): string {
  return "MP_ACCESS_TOKEN_" + sucursal.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

/** Si esta sucursal tiene SU clave cargada.
 *
 *  Importa, y mucho: si no la tiene, cobra con la de respaldo, o sea en la
 *  cuenta de la otra sucursal. Todo anda, nadie ve un error, y la plata
 *  entra a nombre de quien no vendio. Por eso el panel lo avisa. */
export function mpClavePropia(sucursal?: string | null): boolean {
  if (!sucursal) return false;
  const propia = process.env[mpNombreDeVariable(sucursal)];
  return !!(propia && propia.trim());
}

/** La clave de esta sucursal, o la de siempre si no tiene una propia.
 *
 *  Se lee en cada llamada y no una sola vez al arrancar: el servidor atiende
 *  las dos tiendas al mismo tiempo, asi que no hay "la clave" del proceso. */
export function mpToken(sucursal?: string | null): string {
  if (sucursal && mpClavePropia(sucursal))
    return (process.env[mpNombreDeVariable(sucursal)] ?? "").trim();
  return (process.env.MP_ACCESS_TOKEN ?? "").trim();
}

/** Si esta sucursal puede cobrar online. */
export function mpConfigurado(sucursal?: string | null): boolean {
  return mpToken(sucursal).length > 0;
}

// Las credenciales de prueba arrancan con "TEST-". Lo usamos para elegir el
// link de pago correcto (sandbox vs produccion).
export function mpEsPrueba(sucursal?: string | null): boolean {
  return mpToken(sucursal).startsWith("TEST-");
}

export const SITE_URL = (
  process.env.SITE_URL || "https://conesa.com.ar"
).replace(/\/$/, "");

function client(sucursal?: string | null) {
  return new MercadoPagoConfig({ accessToken: mpToken(sucursal) });
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
  // "1pago" | "cuotas": el cliente ya eligio en NUESTRO checkout y el recargo
  // correspondiente ya esta sumado al total. Limitamos las cuotas en
  // MercadoPago para que no pague en mas cuotas de las que abono de recargo.
  modo?: "1pago" | "cuotas";
  cuotasMax?: number;
  // De que sucursal es la venta. Decide en que cuenta entra la plata.
  sucursal?: string | null;
  // La direccion por la que entro el cliente. Si compro en
  // buenosaires.conesa.com.ar tiene que volver ahi y no a conesa.com.ar:
  // volveria a una tienda que no es la suya, con otro carrito.
  siteUrl?: string;
};

export async function createPreference(
  input: CreatePrefInput,
): Promise<{ ok: boolean; initPoint?: string; preferenceId?: string; error?: string }> {
  if (!mpConfigurado(input.sucursal))
    return {
      ok: false,
      error: "El pago online no está configurado para esta sucursal.",
    };

  // La direccion a la que vuelve el cliente y a la que MercadoPago manda el
  // aviso: la del dominio por el que entro, no la general.
  const base = (input.siteUrl || SITE_URL).replace(/\/$/, "");

  try {
    const pref = new Preference(client(input.sucursal));
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
          success: `${base}/tienda/checkout/exito?orden=${input.orderNumber}`,
          pending: `${base}/tienda/checkout/pendiente?orden=${input.orderNumber}`,
          failure: `${base}/tienda/checkout/error?orden=${input.orderNumber}`,
        },
        auto_return: "approved",
        // El aviso lleva la sucursal pegada en la direccion. Tiene que ir
        // aca porque el aviso lo manda MercadoPago desde SUS servidores: en
        // ese pedido no viene nuestro dominio, asi que es la unica forma de
        // saber a que cuenta hay que preguntarle por el pago.
        notification_url:
          `${base}/api/mercadopago/webhook` +
          (input.sucursal
            ? `?suc=${encodeURIComponent(input.sucursal)}`
            : ""),
        // PENDIENTE: esto es lo que el cliente ve en el resumen de su
        // tarjeta, y tendria que ser el nombre del que cobra, que no es el
        // mismo en las dos sucursales. Se deja como esta hasta confirmar que
        // razon social va en cada una: cambiarlo a ojo le cambiaria el
        // resumen a los clientes de la tienda que ya vende.
        statement_descriptor: "SANITARIOS CONESA",
        // El recargo cobrado corresponde a la cantidad de pagos elegida, asi
        // que limitamos las cuotas disponibles. Si eligio 1 pago y despues
        // pudiera elegir 6 cuotas, pagariamos 26% habiendo cobrado 10%.
        // Se excluye efectivo (ticket/atm): esos no tienen este recargo.
        ...(input.modo
          ? {
              payment_methods: {
                excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
                installments:
                  input.modo === "1pago" ? 1 : (input.cuotasMax ?? 6),
                default_installments:
                  input.modo === "1pago" ? 1 : (input.cuotasMax ?? 6),
              },
            }
          : {}),
      },
    });

    // MercadoPago devuelve DOS links y hay que usar el que corresponde al
    // tipo de credencial:
    //   - token TEST-...  => sandbox_init_point
    //   - token productivo => init_point
    // Mandar un pago de prueba al checkout de produccion da el error
    // "Una de las partes con la que intentás hacer el pago es de prueba".
    const initPoint = mpEsPrueba(input.sucursal)
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
  sucursal?: string | null,
): Promise<{ ok: boolean; payment?: MpPaymentInfo; error?: string }> {
  if (!mpConfigurado(sucursal))
    return { ok: false, error: "MercadoPago no configurado" };
  try {
    const payment = new Payment(client(sucursal));
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
export function publicMpConfig(sucursal?: string | null) {
  return { configured: mpConfigurado(sucursal) };
}
