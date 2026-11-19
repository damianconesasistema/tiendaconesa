// POST /api/admin/en-linea
//
// El panel abierto avisa que sigue ahi y recibe quienes estan en este
// momento (src/lib/presencia.ts).

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { marcarPresente, quienesEstan } from "@/lib/presencia";

export const dynamic = "force-dynamic";

export async function POST() {
  const s = await getAdminSession();
  if (!s) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  await marcarPresente(s.username);
  return NextResponse.json({ yo: s.username, enLinea: await quienesEstan() });
}
