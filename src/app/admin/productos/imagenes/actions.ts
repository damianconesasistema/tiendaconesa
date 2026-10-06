"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export type ImageMatch = {
  key: string; // nombre de archivo sin extension (normalizado)
  itemId: string | null;
  title: string | null;
  matchedBy: "sku" | "codigo" | null;
};

// Dado un conjunto de "keys" (nombres de archivo sin extension), resuelve
// con que producto matchea cada uno: primero por SKU, luego por itemId (codigo).
export async function matchImageFilenames(
  keys: string[],
): Promise<{ ok: boolean; error?: string; matches?: ImageMatch[] }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const uniqueKeys = Array.from(new Set(keys.map((k) => k.trim()))).filter(
    Boolean,
  );
  if (uniqueKeys.length === 0) return { ok: true, matches: [] };

  // Buscar por SKU
  const bySku = await prisma.product.findMany({
    where: { sku: { in: uniqueKeys } },
    select: { sku: true, itemId: true, title: true },
  });
  const skuMap = new Map(bySku.map((p) => [p.sku!, p]));

  // Para los que no matchearon por SKU, buscar por itemId
  const remaining = uniqueKeys.filter((k) => !skuMap.has(k));
  const byItem = await prisma.product.findMany({
    where: { itemId: { in: remaining } },
    select: { itemId: true, title: true },
  });
  const itemMap = new Map(byItem.map((p) => [p.itemId, p]));

  const matches: ImageMatch[] = uniqueKeys.map((key) => {
    const s = skuMap.get(key);
    if (s)
      return { key, itemId: s.itemId, title: s.title, matchedBy: "sku" };
    const i = itemMap.get(key);
    if (i)
      return { key, itemId: i.itemId, title: i.title, matchedBy: "codigo" };
    return { key, itemId: null, title: null, matchedBy: null };
  });

  return { ok: true, matches };
}

// Sube UNA imagen a un producto (por itemId) para el flujo masivo.
// No revalida en cada llamada; el componente llama a finishImageBulk al final.
export async function uploadOneImage(
  itemId: string,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "Archivo vacío" };
  if (file.size > 10 * 1024 * 1024)
    return { ok: false, error: "Supera 10 MB" };
  if (!file.type.startsWith("image/"))
    return { ok: false, error: "No es imagen" };

  const contentType = ["image/png", "image/webp", "image/jpeg"].includes(
    file.type,
  )
    ? file.type
    : "image/jpeg";

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true },
    });
    if (!product) return { ok: false, error: "Producto no encontrado" };

    // Agrega la imagen al final de la galeria del producto.
    const existing = await prisma.productImage.count({
      where: { productId: product.id },
    });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        data: buf,
        contentType,
        position: existing,
      },
    });
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: `/api/productos/${itemId}/imagen?v=${Date.now()}` },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Revalida las paginas una vez terminada la carga masiva.
export async function finishImageBulk(): Promise<{ ok: true }> {
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { ok: true };
}
