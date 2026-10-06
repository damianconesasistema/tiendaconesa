"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  MAX_PRODUCT_IMAGES,
  type ProductImageInfo,
} from "@/lib/product-images";

type UpdateResult = { ok?: true; error?: string };

// Crear un producto manualmente desde el panel.
// Devuelve el itemId generado para poder redirigir a la ficha (y subir foto).
const VALID_CATEGORIES_CREATE = new Set([
  "sanitarios",
  "griferia",
  "banera",
  "accesorios",
  "salamandras",
  "calefones",
  "materiales",
  "piletas",
  "otros",
]);

export async function createProduct(
  prevState: unknown,
  formData: FormData,
): Promise<{ ok?: true; itemId?: string; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "El título es obligatorio" };

  let category = String(formData.get("category") || "otros").trim();
  if (!VALID_CATEGORIES_CREATE.has(category)) category = "otros";

  const description =
    String(formData.get("description") || "").trim() || null;
  const memoRaw = formData.get("memo");
  const memo =
    memoRaw != null && String(memoRaw).trim() !== ""
      ? String(memoRaw).trim()
      : null;
  const skuRaw = formData.get("sku");
  const sku =
    skuRaw != null && String(skuRaw).trim() !== ""
      ? String(skuRaw).trim()
      : null;

  const priceRaw = Number(formData.get("price") || 0);
  if (!Number.isFinite(priceRaw) || priceRaw < 0)
    return { error: "Precio inválido" };
  const price = Math.round(priceRaw);

  const salePriceRaw = formData.get("salePrice");
  const salePrice =
    salePriceRaw && String(salePriceRaw).trim() !== ""
      ? Math.round(Number(salePriceRaw))
      : null;
  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0))
    return { error: "Precio de oferta inválido" };
  if (salePrice !== null && salePrice >= price)
    return { error: "El precio de oferta debe ser menor al precio base" };

  const stock = Math.max(0, Math.floor(Number(formData.get("stock") || 0)));
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  // itemId unico para productos cargados a mano
  const itemId = `MAN-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();

  try {
    await prisma.product.create({
      data: {
        itemId,
        sku,
        title,
        category,
        description,
        price,
        salePrice,
        stock,
        active,
        featured,
        memo,
      },
    });
    // Primer registro en el historial de precios
    await prisma.priceHistory.create({
      data: {
        productId: (
          await prisma.product.findUniqueOrThrow({
            where: { itemId },
            select: { id: true },
          })
        ).id,
        price,
        salePrice,
        note: "Alta manual",
        source: "manual",
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("Unique constraint") && msg.includes("sku"))
      return { error: "Ese SKU ya está en uso en otro producto" };
    return { error: `Error al crear: ${msg}` };
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  return { ok: true, itemId };
}

// Loguea un cambio en el historial de precios de un producto.
// Se llama internamente desde updateProduct / quickUpdate cuando cambia price o salePrice.
async function logPriceChange(opts: {
  itemId: string;
  newPrice: number;
  newSalePrice: number | null;
  source: "manual" | "excel" | "bulk" | "quick";
  note?: string | null;
}) {
  try {
    const current = await prisma.product.findUnique({
      where: { itemId: opts.itemId },
      select: { id: true, price: true, salePrice: true },
    });
    if (!current) return;
    const changed =
      current.price !== opts.newPrice ||
      (current.salePrice ?? null) !== (opts.newSalePrice ?? null);
    if (!changed) return;
    await prisma.priceHistory.create({
      data: {
        productId: current.id,
        price: opts.newPrice,
        salePrice: opts.newSalePrice,
        source: opts.source,
        note: opts.note ?? null,
      },
    });
  } catch {
    // No queremos que un fallo del log rompa la actualizacion
  }
}

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
  const memoRaw = formData.get("memo");
  const memo =
    memoRaw != null && String(memoRaw).trim() !== ""
      ? String(memoRaw).trim()
      : null;
  const skuRaw = formData.get("sku");
  const sku =
    skuRaw != null && String(skuRaw).trim() !== ""
      ? String(skuRaw).trim()
      : null;

  if (!title) return { error: "El título es obligatorio" };
  if (!Number.isFinite(priceRaw) || priceRaw < 0)
    return { error: "Precio inválido" };
  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0))
    return { error: "Precio de oferta inválido" };
  if (salePrice !== null && salePrice >= priceRaw)
    return { error: "El precio de oferta debe ser menor al precio base" };

  const newPrice = Math.round(priceRaw);
  const newSalePrice = salePrice !== null ? Math.round(salePrice) : null;

  try {
    await logPriceChange({
      itemId,
      newPrice,
      newSalePrice,
      source: "manual",
    });
    await prisma.product.update({
      where: { itemId },
      data: {
        title,
        sku,
        category,
        description,
        price: newPrice,
        salePrice: newSalePrice,
        stock,
        active,
        featured,
        memo,
      },
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes("Unique constraint") && msg.includes("sku"))
      return { error: "Ese SKU ya está en uso en otro producto" };
    return { error: `Error al guardar: ${msg}` };
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
    // Si cambia precio o oferta, loguear primero el estado nuevo
    if (field === "price" || field === "salePrice") {
      const current = await prisma.product.findUnique({
        where: { itemId },
        select: { price: true, salePrice: true },
      });
      if (current) {
        const nextPrice =
          field === "price" ? (data.price as number) : current.price;
        const nextSale =
          field === "salePrice"
            ? (data.salePrice as number | null)
            : current.salePrice;
        await logPriceChange({
          itemId,
          newPrice: nextPrice,
          newSalePrice: nextSale,
          source: "quick",
        });
      }
    }
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

// Registrar manualmente un precio pasado en el historial.
// Sirve para cargar datos previos ("este producto antes lo vendía a X")
// sin tener que modificar el precio actual del producto.
export async function addHistoricalPrice(
  itemId: string,
  price: number,
  salePrice: number | null,
  note: string | null,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!Number.isFinite(price) || price < 0)
    return { error: "Precio inválido" };
  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0))
    return { error: "Precio de oferta inválido" };
  if (salePrice !== null && salePrice >= price)
    return { error: "La oferta debe ser menor al precio base" };

  const p = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true },
  });
  if (!p) return { error: "Producto no encontrado" };

  await prisma.priceHistory.create({
    data: {
      productId: p.id,
      price: Math.round(price),
      salePrice: salePrice !== null ? Math.round(salePrice) : null,
      note: note && note.trim() ? note.trim() : null,
      source: "manual",
    },
  });
  revalidatePath(`/admin/productos/${itemId}`);
  return { ok: true };
}

// Eliminar una entrada del historial (en caso de error de carga)
export async function deleteHistoryEntry(
  entryId: string,
  itemId: string,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  await prisma.priceHistory.delete({ where: { id: entryId } });
  revalidatePath(`/admin/productos/${itemId}`);
  return { ok: true };
}

// Acciones en bulk: pausar / activar / destacar muchos a la vez
type BulkAction = "activate" | "pause" | "feature" | "unfeature";

export async function bulkUpdate(
  itemIds: string[],
  action: BulkAction,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };

  const data: Record<string, boolean> = {};
  if (action === "activate") data.active = true;
  else if (action === "pause") data.active = false;
  else if (action === "feature") data.featured = true;
  else if (action === "unfeature") data.featured = false;
  else return { error: "Acción no soportada" };

  try {
    const r = await prisma.product.updateMany({
      where: { itemId: { in: itemIds } },
      data,
    });
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return { ok: true, count: r.count };
  } catch (e) {
    return { error: `Error al actualizar: ${(e as Error).message}` };
  }
}

// Acción masiva sobre TODOS los productos que coinciden con el filtro
// actual (no solo los de la página visible). Sirve para "pausar todos".
type ProductFilter = { q?: string; cat?: string; filter?: string };

function buildProductWhere(f: ProductFilter) {
  const where: {
    itemId?: { not: string };
    title?: { contains: string };
    category?: string;
    active?: boolean;
    featured?: boolean;
    stock?: { lt: number };
    salePrice?: { not: null };
  } = { itemId: { not: "__RESET_PRICES_MARKER__" } };
  if (f.q) where.title = { contains: f.q };
  if (f.cat) where.category = f.cat;
  if (f.filter === "low-stock") {
    where.active = true;
    where.stock = { lt: 5 };
  } else if (f.filter === "inactive") where.active = false;
  else if (f.filter === "featured") where.featured = true;
  else if (f.filter === "on-sale") where.salePrice = { not: null };
  return where;
}

export async function bulkUpdateAll(
  filter: ProductFilter,
  action: BulkAction,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const data: Record<string, boolean> = {};
  if (action === "activate") data.active = true;
  else if (action === "pause") data.active = false;
  else if (action === "feature") data.featured = true;
  else if (action === "unfeature") data.featured = false;
  else return { error: "Acción no soportada" };

  try {
    const r = await prisma.product.updateMany({
      where: buildProductWhere(filter),
      data,
    });
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return { ok: true, count: r.count };
  } catch (e) {
    return { error: `Error al actualizar: ${(e as Error).message}` };
  }
}

// Stock masivo: reemplaza o suma/resta a los seleccionados.
// mode "set" => value es el nuevo stock para todos.
// mode "delta" => se suma value a cada stock (puede ser negativo). Nunca baja de 0.
export async function bulkSetStock(
  itemIds: string[],
  mode: "set" | "delta",
  value: number,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };
  if (!Number.isFinite(value)) return { error: "Valor inválido" };
  const v = Math.floor(value);

  try {
    if (mode === "set") {
      const stock = Math.max(0, v);
      const r = await prisma.product.updateMany({
        where: { itemId: { in: itemIds } },
        data: { stock },
      });
      revalidatePath("/admin/productos");
      revalidatePath("/tienda");
      revalidatePath("/");
      return { ok: true, count: r.count };
    }
    // delta: necesitamos leer cada stock actual
    const current = await prisma.product.findMany({
      where: { itemId: { in: itemIds } },
      select: { itemId: true, stock: true },
    });
    let count = 0;
    for (const p of current) {
      const next = Math.max(0, p.stock + v);
      if (next === p.stock) continue;
      await prisma.product.update({
        where: { itemId: p.itemId },
        data: { stock: next },
      });
      count++;
    }
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return { ok: true, count };
  } catch (e) {
    return { error: `Error al actualizar: ${(e as Error).message}` };
  }
}

// Precio masivo: reemplaza o ajusta por porcentaje.
// mode "set" => value = precio nuevo para todos los seleccionados.
// mode "pct" => multiplica precio y oferta por (1 + value/100). value puede ser negativo.
// Loguea cada cambio en el historial de precios.
export async function bulkAdjustPrice(
  itemIds: string[],
  mode: "set" | "pct",
  value: number,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };
  if (!Number.isFinite(value)) return { error: "Valor inválido" };

  try {
    const current = await prisma.product.findMany({
      where: { itemId: { in: itemIds } },
      select: { itemId: true, price: true, salePrice: true },
    });
    let count = 0;
    for (const p of current) {
      let newPrice: number;
      let newSale: number | null;
      if (mode === "set") {
        if (value < 0) continue;
        newPrice = Math.round(value);
        // Si tenía oferta, la mantenemos SOLO si sigue siendo menor
        newSale =
          p.salePrice !== null && p.salePrice < newPrice ? p.salePrice : null;
      } else {
        const factor = 1 + value / 100;
        newPrice = Math.max(0, Math.round(p.price * factor));
        newSale =
          p.salePrice !== null
            ? Math.max(0, Math.round(p.salePrice * factor))
            : null;
        // Si la oferta quedó >= al precio nuevo, la limpiamos
        if (newSale !== null && newSale >= newPrice) newSale = null;
      }
      if (newPrice === p.price && newSale === p.salePrice) continue;
      await logPriceChange({
        itemId: p.itemId,
        newPrice,
        newSalePrice: newSale,
        source: "bulk",
      });
      await prisma.product.update({
        where: { itemId: p.itemId },
        data: { price: newPrice, salePrice: newSale },
      });
      count++;
    }
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return { ok: true, count };
  } catch (e) {
    return { error: `Error al actualizar: ${(e as Error).message}` };
  }
}

// --- Galeria de imagenes del producto (hasta MAX por producto) ---
// Sincroniza Product.imageUrl con la imagen principal (position mas baja).
// El ?v invalida la cache del navegador en cada cambio.
async function syncMainImageUrl(itemId: string, productId: string) {
  const main = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  await prisma.product.update({
    where: { itemId },
    data: {
      imageUrl: main
        ? `/api/productos/${itemId}/imagen?v=${Date.now()}`
        : null,
    },
  });
}

function imgContentType(type: string): string {
  return ["image/png", "image/webp", "image/jpeg"].includes(type)
    ? type
    : "image/jpeg";
}

function revalidateProduct(itemId: string) {
  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${itemId}`);
  revalidatePath("/tienda");
  revalidatePath(`/tienda/${itemId}`);
  revalidatePath("/");
}

