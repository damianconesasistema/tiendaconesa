// MercadoPago manda acá cuando el pago queda PENDIENTE: tipicamente cuando el
// cliente elige efectivo (Rapipago, Pago Fácil) y todavia no fue a pagar el
// cupón. La plata no está acreditada, asi que NO hay que prometer la entrega.
//
// Sin esta pagina, back_urls.pending apuntaba a una ruta inexistente y el
// cliente terminaba en un 404 despues de pagar.
import type { Metadata } from "next";
import Link from "next/link";
import { Clock, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/order";
import { whatsappLink } from "@/lib/business";

export const metadata: Metadata = {
  title: "Pago pendiente",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orden?: string }>;

export default async function PendientePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const orderNumber = Number(sp.orden);
  const order = Number.isFinite(orderNumber)
    ? await prisma.order.findUnique({
        where: { number: orderNumber },
        select: { number: true, total: true },
      })
    : null;

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg">
          <Clock className="h-10 w-10" strokeWidth={2.5} />
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          Pago pendiente
        </h1>

        {order ? (
          <p className="mt-3 text-balance text-[var(--muted)]">
            Tu pedido <strong>#{order.number}</strong> por{" "}
            {formatPrice(order.total)} quedó registrado, pero MercadoPago
            todavía no nos confirmó el pago.
          </p>
        ) : (
          <p className="mt-3 text-balance text-[var(--muted)]">
            Tu pedido quedó registrado, pero MercadoPago todavía no nos
            confirmó el pago.
          </p>
        )}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
          <strong>¿Elegiste pagar en efectivo?</strong> Acercate con el cupón a
          Rapipago o Pago Fácil. Una vez que pagues, la acreditación puede
          demorar hasta 1 día hábil y ahí te confirmamos el pedido.
        </div>

        <p className="mt-4 text-balance text-sm text-[var(--muted)]">
          Apenas MercadoPago nos avise, te contactamos para coordinar la entrega
          o el retiro en el local. No hace falta que hagas nada más.
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
                ? `Hola! Hice el pedido #${order.number} y el pago quedó pendiente. Quería consultar.`
                : "Hola! Hice un pedido y el pago quedó pendiente.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            Consultar
          </Link>
        </div>
      </div>
    </main>
  );
}
