"use client";

import { useRef, useState } from "react";
import { Info } from "lucide-react";

// La "ayuda memoria" del panel: un (i) chiquito al lado de cada columna o
// campo que explica que hace. Damian, 19/11/2026: "PODES PONERLE UN LABEL
// EXPLICANDO QUE HACE CADA COSA DE AYUDA MEMORIA? A TODO EL PANEL".
//
// Se abre pasando el mouse o tocandolo (en el celular no hay mouse). Va con
// posicion fija calculada al abrir: adentro de una tabla con scroll, un
// cartel comun quedaria cortado por el borde de la tabla.

const ANCHO = 260;

export function Ayuda({ texto, className = "" }: { texto: string; className?: string }) {
  const boton = useRef<HTMLButtonElement>(null);
  const [donde, setDonde] = useState<{ left: number; top: number } | null>(null);

  function abrir() {
    const r = boton.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - ANCHO / 2), window.innerWidth - ANCHO - 8);
    setDonde({ left, top: r.bottom + 6 });
  }

  return (
    <span className={`inline-flex align-middle normal-case tracking-normal ${className}`}>
      <button
        ref={boton}
        type="button"
        aria-label={`Ayuda: ${texto}`}
        onClick={(e) => {
          // Adentro de un titulo que ordena o de una etiqueta: que no haga lo
          // de abajo, solo mostrar la ayuda.
          e.preventDefault();
          e.stopPropagation();
          if (donde) setDonde(null);
          else abrir();
        }}
        onMouseEnter={abrir}
        onMouseLeave={() => setDonde(null)}
        onBlur={() => setDonde(null)}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[var(--muted)] opacity-70 transition hover:text-[var(--brand-red)] hover:opacity-100"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {donde && (
        <span
          role="tooltip"
          style={{ position: "fixed", left: donde.left, top: donde.top, width: ANCHO }}
          className="pointer-events-none z-[100] rounded-lg bg-neutral-900 px-3 py-2 text-left text-xs font-normal normal-case leading-snug tracking-normal text-white shadow-xl"
        >
          {texto}
        </span>
      )}
    </span>
  );
}
