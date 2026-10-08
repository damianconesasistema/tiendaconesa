"use server";

import * as XLSX from "xlsx";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { detectarMarca, marcaPorId } from "@/lib/marcas";

export type ParsedRow = {
  itemId: string;
  sku: string | null;
  title: string;
  category: string;
  brand: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  description: string | null;
  memo: string | null;
  imageUrl: string | null;
  // Metadata del parseo
  __rowNumber: number;
  __errors: string[];
  __exists: boolean; // ya está en DB
  __hasActive: boolean; // la fila traía explícito el campo "activo"
  __hasFeatured: boolean; // la fila traía explícito el campo "destacado"
  __traeMarca: boolean; // la fila traía explícito el campo "marca"
};

export type ParseResult = {
  ok: boolean;
  error?: string;
  rows?: ParsedRow[];
  stats?: {
    total: number;
    valid: number;
    withErrors: number;
    toCreate: number;
    toUpdate: number;
    withImage: number;
  };
};

// Normaliza nombres de columnas: trim, lowercase, saca acentos
function norm(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Mapeo de aliases de columna a campo canónico
const COL_ALIASES: Record<string, string> = {
  codigo: "itemId",
  code: "itemId",
  id: "itemId",
  itemid: "itemId",
  mla: "itemId",

  sku: "sku",
  codigo_interno: "sku",
  "codigo interno": "sku",

  memo: "memo",
  nota: "memo",
  observacion: "memo",
  observaciones: "memo",
  ayudamemoria: "memo",
  "ayuda memoria": "memo",

  titulo: "title",
  nombre: "title",
  producto: "title",
  name: "title",
  title: "title",

  precio: "price",
  "precio base": "price",
  precio_base: "price",
  price: "price",

  oferta: "salePrice",
  "precio oferta": "salePrice",
  precio_oferta: "salePrice",
  descuento: "salePrice",
  saleprice: "salePrice",

  stock: "stock",
  cantidad: "stock",
  disponible: "stock",

  marca: "brand",
  brand: "brand",

  categoria: "category",
  cat: "category",
  category: "category",

  activo: "active",
  publicado: "active",
  active: "active",

  destacado: "featured",
  featured: "featured",

  descripcion: "description",
  description: "description",
  detalle: "description",

  imagen: "imageUrl",
  foto: "imageUrl",
  "imagen url": "imageUrl",
  imagen_url: "imageUrl",
  imageurl: "imageUrl",
};

const VALID_CATEGORIES = new Set([
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

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return (
    s === "si" ||
    s === "sí" ||
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "activo" ||
    s === "publicado"
  );
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v === null || v === undefined || v === "") return null;
  // Soportar "15.000,50" / "15,000.50" / "15000"
  const s = String(v).trim().replace(/[^\d,.-]/g, "");
  if (!s) return null;
  // Si tiene coma Y punto, el último decimal es el final (es-AR)
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized = s;
  if (lastComma > lastDot) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = s.replace(/,/g, "");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeCategory(v: unknown): string {
  const raw = norm(String(v || ""));
  if (VALID_CATEGORIES.has(raw)) return raw;
  // Mapeos comunes a nuestras categorias
  if (raw.includes("grif")) return "griferia";
  if (raw.includes("sanit") || raw.includes("inod")) return "sanitarios";
  if (raw.includes("ban") || raw.includes("tina")) return "banera";
  if (raw.includes("salam") || raw.includes("estufa")) return "salamandras";
  if (raw.includes("calef") || raw.includes("termo")) return "calefones";
  if (raw.includes("acc") || raw.includes("espejo")) return "accesorios";
  if (raw.includes("pil") || raw.includes("bacha")) return "piletas";
  if (raw.includes("mat") || raw.includes("ceme") || raw.includes("hierro"))
    return "materiales";
  return "otros";
}

export async function previewExcel(formData: FormData): Promise<ParseResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No se recibió el archivo" };

  if (file.size > 10 * 1024 * 1024)
    return { ok: false, error: "El archivo no puede superar 10 MB" };

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { ok: false, error: "Excel sin hojas" };
    const sheet = wb.Sheets[sheetName];
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    if (raw.length === 0)
      return { ok: false, error: "La hoja está vacía" };

    // Mapear nombres de columnas a canónicos
    const originalKeys = Object.keys(raw[0]);
    const keyMap: Record<string, string> = {};
    for (const k of originalKeys) {
      const canonical = COL_ALIASES[norm(k)];
      if (canonical) keyMap[k] = canonical;
    }

    // Pre-chequeo: columnas mínimas
    const canonicals = new Set(Object.values(keyMap));
    const missing: string[] = [];
    if (!canonicals.has("itemId")) missing.push("código");
    if (!canonicals.has("title")) missing.push("título");
    if (!canonicals.has("price")) missing.push("precio");
    if (missing.length) {
      return {
        ok: false,
        error: `Faltan columnas obligatorias: ${missing.join(", ")}. Usá la plantilla.`,
      };
    }

    // Obtener itemIds existentes en DB en una query
    const normalized: ParsedRow[] = [];
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      const parsed: Record<string, unknown> = {};
      for (const [orig, canonical] of Object.entries(keyMap)) {
        parsed[canonical] = row[orig];
      }
      const errors: string[] = [];
      const itemId = String(parsed.itemId ?? "").trim();
      if (!itemId) errors.push("itemId vacío");

      const title = String(parsed.title ?? "").trim();
      if (!title) errors.push("título vacío");

      const price = toNumber(parsed.price);
      if (price === null || price < 0) errors.push("precio inválido");

      const salePrice = toNumber(parsed.salePrice);
      if (salePrice !== null && price !== null && salePrice >= price)
        errors.push("oferta >= precio");

      const stockRaw = toNumber(parsed.stock);
      const stock = stockRaw !== null ? Math.max(0, Math.floor(stockRaw)) : 0;

      const category = normalizeCategory(parsed.category);
      // La marca puede venir como slug (fv) o como nombre (FV). Si la columna
      // no esta, la sacamos del titulo igual que al dar de alta a mano.
      const marcaCruda = parsed.brand ? String(parsed.brand).trim() : "";
      const traeMarca = marcaCruda !== "";
      const brand = traeMarca
        ? marcaPorId(marcaCruda.toLowerCase())?.id ??
          detectarMarca(marcaCruda) ??
          detectarMarca(title)
        : detectarMarca(title);
      const hasActive =
        parsed.active !== undefined &&
        parsed.active !== null &&
        String(parsed.active).trim() !== "";
      const hasFeatured =
        parsed.featured !== undefined &&
        parsed.featured !== null &&
        String(parsed.featured).trim() !== "";
      const active = hasActive ? toBool(parsed.active) : true;
      const featured = hasFeatured ? toBool(parsed.featured) : false;
      const description = parsed.description
        ? String(parsed.description).trim()
        : null;
      const imageUrl = parsed.imageUrl
        ? String(parsed.imageUrl).trim()
        : null;
      const sku = parsed.sku ? String(parsed.sku).trim() || null : null;
      const memo = parsed.memo ? String(parsed.memo).trim() || null : null;

      normalized.push({
        itemId,
        sku,
        title,
        category,
        brand,
        __traeMarca: traeMarca,
        price: price ?? 0,
        salePrice: salePrice === null ? null : Math.round(salePrice),
        stock,
        active,
        featured,
        description,
        memo,
        imageUrl,
        __rowNumber: i + 2, // +2 porque Excel es 1-indexed y hay header
        __errors: errors,
        __exists: false,
        __hasActive: hasActive,
        __hasFeatured: hasFeatured,
      });
    }

    // Marcar cuáles ya existen
    const ids = normalized.map((r) => r.itemId).filter(Boolean);
    const existing = await prisma.product.findMany({
      where: { itemId: { in: ids } },
      select: { itemId: true },
    });
    const existingSet = new Set(existing.map((e) => e.itemId));
    for (const r of normalized) {
      r.__exists = existingSet.has(r.itemId);
    }

    const valid = normalized.filter((r) => r.__errors.length === 0);
    return {
      ok: true,
      rows: normalized,
      stats: {
        total: normalized.length,
        valid: valid.length,
        withErrors: normalized.length - valid.length,
        toCreate: valid.filter((r) => !r.__exists).length,
        toUpdate: valid.filter((r) => r.__exists).length,
        withImage: valid.filter((r) => r.imageUrl).length,
      },
    };
  } catch (e) {
    return { ok: false, error: `Error al leer Excel: ${(e as Error).message}` };
  }
}

