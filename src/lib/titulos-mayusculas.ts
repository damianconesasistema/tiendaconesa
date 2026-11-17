// Pasar a mayusculas los titulos que ya estaban cargados, UNA sola vez. Ver
// src/lib/titulo-en-linea.ts.
//
// Va desde el programa y no como migracion de la base a proposito: una
// migracion que falla deja la tienda sin arrancar (paso el 31/10), y esto no
// tiene por que poner en riesgo nada. Si falla, la tienda sigue igual y se
// reintenta la proxima vez.
//
// Antes de tocar nada guarda los titulos originales en la tabla Setting
// ("titulos_antes_de_mayusculas", {codigo: titulo}), para poder volver atras.
// Solo cambia el titulo: precios, stock, fotos y si esta publicado quedan
// igual.

import { prisma } from "@/lib/db";
import { getSetting, setSetting } from "@/lib/settings";
import { tituloEnLinea } from "@/lib/titulo-en-linea";

const S_HECHO = "titulos_mayusculas_hecho";
const S_RESPALDO = "titulos_antes_de_mayusculas";

let corriendo: Promise<number> | null = null;

/** Devuelve cuantos titulos cambio (0 si ya estaba hecho). */
export function titulosAMayusculasUnaVez(): Promise<number> {
  if (!corriendo)
    corriendo = (async () => {
      try {
        if (await getSetting(S_HECHO)) return 0;
        const todos = await prisma.product.findMany({ select: { itemId: true, title: true } });
        const cambian = todos.filter((p) => tituloEnLinea(p.title) !== p.title);
        // El respaldo primero. Si ya habia uno (un intento anterior que se
        // corto), se suma: nunca se pisa un titulo original con uno ya
        // cambiado.
        let respaldo: Record<string, string> = {};
        try {
          respaldo = JSON.parse((await getSetting(S_RESPALDO)) || "{}");
        } catch {
          respaldo = {};
        }
        for (const p of cambian) if (!(p.itemId in respaldo)) respaldo[p.itemId] = p.title;
        await setSetting(S_RESPALDO, JSON.stringify(respaldo));

        for (const p of cambian)
          await prisma.product.update({
            where: { itemId: p.itemId },
            data: { title: tituloEnLinea(p.title) },
          });
        await setSetting(S_HECHO, new Date().toISOString());
        return cambian.length;
      } finally {
        setTimeout(() => (corriendo = null), 0);
      }
    })();
  return corriendo;
}
