"use client";

import { useEffect, useState } from "react";
import { esPorVersionNueva, recargar, sePuedeRecargar } from "@/lib/desfasaje";
import { anotarErrorDePantalla } from "@/lib/errores-de-pantalla";

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

  // Queda anotado en el Registro, con la pantalla (Damian, 20/11/2026: "que
  // es esto que tira?": no habia forma de saber donde ni que).
  useEffect(() => {
    if (recargando) return;
    void anotarErrorDePantalla(
      `${window.location.pathname}${window.location.search}`,
      error?.message ?? String(error),
      error?.digest ?? null,
      "pantalla de error",
    ).catch(() => {});
  }, [error, recargando]);

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
        <p className="mt-3 text-[11px] text-[var(--muted)]">
          {error?.digest ? `Código: ${error.digest}` : `Detalle: ${String(error?.message ?? "").slice(0, 140)}`}
        </p>
      )}
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
