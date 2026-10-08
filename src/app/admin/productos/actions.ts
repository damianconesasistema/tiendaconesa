"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  MAX_PRODUCT_IMAGES,
  type ProductImageInfo,
} from "@/lib/product-images";
import { processProductImage } from "@/lib/image-processing";
import { formatShipping } from "@/lib/shipping";
import { detectarMarca, marcaPorId } from "@/lib/marcas";

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
  const shippingType = formatShipping(
    formData.getAll("shippingType").map((v) => String(v)),
  );

  // Marca: la que eligieron en el formulario y, si no, la que diga el titulo
  const brandElegida = String(formData.get("brand") || "").trim();
  const brand =
    brandElegida && marcaPorId(brandElegida)
      ? brandElegida
      : detectarMarca(title);

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
        brand,
        description,
        price,
        salePrice,
        stock,
        active,
        featured,
        memo,
        shippingType,
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

  const bloqueado = await assertUnlocked(itemId);
  if (bloqueado) return { error: bloqueado };

  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "otros");
  const brandRaw = String(formData.get("brand") || "").trim();
  const brand = brandRaw && marcaPorId(brandRaw) ? brandRaw : null;
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
  const shippingType = formatShipping(
    formData.getAll("shippingType").map((v) => String(v)),
  );

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
        brand,
        description,
        price: newPrice,
        salePrice: newSalePrice,
        stock,
        active,
        featured,
        memo,
        shippingType,
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

  const bloqueado = await assertUnlocked(itemId);
  if (bloqueado) return { error: bloqueado };

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
    // locked: false => los bloqueados con candado quedan intactos
    const r = await prisma.product.updateMany({
      where: { itemId: { in: itemIds }, locked: false },
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
type ProductFilter = { q?: string; cat?: string; filter?: string; marca?: string };

// `excluir` son los itemId que el admin destildo a mano estando en modo
// "todos los que coinciden". Sin esto, destildar uno hacia perder la
// seleccion completa y caia a los de la pagina visible.
function buildProductWhere(f: ProductFilter, excluir: string[] = []) {
  const where: {
    itemId?: { not: string; notIn?: string[] };
    title?: { contains: string; mode: "insensitive" };
    category?: string;
    active?: boolean;
    featured?: boolean;
    stock?: { lt: number };
    salePrice?: { not: null };
    brand?: string | null;
  } = {
    itemId: {
      not: "__RESET_PRICES_MARKER__",
      ...(excluir.length ? { notIn: excluir } : {}),
    },
  };
  if (f.q) where.title = { contains: f.q, mode: "insensitive" };
  if (f.cat) where.category = f.cat;
  // "sin-marca" es su propio filtro: sirve para encontrar lo que falta etiquetar
  if (f.marca) where.brand = f.marca === "sin-marca" ? null : f.marca;
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
  excluir: string[] = [],
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
      where: { ...buildProductWhere(filter, excluir), locked: false },
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

// --- Redactar descripcion con IA ---
// Busca el producto en internet (Gemini + google_search) y arma el texto.
// No guarda nada: devuelve el texto para que el admin lo revise y edite
// antes de apretar Guardar. La IA se puede equivocar, asi que la ultima
// palabra siempre la tiene la persona.
export async function redactarDescripcionIA(
  titulo: string,
  categoria: string,
): Promise<{
  ok?: true;
  texto?: string;
  fuentes?: string[];
  error?: string;
  conBusqueda?: boolean;
}> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const { redactarDescripcion } = await import("@/lib/gemini");
  return redactarDescripcion(titulo, categoria);
}

// --- Restaurar productos borrados desde el catalogo original ---
// src/data/products.json tiene los 779 productos del catalogo original con sus
// precios reales. Si se borraron por accidente, esto los vuelve a crear.
// SOLO crea los que faltan: nunca pisa un producto que ya existe en la DB,
// asi los que sobrevivieron conservan sus precios, ofertas y estado.

type RestoreStats = {
  ok?: true;
  error?: string;
  enJson?: number;
  yaExisten?: number;
  faltantes?: number;
  restaurados?: number;
};

// Se importa como modulo (NO se lee con fs en runtime): asi queda incrustado
// en el build y funciona siempre, sin depender de que el archivo fuente este
// presente en el servidor ni de cual sea el process.cwd().
async function leerCatalogoOriginal() {
  const mod = await import("@/data/products.json");
  const data = (mod.default ?? mod) as Array<{
    itemId: string;
    title: string;
    price: number;
    salePrice: number | null;
    stock: number;
    category: string;
    status?: string;
  }>;
  return data;
}

// Solo cuenta: no toca nada. Sirve para mostrar el preview antes de restaurar.
export async function previewRestore(): Promise<RestoreStats> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const catalogo = await leerCatalogoOriginal();
    const ids = catalogo.map((p) => p.itemId);
    const existentes = await prisma.product.findMany({
      where: { itemId: { in: ids } },
      select: { itemId: true },
    });
    const yaExisten = existentes.length;
    return {
      ok: true,
      enJson: catalogo.length,
      yaExisten,
      faltantes: catalogo.length - yaExisten,
    };
  } catch (e) {
    return { error: `Error al leer el catálogo: ${(e as Error).message}` };
  }
}

