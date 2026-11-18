"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { esPorVersionNueva } from "@/lib/desfasaje";

// El aviso de "se publico una version nueva" del panel. Damian, 18/11/2026,
// con la pantalla "This page couldn't load": "no para de salirme esa
// pantalla que onda?". Pasaba despues de cada publicacion: la pestaña abierta
// tenia la version vieja y, al guardar o cambiar de pantalla, el servidor ya
// no la reconocia.
//
// Cada minuto (y al volver a la pestaña) se le pregunta al servidor que
// version tiene. Si cambio, aparece una franja arriba para recargar ANTES de
// seguir tocando. Tambien aparece si algo falla por eso mismo.
// No recarga solo: podria haber algo escrito sin guardar.

const CADA = 60_000;

export function AvisoVersionNueva({ version }: { version: string }) {
  const [nueva, setNueva] = useState(false);

  useEffect(() => {
    if (version === "desarrollo") return;
    let vivo = true;
    async function mirar() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/version", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as { version?: string };
        if (vivo && j.version && j.version !== version) setNueva(true);
      } catch {
        /* sin conexion: se vuelve a probar en un rato */
      }
    }
    const t = setInterval(mirar, CADA);
    const alVolver = () => void mirar();
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("focus", alVolver);
    // Lo que falla por la version vieja y no llega a la pantalla de error
    // (por ejemplo, un guardar que no se pudo).
    const alFallar = (e: PromiseRejectionEvent | ErrorEvent) => {
      const x = "reason" in e ? e.reason : e.error ?? e.message;
      if (esPorVersionNueva(x)) setNueva(true);
    };
    window.addEventListener("unhandledrejection", alFallar);
    window.addEventListener("error", alFallar);
    return () => {
      vivo = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("focus", alVolver);
      window.removeEventListener("unhandledrejection", alFallar);
      window.removeEventListener("error", alFallar);
    };
  }, [version]);

  if (!nueva) return null;
  return (
    <div className="sticky top-0 z-[90] border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-amber-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <p className="flex-1">
          <strong>Hay una versión nueva del panel.</strong> Recargá la página para seguir: con esta, guardar
          puede fallar. Si estabas escribiendo algo sin guardar, copialo antes.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-amber-600 px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-amber-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Recargar
        </button>
      </div>
    </div>
  );
}
