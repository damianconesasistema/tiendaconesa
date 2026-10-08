"use client";

import { useState, useTransition } from "react";
import { Tags } from "lucide-react";
import { asignarMarcasAuto } from "@/app/admin/productos/actions";

// Lee el titulo de cada producto y le pone la marca. Por defecto solo toca lo
// que esta sin marca, asi lo que se corrigio a mano no se pisa.

export function MarcasAuto() {
  const [pendiente, iniciar] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function etiquetar(sobrescribir: boolean) {
    setMsg(null);
    setError(null);
    iniciar(async () => {
      const r = await asignarMarcasAuto(sobrescribir);
      if (r.error) setError(r.error);
      else
        setMsg(
          `Etiquetados ${r.etiquetados}. Quedaron ${r.sinMarca} sin marca reconocida.`,
        );
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <Tags className="h-4 w-4 text-[var(--brand-red)]" />
        <span className="text-sm font-bold">Marcas</span>
        <span className="text-xs text-[var(--muted)]">
          Detecta la marca leyendo el titulo del producto.
        </span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            disabled={pendiente}
            onClick={() => etiquetar(false)}
            className="rounded-full bg-[var(--brand-black)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {pendiente ? "Etiquetando…" : "Etiquetar los que faltan"}
          </button>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (
                confirm(
                  "Vuelve a detectar la marca de TODOS los productos y pisa las que hayas puesto a mano. ¿Seguir?",
                )
              )
                etiquetar(true);
            }}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)] disabled:opacity-50"
          >
            Rehacer todas
          </button>
        </div>
      </div>
      {msg && <p className="mt-3 text-xs font-medium text-green-700">{msg}</p>}
      {error && <p className="mt-3 text-xs font-medium text-[var(--brand-red)]">{error}</p>}
    </div>
  );
}
