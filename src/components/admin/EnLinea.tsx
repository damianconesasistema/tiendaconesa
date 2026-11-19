"use client";

import { useEffect, useState } from "react";

// Quien esta en el panel en este momento (src/lib/presencia.ts). Va arriba,
// al lado del reloj. Avisa cada minuto que este panel sigue abierto, solo
// mientras la pestaña esta a la vista.

type Presente = { usuario: string; nombre: string };

const CADA = 60_000;

export function EnLinea() {
  const [lista, setLista] = useState<Presente[] | null>(null);
  const [yo, setYo] = useState("");

  useEffect(() => {
    let vivo = true;
    async function avisar() {
      if (document.visibilityState !== "visible") return;
      try {
        const r = await fetch("/api/admin/en-linea", { method: "POST", cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as { yo: string; enLinea: Presente[] };
        if (vivo) {
          setYo(d.yo);
          setLista(d.enLinea);
        }
      } catch {
        /* sin red: queda lo que habia */
      }
    }
    void avisar();
    const t = setInterval(avisar, CADA);
    const alVolver = () => void avisar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      vivo = false;
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  if (!lista || lista.length === 0) return null;
  const nombres = lista.map((p) => (p.usuario === yo ? `${p.nombre} (vos)` : p.nombre));
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-800"
      title={`En el panel ahora: ${nombres.join(", ")}`}
    >
      <span className="relative inline-flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
      </span>
      <span className="hidden font-semibold sm:inline">En línea:</span>
      <span className="max-w-[16rem] truncate">{nombres.join(", ")}</span>
    </span>
  );
}
