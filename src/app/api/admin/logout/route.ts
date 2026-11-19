import { NextResponse } from "next/server";
import { galletasParaSalir } from "@/lib/admin-auth";
import { registrar } from "@/lib/actividad";

// Salir del panel. Las galletas van a mano, como encabezados aparte: con
// cookies() la segunda pisaba a la primera y la sesion quedaba viva (Damian,
// 19/11/2026: "el salir no funciona"). Ver galletasParaSalir().
export async function POST() {
  await registrar("Salió del panel");
  const r = NextResponse.json({ ok: true });
  for (const c of await galletasParaSalir()) r.headers.append("Set-Cookie", c);
  return r;
}
