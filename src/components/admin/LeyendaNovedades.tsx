"use client";

import Link from "next/link";

// La leyenda que corre arriba del panel, como las noticias de la tele.
// Damian, 17/11/2026: "que informe en el panel como una leyenda de noticias".
// Se frena al pasar el mouse (para poder leer y tocar), y si la compu pide
// menos movimiento, queda quieta y se desliza a mano. Ver src/lib/novedades.ts.

export type NovedadEnLeyenda = {
  id: string;
  texto: string;
  link?: string;
  nivel?: "info" | "aviso";
  fecha: string;
};

export function LeyendaNovedades({ novedades }: { novedades: NovedadEnLeyenda[] }) {
  const largo = novedades.reduce((s, n) => s + n.texto.length, 0);
  // Que se pueda leer: unos 9 caracteres por segundo, nunca menos de 25 s.
  const segundos = Math.max(25, Math.round(largo / 9));

  const item = (n: NovedadEnLeyenda, copia: boolean) => (
    <Link
      key={`${copia ? "b" : "a"}-${n.id}`}
      href={n.link ?? "/admin/novedades"}
      tabIndex={copia ? -1 : undefined}
      className={`inline-flex items-center gap-2 whitespace-nowrap text-xs hover:underline ${
        n.nivel === "aviso" ? "font-bold text-amber-300" : "text-white/90"
      }`}
    >
      <span className="text-white/40">
        {new Date(n.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
      </span>
      {n.nivel === "aviso" ? "⚠ " : ""}
      {n.texto}
    </Link>
  );

  return (
    <div className="border-t border-black/10 bg-[#111] text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/admin/novedades"
          className="shrink-0 py-2 font-display text-[10px] font-black uppercase tracking-[0.25em] text-[var(--brand-red)] hover:underline"
        >
          Novedades
        </Link>
        {novedades.length === 0 ? (
          <span className="py-2 text-xs text-white/60">Sin novedades en los últimos días.</span>
        ) : (
          <div className="leyenda relative min-w-0 flex-1 overflow-hidden">
            {/* Dos copias iguales, cada una con su espacio al final: correr la
                mitad del ancho deja todo como al principio, sin salto. */}
            <div className="leyenda-pista flex w-max py-2" style={{ animationDuration: `${segundos}s` }}>
              <div className="flex gap-12 pr-12">{novedades.map((n) => item(n, false))}</div>
              <div className="flex gap-12 pr-12" aria-hidden="true">
                {novedades.map((n) => item(n, true))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
