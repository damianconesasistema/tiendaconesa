"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const VALID_STATUSES = [
  "pendiente",
  "confirmado",
  "en_preparacion",
  "en_entrega",
  "entregado",
  "cancelado",
] as const;

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    return { error: "Estado inválido" };
  }

  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        paidAt: status === "entregado" ? new Date() : undefined,
      },
    });
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { ok: true };
}
