"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { metaPageView } from "@/lib/meta";

// El script base del pixel manda un PageView cuando carga la página, pero la
// tienda es una SPA: al pasar del catálogo a una ficha de producto no se
// recarga nada y Meta no se entera. Esto le avisa en cada navegación.
//
// La primera vista la manda el script base, así que acá la salteamos para no
// contarla dos veces.

export function MetaPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Saltea el primer render, que ya cubrió el script base.
    if (window.__conesaPrimerPageView !== false) {
      window.__conesaPrimerPageView = false;
      return;
    }
    metaPageView();
  }, [pathname, searchParams]);

  return null;
}

declare global {
  interface Window {
    __conesaPrimerPageView?: boolean;
  }
}
