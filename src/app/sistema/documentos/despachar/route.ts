import { registrar } from "@/lib/actividad";
import { despacharDocumento } from "@/lib/punto-documentos";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../../clave";

// Quien despacho la mercaderia de un comprobante en el deposito (V.0.99.82).
// Damian, 22/11/2026: "si va a deposito a buscar caños o mercaderia de
// deposito, que figure quien lo despacha".
//   POST {id, nota?}           -> anota en el comprobante datos.despacho =
//                                 {por, nombre, en, nota}: {ok, documento}.
//                                 Si ya lo despacho otro: {error}; si lo
//                                 despacho el mismo (un reintento), {ok,
//                                 documento} como esta
//   POST {id, deshacer:true}   -> lo saca (un clic equivocado): solo el que
//                                 lo despacho o quien administra los usuarios
// Con usuario, permiso de "Sistema Punto" (../../clave.ts) y la accion
// "despachar" de Punto (src/lib/punto-permisos.ts). Ver despacharDocumento en
// src/lib/punto-documentos.ts. Los errores van con 200 y {error}: Cloudflare
// tapa los 5xx.

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

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let cuerpo: { id?: unknown; nota?: unknown; deshacer?: unknown; yo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo))
    return json({ error: "No entendí lo que me mandaste." }, 400);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "despachar"))
    return json(
      { error: "Tu usuario no despacha en el depósito. Pedíselo a quien administra los usuarios." },
      403,
    );
  const id = typeof cuerpo.id === "string" ? cuerpo.id.trim() : "";
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return json({ error: "No sé cuál es ese comprobante." }, 400);
  if (cuerpo.nota != null && typeof cuerpo.nota !== "string")
    return json({ error: "La nota del despacho es un texto." }, 400);
  const deshacer = cuerpo.deshacer === true;

  try {
    const r = await despacharDocumento(
      id,
      { usuario: yo.usuario, nombre: yo.nombre, admin: yo.adminUsuarios },
      { deshacer, nota: cuerpo.nota },
    );
    if ("error" in r) return json({ error: r.error });
    if (r.cambio) {
      const d = r.doc;
      const nota = deshacer ? "" : ((d.datos as { despacho?: { nota?: string } } | null)?.despacho?.nota ?? "");
      await registrar(
        deshacer ? `Punto: deshizo el despacho de ${d.nroTexto}` : `Punto: despachó ${d.nroTexto}`,
        `${d.cliente}${nota ? " · " + nota : ""}`,
        yo.usuario,
      );
    }
    return json({ ok: true, documento: r.doc });
  } catch {
    return json({ error: "No pude guardar el despacho: probá de nuevo en un momento." });
  }
}
