"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CreditCard } from "lucide-react";

// Tira de financiación que va ARRIBA DE TODO, antes del header.
//
// Pide los datos al navegador en vez de recibirlos por props: así puede
// vivir en el layout sin que las páginas estáticas tengan que consultar la
// base al compilarse.

export function CuotasStrip() {
  const pathname = usePathname();
  const [datos, setDatos] = useState<{
    cuotasMax: number;
    dctoContadoPct: number;
  } | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/financiacion")
      .then((r) => r.json())
      .then((d) => {
        if (vivo) setDatos(d);
      })
      .catch(() => {
        /* sin datos: la tira no aparece */
      });
    return () => {
      vivo = false;
    };
  }, []);

  // En el panel no va
  if (pathname?.startsWith("/admin")) return null;
  if (!datos || !datos.cuotasMax || datos.cuotasMax < 2) return null;

  return (
    <div className="bg-[#009EE3] px-4 py-2 text-center text-white">
      <span className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 font-display text-xs font-bold uppercase tracking-wider sm:text-sm">
        <CreditCard className="h-4 w-4" />
        <span className="animate-cuotas-blink">
          Hasta {datos.cuotasMax} cuotas fijas
        </span>
        {datos.dctoContadoPct > 0 && (
          <span className="opacity-90">
            · {datos.dctoContadoPct}% OFF en efectivo o transferencia
          </span>
        )}
      </span>
    </div>
  );
}
