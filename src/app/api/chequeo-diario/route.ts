// POST /api/chequeo-diario
// Lo llama el vigia de GitHub cada 10 minutos (.github/workflows/vigilar.yml).
// No hace nada si el chequeo ya corrio en las ultimas 20 horas, asi que
// llamarlo de mas no cuesta nada. Ver src/lib/chequeo-diario.ts.
import { NextResponse } from "next/server";
import { chequeoDiarioSiToca } from "@/lib/chequeo-diario";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const r = await chequeoDiarioSiToca();
    return NextResponse.json(r);
  } catch {
    return NextResponse.json({ corrio: false, error: "no se pudo correr" }, { status: 500 });
  }
}
