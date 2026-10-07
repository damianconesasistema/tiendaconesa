import { CreditCard } from "lucide-react";

// Banner de financiación. Se arma con el plan de MÁS cuotas que esté
// configurado, así cuando se agregue o saque un plan el cartel se actualiza
// solo y nunca promete algo que el checkout no ofrece.

export function CuotasBanner({
  cuotasMax,
  variant = "full",
}: {
  cuotasMax: number;
  variant?: "full" | "strip";
}) {
  if (!cuotasMax || cuotasMax < 2) return null;

  // Tira finita para la parte superior del sitio
  if (variant === "strip") {
    return (
      <div className="bg-[#009EE3] px-4 py-2 text-center text-white">
        <span className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider sm:text-sm">
          <CreditCard className="h-4 w-4" />
          Pagá hasta {cuotasMax} cuotas fijas con MercadoPago
        </span>
      </div>
    );
  }

  return (
    <section className="bg-[#009EE3] px-6 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-center sm:text-left">
        <CreditCard className="h-12 w-12 shrink-0" strokeWidth={1.5} />
        <div>
          <h2 className="font-display text-3xl font-black uppercase leading-none sm:text-4xl">
            Hasta {cuotasMax} cuotas fijas
          </h2>
          <p className="mt-1.5 text-sm text-white/90">
            Con todas las tarjetas de crédito, a través de MercadoPago.{" "}
            <span className="font-bold">
              O pagá en efectivo o por transferencia y tenés descuento.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
