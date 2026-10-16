import { formatPrice } from "@/lib/order";
import { estadoPago, leerDetallePago } from "@/lib/mp-detalle";

// Ficha del pago de MercadoPago dentro del detalle del pedido.
//
// Muestra lo que importa para controlar la venta: si el pago está aprobado,
// con qué tarjeta, en cuántas cuotas, cuánto entró de verdad a la cuenta
// después de la comisión, y el ID de operación para buscarlo en MercadoPago.

type OrderPago = {
  mpPaymentId: string | null;
  mpStatus: string | null;
  mpStatusDetail: string | null;
  mpPaymentType: string | null;
  mpRawResponse: string | null;
};

const TONOS = {
  ok: "bg-emerald-100 text-emerald-700",
  espera: "bg-amber-100 text-amber-700",
  mal: "bg-red-100 text-red-700",
} as const;

const TIPOS: Record<string, string> = {
  credit_card: "Tarjeta de crédito",
  debit_card: "Tarjeta de débito",
  account_money: "Dinero en cuenta",
  ticket: "Efectivo (pago fácil / rapipago)",
  bank_transfer: "Transferencia",
};

export function DetalleMercadoPago({ order }: { order: OrderPago }) {
  const estado = estadoPago(order.mpStatus);
  const d = leerDetallePago(order.mpRawResponse);

  return (
    <div className="space-y-2">
      {/* El logo identifica el medio de un vistazo, mejor que la palabra
          "mercadopago" en minuscula que venia del dato crudo. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/mercadopago.png"
        alt="MercadoPago"
        width={113}
        height={30}
        className="h-[26px] w-auto"
      />
      <div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${TONOS[estado.tono]}`}
        >
          {estado.texto}
        </span>
        {order.mpStatusDetail && estado.tono !== "ok" && (
          <span className="ml-2 text-xs text-[var(--muted)]">
            {order.mpStatusDetail}
          </span>
        )}
      </div>

      {d && (
        <dl className="space-y-1 text-xs text-[var(--muted)]">
          {(d.tipo || d.metodo) && (
            <Fila
              k="Medio"
              v={`${TIPOS[d.tipo ?? ""] ?? d.tipo ?? ""}${
                d.metodo ? ` · ${d.metodo.toUpperCase()}` : ""
              }${d.ultimos4 ? ` ···· ${d.ultimos4}` : ""}`}
            />
          )}
          {d.titular && <Fila k="Titular" v={d.titular} />}
          {d.cuotas && d.cuotas > 1 && <Fila k="Cuotas" v={String(d.cuotas)} />}
          {d.pagado !== undefined && (
            <Fila k="Pagó el cliente" v={formatPrice(Math.round(d.pagado))} />
          )}
          {d.comision !== undefined && (
            <Fila
              k="Comisión MercadoPago"
              v={`− ${formatPrice(Math.round(d.comision))}`}
            />
          )}
          {d.neto !== undefined && (
            <Fila
              k="Te queda"
              v={formatPrice(Math.round(d.neto))}
              fuerte
            />
          )}
          {d.aprobadoEl && (
            <Fila
              k="Acreditado"
              v={d.aprobadoEl.toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            />
          )}
          {d.emailPagador && <Fila k="Mail del pagador" v={d.emailPagador} />}
        </dl>
      )}

      <div className="text-[11px] text-[var(--muted)]">
        ID de operación: {order.mpPaymentId}
      </div>
    </div>
  );
}

function Fila({ k, v, fuerte }: { k: string; v: string; fuerte?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{k}</dt>
      <dd className={fuerte ? "font-bold text-foreground" : "text-foreground"}>
        {v}
      </dd>
    </div>
  );
}
