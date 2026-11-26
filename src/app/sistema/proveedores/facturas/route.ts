import { registrar } from "@/lib/actividad";
import { borrarFacturaPrv, cargarFacturaPrv, listarFacturasPrv } from "@/lib/punto-facturas-prv";
import { conceptoDeFactura, limpiarFactura } from "@/lib/punto-facturas-prv-reglas";
import { puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../../clave";

// Las facturas de cada proveedor (V.0.11.285; reglas en
// src/lib/punto-facturas-prv-reglas.ts). Damián: "en cada proveedor podamos
// cargar el número de factura para tener en la agenda de pagos".
//
// GET ?proveedor=NOMBRE -> {facturas}: las cargadas y las de compra subidas
//   en Adjuntar, con lo que ya se agendó de cada una.
// POST {yo, accion}:
//   - "cargar" {proveedor, proveedorId?, tipo, nro, fecha, vence, monto, dtoPago, nota}
//   - "borrar" {id}
// Lo ve y lo carga el que tiene Proveedores o la Agenda de pagos.
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

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

const puede = (yo: YoPunto) => puedePunto(yo.permisos, "proveedores") || puedePunto(yo.permisos, "pagos");
const NO = "Las facturas de los proveedores las ve el que tiene Proveedores o la Agenda de pagos.";

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

export async function GET(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  if (!puede(yo)) return json({ error: NO });
  const proveedor = (new URL(req.url).searchParams.get("proveedor") || "").trim().slice(0, 120);
  if (!proveedor) return json({ facturas: [] });
  try {
    return json({ facturas: await listarFacturasPrv(proveedor) });
  } catch {
    return json({ error: "No pude leer las facturas del proveedor: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  if (!puede(yo)) return json({ error: NO });
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." });
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." });
  const quien = yo.usuario;
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });
  try {
    if (cuerpo.accion === "cargar") {
      const p = limpiarFactura(cuerpo);
      if (typeof p === "string") return json({ error: p });
      const r = await cargarFacturaPrv(p, quien);
      if (!r.yaEstaba)
        await registrar(
          "Punto: cargó una factura de proveedor",
          `${p.proveedor} · ${conceptoDeFactura(p)}${p.monto ? ` · $${p.monto}` : ""}${p.dtoPago ? ` · ${p.dtoPago} % por pago en término` : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }
    if (cuerpo.accion === "borrar") {
      const id = typeof cuerpo.id === "string" ? cuerpo.id.slice(0, 60) : "";
      if (!id) return json({ error: "No dice qué factura sacar." });
      const f = await borrarFacturaPrv(id);
      if (!f) return json({ error: "Esa factura ya no estaba." });
      await registrar("Punto: sacó una factura de proveedor", `${f.proveedor} · ${conceptoDeFactura(f)}`, quien);
      return json({ ok: true });
    }
    return json({ error: "No entendí qué hacer." });
  } catch {
    return json({ error: "No pude guardar: probá de nuevo en un momento." });
  }
}
