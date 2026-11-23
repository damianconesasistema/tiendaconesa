import { registrar } from "@/lib/actividad";
import { ajustarStockDe, eliminarDocumento } from "@/lib/punto-documentos";
import { motivoParaLaPantalla } from "@/lib/punto-error";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../../clave";

// Eliminar (o recuperar) un comprobante de Punto: POST {id, recuperar}.
// No borra la fila: la marca (ver eliminarDocumento en
// src/lib/punto-documentos.ts). Solo con usuario y con el permiso
// "eliminar" de Punto (src/lib/punto-permisos.ts), para eliminar y para
// recuperar, y queda en Actividad quien fue. Los errores van con 200 y
// {error}: Cloudflare tapa los 5xx.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let cuerpo: { id?: unknown; recuperar?: unknown; yo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  // Un cuerpo "null" es JSON valido: sin esto, leerle .yo tiraba un error
  // que salia como 500 (y Cloudflare lo tapa).
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  const quien = yo.usuario;
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "eliminar"))
    return json(
      { error: "Tu usuario no tiene permiso para eliminar comprobantes. Pedíselo a quien administra los usuarios." },
      403,
    );
  const recuperar = cuerpo.recuperar === true;
  try {
    const r = await eliminarDocumento(String(cuerpo.id ?? ""), quien, recuperar);
    if ("error" in r) return json({ error: r.error });
    // Eliminada, lo vendido vuelve al deposito; recuperada, sale otra vez.
    const stock = await ajustarStockDe(r.doc.id);
    const total = r.doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    await registrar(
      `Punto: ${recuperar ? "recuperó" : "eliminó"} ${r.doc.comp.replace(/^\d+\./, "")} ${r.doc.nroTexto}`,
      `${r.doc.cliente} · $ ${total}`,
      quien,
    );
    return json({ ok: true, documento: r.doc, stock });
  } catch (e) {
    return json({ error: "No se pudo: " + motivoParaLaPantalla(e, "error del servidor") + "." });
  }
}
