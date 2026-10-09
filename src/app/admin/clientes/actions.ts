"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// Borrar un cliente que tiene pedidos dejaria los pedidos sin a quien
// entregarselos, y ademas la base no lo permite (la relacion es obligatoria).
// Avisamos cuantos tiene en vez de tirar el error de Prisma en la cara.
export async function borrarCliente(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  try {
    const pedidos = await prisma.order.count({ where: { customerId: id } });
    if (pedidos > 0)
      return {
        error: `No se puede: tiene ${pedidos} ${pedidos === 1 ? "pedido" : "pedidos"}. Borrá los pedidos primero.`,
      };

    await prisma.customer.delete({ where: { id } });
    revalidatePath("/admin/clientes");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { error: `Error: ${(e as Error).message}` };
  }
}
