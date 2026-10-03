"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

export type SyncRow = {
  sku: string;
  stock: number;
  __rowNumber: number;
  __errors: string[];
  __matched: boolean; // encontrado por SKU o itemId
  __matchField?: "sku" | "itemId";
  __currentStock?: number;
  __currentTitle?: string;
};

export type SyncParse = {
  ok: boolean;
  error?: string;
  rows?: SyncRow[];
  stats?: {
    total: number;
    valid: number;
    withErrors: number;
    matched: number;
    unmatched: number;
  };
};

function norm(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const SKU_ALIASES = ["sku", "codigo", "code", "id", "itemid", "mla"];
const STOCK_ALIASES = ["stock", "cantidad", "disponible", "unidades"];

export async function previewStockSync(formData: FormData): Promise<SyncParse> {
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
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return { ok: false, error: "Excel sin hojas" };
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
    });
    if (!raw.length) return { ok: false, error: "La hoja está vacía" };

    // Detectar columnas sku y stock
    const keys = Object.keys(raw[0]);
    const skuKey = keys.find((k) => SKU_ALIASES.includes(norm(k)));
    const stockKey = keys.find((k) => STOCK_ALIASES.includes(norm(k)));
    if (!skuKey || !stockKey)
      return {
        ok: false,
        error: `El Excel debe tener columnas SKU y Stock. Columnas detectadas: ${keys.join(", ")}`,
      };

    const rows: SyncRow[] = raw.map((r, i) => {
      const sku = String(r[skuKey] ?? "").trim();
      const stockRaw = r[stockKey];
      const stockN = Number(String(stockRaw ?? "0").replace(/[^\d.-]/g, ""));
      const stock = Number.isFinite(stockN) ? Math.max(0, Math.floor(stockN)) : NaN;
      const errors: string[] = [];
      if (!sku) errors.push("SKU vacío");
      if (!Number.isFinite(stock)) errors.push("stock inválido");
      return {
        sku,
        stock: Number.isFinite(stock) ? stock : 0,
        __rowNumber: i + 2,
        __errors: errors,
        __matched: false,
      };
    });

    // Buscar match: primero por sku, después por itemId (fallback para los que no tengan sku todavía)
    const skus = rows.map((r) => r.sku).filter(Boolean);
    const bySku = await prisma.product.findMany({
      where: { sku: { in: skus } },
      select: { sku: true, title: true, stock: true },
    });
    const skuMap = new Map(bySku.map((p) => [p.sku!, p]));
    const unmatchedSkus = skus.filter((s) => !skuMap.has(s));
    const byItemId = await prisma.product.findMany({
      where: { itemId: { in: unmatchedSkus } },
      select: { itemId: true, title: true, stock: true },
    });
    const itemIdMap = new Map(byItemId.map((p) => [p.itemId, p]));

    for (const r of rows) {
      if (!r.sku) continue;
      const bySkuHit = skuMap.get(r.sku);
      if (bySkuHit) {
        r.__matched = true;
        r.__matchField = "sku";
        r.__currentStock = bySkuHit.stock;
        r.__currentTitle = bySkuHit.title;
        continue;
      }
      const byIdHit = itemIdMap.get(r.sku);
      if (byIdHit) {
        r.__matched = true;
        r.__matchField = "itemId";
        r.__currentStock = byIdHit.stock;
        r.__currentTitle = byIdHit.title;
      }
    }

    const valid = rows.filter((r) => r.__errors.length === 0);
    return {
      ok: true,
      rows,
      stats: {
        total: rows.length,
        valid: valid.length,
        withErrors: rows.length - valid.length,
        matched: valid.filter((r) => r.__matched).length,
        unmatched: valid.filter((r) => !r.__matched).length,
      },
    };
  } catch (e) {
    return { ok: false, error: `Error al leer: ${(e as Error).message}` };
  }
}

export async function applyStockSync(
  rows: SyncRow[],
): Promise<{ ok: boolean; error?: string; updated?: number; unmatched?: number }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const valid = rows.filter((r) => r.__errors.length === 0 && r.__matched);
  let updated = 0;
  for (const r of valid) {
    try {
      const where =
        r.__matchField === "sku"
          ? { sku: r.sku }
          : { itemId: r.sku };
      await prisma.product.update({ where, data: { stock: r.stock } });
      updated++;
    } catch {
      /* skip */
    }
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  return {
    ok: true,
    updated,
    unmatched: rows.filter((r) => r.__errors.length === 0 && !r.__matched).length,
  };
}
