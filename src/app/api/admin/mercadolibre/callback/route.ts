import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { TIENDA_URL } from "@/lib/dominio";
import { canjearCodigo } from "@/lib/mercadolibre";

// La vuelta de MercadoLibre despues de que Damian dio el permiso. Cambia el
// codigo por el token y vuelve a la pantalla de la conexion. Solo con la
// sesion del panel abierta y con la misma marca de seguridad que se mando
// (si no, cualquiera podria colgar SU cuenta de MercadoLibre en la tienda).
export async function GET(req: NextRequest) {
  const volver = (q: string) => NextResponse.redirect(`${TIENDA_URL}/admin/productos/mercadolibre?${q}`);

  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(`${TIENDA_URL}/admin/login`);

  const sp = req.nextUrl.searchParams;
  const error = sp.get("error");
  if (error) return volver(`error=${encodeURIComponent(`MercadoLibre no dio el permiso (${error}).`)}`);

  const codigo = sp.get("code") ?? "";
  const estado = sp.get("state") ?? "";
  const esperado = req.cookies.get("ml_estado")?.value ?? "";
  if (!codigo || !estado || estado !== esperado)
    return volver(`error=${encodeURIComponent("La conexión venció o no coincide. Tocá Conectar de nuevo.")}`);

  const r = await canjearCodigo(codigo);
  const res = r.ok
    ? volver(`ok=${encodeURIComponent(r.nickname ?? "")}`)
    : volver(`error=${encodeURIComponent(r.error ?? "No se pudo conectar.")}`);
  res.cookies.set("ml_estado", "", { path: "/api/admin/mercadolibre", maxAge: 0 });
  return res;
}
