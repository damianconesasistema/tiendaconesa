// POST /api/recomendados  { itemIds: string[] }
//
// Devuelve que ofrecerle a quien tiene esos productos en el carrito. Va por
// API y no por props porque el carrito vive en localStorage: el server no
// sabe que hay adentro hasta que el navegador se lo cuenta.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getRecargosMp } from "@/lib/settings";
import { precioVitrina } from "@/lib/precios";
import { leerCarrito, elegirSugerencias } from "@/lib/recomendaciones";

export const dynamic = "force-dynamic";

const TOPE = 4;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.itemIds)
      ? body.itemIds.filter((x: unknown) => typeof x === "string").slice(0, 50)
      : [];
    if (ids.length === 0) return NextResponse.json({ recomendados: [] });

    const enCarrito = await prisma.product.findMany({
      where: { itemId: { in: ids } },
      select: { itemId: true, title: true, description: true, category: true },
    });
    if (enCarrito.length === 0) return NextResponse.json({ recomendados: [] });

    const candidatos = await prisma.product.findMany({
      where: {
        active: true,
        stock: { gt: 0 },
        itemId: { notIn: [...ids, "__RESET_PRICES_MARKER__"] },
      },
      select: {
        itemId: true,
        title: true,
        description: true,
        category: true,
        price: true,
        salePrice: true,
        imageUrl: true,
      },
      orderBy: [{ featured: "desc" }, { stock: "desc" }],
      take: 200,
    });

    const senales = leerCarrito(enCarrito);
    const sugerencias = elegirSugerencias(senales, candidatos, TOPE);

    const porId = new Map(candidatos.map((p) => [p.itemId, p]));
    const recargos = await getRecargosMp();

    return NextResponse.json({
      recomendados: sugerencias.map((s) => {
        const p = porId.get(s.producto.itemId)!;
        const contado = p.salePrice ?? p.price;
        return {
          itemId: p.itemId,
          title: p.title,
          category: p.category,
          imageUrl: p.imageUrl,
          // El mismo precio que muestra el catalogo
          precio: precioVitrina(contado, recargos.unPago),
          motivo: s.motivo,
        };
      }),
    });
  } catch {
    // Una recomendacion que falla no puede romper el carrito.
    return NextResponse.json({ recomendados: [] });
  }
}
