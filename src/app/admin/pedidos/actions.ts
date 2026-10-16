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

// Elimina un pedido (y sus items en cascada). Para limpiar pedidos de prueba.
export async function deleteOrder(
  orderId: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  try {
    // Los OrderItem se borran en cascada (onDelete: Cascade en el schema).
    await prisma.order.delete({ where: { id: orderId } });
  } catch (e) {
    return { error: `No se pudo eliminar: ${(e as Error).message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  return { ok: true };
}

// Emite la factura electronica del pedido contra ARCA.
//
// El trabajo pesado esta en src/lib/afip/emitir.ts; aca solo se chequea la
// sesion y se refrescan las pantallas del panel.
export async function facturarPedido(
  orderId: string,
): Promise<{ ok?: true; cbteNro?: number; cae?: string; aviso?: string; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const { emitirFactura } = await import("@/lib/afip/emitir");
  const r = await emitirFactura(orderId);
  if (!r.ok) return { error: r.error };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return {
    ok: true,
    cbteNro: r.cbteNro,
    cae: r.cae,
    aviso: r.observaciones.length ? r.observaciones.join(" · ") : undefined,
  };
}
