"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { desconectarML, guardarAppML } from "@/lib/mercadolibre";
import { conRegistro } from "@/lib/actividad";

async function guardarAplicacionML__(
  fd: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Sesión vencida. Entrá de nuevo." };
  const r = await guardarAppML(String(fd.get("appId") ?? ""), String(fd.get("clave") ?? ""));
  if (r.ok) revalidatePath("/admin/productos/mercadolibre");
  return r;
}

async function desconectarMercadoLibre__(): Promise<{ ok: true } | { error: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Sesión vencida. Entrá de nuevo." };
  await desconectarML();
  revalidatePath("/admin/productos/mercadolibre");
  return { ok: true };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function guardarAplicacionML(...a: Parameters<typeof guardarAplicacionML__>): ReturnType<typeof guardarAplicacionML__> {
  return conRegistro("guardarAplicacionML", a, () => guardarAplicacionML__(...a));
}
export async function desconectarMercadoLibre(...a: Parameters<typeof desconectarMercadoLibre__>): ReturnType<typeof desconectarMercadoLibre__> {
  return conRegistro("desconectarMercadoLibre", a, () => desconectarMercadoLibre__(...a));
}
