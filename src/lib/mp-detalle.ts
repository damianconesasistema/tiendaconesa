// Lee la respuesta cruda que guarda el webhook de MercadoPago y saca de ahí
// lo que sirve para controlar una venta.
//
// El webhook guarda el JSON entero en mpRawResponse. En vez de agregar una
// columna por cada dato (y una migración cada vez que MercadoPago agrega
// algo), se parsea acá al mostrarlo.
//
// Todo es opcional a propósito: MercadoPago manda campos distintos según
// cómo se pagó, y un pago con dinero en cuenta no trae datos de tarjeta.

export type DetallePago = {
  metodo?: string; // visa, master, account_money, rapipago...
  tipo?: string; // credit_card, debit_card, ticket, account_money
  ultimos4?: string;
  titular?: string;
  cuotas?: number;
  /** Lo que pagó el cliente. */
  pagado?: number;
  /** Lo que queda en la cuenta después de comisiones. */
  neto?: number;
  /** Comisión de MercadoPago. */
  comision?: number;
  /** Lo que se le cobró de interés al cliente por las cuotas. */
  costoCuotas?: number;
  aprobadoEl?: Date;
  emailPagador?: string;
  idOperacion?: string;
};

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function leerDetallePago(raw: string | null): DetallePago | null {
  if (!raw) return null;
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!p || typeof p !== "object") return null;

  const card = (p.card ?? {}) as Record<string, unknown>;
  const titular = (card.cardholder ?? {}) as Record<string, unknown>;
  const payer = (p.payer ?? {}) as Record<string, unknown>;
  const detalles = Array.isArray(p.fee_details)
    ? (p.fee_details as Array<Record<string, unknown>>)
    : [];

  const comision = detalles
    .filter((d) => d.type === "mercadopago_fee")
    .reduce((s, d) => s + (num(d.amount) ?? 0), 0);

  const transaction = (p.transaction_details ?? {}) as Record<string, unknown>;

  return {
    metodo: typeof p.payment_method_id === "string" ? p.payment_method_id : undefined,
    tipo: typeof p.payment_type_id === "string" ? p.payment_type_id : undefined,
    ultimos4: typeof card.last_four_digits === "string" ? card.last_four_digits : undefined,
    titular: typeof titular.name === "string" ? titular.name : undefined,
    cuotas: num(p.installments),
    pagado: num(p.transaction_amount),
    neto: num(transaction.net_received_amount),
    comision: comision || undefined,
    costoCuotas: num(transaction.installment_amount)
      ? Math.round(
          ((num(transaction.installment_amount) ?? 0) * (num(p.installments) ?? 1) -
            (num(p.transaction_amount) ?? 0)) *
            100,
        ) / 100
      : undefined,
    aprobadoEl: typeof p.date_approved === "string" ? new Date(p.date_approved) : undefined,
    emailPagador: typeof payer.email === "string" ? payer.email : undefined,
    idOperacion: p.id !== undefined ? String(p.id) : undefined,
  };
}

/** Texto legible del medio de pago guardado en Order.paymentMethod. */
export function nombreMedioDePago(paymentMethod: string | null): string {
  if (!paymentMethod) return "A coordinar";
  if (paymentMethod === "mp_1pago") return "MercadoPago · débito o 1 pago";
  if (paymentMethod.startsWith("mp_cuotas")) {
    const n = paymentMethod.split("_")[2];
    return n ? `MercadoPago · ${n} cuotas` : "MercadoPago · cuotas";
  }
  if (paymentMethod === "tarjeta") return "Tarjeta (Payway)";
  if (paymentMethod === "efectivo_local") return "Efectivo en el local";
  if (paymentMethod === "whatsapp") return "Efectivo o transferencia · a coordinar";
  return paymentMethod;
}

/** Cómo se ve el estado de MercadoPago en castellano. */
export function estadoPago(status: string | null): {
  texto: string;
  tono: "ok" | "espera" | "mal";
} {
  switch (status) {
    case "approved":
      return { texto: "Aprobado", tono: "ok" };
    case "pending":
    case "in_process":
    case "authorized":
      return { texto: "Pendiente de acreditación", tono: "espera" };
    case "rejected":
      return { texto: "Rechazado", tono: "mal" };
    case "cancelled":
      return { texto: "Cancelado", tono: "mal" };
    case "refunded":
      return { texto: "Devuelto", tono: "mal" };
    case "charged_back":
      return { texto: "Contracargo", tono: "mal" };
    default:
      return { texto: status || "Sin datos", tono: "espera" };
  }
}