// Sube una o varias imagenes a un producto. Acepta archivos bajo la clave
// "image" (una) o "images" (varias). Las agrega al final de la galeria.
export async function uploadProductImage(
  itemId: string,
  formData: FormData,
): Promise<UpdateResult & { imageUrl?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const raw = [...formData.getAll("images"), ...formData.getAll("image")];
  const files = raw.filter(
    (f): f is File => f instanceof File && f.size > 0,
  );
  if (files.length === 0) return { error: "No se recibió ninguna imagen" };

  for (const f of files) {
    if (f.size > 10 * 1024 * 1024)
      return { error: `"${f.name}" supera los 10 MB` };
    if (!f.type.startsWith("image/"))
      return { error: `"${f.name}" no es una imagen` };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true },
    });
    if (!product) return { error: "Producto no encontrado" };

    const existing = await prisma.productImage.count({
      where: { productId: product.id },
    });
    const room = MAX_PRODUCT_IMAGES - existing;
    if (room <= 0)
      return {
        error: `El producto ya tiene el máximo de ${MAX_PRODUCT_IMAGES} fotos. Borrá alguna para agregar más.`,
      };

    const toAdd = files.slice(0, room);
    let pos = existing;
    for (const f of toAdd) {
      const buf = Buffer.from(await f.arrayBuffer());
      await prisma.productImage.create({
        data: {
          productId: product.id,
          data: buf,
          contentType: imgContentType(f.type),
          position: pos++,
        },
      });
    }

    await syncMainImageUrl(itemId, product.id);
    revalidateProduct(itemId);

    const imageUrl = `/api/productos/${itemId}/imagen?v=${Date.now()}`;
    return { ok: true, imageUrl, count: toAdd.length };
  } catch (e) {
    return { error: `No se pudo guardar: ${(e as Error).message}` };
  }
}

