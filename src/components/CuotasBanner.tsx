import Link from "next/link";
import Image from "next/image";
import { CreditCard, Wallet, ArrowRight } from "lucide-react";

// Banner de financiación.
//
// Se arma con el plan de MÁS cuotas que esté configurado, así cuando se agregue
// o saque un plan el cartel se actualiza solo y nunca promete algo que el
// checkout no ofrece. Lo mismo con el descuento de contado.

export function CuotasBanner({
  cuotasMax,
  dctoContadoPct = 0,
  variant = "hero",
}: {
  cuotasMax: number;
  /** Descuento real de pagar en efectivo/transferencia. */
  dctoContadoPct?: number;
  variant?: "hero" | "full" | "strip";
}) {
  if (!cuotasMax || cuotasMax < 2) return null;

  // Tira finita para la parte superior del catálogo
  if (variant === "strip") {
    return (
      <div className="bg-[#009EE3] px-4 py-2 text-center text-white">
        <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-display text-xs font-bold uppercase tracking-wider sm:text-sm">
          <CreditCard className="h-4 w-4" />
          <span className="animate-cuotas-blink">
            Hasta {cuotasMax} cuotas fijas
          </span>
          {dctoContadoPct > 0 && (
            <span className="opacity-90">
              · {dctoContadoPct}% OFF en efectivo o transferencia
            </span>
          )}
        </span>
      </div>
    );
  }

  const compacto = variant === "full";

  return (
    <section
      className={`relative overflow-hidden bg-[#009EE3] text-white ${
        compacto ? "px-6 py-10" : "px-6 py-12 sm:py-14"
      }`}
    >
      {/* Brillo que cruza cada tanto, como el reflejo de una tarjeta */}
      <div
        aria-hidden
        className="animate-banner-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/25 to-transparent"
      />

      {/* Círculos de fondo: dan profundidad sin tapar el texto */}
      <div
        aria-hidden
        className="animate-banner-drift pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="animate-banner-drift-slow pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-black/10"
      />

      <div className="relative mx-auto grid max-w-5xl gap-8 sm:grid-cols-[1.3fr_auto_1fr] sm:items-center">
        {/* CUOTAS */}
        <div className="animate-banner-in flex items-center gap-4 sm:gap-5">
          <div className="animate-banner-beat font-display text-[5rem] font-black leading-[0.8] tracking-tighter sm:text-[7rem]">
            {cuotasMax}
          </div>
          <div>
            <div className="font-display text-2xl font-black uppercase leading-none tracking-tight sm:text-3xl">
              Cuotas
              <br />
              fijas
            </div>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
              <CreditCard className="h-3.5 w-3.5" />
              Con MercadoPago
            </div>
          </div>
        </div>

        {/* Separador */}
        <div
          aria-hidden
          className="hidden h-24 w-px bg-white/30 sm:block"
        />

        {/* CONTADO + marca */}
        {dctoContadoPct > 0 && (
          <div className="animate-banner-in-2 border-t border-white/25 pt-6 sm:border-0 sm:pt-0">
            <div className="flex items-center gap-3">
              <Wallet className="h-10 w-10 shrink-0" strokeWidth={1.5} />
              {/* El logo va DENTRO de esta columna para quedar alineado con
                  el "% OFF" y no debajo del ícono. */}
              <div>
                <div className="font-display text-3xl font-black leading-none sm:text-4xl">
                  {dctoContadoPct}% OFF
                </div>
                <div className="mt-1 text-sm font-bold uppercase tracking-wide">
                  Efectivo o transferencia
                </div>
                <Image
                  src="/brand/logo.png"
                  alt="Sanitarios Conesa Traslasierra"
                  width={520}
                  height={132}
                  priority
                  className="animate-logo-pop mt-5 h-24 w-auto object-contain drop-shadow-[0_3px_10px_rgba(0,0,0,0.3)] sm:h-32"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="animate-banner-in-3 relative mx-auto mt-8 max-w-5xl">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-[#009EE3] transition-transform hover:scale-[1.03]"
        >
          Ver la tienda
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
