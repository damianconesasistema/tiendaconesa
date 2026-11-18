"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Volver de la ficha de un producto al MISMO lugar de la lista. Damian,
// 18/11/2026: "cuando vuelvo para atras si estoy editando un producto deberia
// volver al punto donde estaba ... porque me resetea los filtros que tenia".
//
// Al entrar a un producto desde la lista se anota (en la pestaña del
// navegador, sessionStorage) con que filtros estaba la lista, hasta donde
// estaba bajada y cual producto se abrio. Al volver:
//   - Con la flecha del navegador o con "Volver a productos": se baja hasta
//     ese producto y se lo marca un momento.
//   - Con la pestaña PRODUCTOS de arriba (que no lleva filtros): se vuelven a
//     poner los filtros de antes, y lo mismo.
// Pasada media hora no se recuerda nada: es otra tanda de trabajo.

const CLAVE = "productos:vuelta";
const VIGENCIA = 30 * 60_000;

type Vuelta = { lista: string; y: number; itemId: string; t: number };

function leer(): Vuelta | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(CLAVE) || "null");
    return v && typeof v.lista === "string" && typeof v.itemId === "string" && Date.now() - v.t < VIGENCIA
      ? (v as Vuelta)
      : null;
  } catch {
    return null;
  }
}

function olvidar() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    /* sin sessionStorage no se recuerda, nada mas */
  }
}

/** Baja hasta la fila del producto y la marca un momento. */
function irA(v: Vuelta) {
  const fila = document.querySelector<HTMLElement>(`tr[data-item="${CSS.escape(v.itemId)}"]`);
  if (fila) {
    // De golpe: el sitio tiene desplazamiento suave y aca se quiere aparecer
    // ahi, no ver pasar la lista.
    fila.scrollIntoView({ block: "center", behavior: "instant" });
    fila.style.transition = "box-shadow 0.3s";
    fila.style.boxShadow = "inset 4px 0 0 var(--brand-red), 0 0 0 2px rgba(220, 38, 38, 0.25)";
    setTimeout(() => {
      fila.style.boxShadow = "";
    }, 2500);
  } else window.scrollTo({ top: v.y, behavior: "instant" });
}

export function RecordarLista({ lista }: { lista: string }) {
  const router = useRouter();
  // Los filtros de ahora, para anotarlos al hacer clic (el efecto de abajo
  // se arma una vez).
  const actual = useRef(lista);
  useEffect(() => {
    actual.current = lista;
  }, [lista]);

  // Al hacer clic en un producto de la lista (el nombre o el lapiz), anotar.
  useEffect(() => {
    function alClic(e: MouseEvent) {
      const a = (e.target as Element | null)?.closest?.("a[href^='/admin/productos/']");
      const fila = a?.closest<HTMLElement>("tr[data-item]");
      if (!a || !fila?.dataset.item) return;
      try {
        sessionStorage.setItem(
          CLAVE,
          JSON.stringify({ lista: actual.current, y: window.scrollY, itemId: fila.dataset.item, t: Date.now() } satisfies Vuelta),
        );
      } catch {
        /* idem */
      }
    }
    document.addEventListener("click", alClic, true);
    return () => document.removeEventListener("click", alClic, true);
  }, []);

  // Al llegar a la lista.
  const yaMiro = useRef(false);
  useEffect(() => {
    if (yaMiro.current) return;
    const v = leer();
    if (!v) {
      yaMiro.current = true;
      return;
    }
    // Llego por la pestaña de arriba, sin filtros: los de antes.
    if (!lista && v.lista) {
      router.replace(`/admin/productos${v.lista}`, { scroll: false });
      return; // vuelve a pasar por aca con los filtros puestos
    }
    yaMiro.current = true;
    if (v.lista !== lista) return;
    olvidar();
    // Despues de que Next termine de acomodar la pantalla (con un reloj y no
    // con requestAnimationFrame, que no corre si la pestaña esta de fondo).
    setTimeout(() => irA(v), 80);
  }, [lista, router]);

  return null;
}
