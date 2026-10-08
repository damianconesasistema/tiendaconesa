"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CreditCard } from "lucide-react";

// Tira de financiación que va ARRIBA DE TODO, antes del header.
//
// Pide los datos al navegador en vez de recibirlos por props: así puede
// vivir en el layout sin que las páginas estáticas tengan que consultar la
// base al compilarse.
//
// Alto fijo (--strip-h) desde el primer pintado: si creciera al llegar los
// datos empujaría el hero hacia abajo y en iPhone la sección de abajo queda
// asomando atrás de la barra de Safari. El texto aparece cuando llega.

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
        /* sin datos: la tira queda vacía, pero el alto no cambia */
      });
    return () => {
      vivo = false;
    };
  }, []);

  // En el panel no va: ahí nadie compra, y el alto reservado estorba
  const oculta = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    const raiz = document.documentElement;
    if (oculta) raiz.style.setProperty("--strip-h", "0px");
    else raiz.style.removeProperty("--strip-h");
  }, [oculta]);

  if (oculta) return null;

  const hayCuotas = !!datos && datos.cuotasMax >= 2;
  const dcto = datos?.dctoContadoPct ?? 0;

  return (
    <div className="flex h-[var(--strip-h)] items-center justify-center overflow-hidden bg-[#009EE3] px-3 text-white">
      {hayCuotas && (
        <span className="inline-flex items-center gap-2 whitespace-nowrap font-display font-bold uppercase tracking-wider">
          <CreditCard className="h-4 w-4 shrink-0" />
          {/* Mobile: corto, para que entre en una línea */}
          <span className="text-[11px] sm:hidden">
            <span className="animate-cuotas-blink">
              {datos!.cuotasMax} cuotas fijas
            </span>
            {dcto > 0 && <span className="opacity-90"> · {dcto}% OFF efectivo</span>}
          </span>
          {/* Desktop: el texto completo */}
          <span className="hidden text-sm sm:inline">
            <span className="animate-cuotas-blink">
              Hasta {datos!.cuotasMax} cuotas fijas
            </span>
            {dcto > 0 && (
              <span className="opacity-90">
                {" "}
                · {dcto}% OFF en efectivo o transferencia
              </span>
            )}
          </span>
        </span>
      )}
    </div>
  );
}
