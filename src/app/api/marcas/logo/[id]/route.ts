// GET /api/marcas/logo/[id]
// El logo de una marca traido de su pagina web (src/lib/logo-de-marca.ts).
// La direccion lleva la version (?v=...), asi que se puede guardar para
// siempre en el navegador: si se trae otro logo, cambia la direccion.
import type { NextRequest } from "next/server";
import { logoGuardado } from "@/lib/marcas-server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const png = await logoGuardado(id);
  if (!png) return new Response("Sin logo", { status: 404 });
  return new Response(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
