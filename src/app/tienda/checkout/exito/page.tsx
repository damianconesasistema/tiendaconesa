import type { Metadata } from "next";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/order";
import { whatsappLink } from "@/lib/business";

export const metadata: Metadata = {
  title: "Pago aprobado",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orden?: string }>;

export default async function ExitoPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const orderNumber = Number(sp.orden);
  const order = Number.isFinite(orderNumber)
    ? await prisma.order.findUnique({
        where: { number: orderNumber },
        select: {
          number: true,
          total: true,
          mpPaymentType: true,
          mpStatus: true,
          paymentMethod: true,
        },
      })
    : null;

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-500 text-white shadow-lg">
          <Check className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          ¡Pago aprobado!
        </h1>
        {order ? (
          <p className="mt-3 text-balance text-[var(--muted)]">
            Tu pedido <strong>#{order.number}</strong> quedó confirmado y pagado.
            {" "}
            Pagaste {formatPrice(order.total)} con MercadoPago
            {(() => {
              // paymentMethod guarda "mp_cuotas_12" cuando eligió cuotas
              const n = Number(
                (order.paymentMethod ?? "").replace("mp_cuotas_", ""),
              );
              return Number.isFinite(n) && n > 1 ? ` en ${n} cuotas` : "";
            })()}
            .
          </p>
        ) : (
          <p className="mt-3 text-balance text-[var(--muted)]">
            Tu pago fue procesado correctamente.
          </p>
        )}
        <p className="mt-2 text-balance text-sm text-[var(--muted)]">
          Te vamos a contactar para coordinar la entrega o el retiro en el local.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white"
          >
            Seguir comprando
          </Link>
          <Link
            href={whatsappLink(
              order
                ? `Hola! Acabo de pagar el pedido #${order.number} con MercadoPago.`
                : "Hola! Acabo de hacer una compra.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            Escribinos
          </Link>
        </div>
      </div>
    </main>
  );
}
