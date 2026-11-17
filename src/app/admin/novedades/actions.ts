"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { chequeoDiario } from "@/lib/chequeo-diario";

/** "Chequear ahora": corre el chequeo diario sin esperar al dia siguiente. */
export async function chequearAhora(): Promise<{ ok?: true; error?: string; novedades?: number }> {
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
