"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * Compartir producto.
 *
 * En celular usa el menú nativo (navigator.share): el usuario elige WhatsApp,
 * Instagram, mail, lo que tenga. En escritorio ese menú no existe, así que
 * copia el link al portapapeles y avisa.
 */
export function ShareButton({
  titulo,
  texto,
  className = "",
}: {
  titulo: string;
  texto?: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartir() {
    // La URL se lee en el momento del click: así funciona igual en cualquier
    // producto sin tener que pasarla por props.
    const url = window.location.href;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: titulo, text: texto ?? titulo, url });
        return;
      } catch {
        // El usuario canceló el menú: no es un error, no mostramos nada.
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Navegador sin permiso de portapapeles: último recurso.
      window.prompt("Copiá el link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={compartir}
      aria-label="Compartir este producto"
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] ${className}`}
    >
      {copiado ? (
        <>
          <Check className="h-4 w-4 text-green-600" />
          Link copiado
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Compartir
        </>
      )}
    </button>
  );
}
