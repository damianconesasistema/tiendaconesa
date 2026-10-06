import type { Metadata } from "next";
import Link from "next/link";
import { XCircle, RefreshCw, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/business";

export const metadata: Metadata = {
  title: "Pago rechazado",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ orden?: string; motivo?: string }>;

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const orderNumber = sp.orden;
  const motivo = sp.motivo || "El pago no pudo procesarse.";

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-20">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-lg">
          <XCircle className="h-10 w-10" strokeWidth={2} />
        </div>
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          Pago rechazado
        </h1>
        <p className="mt-3 text-balance text-[var(--muted)]">{motivo}</p>
        <p className="mt-2 text-balance text-sm text-[var(--muted)]">
          No se realizó ningún cobro. Podés intentar con otra tarjeta o coordinar
          el pago por WhatsApp.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {orderNumber && (
            <Link
              href={`/tienda/checkout/pago?orden=${orderNumber}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar pago
            </Link>
          )}
          <Link
            href={whatsappLink(
              orderNumber
                ? `Hola! Tuve un problema para pagar el pedido #${orderNumber} con tarjeta.`
                : "Hola! Tuve un problema para pagar con tarjeta.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            Coordinar por WhatsApp
          </Link>
        </div>
      </div>
    </main>
  );
}
