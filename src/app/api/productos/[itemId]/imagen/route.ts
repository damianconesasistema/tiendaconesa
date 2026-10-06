// GET /api/productos/[itemId]/imagen
// Sirve la imagen del producto guardada en la DB (tabla ProductImage).
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;

  const product = await prisma.product.findUnique({
    where: { itemId },
    select: { id: true },
  });
  if (!product) {
    return new Response("No encontrado", { status: 404 });
  }

  const image = await prisma.productImage.findFirst({
    where: { productId: product.id },
    orderBy: { position: "asc" },
    select: { data: true, contentType: true, updatedAt: true },
  });
  if (!image) {
    return new Response("Sin imagen", { status: 404 });
  }

  const body = new Uint8Array(image.data);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      // Cache agresiva: el ?v cambia cuando se actualiza la imagen
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": image.updatedAt.toUTCString(),
    },
  });
}
