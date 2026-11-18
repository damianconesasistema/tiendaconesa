"use client";

import { useEffect, useState } from "react";
import { esPorVersionNueva, recargar, sePuedeRecargar } from "@/lib/desfasaje";

// Cuando una pantalla falla. Antes salia la de Next en ingles ("This page
// couldn't load"). Casi siempre era por una publicacion con la pestaña
// abierta (src/lib/desfasaje.ts): eso se arregla recargando, y se recarga
// solo. Si es otra cosa, se dice en castellano y se ofrece reintentar.

export default function ErrorDePantalla({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Se decide una sola vez, al aparecer.
  const [recargando] = useState(() => esPorVersionNueva(error) && sePuedeRecargar());

  useEffect(() => {
    if (recargando) recargar();
  }, [recargando]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-xl font-black uppercase">
        {recargando ? "Actualizando…" : "No se pudo mostrar esta pantalla"}
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {recargando
          ? "Hay una versión nueva: se está recargando sola."
          : "Probá de nuevo. Si sigue igual, recargá la página."}
      </p>
      {!recargando && (
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="h-10 rounded-full border border-[var(--border)] px-5 text-xs font-bold uppercase tracking-wider"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-10 rounded-full bg-[var(--brand-red)] px-5 text-xs font-bold uppercase tracking-wider text-white"
          >
            Recargar
          </button>
        </div>
      )}
    </div>
  );
}
