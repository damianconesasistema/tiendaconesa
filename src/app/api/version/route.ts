// GET /api/version: la version de la tienda que esta atendiendo. La pregunta
// el panel cada tanto para avisar que hay una nueva (src/components/
// AvisoVersionNueva.tsx). No dice nada privado: es el nombre de la
// compilacion.
import { NextResponse } from "next/server";
import { versionPublicada } from "@/lib/version-publicada";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ version: versionPublicada() }, { headers: { "Cache-Control": "no-store" } });
}
