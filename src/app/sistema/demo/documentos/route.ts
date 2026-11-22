import { getAdminSession } from "@/lib/admin-auth";
import { registrar } from "@/lib/actividad";
import {
  contadores,
  crearDocumento,
  documentoPorMarca,
  limpiarDocumento,
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

  let cuerpo: { documento?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  const limpio = limpiarDocumento(cuerpo.documento);
  if ("error" in limpio) return json({ error: limpio.error }, 400);

  const quien = (await getAdminSession())?.username ?? "?";
  try {
    const { doc, repetido } = await crearDocumento(limpio.doc, quien);
    if (!repetido) {
      const total = doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      await registrar(
        `Punto: emitió ${doc.comp.replace(/^\d+\./, "")} ${doc.nroTexto}`,
        `${doc.cliente} · $ ${total} · ${limpio.doc.renglones.length} renglones · vendedor ${doc.vendedor} (${doc.puesto})`,
        quien,
      );
    }
    return json({ ok: true, documento: doc, repetido });
  } catch (e) {
    return json({ error: "No se pudo guardar el comprobante: " + ((e as Error).message || "error del servidor") + "." });
  }
}
