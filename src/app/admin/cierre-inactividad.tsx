"use client";

import { useEffect } from "react";

// V.0.11.259. Damian, 24/11/2026: "si pasa mas de 2 horas sin actividad un
// usuario, se le cierra la sesion". El mismo reloj que Punto (la seccion
// CIERRE POR INACTIVIDAD de src/app/sistema/punto.ts): la ultima vez que la
// persona toco algo (mouse, teclado, toques) queda en el navegador
// (localStorage, "conesa.actividad") y la comparten las pestanas de Punto y
// del panel. Lo que la pagina consulta sola no cuenta. Lo anotado antes de
// entrar con esta sesion ("desde") es de otra y no cuenta.

const INACTIVO_MS = 2 * 60 * 60 * 1000;
const CLAVE = "conesa.actividad";

export default function CierreInactividad({ desde }: { desde: number }) {
  useEffect(() => {
    if (location.pathname.startsWith("/admin/login")) return;
    let ultima = Date.now();
    let marcada = 0;
    let cerrando = false;
    const leerGuardada = () => {
      let t = 0;
      try {
        t = Number(localStorage.getItem(CLAVE)) || 0;
      } catch {}
      return t && desde && t < desde ? 0 : t;
    };
    const marcar = () => {
      const ahora = Date.now();
      ultima = ahora;
      if (ahora - marcada > 15_000) {
        marcada = ahora;
        try {
          localStorage.setItem(CLAVE, String(ahora));
        } catch {}
      }
    };
    const cerrar = async () => {
      if (cerrando) return;
      cerrando = true;
      try {
        localStorage.removeItem(CLAVE);
      } catch {}
      try {
        await fetch("/api/admin/logout", { method: "POST", credentials: "same-origin" });
      } catch {}
      // Adentro de Punto (la solapa Web) se va todo Punto a la entrada.
      if (window.top && window.top !== window) {
        try {
          window.top.location.href = "/sistema/entrar?volver=/sistema&motivo=inactividad";
          return;
        } catch {}
      }
      // Carga entera a proposito: despues de salir no tiene que quedar nada del panel en memoria.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      location.href = "/admin/login";
    };
    const revisar = () => {
      if (Date.now() - Math.max(ultima, leerGuardada()) >= INACTIVO_MS) void cerrar();
    };
    const t0 = leerGuardada();
    if (t0 && Date.now() - t0 >= INACTIVO_MS) {
      void cerrar();
      return;
    }
    marcar();
    let movio = 0;
    const alMover = () => {
      const t = Date.now();
      if (t - movio > 5_000) {
        movio = t;
        marcar();
      }
    };
    const eventos = ["mousedown", "keydown", "wheel", "touchstart"] as const;
    for (const ev of eventos) window.addEventListener(ev, marcar, { capture: true, passive: true });
    window.addEventListener("mousemove", alMover, { capture: true, passive: true });
    const alVolver = () => {
      if (!document.hidden) revisar();
    };
    document.addEventListener("visibilitychange", alVolver);
    const reloj = window.setInterval(revisar, 30_000);
    return () => {
      for (const ev of eventos) window.removeEventListener(ev, marcar, { capture: true });
      window.removeEventListener("mousemove", alMover, { capture: true });
      document.removeEventListener("visibilitychange", alVolver);
      window.clearInterval(reloj);
    };
  }, [desde]);
  return null;
}
