"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { chequeoDiario } from "@/lib/chequeo-diario";
import { conRegistro } from "@/lib/actividad";

/** "Chequear ahora": corre el chequeo diario sin esperar al dia siguiente. */
async function chequearAhora__(): Promise<{ ok?: true; error?: string; novedades?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const r = await chequeoDiario();
    revalidatePath("/admin", "layout");
    return { ok: true, novedades: r.novedades };
  } catch (e) {
    return { error: `No se pudo: ${(e as Error).message}` };
  }
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function chequearAhora(...a: Parameters<typeof chequearAhora__>): ReturnType<typeof chequearAhora__> {
  return conRegistro("chequearAhora", a, () => chequearAhora__(...a));
}