export type ImportResult = {
  ok: boolean;
  error?: string;
  stats?: {
    created: number;
    updated: number;
    imagesDownloaded: number;
    imagesFailed: number;
    rowsSkipped: number;
  };
};

export async function importExcel(
  rows: ParsedRow[],
  options: { downloadImages: boolean },
): Promise<ImportResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const valid = rows.filter((r) => r.__errors.length === 0);
  let created = 0;
  let updated = 0;
  let imagesDownloaded = 0;
  let imagesFailed = 0;

  for (const row of valid) {
    try {
      let finalImageUrl: string | null = null;

      // Descargar imagen si hay URL y se pidió
      if (options.downloadImages && row.imageUrl) {
        try {
          const r = await fetch(row.imageUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          if (r.ok) {
            const ct = r.headers.get("content-type") || "";
            if (ct.startsWith("image/")) {
              const buf = Buffer.from(await r.arrayBuffer());
              if (buf.length > 0 && buf.length < 8 * 1024 * 1024) {
                const ext = ct.includes("png")
                  ? "png"
                  : ct.includes("webp")
                    ? "webp"
                    : "jpg";
                const dir = path.join(process.cwd(), "public", "products");
                await mkdir(dir, { recursive: true });
                const relPath = `/products/${row.itemId}.${ext}`;
                const absPath = path.join(dir, `${row.itemId}.${ext}`);
                await writeFile(absPath, buf);
                finalImageUrl = `${relPath}?v=${Date.now()}`;
                imagesDownloaded++;
              }
            }
          } else {
            imagesFailed++;
          }
        } catch {
          imagesFailed++;
        }
      }

      // Al CREAR: usamos los valores (con defaults).
      const createData = {
        itemId: row.itemId,
        sku: row.sku,
        title: row.title,
        category: row.category,
        brand: row.brand,
        price: Math.round(row.price),
        salePrice: row.salePrice,
        stock: row.stock,
        active: row.active,
        featured: row.featured,
        description: row.description,
        memo: row.memo,
        ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
      };

      // Al ACTUALIZAR: NO tocamos active/featured si el Excel no traía
      // esas columnas (para no re-activar productos pausados sin querer).
      const updateData: Record<string, unknown> = {
        title: row.title,
        category: row.category,
        price: Math.round(row.price),
        salePrice: row.salePrice,
        stock: row.stock,
        description: row.description,
        ...(row.__traeMarca && row.brand ? { brand: row.brand } : {}),
        ...(row.sku !== null ? { sku: row.sku } : {}),
        ...(row.memo !== null ? { memo: row.memo } : {}),
        ...(row.__hasActive ? { active: row.active } : {}),
        ...(row.__hasFeatured ? { featured: row.featured } : {}),
        ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
      };

      const result = await prisma.product.upsert({
        where: { itemId: row.itemId },
        create: createData,
        update: updateData,
      });
      // En updates `createdAt === updatedAt` ya no es cierto, uso otra heurística:
      // chequeo si existía
      if (row.__exists) updated++;
      else created++;
      void result;
    } catch {
      // skip row con error de DB
    }
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  return {
    ok: true,
    stats: {
      created,
      updated,
      imagesDownloaded,
      imagesFailed,
      rowsSkipped: rows.length - valid.length,
    },
  };
}
