"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

type UpdateResult = { ok?: true; error?: string };

export async function updateProduct(
  prevState: unknown,
  formData: FormData,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) {
    return { error: "No autorizado" };
  }

  const itemId = String(formData.get("itemId") || "");
  if (!itemId) return { error: "itemId requerido" };

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "otros");
  const description = String(formData.get("description") || "").trim() || null;
  const priceRaw = Number(formData.get("price") || 0);
  const salePriceRaw = formData.get("salePrice");
  const salePrice =
    salePriceRaw && String(salePriceRaw).trim() !== ""
      ? Number(salePriceRaw)
      : null;
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") || 0)));
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  if (!title) return { error: "El título es obligatorio" };
  if (!Number.isFinite(priceRaw) || priceRaw < 0)
    return { error: "Precio inválido" };
  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0))
    return { error: "Precio de oferta inválido" };
  if (salePrice !== null && salePrice >= priceRaw)
    return { error: "El precio de oferta debe ser menor al precio base" };

  try {
    await prisma.product.update({
      where: { itemId },
      data: {
        title,
        category,
        description,
        price: Math.round(priceRaw),
        salePrice: salePrice !== null ? Math.round(salePrice) : null,
        stock,
        active,
        featured,
      },
    });
  } catch (e) {
    return { error: `Error al guardar: ${(e as Error).message}` };
  }

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${itemId}`);
  revalidatePath("/tienda");
  revalidatePath(`/tienda/${itemId}`);
  revalidatePath("/");

  return { ok: true };
}
