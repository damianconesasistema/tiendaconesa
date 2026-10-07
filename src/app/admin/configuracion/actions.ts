"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import {
  setSetting,
  SETTING_RECARGO_1PAGO,
  SETTING_RECARGO_CUOTAS,
  SETTING_CUOTAS_MAX,
} from "@/lib/settings";

export async function guardarRecargos(
  prevState: unknown,
  formData: FormData,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const unPago = Number(formData.get("unPago"));
  const cuotas = Number(formData.get("cuotas"));
  const cuotasMax = Number(formData.get("cuotasMax"));

  if (!Number.isFinite(unPago) || unPago < 0 || unPago > 60)
    return { error: "El recargo de 1 pago tiene que estar entre 0 y 60." };
  if (!Number.isFinite(cuotas) || cuotas < 0 || cuotas > 60)
    return { error: "El recargo en cuotas tiene que estar entre 0 y 60." };
  if (!Number.isFinite(cuotasMax) || cuotasMax < 1 || cuotasMax > 24)
    return { error: "Las cuotas tienen que estar entre 1 y 24." };

  try {
    await setSetting(SETTING_RECARGO_1PAGO, String(unPago));
    await setSetting(SETTING_RECARGO_CUOTAS, String(cuotas));
    await setSetting(SETTING_CUOTAS_MAX, String(Math.floor(cuotasMax)));
    revalidatePath("/admin/configuracion");
    revalidatePath("/tienda/checkout");
    return { ok: true };
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }
}