export async function restoreMissingProducts(): Promise<RestoreStats> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const catalogo = await leerCatalogoOriginal();
    const ids = catalogo.map((p) => p.itemId);
    const existentes = await prisma.product.findMany({
      where: { itemId: { in: ids } },
      select: { itemId: true },
    });
    const yaHay = new Set(existentes.map((e) => e.itemId));
    const faltantes = catalogo.filter((p) => !yaHay.has(p.itemId));

    if (!faltantes.length) {
      return {
        ok: true,
        enJson: catalogo.length,
        yaExisten: yaHay.size,
        faltantes: 0,
        restaurados: 0,
      };
    }

    // createMany + skipDuplicates: no puede pisar nada existente.
    const r = await prisma.product.createMany({
      data: faltantes.map((p) => ({
        itemId: p.itemId,
        title: p.title,
        category: p.category || "otros",
        price: Math.round(p.price || 0),
        salePrice: p.salePrice ? Math.round(p.salePrice) : null,
        stock: p.stock > 0 ? p.stock : 0,
        // Se restauran PAUSADOS a proposito: que el admin revise precio y
        // stock antes de que vuelvan a aparecer en la tienda.
        active: false,
        featured: false,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return {
      ok: true,
      enJson: catalogo.length,
      yaExisten: yaHay.size,
      faltantes: faltantes.length,
      restaurados: r.count,
    };
  } catch (e) {
    return { error: `Error al restaurar: ${(e as Error).message}` };
  }
}

// --- Restaurar desde un archivo de backup (el JSON de /api/.../backup) ---
// A diferencia de restoreMissingProducts (que lee el catalogo original y por
// lo tanto NO tiene los articulos de alta manual), esto restaura exactamente
// lo que habia cuando se hizo el backup, fotos incluidas si el backup las trae.
//
// Por defecto SOLO crea los que faltan. Con pisarExistentes=true tambien
// actualiza los que ya estan (ojo: sobrescribe precios y estado actuales).

type BackupFoto = { position: number; contentType: string; data: string };
type BackupProducto = {
  itemId: string;
  sku: string | null;
  title: string;
  description: string | null;
  category: string;
  price: number;
  salePrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  locked?: boolean;
  memo: string | null;
  shippingType: string | null;
  imageUrl: string | null;
  fotos?: BackupFoto[];
};

export async function restoreFromBackup(
  json: string,
  pisarExistentes = false,
): Promise<{
  ok?: true;
  error?: string;
  creados?: number;
  actualizados?: number;
  fotos?: number;
  enBackup?: number;
}> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  let parsed: { formato?: string; productos?: BackupProducto[] };
  try {
    parsed = JSON.parse(json);
  } catch {
    return { error: "El archivo no es un JSON válido" };
  }
  if (parsed.formato !== "conesa-backup-productos" || !parsed.productos) {
    return {
      error:
        "Ese archivo no es un backup de Conesa. Usá el que baja el botón 'Backup'.",
    };
  }

  const productos = parsed.productos;
  let creados = 0;
  let actualizados = 0;
  let fotos = 0;

  try {
    for (const p of productos) {
      if (!p.itemId || !p.title) continue;

      const existe = await prisma.product.findUnique({
        where: { itemId: p.itemId },
        select: { id: true },
      });

      if (existe && !pisarExistentes) continue;

      const data = {
        title: p.title,
        description: p.description ?? null,
        category: p.category || "otros",
        price: Math.round(p.price || 0),
        salePrice: p.salePrice != null ? Math.round(p.salePrice) : null,
        stock: Math.max(0, Math.floor(p.stock || 0)),
        active: !!p.active,
        featured: !!p.featured,
        locked: !!p.locked,
        memo: p.memo ?? null,
        shippingType: p.shippingType ?? "ambos",
        imageUrl: p.imageUrl ?? null,
        // sku es unique: si choca con otro producto lo dejamos vacio
        sku: p.sku ?? null,
      };

      let productId: string;
      if (existe) {
        const up = await prisma.product.update({
          where: { itemId: p.itemId },
          data,
          select: { id: true },
        });
        productId = up.id;
        actualizados++;
      } else {
        const cr = await prisma.product.create({
          data: { itemId: p.itemId, ...data },
          select: { id: true },
        });
        productId = cr.id;
        creados++;
      }

      // Fotos: solo si el backup las trae y el producto no tiene ninguna,
      // para no duplicar galerias al re-restaurar.
      if (p.fotos && p.fotos.length) {
        const yaTiene = await prisma.productImage.count({ where: { productId } });
        if (yaTiene === 0) {
          for (const f of p.fotos) {
            await prisma.productImage.create({
              data: {
                productId,
                data: Buffer.from(f.data, "base64"),
                contentType: f.contentType || "image/jpeg",
                position: f.position ?? 0,
              },
            });
            fotos++;
          }
          await prisma.product.update({
            where: { id: productId },
            data: {
              imageUrl: `/api/productos/${p.itemId}/imagen?v=${Date.now()}`,
            },
          });
        }
      }
    }

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return {
      ok: true,
      creados,
      actualizados,
      fotos,
      enBackup: productos.length,
    };
  } catch (e) {
    return { error: `Error al restaurar: ${(e as Error).message}` };
  }
}

// --- Duplicar publicacion ---
// Copia un producto entero (campos + galeria de fotos) con un itemId nuevo.
// Queda PAUSADO y sin candado, listo para editar y publicar.

export async function duplicateProduct(
  itemId: string,
): Promise<{ ok?: true; error?: string; itemId?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  try {
    const orig = await prisma.product.findUnique({
      where: { itemId },
      include: { images: { orderBy: { position: "asc" } } },
    });
    if (!orig) return { error: "El producto no existe" };

    // itemId nuevo y unico. COPIA-<timestamp36>-<random> es corto y no choca.
    const nuevoItemId = `COPIA-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const copia = await prisma.product.create({
      data: {
        itemId: nuevoItemId,
        // sku es unique: no se copia, lo completa el admin
        sku: null,
        title: `${orig.title} (copia)`,
        description: orig.description,
        category: orig.category,
        price: orig.price,
        salePrice: orig.salePrice,
        stock: orig.stock,
        // Pausado y sin destacar: que no salga solo a la tienda
        active: false,
        featured: false,
        locked: false,
        memo: orig.memo,
        shippingType: orig.shippingType,
        imageUrl: null,
      },
      select: { id: true },
    });

    // Copiar la galeria de fotos
    for (const img of orig.images) {
      await prisma.productImage.create({
        data: {
          productId: copia.id,
          data: img.data,
          contentType: img.contentType,
          position: img.position,
        },
      });
    }
    if (orig.images.length) {
      await prisma.product.update({
        where: { id: copia.id },
        data: {
          imageUrl: `/api/productos/${nuevoItemId}/imagen?v=${Date.now()}`,
        },
      });
    }

    revalidatePath("/admin/productos");
    return { ok: true, itemId: nuevoItemId };
  } catch (e) {
    return { error: `Error al duplicar: ${(e as Error).message}` };
  }
}

// --- Candado (locked) ---
// Un producto con locked=true no se puede editar ni eliminar. Es la red de
// seguridad contra cambios masivos accidentales: las acciones masivas lo
// saltean en vez de tocarlo, y las individuales devuelven error.

// Devuelve un mensaje de error si el producto esta bloqueado; null si se puede tocar.
async function assertUnlocked(itemId: string): Promise<string | null> {
  const p = await prisma.product.findUnique({
    where: { itemId },
    select: { locked: true, title: true },
  });
  if (!p) return "El producto no existe";
  if (p.locked)
    return `"${p.title}" está bloqueado con candado 🔒. Quitá el candado para poder modificarlo.`;
  return null;
}

export async function setProductLocked(
  itemId: string,
  locked: boolean,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemId) return { error: "itemId requerido" };
  try {
    await prisma.product.update({ where: { itemId }, data: { locked } });
    revalidatePath("/admin/productos");
    return { ok: true };
  } catch (e) {
    return { error: `Error: ${(e as Error).message}` };
  }
}

// Candado masivo sobre los seleccionados o sobre todo el filtro.
export async function bulkSetLocked(
  itemIds: string[],
  locked: boolean,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };
  try {
    const r = await prisma.product.updateMany({
      where: { itemId: { in: itemIds } },
      data: { locked },
    });
    revalidatePath("/admin/productos");
    return { ok: true, count: r.count };
  } catch (e) {
    return { error: `Error: ${(e as Error).message}` };
  }
}

export async function bulkSetLockedAll(
  filter: ProductFilter,
  locked: boolean,
  excluir: string[] = [],
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const r = await prisma.product.updateMany({
      where: buildProductWhere(filter, excluir),
      data: { locked },
    });
    revalidatePath("/admin/productos");
    return { ok: true, count: r.count };
  } catch (e) {
    return { error: `Error: ${(e as Error).message}` };
  }
}

// --- Eliminar productos ---
// OJO: un producto que ya fue vendido NO se puede borrar. OrderItem apunta a
// Product sin onDelete:Cascade (es Restrict), asi que borrarlo romperia el
// historial de pedidos. En esos casos avisamos y sugerimos pausar / sin stock.
// Las imagenes y el historial de precios SI se borran solos (tienen Cascade).

export async function deleteProduct(
  itemId: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: {
        title: true,
        locked: true,
        _count: { select: { orderItems: true } },
      },
    });
    if (!product) return { error: "El producto ya no existe" };

    if (product.locked)
      return {
        error: `"${product.title}" está bloqueado con candado 🔒. Quitá el candado para poder eliminarlo.`,
      };

    const vendido = product._count.orderItems;
    if (vendido > 0) {
      return {
        error: `No se puede eliminar "${product.title}": está en ${vendido} pedido${vendido === 1 ? "" : "s"} y se perdería el historial de ventas. Pausalo o ponelo en stock 0 para sacarlo de la tienda.`,
      };
    }

    await prisma.product.delete({ where: { itemId } });
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { error: `Error al eliminar: ${(e as Error).message}` };
  }
}

// Borrado masivo. Solo borra los que NO esten en ningun pedido; el resto se
// informa como "omitidos" para que el admin sepa que quedaron sin tocar.
async function deleteWhere(
  where: Prisma.ProductWhereInput,
): Promise<{ ok?: true; error?: string; count?: number; skipped?: number }> {
  try {
    const total = await prisma.product.count({ where });
    // Nunca borramos bloqueados ni vendidos: se omiten y se reportan.
    const r = await prisma.product.deleteMany({
      where: { ...where, locked: false, orderItems: { none: {} } },
    });
    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    revalidatePath("/");
    return { ok: true, count: r.count, skipped: total - r.count };
  } catch (e) {
    return { error: `Error al eliminar: ${(e as Error).message}` };
  }
}

export async function bulkDelete(
  itemIds: string[],
): Promise<{ ok?: true; error?: string; count?: number; skipped?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };
  return deleteWhere({ itemId: { in: itemIds } });
}

export async function bulkDeleteAll(
  filter: ProductFilter,
  excluir: string[] = [],
): Promise<{ ok?: true; error?: string; count?: number; skipped?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  return deleteWhere(buildProductWhere(filter, excluir));
}

// Stock masivo: reemplaza o suma/resta a un conjunto de productos definido
// por un `where` de Prisma (sea por IDs de la pagina o por filtro => TODOS).
// mode "set" => value es el nuevo stock para todos.
// mode "delta" => se suma value a cada stock (puede ser negativo). Nunca baja de 0.
async function applyStockWhere(
  whereIn: Prisma.ProductWhereInput,
  mode: "set" | "delta",
  value: number,
): Promise<{ ok?: true; error?: string; count?: number }> {
  if (!Number.isFinite(value)) return { error: "Valor inválido" };
  const v = Math.floor(value);
  // Los bloqueados con candado nunca se tocan
  const where: Prisma.ProductWhereInput = { ...whereIn, locked: false };

  try {
    if (mode === "set") {
      const stock = Math.max(0, v);
      const r = await prisma.product.updateMany({ where, data: { stock } });
      revalidatePath("/admin/productos");
      revalidatePath("/tienda");
      revalidatePath("/");
      return { ok: true, count: r.count };
    }
    // delta: necesitamos leer cada stock actual
    const current = await prisma.product.findMany({
      where,
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

export async function bulkSetStock(
  itemIds: string[],
  mode: "set" | "delta",
  value: number,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };
  return applyStockWhere({ itemId: { in: itemIds } }, mode, value);
}

// Igual que bulkSetStock pero aplica a TODOS los que coinciden con el filtro
// (no solo la pagina visible).
export async function bulkSetStockAll(
  filter: ProductFilter,
  mode: "set" | "delta",
  value: number,
  excluir: string[] = [],
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  return applyStockWhere(buildProductWhere(filter, excluir), mode, value);
}

// Precio masivo: reemplaza o ajusta por porcentaje sobre el conjunto que
// define `where` (IDs de la pagina o filtro => TODOS).
// mode "set" => value = precio nuevo para todos.
// mode "pct" => multiplica precio y oferta por (1 + value/100). value puede ser negativo.
// Loguea cada cambio en el historial de precios.
async function applyPriceWhere(
  whereIn: Prisma.ProductWhereInput,
  mode: "set" | "pct",
  value: number,
): Promise<{ ok?: true; error?: string; count?: number }> {
  if (!Number.isFinite(value)) return { error: "Valor inválido" };
  // Los bloqueados con candado nunca se tocan
  const where: Prisma.ProductWhereInput = { ...whereIn, locked: false };

  try {
    const current = await prisma.product.findMany({
      where,
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

export async function bulkAdjustPrice(
  itemIds: string[],
  mode: "set" | "pct",
  value: number,
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!itemIds.length) return { error: "Ningún producto seleccionado" };
  return applyPriceWhere({ itemId: { in: itemIds } }, mode, value);
}

// Igual que bulkAdjustPrice pero aplica a TODOS los que coinciden con el filtro.
export async function bulkAdjustPriceAll(
  filter: ProductFilter,
  mode: "set" | "pct",
  value: number,
  excluir: string[] = [],
): Promise<{ ok?: true; error?: string; count?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  return applyPriceWhere(buildProductWhere(filter, excluir), mode, value);
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
      const raw = Buffer.from(await f.arrayBuffer());
      const { data, contentType } = await processProductImage(raw);
      await prisma.productImage.create({
        data: {
          productId: product.id,
          data,
          contentType,
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

// Reordena toda la galeria segun el orden de ids recibido.
export async function reorderProductImages(
  itemId: string,
  orderedIds: string[],
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const product = await prisma.product.findUnique({
      where: { itemId },
      select: { id: true },
    });
    if (!product) return { error: "Producto no encontrado" };

    // Solo reordenamos ids que realmente pertenecen al producto
    const owned = await prisma.productImage.findMany({
      where: { productId: product.id },
      select: { id: true },
    });
    const ownedSet = new Set(owned.map((o) => o.id));
    const finalOrder = orderedIds.filter((id) => ownedSet.has(id));
    // por si quedó alguno afuera, lo agregamos al final
    for (const o of owned) if (!finalOrder.includes(o.id)) finalOrder.push(o.id);

    for (let i = 0; i < finalOrder.length; i++) {
      await prisma.productImage.update({
        where: { id: finalOrder[i] },
        data: { position: i },
      });
    }

    await syncMainImageUrl(itemId, product.id);
    revalidateProduct(itemId);
    return { ok: true };
  } catch (e) {
    return { error: `No se pudo reordenar: ${(e as Error).message}` };
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

// Etiqueta la marca leyendola del titulo. Es para ponerse al dia con lo que
// ya esta cargado: por defecto solo toca lo que no tiene marca, asi lo que el
// admin corrigio a mano no se pisa. Con sobrescribir=true vuelve a pasar por
// todos (sirve si se agrega una marca nueva al catalogo).
export async function asignarMarcasAuto(
  sobrescribir = false,
): Promise<{ ok?: true; error?: string; etiquetados?: number; sinMarca?: number }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  try {
    const productos = await prisma.product.findMany({
      where: {
        itemId: { not: "__RESET_PRICES_MARKER__" },
        ...(sobrescribir ? {} : { brand: null }),
      },
      select: { id: true, title: true },
    });

    // Agrupamos por marca y hacemos un updateMany por cada una: 20 consultas
    // en vez de una por producto.
    const porMarca = new Map<string, string[]>();
    let sinMarca = 0;
    for (const p of productos) {
      const marca = detectarMarca(p.title);
      if (!marca) {
        sinMarca++;
        continue;
      }
      const lista = porMarca.get(marca);
      if (lista) lista.push(p.id);
      else porMarca.set(marca, [p.id]);
    }

    let etiquetados = 0;
    for (const [marca, ids] of porMarca) {
      const r = await prisma.product.updateMany({
        where: { id: { in: ids } },
        data: { brand: marca },
      });
      etiquetados += r.count;
    }

    revalidatePath("/admin/productos");
    revalidatePath("/tienda");
    return { ok: true, etiquetados, sinMarca };
  } catch (e) {
    return { error: `Error: ${(e as Error).message}` };
  }
}

// Marca de a uno, desde la tabla o la ficha. Cadena vacia la saca.
export async function setProductBrand(
  itemId: string,
  brand: string,
): Promise<UpdateResult> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const limpio = brand.trim();
  if (limpio && !marcaPorId(limpio)) return { error: "Marca desconocida" };
  const bloqueado = await assertUnlocked(itemId);
  if (bloqueado) return { error: bloqueado };
  try {
    await prisma.product.update({
      where: { itemId },
      data: { brand: limpio || null },
    });
    revalidatePath("/admin/productos");
    revalidatePath(`/tienda/${itemId}`);
    return { ok: true };
  } catch (e) {
    return { error: `Error: ${(e as Error).message}` };
  }
}
