"use server";

// Lo que falla en el navegador, anotado en el Registro (src/lib/errores.ts).
// Solo de alguien del panel con su sesion: esta accion la puede llamar
// cualquiera y no puede ser una puerta para escribir en la base.

import { getAdminSession } from "@/lib/admin-auth";
import { anotarError } from "@/lib/errores";

export async function anotarErrorDePantalla(
  ruta: string,
  mensaje: string,
  codigo?: string | null,
  tipo?: string | null,
): Promise<void> {
  const s = await getAdminSession();
  if (!s) return;
  await anotarError({
    donde: String(ruta ?? "").slice(0, 150),
    que: String(mensaje ?? "").slice(0, 700),
    codigo: codigo ? String(codigo).slice(0, 40) : null,
    tipo: tipo ? `en el navegador, ${String(tipo).slice(0, 80)}` : "en el navegador",
    usuario: s.username,
  });
}
