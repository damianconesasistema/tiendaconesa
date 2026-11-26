// Cuanto lugar le queda al disco del servidor (V.0.11.273).
//
// 26/11/2026: el disco de 30 GB llego al 100 %. Postgres se detuvo (asi no
// rompe datos), la tienda dio error 500 y Punto cargaba a medias. Damian:
// "siempre avisame antes cuando esta quedando poco espacio porque no podemos
// parar la produccion". La pagina de Punto lo pregunta con la version (cada
// 2 minutos) y a gerencia le muestra una franja; el vigia de GitHub lo mira
// cada 10 minutos por su lado (.github/workflows/vigilar.yml).
//
// cuentaDisco() es pura (la prueban scripts/pruebas/disco.test.ts); leerDisco()
// le pregunta al sistema y guarda la respuesta un minuto.

import { statfs } from "node:fs/promises";

/** Desde aca, la franja amarilla. */
export const DISCO_OJO = 80;
/** Desde aca, roja: falta poco para que se frene todo. */
export const DISCO_MAL = 90;

export type Disco = {
  /** Usado, en %, como lo dice "df" (usado / (usado + disponible)). */
  pct: number;
  libreGb: number;
  totalGb: number;
  nivel: "ok" | "ojo" | "mal";
};

const gb = (bytes: number) => Math.round((bytes / 1024 ** 3) * 10) / 10;

/** Las cuentas, con lo que devuelve statfs: bloques totales, tamano de
 *  bloque, disponibles (para cualquiera) y libres (contando la reserva de
 *  root). null si no tiene sentido. */
export function cuentaDisco(bloques: number, tamano: number, disponibles: number, libres?: number): Disco | null {
  if (!(bloques > 0) || !(tamano > 0) || !(disponibles >= 0)) return null;
  const total = bloques * tamano;
  const usado = total - (libres ?? disponibles) * tamano;
  const disp = disponibles * tamano;
  const base = usado + disp;
  if (!(base > 0)) return null;
  const pct = Math.min(100, Math.max(0, Math.ceil((usado / base) * 100)));
  return {
    pct,
    libreGb: gb(disp),
    totalGb: gb(total),
    nivel: pct >= DISCO_MAL ? "mal" : pct >= DISCO_OJO ? "ojo" : "ok",
  };
}

type Cache = { cuando: number; disco: Disco | null };
const g = globalThis as typeof globalThis & { __discoPunto?: Cache };

/** El disco donde corre el servidor ("/"). null si no se puede saber. */
export async function leerDisco(ruta = "/"): Promise<Disco | null> {
  const ya = g.__discoPunto;
  if (ya && Date.now() - ya.cuando < 60_000) return ya.disco;
  let disco: Disco | null = null;
  try {
    const s = await statfs(ruta);
    disco = cuentaDisco(Number(s.blocks), Number(s.bsize), Number(s.bavail), Number(s.bfree));
  } catch {
    disco = null;
  }
  g.__discoPunto = { cuando: Date.now(), disco };
  return disco;
}
