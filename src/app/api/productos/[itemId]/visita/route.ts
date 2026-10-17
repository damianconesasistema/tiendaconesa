// POST /api/productos/[itemId]/visita
//
// Suma una visita a la ficha del producto. La llama el navegador, no el
// server: si contaramos al renderizar la pagina sumarian los bots y los
// previews de WhatsApp, que son muchos mas que las personas.
//
// El navegador ademas solo llama una vez por sesion y por producto, asi que
// darle refresh diez veces no infla el numero.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  try {
    await prisma.product.update({
      where: { itemId },
      data: { views: { increment: 1 } },
    });
  } catch {
    // Producto borrado o id inventado: no es motivo para devolver un error,
    // esto es un contador, no una operacion del usuario.
  }
  // 204: no hay nada que devolverle al navegador.
  return new NextResponse(null, { status: 204 });
}
