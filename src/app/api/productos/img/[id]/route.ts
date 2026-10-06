// GET /api/productos/img/[id]
// Sirve una imagen puntual de la galeria por su id (para los thumbnails).
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const image = await prisma.productImage.findUnique({
    where: { id },
    select: { data: true, contentType: true, updatedAt: true },
  });
  if (!image) return new Response("Sin imagen", { status: 404 });

  const body = new Uint8Array(image.data);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": image.updatedAt.toUTCString(),
    },
  });
}
