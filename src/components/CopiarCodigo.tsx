"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** El boton para copiar el codigo del producto, solo el codigo (V.0.11.263).
 *  Damian, 25/11/2026: "en la pagina poneme para copiar el sku arriba pero
 *  solo el codigo". Si el navegador no deja usar el portapapeles moderno
 *  (pagina sin https, permisos), prueba con el metodo viejo. */
export function CopiarCodigo({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    let bien = false;
    try {
      await navigator.clipboard.writeText(codigo);
      bien = true;
    } catch {
      try {
        const t = document.createElement("textarea");
        t.value = codigo;
        t.style.position = "fixed";
        t.style.opacity = "0";
        document.body.appendChild(t);
        t.select();
        bien = document.execCommand("copy");
        t.remove();
      } catch {
        bien = false;
      }
    }
    if (bien) {
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1500);
    }
  };
  return (
    <button
      type="button"
      onClick={copiar}
      title="Copiar el código"
      aria-label={`Copiar el código ${codigo}`}
      className="ml-2 inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)] transition hover:border-foreground hover:text-foreground"
    >
      {copiado ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
      {copiado ? "Copiado" : "Copiar"}
    </button>
  );
}
