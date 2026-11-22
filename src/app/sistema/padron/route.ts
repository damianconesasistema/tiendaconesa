import { getAdminSession } from "@/lib/admin-auth";
import { buscarEnPadron, PadronNoHabilitado } from "@/lib/afip/padron";
import { quienEntra } from "../clave";

// Los datos de un CUIT o DNI desde el padron de ARCA, para el alta de un
// cliente en Punto: GET ?doc=20123456789. Solo consulta (src/lib/afip/padron.ts).
// Solo con usuario. Los errores van con 200 y {error}: Cloudflare tapa los 5xx.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

// Tope por usuario: nadie consulta 30 CUIT por minuto en un mostrador, y asi
// un error en la pagina no le dispara cientos de pedidos a ARCA.
const usos = new Map<string, number[]>();
function demasiadas(quien: string): boolean {
  const ahora = Date.now();
  const ult = (usos.get(quien) ?? []).filter((t) => ahora - t < 60_000);
  ult.push(ahora);
  usos.set(quien, ult);
  return ult.length > 30;
}

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  const quien = (await getAdminSession())?.username ?? "?";
  if (demasiadas(quien)) return json({ error: "Muchas consultas seguidas: esperá un minuto." });
  const doc = (new URL(req.url).searchParams.get("doc") ?? "").replace(/\D/g, "");
  if (doc.length !== 11 && doc.length !== 8 && doc.length !== 7)
    return json({ error: "Poné un CUIT de 11 números o un DNI." }, 400);
  try {
    const d = await buscarEnPadron(doc);
    if (!d)
      return json({
        encontrado: false,
        error:
          doc.length === 11
            ? "ARCA no tiene datos de ese CUIT."
            : "Ese DNI no tiene CUIT en ARCA (es consumidor final): cargá el nombre a mano.",
      });
    return json({ encontrado: true, ...d });
  } catch (e) {
    if (e instanceof PadronNoHabilitado)
      return json({
        error:
          "ARCA todavía no habilitó la consulta del padrón para el certificado de la tienda. " +
          'Hay que darle el servicio "ws_sr_constancia_inscripcion" en ARCA (Administrador de Relaciones). Mientras tanto, cargalo a mano.',
        habilitar: true,
      });
    return json({ error: "No pude consultar ARCA ahora: " + ((e as Error).message || "error") + ". Cargalo a mano." });
  }
}
