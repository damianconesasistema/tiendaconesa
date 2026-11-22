import { getAdminSession } from "@/lib/admin-auth";
import { registrar } from "@/lib/actividad";
import {
  contadores,
  crearDocumento,
  documentoPorMarca,
  editarPresupuesto,
  limpiarDocumento,
  limpiarEdicion,
  listarDocumentos,
} from "@/lib/punto-documentos";
import { quienEntra } from "../clave";

// Lo que se emite en el sistema Punto (presupuestos, facturas sin CAE,
// remitos, ventas sin comprobante). Ver src/lib/punto-documentos.ts.
//   GET  ?dias=30&tipo=&suc=   -> lo emitido, de todos los puestos
//   GET  ?solo=contadores      -> el ultimo numero de cada serie
//   GET  ?idLocal=...          -> si ese comprobante quedo guardado (para
//                                 cuando se corto la respuesta al emitir)
//   POST {documento}           -> lo guarda y le pone el numero
//   POST {documento, edita}    -> cambia un presupuesto ya emitido (mismo
//                                 numero; edita = {id, base})
//   GET  ./pdf?id=...          -> el PDF (./pdf/route.ts)
// Todo solo con usuario y permiso de "Sistema Punto" (../clave.ts). Los
// errores del servidor van con 200 y {error}: Cloudflare tapa los 5xx.

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

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const u = new URL(req.url);
  try {
    if (u.searchParams.get("solo") === "contadores") return json({ contadores: await contadores() });
    const marca = u.searchParams.get("idLocal");
    if (marca) return json({ documento: await documentoPorMarca(marca) });
    const dias = Math.min(366, Math.max(1, Math.round(Number(u.searchParams.get("dias")) || 30)));
    const [lista, numeros] = await Promise.all([
      listarDocumentos({
        dias,
        tipo: u.searchParams.get("tipo") || undefined,
        sucursal: u.searchParams.get("suc") || undefined,
      }),
      contadores(),
    ]);
    return json({ ...lista, contadores: numeros, dias });
  } catch {
    return json({ error: "No pude leer los comprobantes guardados." });
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok")
    return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario. La venta queda en pantalla." }, 401);

  let cuerpo: { documento?: unknown; edita?: unknown; yo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  const limpio = limpiarDocumento(cuerpo.documento);
  if ("error" in limpio) return json({ error: limpio.error }, 400);

  const quien = (await getAdminSession())?.username ?? "?";
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });
  if (cuerpo.edita != null) {
    const ed = limpiarEdicion(cuerpo.edita);
    if (!ed) return json({ error: "No sé qué presupuesto querés cambiar." }, 400);
    try {
      const r = await editarPresupuesto(ed, limpio.doc, quien);
      if ("error" in r) return json({ error: r.error });
      if (!r.repetido) {
        const total = r.doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await registrar(
          `Punto: cambió el Presupuesto ${r.doc.nroTexto}`,
          `${r.doc.cliente} · $ ${total} · ${limpio.doc.renglones.length} renglones`,
          quien,
        );
      }
      return json({ ok: true, documento: r.doc, repetido: r.repetido, editado: true });
    } catch (e) {
      return json({ error: "No se pudo guardar el cambio: " + ((e as Error).message || "error del servidor") + "." });
    }
  }
  try {
    const { doc, repetido } = await crearDocumento(limpio.doc, quien);
    if (!repetido) {
      const total = doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      await registrar(
        `Punto: emitió ${doc.comp.replace(/^\d+\./, "")} ${doc.nroTexto}`,
        `${doc.cliente} · $ ${total} · ${limpio.doc.renglones.length} renglones · vendedor ${doc.vendedor}`,
        quien,
      );
    }
    return json({ ok: true, documento: doc, repetido });
  } catch (e) {
    return json({ error: "No se pudo guardar el comprobante: " + ((e as Error).message || "error del servidor") + "." });
  }
}
