// Wrapper del SDK Node de Payway (Decidir Plus).
// Repo oficial: https://github.com/payway-ar/sdk-node-ventaonline
//
// CONFIGURACION (variables de entorno en Railway):
//   PAYWAY_ENV            "developer" (sandbox) | "production"
//   PAYWAY_PUBLIC_KEY     Public key (para frontend, tokenizacion)
//   PAYWAY_PRIVATE_KEY    Private key (para backend, SOLO server)
//   PAYWAY_COMPANY        Nombre comercial (default: Sanitarios Conesa)
//   PAYWAY_USER           User tecnico (default: sistema)
//
// Para pruebas, las credenciales de SANDBOX figuran en los README
// publicos de los SDKs oficiales de Payway. NO se incluyen en el
// codigo fuente — se cargan via variables de entorno.

export const PAYWAY_ENV =
  (process.env.PAYWAY_ENV as "developer" | "production") || "developer";

export const PAYWAY_PUBLIC_KEY = process.env.PAYWAY_PUBLIC_KEY ?? "";
const PAYWAY_PRIVATE_KEY = process.env.PAYWAY_PRIVATE_KEY ?? "";

const PAYWAY_COMPANY = process.env.PAYWAY_COMPANY || "Sanitarios Conesa";
const PAYWAY_USER = process.env.PAYWAY_USER || "sistema";

export const PAYWAY_CONFIGURED =
  PAYWAY_PUBLIC_KEY.length > 0 && PAYWAY_PRIVATE_KEY.length > 0;

// URLs publicas usadas por el frontend (sdk-javascript-ventaonline)
export const PAYWAY_FRONTEND_URL =
  PAYWAY_ENV === "production"
    ? "https://ventasonline.payway.com.ar/api/v2"
    : "https://developers.decidir.com/api/v2";

export const PAYWAY_SCRIPT_URL =
  "https://ventasonline.payway.com.ar/static/v2.6.4/decidir.js";

export type PaywayPaymentArgs = {
  siteTransactionId: string; // identificador unico de la operacion (nuestro)
  token: string;             // token de tarjeta generado en frontend
  userId: string;            // identificador del cliente (DNI o email)
  paymentMethodId: number;   // 1 = Visa, 15 = Mastercard, etc.
  bin: string;               // primeros 6 digitos
  amount: number;            // monto en pesos * 100 (en centavos)
  currency: "ARS";
  installments: number;      // cuotas
  description: string;
  paymentType: "single";
};

export type PaywayPaymentResult = {
  ok: boolean;
  status?: "approved" | "rejected" | "pending" | "error";
  paymentId?: string;
  authCode?: string;
  cardBrand?: string;
  cardLast4?: string;
  errorCode?: string;
  errorMessage?: string;
  raw?: unknown;
};

export async function payWithToken(
  args: PaywayPaymentArgs,
): Promise<PaywayPaymentResult> {
  if (!PAYWAY_CONFIGURED) {
    return {
      ok: false,
      status: "error",
      errorCode: "not_configured",
      errorMessage:
        "Payway no está configurado. Faltan PAYWAY_PUBLIC_KEY o PAYWAY_PRIVATE_KEY en el entorno.",
    };
  }
  try {
    const sdkModulo = (await import("sdk-node-payway")) as unknown as {
      sdk: new (
        env: string,
        pub: string,
        priv: string,
        company: string,
        user: string,
      ) => {
        payment: (
          args: Record<string, unknown>,
          cb: (result: unknown, err: unknown) => void,
        ) => void;
      };
    };

    const client = new sdkModulo.sdk(
      PAYWAY_ENV,
      PAYWAY_PUBLIC_KEY,
      PAYWAY_PRIVATE_KEY,
      PAYWAY_COMPANY,
      PAYWAY_USER,
    );

    const payload: Record<string, unknown> = {
      site_transaction_id: args.siteTransactionId,
      token: args.token,
      user_id: args.userId,
      payment_method_id: args.paymentMethodId,
      bin: args.bin,
      amount: args.amount,
      currency: args.currency,
      installments: args.installments,
      description: args.description,
      payment_type: args.paymentType,
      sub_payments: [],
      apiKey: PAYWAY_PRIVATE_KEY,
      "Content-Type": "application/json",
    };

    return new Promise<PaywayPaymentResult>((resolve) => {
      client.payment(payload, (result: unknown, err: unknown) => {
        if (err) {
          const e = err as {
            data?: {
              error_type?: string;
              validation_errors?: { code?: string; param?: string }[];
            };
          };
          resolve({
            ok: false,
            status: "error",
            errorCode: e.data?.error_type ?? "unknown",
            errorMessage:
              e.data?.validation_errors?.[0]?.code || "Error en Payway",
            raw: err,
          });
          return;
        }
        const r = result as {
          status?: string;
          id?: number | string;
          card_brand?: string;
          last_four_digits?: string;
          site_transaction_id?: string;
          validation_data?: { auth_code?: string };
          status_details?: {
            card_authorization_code?: string;
            ticket?: string;
          };
        };
        const status =
          r.status === "approved"
            ? "approved"
            : r.status === "rejected"
              ? "rejected"
              : r.status === "pending"
                ? "pending"
                : "error";
        resolve({
          ok: status === "approved",
          status,
          paymentId: r.id != null ? String(r.id) : undefined,
          authCode:
            r.status_details?.card_authorization_code ||
            r.validation_data?.auth_code,
          cardBrand: r.card_brand,
          cardLast4: r.last_four_digits,
          raw: result,
        });
      });
    });
  } catch (e) {
    return {
      ok: false,
      status: "error",
      errorCode: "sdk_exception",
      errorMessage: (e as Error).message,
      raw: e,
    };
  }
}

// Config publica para el cliente. NUNCA incluye la private key.
export function publicPaywayConfig() {
  return {
    publicKey: PAYWAY_PUBLIC_KEY,
    apiUrl: PAYWAY_FRONTEND_URL,
    scriptUrl: PAYWAY_SCRIPT_URL,
    env: PAYWAY_ENV,
    configured: PAYWAY_CONFIGURED,
  };
}
