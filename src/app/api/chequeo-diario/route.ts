// POST /api/chequeo-diario
// Lo llama el vigia de GitHub cada 10 minutos (.github/workflows/vigilar.yml).
// No hace nada si el chequeo ya corrio en las ultimas 20 horas, asi que
// llamarlo de mas no cuesta nada. Ver src/lib/chequeo-diario.ts.
import { NextResponse } from "next/server";
import { chequeoDiarioSiToca } from "@/lib/chequeo-diario";
import { titulosAMayusculasUnaVez } from "@/lib/titulos-mayusculas";
import { pausarSinStock } from "@/lib/sin-stock";
import { herramientasUnaVez } from "@/lib/herramientas-una-vez";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Los titulos de antes a mayusculas, una sola vez (despues no hace nada).
    const titulos = await titulosAMayusculasUnaVez().catch(() => -1);
    // Bombas de Agua y Dogo a Herramientas, una sola vez.
    const herramientas = await herramientasUnaVez().catch(() => -1);
    // Los publicados sin stock, a pausa (esto si, cada vez: es barato).
    const pausados = await pausarSinStock().catch(() => -1);
    const r = await chequeoDiarioSiToca();
    return NextResponse.json({ ...r, titulos, herramientas, pausados });
  } catch {
    return NextResponse.json({ corrio: false, error: "no se pudo correr" }, { status: 500 });
  }
}
