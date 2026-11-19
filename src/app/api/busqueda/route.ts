// POST /api/busqueda  { q, resultados }
//
// Alguien busco algo en la tienda. Lo manda el buscador del catalogo cuando
// la persona deja de escribir (src/components/CatalogClient.tsx), una vez por
// palabra y por sesion. Se ve en Panel -> Que miran. Lo que buscan los de
// Conesa no cuenta (src/lib/miradas.ts).

import { NextResponse } from "next/server";
import { esDeLosNuestros, sumarBusqueda } from "@/lib/miradas";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { q?: unknown; resultados?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  if (!(await esDeLosNuestros())) await sumarBusqueda(String(body.q ?? ""), Number(body.resultados));
  return new NextResponse(null, { status: 204 });
}
