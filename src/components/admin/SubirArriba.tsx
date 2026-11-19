"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

// El boton "Subir" del panel. Damian, 19/11/2026: "agregame un boton subir que
// a veces es engorroso" (las listas de productos y del comparador son largas).
// Aparece cuando se bajo un poco y lleva arriba de todo. Va abajo a la
// izquierda: a la derecha sale el aviso de ventas nuevas.

export function SubirArriba() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ver = () => setVisible(window.scrollY > 300);
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    return () => window.removeEventListener("scroll", ver);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Subir al principio"
      title="Subir al principio"
      className={`fixed bottom-5 left-5 z-40 inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-black)] px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white shadow-lg transition-all duration-300 hover:bg-[var(--brand-red)] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-4 w-4" />
      Subir
    </button>
  );
}
