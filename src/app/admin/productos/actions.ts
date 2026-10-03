"use server";

import { revalidatePath } from "next/cache";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

type UpdateResult = { ok?: true; error?: string };

// Edicion completa desde la ficha
export async function updateProduct(
  prevState: unknown,
  formData: FormData,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

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

// Edicion rapida desde la lista (un solo campo)
type QuickField = "price" | "salePrice" | "stock" | "active" | "featured";

export async function quickUpdate(
  itemId: string,
  field: QuickField,
  value: string | number | boolean | null,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemId) return { error: "itemId requerido" };

  const data: Record<string, number | boolean | null> = {};

  if (field === "price") {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return { error: "Precio inválido" };
    data.price = Math.round(n);
  } else if (field === "salePrice") {
    if (value === "" || value === null) {
      data.salePrice = null;
    } else {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0)
        return { error: "Precio oferta inválido" };
      const existing = await prisma.product.findUnique({
        where: { itemId },
        select: { price: true },
      });
      if (existing && n >= existing.price)
        return { error: "La oferta debe ser menor al precio base" };
      data.salePrice = Math.round(n);
    }
  } else if (field === "stock") {
    const n = Math.max(0, Math.floor(Number(value || 0)));
    if (!Number.isFinite(n)) return { error: "Stock inválido" };
    data.stock = n;
  } else if (field === "active") {
    data.active = Boolean(value);
  } else if (field === "featured") {
    data.featured = Boolean(value);
  } else {
    return { error: "Campo no soportado" };
  }

  try {
    await prisma.product.update({ where: { itemId }, data });
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

// Upload de foto personalizada para un producto.
// Guarda el archivo en /public/products/{itemId}.jpg y setea imageUrl.
// NOTA: Para persistencia en Railway hace falta un Volume mounted en
// /app/public/products (sino se pierde al redeploy).
export async function uploadProductImage(
  itemId: string,
  formData: FormData,
): Promise<UpdateResult & { imageUrl?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0)
    return { error: "No se recibió ninguna imagen" };

  if (file.size > 8 * 1024 * 1024)
    return { error: "La imagen no puede superar 8 MB" };
  if (!file.type.startsWith("image/"))
    return { error: "El archivo debe ser una imagen" };

  const buf = Buffer.from(await file.arrayBuffer());
  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";
  const relPath = `/products/${itemId}.${ext}`;
  const absDir = path.join(process.cwd(), "public", "products");
  const absPath = path.join(absDir, `${itemId}.${ext}`);

  try {
    await mkdir(absDir, { recursive: true });
    await writeFile(absPath, buf);
    // Timestamp para invalidar cache del navegador
    const imageUrl = `${relPath}?v=${Date.now()}`;
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl },
    });

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${itemId}`);
    revalidatePath("/tienda");
    revalidatePath(`/tienda/${itemId}`);
    revalidatePath("/");

    return { ok: true, imageUrl };
  } catch (e) {
    return { error: `No se pudo guardar: ${(e as Error).message}` };
  }
}

export async function removeProductImage(itemId: string): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { imageUrl: true },
    });
    if (product?.imageUrl) {
      // intentar borrar archivo (tolerante si no existe)
      const rel = product.imageUrl.split("?")[0];
      const abs = path.join(process.cwd(), "public", rel);
      try {
        await unlink(abs);
      } catch {}
    }
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: null },
    });

    revalidatePath("/admin/productos");
    revalidatePath(`/admin/productos/${itemId}`);
    revalidatePath("/tienda");
    revalidatePath(`/tienda/${itemId}`);
    revalidatePath("/");

    return { ok: true };
  } catch (e) {
    return { error: `No se pudo eliminar: ${(e as Error).message}` };
  }
}
