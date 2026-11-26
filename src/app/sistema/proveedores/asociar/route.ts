import { registrar } from "@/lib/actividad";
import { guardarAsociaciones, leerAsociaciones } from "@/lib/punto-asociar";
import { limpiarAsociaciones } from "@/lib/punto-asociar-reglas";
import { puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../../clave";

// Asociar los artículos con los proveedores de la lista (V.0.11.288; reglas
// en src/lib/punto-asociar-reglas.ts). Damián: "¿los artículos ven la lista de
// proveedores que armé?" / "sí, armala".
//
// GET -> {asociaciones: {porNombre, porMarca}}
// POST {yo, asociaciones} -> las reemplaza. Lo hace el que tiene Proveedores.
// Se aplican al leer los artículos (GET /sistema/articulos).
// Los errores van con 200 y {error}: Cloudflare tapa los 5xx.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

async function quienSoy(): Promise<YoPunto | Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let yo: YoPunto | null;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  return yo;
}

const NO = "Asociar los artículos con los proveedores lo hace el que tiene Proveedores.";

export async function GET(): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  if (!puedePunto(yo.permisos, "proveedores")) return json({ error: NO });
  try {
    return json({ asociaciones: await leerAsociaciones() });
  } catch {
    return json({ error: "No pude leer las asociaciones: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  if (!puedePunto(yo.permisos, "proveedores")) return json({ error: NO });
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." });
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." });
  const quien = yo.usuario;
  if (typeof cuerpo.yo === "string" && cuerpo.yo && cuerpo.yo !== quien)
    return json({ error: `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.` });
  const a = limpiarAsociaciones(cuerpo.asociaciones);
  if (typeof a === "string") return json({ error: a });
  try {
    await guardarAsociaciones(a);
    await registrar(
      "Punto: asoció artículos con proveedores",
      `${Object.keys(a.porNombre).length} nombres y ${Object.keys(a.porMarca).length} marcas asociados a proveedores de la lista`,
      quien,
    );
    return json({ ok: true, asociaciones: a });
  } catch {
    return json({ error: "No pude guardar: probá de nuevo en un momento." });
  }
}