// Lista las imagenes (solo ids + posicion) para armar la galeria en el admin.
export async function listProductImages(
  itemId: string,
): Promise<{ ok: boolean; images?: ProductImageInfo[]; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };
  const product = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true },
  });
  if (!product) return { ok: false, error: "Producto no encontrado" };
  const images = await prisma.productImage.findMany({
    where: { productId: product.id },
    orderBy: { position: "asc" },
    select: { id: true, position: true },
  });
  return { ok: true, images };
}

// Borra UNA imagen de la galeria.
export async function deleteProductImageById(
  imageId: string,
  itemId: string,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true },
    });
    if (!product) return { error: "Producto no encontrado" };

    await prisma.productImage
      .delete({ where: { id: imageId } })
      .catch(() => {});

    // Renumerar las restantes 0..n
    const rest = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    for (let i = 0; i < rest.length; i++) {
      await prisma.productImage.update({
        where: { id: rest[i].id },
        data: { position: i },
      });
    }

    await syncMainImageUrl(itemId, product.id);
    revalidateProduct(itemId);
    return { ok: true };
  } catch (e) {
    return { error: `No se pudo eliminar: ${(e as Error).message}` };
  }
}

// Marca una imagen como principal (la mueve al frente de la galeria).
export async function setMainProductImage(
  imageId: string,
  itemId: string,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true },
    });
    if (!product) return { error: "Producto no encontrado" };

    const all = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { position: "asc" },
      select: { id: true },
    });
    const reordered = [
      imageId,
      ...all.map((a) => a.id).filter((id) => id !== imageId),
    ];
    for (let i = 0; i < reordered.length; i++) {
      await prisma.productImage.update({
        where: { id: reordered[i] },
        data: { position: i },
      });
    }

    await syncMainImageUrl(itemId, product.id);
    revalidateProduct(itemId);
    return { ok: true };
  } catch (e) {
    return { error: `No se pudo actualizar: ${(e as Error).message}` };
  }
}

// Quita TODAS las fotos del producto.
export async function removeProductImage(itemId: string): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true },
    });
    if (!product) return { error: "Producto no encontrado" };

    await prisma.productImage.deleteMany({
      where: { productId: product.id },
    });
    await prisma.product.update({
      where: { itemId },
      data: { imageUrl: null },
    });
    revalidateProduct(itemId);
    return { ok: true };
  } catch (e) {
    return { error: `No se pudo eliminar: ${(e as Error).message}` };
  }
}
