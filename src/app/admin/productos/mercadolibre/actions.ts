"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { desconectarML, guardarAppML } from "@/lib/mercadolibre";

export async function guardarAplicacionML(
  fd: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Sesión vencida. Entrá de nuevo." };
  const r = await guardarAppML(String(fd.get("appId") ?? ""), String(fd.get("clave") ?? ""));
  if (r.ok) revalidatePath("/admin/productos/mercadolibre");
  return r;
}

export async function desconectarMercadoLibre(): Promise<{ ok: true } | { error: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "Sesión vencida. Entrá de nuevo." };
  await desconectarML();
  revalidatePath("/admin/productos/mercadolibre");
  return { ok: true };
}
