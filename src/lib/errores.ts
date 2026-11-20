// Los errores quedan anotados en el Registro (Panel -> Registro), con la
// pantalla, que fallo y el codigo. Damian, 20/11/2026, con la pantalla "No se
// pudo mostrar esta pantalla": "que es esto que tira?". Lo que anota el
// servidor no se puede ver desde afuera, y la pantalla de error no decia ni
// donde estaba ni que habia fallado: no habia forma de saberlo.
//
// Los anotan src/instrumentation.ts (los del servidor, con el mensaje de
// verdad) y la pantalla de error (src/app/error.tsx, los del navegador). Un
// mismo error repetido se anota una vez cada 10 minutos, y como mucho 60 por
// hora: que un error en loop no llene el Registro.

import { registrar } from "@/lib/actividad";

const REPETIDO = 10 * 60_000;
const POR_HORA = 60;
const vistos = new Map<string, number>();
let hora = { desde: 0, cuantos: 0 };

/** Lo que nunca va al Registro: usuario y clave de una direccion. */
function sinClaves(x: string): string {
  return x.replace(/:\/\/[^/@\s]+@/g, "://***@");
}

export async function anotarError(e: {
  /** La pantalla o direccion ("/admin/productos/786086"). */
  donde: string;
  /** El mensaje del error. */
  que: string;
  /** El codigo que muestra la pantalla de error (digest). */
  codigo?: string | null;
  /** Donde paso: "al armar la pantalla", "en una accion", "en el navegador"... */
  tipo?: string | null;
  /** Quien estaba (sin sesion: "sistema"). */
  usuario?: string | null;
}): Promise<void> {
  try {
    const ahora = Date.now();
    const clave = `${e.donde}|${e.que}`.slice(0, 400);
    if (ahora - (vistos.get(clave) ?? 0) < REPETIDO) return;
    if (vistos.size > 500) vistos.clear();
    vistos.set(clave, ahora);
    if (ahora - hora.desde > 3_600_000) hora = { desde: ahora, cuantos: 0 };
    if (++hora.cuantos > POR_HORA) return;
    const detalle = [sinClaves(e.que).slice(0, 700), e.codigo ? `código ${e.codigo}` : "", e.tipo ?? ""]
      .filter(Boolean)
      .join(" · ");
    await registrar(`Error en ${e.donde.slice(0, 150)}`, detalle, e.usuario || "sistema");
  } catch {
    /* anotar un error nunca puede causar otro */
  }
}
