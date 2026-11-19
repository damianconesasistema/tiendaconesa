"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { PRINCIPAL } from "@/lib/usuarios";
import {
  buscarLugares,
  guardarClave,
  guardarConfig,
  leerConfig,
  opinionesDe,
  type LugarEncontrado,
} from "@/lib/opiniones-google";
import { conRegistro } from "@/lib/actividad";

// Panel -> Opiniones (src/lib/opiniones-google.ts). La clave de Google la
// carga solo "admin", igual que la de MercadoLibre; elegir los locales y las
// estrellas, cualquiera que tenga tildada esta parte.

type R = { ok?: true; error?: string };

async function guardarClaveGoogle__(k: string): Promise<R> {
  const s = await getAdminSession();
  if (!s) return { error: "No autorizado" };
  if (s.username !== PRINCIPAL) return { error: "La clave de Google la carga solo el usuario admin." };
  const clave = String(k ?? "").trim();
  if (!/^[A-Za-z0-9_-]{30,}$/.test(clave)) return { error: "Esa clave no parece completa: pegala entera, sin espacios." };
  await guardarClave(clave);
  revalidatePath("/admin/opiniones");
  revalidatePath("/");
  return { ok: true };
}

async function buscarLocalEnGoogle__(texto: string): Promise<{ lugares?: LugarEncontrado[]; error?: string }> {
  const s = await getAdminSession();
  if (!s) return { error: "No autorizado" };
  const t = String(texto ?? "").trim().slice(0, 120);
  if (t.length < 3) return { error: "Escribí el nombre del local como figura en Google." };
  try {
    const lugares = await buscarLugares(t);
    return lugares.length ? { lugares } : { error: "Google no encontró nada con ese texto. Probá con el nombre y la localidad." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo buscar en Google." };
  }
}

async function elegirLocalDeGoogle__(sucursal: string, placeId: string | null): Promise<R> {
  const s = await getAdminSession();
  if (!s) return { error: "No autorizado" };
  const c = await leerConfig();
  const lugares = { ...c.lugares };
  if (placeId) {
    // Que exista de verdad antes de guardarlo.
    try {
      await opinionesDe(placeId, { fresco: true });
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Google no encontró ese local." };
    }
    lugares[sucursal] = placeId;
  } else delete lugares[sucursal];
  await guardarConfig({ ...c, lugares });
  revalidatePath("/admin/opiniones");
  revalidatePath("/");
  return { ok: true };
}

async function guardarOpcionesOpiniones__(datos: { minimo: number; mostrar: boolean }): Promise<R> {
  const s = await getAdminSession();
  if (!s) return { error: "No autorizado" };
  const c = await leerConfig();
  const minimo = [3, 4, 5].includes(Number(datos.minimo)) ? Number(datos.minimo) : 4;
  await guardarConfig({ ...c, minimo, mostrar: !!datos.mostrar });
  revalidatePath("/admin/opiniones");
  revalidatePath("/");
  return { ok: true };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function guardarClaveGoogle(...a: Parameters<typeof guardarClaveGoogle__>): ReturnType<typeof guardarClaveGoogle__> {
  return conRegistro("guardarClaveGoogle", a, () => guardarClaveGoogle__(...a));
}
export async function buscarLocalEnGoogle(...a: Parameters<typeof buscarLocalEnGoogle__>): ReturnType<typeof buscarLocalEnGoogle__> {
  return conRegistro("buscarLocalEnGoogle", a, () => buscarLocalEnGoogle__(...a));
}
export async function elegirLocalDeGoogle(...a: Parameters<typeof elegirLocalDeGoogle__>): ReturnType<typeof elegirLocalDeGoogle__> {
  return conRegistro("elegirLocalDeGoogle", a, () => elegirLocalDeGoogle__(...a));
}
export async function guardarOpcionesOpiniones(...a: Parameters<typeof guardarOpcionesOpiniones__>): ReturnType<typeof guardarOpcionesOpiniones__> {
  return conRegistro("guardarOpcionesOpiniones", a, () => guardarOpcionesOpiniones__(...a));
}
