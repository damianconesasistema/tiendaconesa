import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { TIENDA_HOST, TIENDA_URL } from "@/lib/dominio";
import { urlDeAutorizacion } from "@/lib/mercadolibre";

// "Conectar MercadoLibre": manda a Damian a MercadoLibre para que, con SU
// usuario, le de permiso a la aplicacion de Sanitarios Conesa. Ver
// src/lib/mercadolibre.ts.
//
// MercadoLibre vuelve siempre a tienda.conesa.com.ar (es la direccion que
// queda cargada en la aplicacion). Por eso esto arranca ahi: la marca de
// seguridad ("state") se guarda en una galleta de esa direccion y la vuelta
// la tiene que encontrar igual.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(`${TIENDA_URL}/admin/login`);

  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .toLowerCase()
    .split(":")[0];
  if (host !== TIENDA_HOST && host !== "localhost")
    return NextResponse.redirect(`${TIENDA_URL}/api/admin/mercadolibre/conectar`);

  const estado = randomBytes(16).toString("hex");
  const url = await urlDeAutorizacion(estado);
  if (!url)
    return NextResponse.redirect(
      `${TIENDA_URL}/admin/productos/mercadolibre?error=${encodeURIComponent("Primero cargá el número y la clave de la aplicación.")}`,
    );

  const res = NextResponse.redirect(url);
  res.cookies.set("ml_estado", estado, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/mercadolibre",
    maxAge: 15 * 60,
  });
  return res;
}
