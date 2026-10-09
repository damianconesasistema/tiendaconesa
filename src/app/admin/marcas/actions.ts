"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { agregarMarca, quitarMarca } from "@/lib/marcas-server";

type Resultado = { ok?: true; error?: string };

export async function crearMarca(formData: FormData): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const r = await agregarMarca(
    String(formData.get("nombre") || ""),
    String(formData.get("logo") || ""),
  );
  if (r.error) return { error: r.error };

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { ok: true };
}

// Borrar una marca no toca los productos: si alguno la tenia, queda con un
// slug que ya no resuelve a ningun nombre. Por eso la pantalla muestra cuantos
// productos la usan antes de dejar borrar.
export async function borrarMarca(id: string): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const enUso = await prisma.product.count({ where: { brand: id } });
  if (enUso > 0)
    return {
      error: `No se puede: ${enUso} ${enUso === 1 ? "producto la usa" : "productos la usan"}. Cambiales la marca primero.`,
    };

  const r = await quitarMarca(id);
  if (r.error) return { error: r.error };

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { ok: true };
}
