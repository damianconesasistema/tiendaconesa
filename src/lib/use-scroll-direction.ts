"use client";

import { useEffect, useState } from "react";

/**
 * Detecta si el usuario está bajando (leyendo) o subiendo (buscando acciones).
 *
 * Sirve para esconder los botones flotantes mientras lee: en mobile tapan el
 * texto y molestan. Vuelven apenas sube el dedo, que es justo cuando los busca.
 */
export function useScrollDirection() {
  // visible arranca en true: si la página entra sin scroll, los botones están
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let ultimo = window.scrollY;
    let pendiente = false;

    const alScrollear = () => {
      if (pendiente) return;
      pendiente = true;
      // rAF: no recalcular en cada evento de scroll, que en mobile son muchos
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dif = y - ultimo;

        // Umbral de 8px: evita que un temblor del dedo haga parpadear todo
        if (Math.abs(dif) > 8) {
          // Cerca del tope o del final siempre visibles
          const cercaDelTope = y < 120;
          const cercaDelFinal =
            window.innerHeight + y >= document.body.scrollHeight - 160;
          setVisible(cercaDelTope || cercaDelFinal || dif < 0);
          ultimo = y;
        }
        pendiente = false;
      });
    };

    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  return visible;
}
