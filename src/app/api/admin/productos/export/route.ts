import * as XLSX from "xlsx";
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// Exporta los productos (respetando los filtros de /admin/productos) en Excel
// listo para editar y re-importar.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return new Response("No autorizado", { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || "";
  const cat = sp.get("cat") || "";
  const filter = sp.get("filter") || "";

  const where: Prisma.ProductWhereInput = {
    itemId: { not: "__RESET_PRICES_MARKER__" },
  };
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (cat) where.category = cat;
  if (filter === "low-stock") {
    where.active = true;
    where.stock = { lt: 5 };
  } else if (filter === "inactive") where.active = false;
  else if (filter === "featured") where.featured = true;
  else if (filter === "on-sale") where.salePrice = { not: null };

  const products = await prisma.product.findMany({
    where,
    orderBy: [
      { salePrice: { sort: "desc", nulls: "last" } },
      { featured: "desc" },
      { title: "asc" },
    ],
  });

  // Fila por producto con el mismo esquema que acepta el import
  const rows = products.map((p) => ({
    codigo: p.itemId,
    sku: p.sku ?? "",
    titulo: p.title,
    categoria: p.category,
    precio: p.price,
    oferta: p.salePrice ?? "",
    stock: p.stock,
    activo: p.active ? "SI" : "NO",
    destacado: p.featured ? "SI" : "NO",
    descripcion: p.description ?? "",
    memo: p.memo ?? "",
    imagen_url: p.imageUrl ? absoluteOrEmpty(req, p.imageUrl) : "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, {
    header: [
      "codigo",
      "sku",
      "titulo",
      "categoria",
      "precio",
      "oferta",
      "stock",
      "activo",
      "destacado",
      "descripcion",
      "memo",
      "imagen_url",
    ],
  });

  // Ancho sugerido de columnas
  ws["!cols"] = [
    { wch: 16 }, // codigo
    { wch: 14 }, // sku
    { wch: 42 }, // titulo
    { wch: 14 }, // categoria
    { wch: 12 }, // precio
    { wch: 12 }, // oferta
    { wch: 8 }, // stock
    { wch: 8 }, // activo
    { wch: 10 }, // destacado
    { wch: 40 }, // descripcion
    { wch: 30 }, // memo
    { wch: 40 }, // imagen_url
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Productos");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const now = new Date();
  const stamp =
    now.toISOString().slice(0, 10) + "_" + now.toTimeString().slice(0, 5).replace(":", "-");
  const suffix = [cat, filter].filter(Boolean).join("-");
  const filename = `productos-conesa_${stamp}${suffix ? `_${suffix}` : ""}.xlsx`;

  // Convertir Buffer a Uint8Array para evitar warning de deprecacion
  const u8 = new Uint8Array(buf);

  return new Response(u8, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function absoluteOrEmpty(req: NextRequest, pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  // El imageUrl guardado es tipo "/products/MLA123.jpg?v=12345"
  const origin = req.nextUrl.origin;
  return `${origin}${pathOrUrl}`;
}
