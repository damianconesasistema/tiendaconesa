import { cookies } from "next/headers";
import { registrar } from "@/lib/actividad";
import { SUCURSALES_PUNTO, nombresSucursales } from "@/lib/punto-permisos";
import { COOKIE_VER_COMO, DURA_VER_COMO, limpiarVerComo, textoVerComo } from "@/lib/punto-ver-como";
import { yoPuntoReal } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Ver Punto como otro perfil o usuario (V.0.11.266; reglas en
// src/lib/punto-ver-como.ts). Damian, 26/11/2026: "podes agregarme antes que
// lo usuarios puedan ver como los perfiles es decir como cajero, gerencia
// etc".
//
// POST {accion:"ver", nombre, permisos, sucursales} -> lo prende en este
//   navegador. Solo el que administra los usuarios de Punto (mirado con sus
//   permisos de verdad, no con los del perfil que esta mirando).
// POST {accion:"volver"} -> lo apaga. Lo puede hacer cualquiera: apagarlo
//   nunca da mas de lo que uno tiene.
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

const OPCIONES = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/sistema",
};

export async function POST(req: Request): Promise<Response> {
  const c = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!c || typeof c !== "object") return json({ error: "No entendí el pedido." }, 400);
  const jar = await cookies();

  if (c.accion === "volver") {
    jar.set(COOKIE_VER_COMO, "", { ...OPCIONES, maxAge: 0 });
    return json({ ok: true });
  }
  if (c.accion !== "ver") return json({ error: "No entendí qué hacer." }, 400);

  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let real: Awaited<ReturnType<typeof yoPuntoReal>>;
  try {
    real = await yoPuntoReal();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!real) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  if (!real.yo.adminUsuarios) return json({ error: "Solo el que administra los usuarios puede ver el sistema como otro." }, 403);

  const v = limpiarVerComo(c, real.yo, real.sesion, SUCURSALES_PUNTO.map((s) => s.id));
  if (typeof v === "string") return json({ error: v });
  jar.set(COOKIE_VER_COMO, textoVerComo(v), { ...OPCIONES, maxAge: DURA_VER_COMO });
  await registrar("Punto: miró el sistema como otro", `${v.nombre}${v.sucursales ? " · " + nombresSucursales(v.sucursales) : ""}`, real.yo.usuario);
  return json({ ok: true });
}
