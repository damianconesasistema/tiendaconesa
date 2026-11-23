import { registrar } from "@/lib/actividad";
import { ajustarStockDe, crearNota, limpiarNota } from "@/lib/punto-documentos";
import { motivoParaLaPantalla } from "@/lib/punto-error";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../../clave";

// Nota de credito o de debito de una factura A o B de Punto (V.0.99.96):
// POST {facturaId, clase, idLocal, cants | monto, motivo}. Con el permiso de
// cobrar (el que emite facturas), y queda en Actividad. La de credito
// devuelve al stock lo devuelto. Los errores van con 200 y {error}:
// Cloudflare tapa los 5xx.

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
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
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
  if (!puedePunto(yo.permisos, "cobrar"))
    return json(
      { error: "Tu usuario no puede hacer notas de crédito ni de débito (le falta Cobrar). Pedíselo a quien administra los usuarios." },
      403,
    );
  const limpio = limpiarNota(cuerpo);
  if ("error" in limpio) return json({ error: limpio.error });
  try {
    const r = await crearNota(limpio.facturaId, limpio.nota, quien);
    if ("error" in r) return json({ error: r.error });
    const { doc, repetido } = r;
    const stock = await ajustarStockDe(doc.id, true);
    if (!repetido) {
      const total = doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const dt = (doc.datos ?? {}) as { facturaNro?: string; motivo?: string };
      await registrar(
        `Punto: emitió ${doc.comp} ${doc.nroTexto}`,
        `De la factura ${dt.facturaNro ?? "?"} · ${doc.cliente} · $ ${total}${dt.motivo ? ` · ${dt.motivo}` : ""}`,
        quien,
      );
    }
    return json({ ok: true, documento: doc, repetido, stock });
  } catch (e) {
    return json({ error: "No se pudo: " + motivoParaLaPantalla(e, "error del servidor") + "." });
  }
}
