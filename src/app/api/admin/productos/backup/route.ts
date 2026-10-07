// GET /api/admin/productos/backup
// Backup COMPLETO de todos los productos en JSON, con todos los campos.
// A diferencia del Excel (que es para editar y re-importar), esto guarda
// absolutamente todo, incluidos los articulos dados de alta a mano, que no
// estan en el catalogo original src/data/products.json.
//
//   ?fotos=1  -> incluye tambien las fotos de la galeria en base64.
//                Pesa MUCHO mas. Hay un tope de seguridad.
//
// Se restaura desde /admin/productos/restaurar.
import type { NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

// Tope para que el backup con fotos no tumbe el server ni el navegador.
const MAX_FOTOS_BYTES = 150 * 1024 * 1024; // 150 MB

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const conFotos = req.nextUrl.searchParams.get("fotos") === "1";

  const products = await prisma.product.findMany({
    where: { itemId: { not: "__RESET_PRICES_MARKER__" } },
    orderBy: { title: "asc" },
  });

  type FotoBackup = { position: number; contentType: string; data: string };
  const fotosPorProducto = new Map<string, FotoBackup[]>();
  let fotosIncluidas = 0;
  let fotosOmitidasPorTamano = 0;

  if (conFotos) {
    let acumulado = 0;
    // De a tandas para no cargar todas las imagenes en memoria de una.
    const ids = products.map((p) => p.id);
    const TANDA = 25;
    for (let i = 0; i < ids.length; i += TANDA) {
      const lote = await prisma.productImage.findMany({
        where: { productId: { in: ids.slice(i, i + TANDA) } },
        orderBy: { position: "asc" },
      });
      for (const img of lote) {
        const buf = Buffer.from(img.data);
        if (acumulado + buf.length > MAX_FOTOS_BYTES) {
          fotosOmitidasPorTamano++;
          continue;
        }
        acumulado += buf.length;
        fotosIncluidas++;
        const arr = fotosPorProducto.get(img.productId) ?? [];
        arr.push({
          position: img.position,
          contentType: img.contentType,
          data: buf.toString("base64"),
        });
        fotosPorProducto.set(img.productId, arr);
      }
    }
  }

  const backup = {
    formato: "conesa-backup-productos",
    version: 1,
    fecha: new Date().toISOString(),
    incluyeFotos: conFotos,
    totalProductos: products.length,
    fotosIncluidas,
    fotosOmitidasPorTamano,
    productos: products.map((p) => ({
      itemId: p.itemId,
      sku: p.sku,
      title: p.title,
      description: p.description,
      category: p.category,
      price: p.price,
      salePrice: p.salePrice,
      stock: p.stock,
      active: p.active,
      featured: p.featured,
      locked: p.locked,
      memo: p.memo,
      shippingType: p.shippingType,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt.toISOString(),
      fotos: fotosPorProducto.get(p.id) ?? [],
    })),
  };

  const now = new Date();
  const stamp =
    now.toISOString().slice(0, 10) +
    "_" +
    now.toTimeString().slice(0, 5).replace(":", "-");
  const filename = `backup-conesa_${stamp}${conFotos ? "_con-fotos" : ""}.json`;

  return new Response(JSON.stringify(backup), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
