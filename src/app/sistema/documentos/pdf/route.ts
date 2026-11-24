import { clientesPorIds } from "@/lib/punto-clientes";
import { documentoPorId } from "@/lib/punto-documentos";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { emisorDe } from "@/lib/punto-emisor";
import { generarPdfPunto, nombreArchivo } from "@/lib/punto-pdf";
import { quienEntra } from "../../clave";

// El PDF de un comprobante de Punto: GET ?id=... (src/lib/punto-pdf.ts).
// Solo con usuario, como todo lo de Punto. Los errores van con 200 y
// {error}: Cloudflare tapa los 5xx, y la pagina mira el tipo de lo que
// vuelve para saber si es el PDF o un aviso.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  const u = new URL(req.url);
  const id = u.searchParams.get("id") ?? "";
  // ?remito=1 (V.0.11.229): el remito de esa venta, sin precios, para firmar.
  // Solo de lo que es una venta (no de un presupuesto ni de una nota).
  const remito = u.searchParams.get("remito") === "1";
  try {
    const d = await documentoPorId(id);
    if (!d) return json({ error: "No encontré ese comprobante." });
    // V.0.11.236: el Recibo X, solo con "Ver Recibo X".
    if (d.tipo === "sin-comprobante") {
      const yo = await yoPunto();
      if (!yo || !puedePunto(yo.permisos, "recibox")) return json({ error: "Tu usuario no ve los Recibo X." });
    }
    if (remito && !["factura", "sin-comprobante", "pedido-interno", "remito"].includes(d.tipo))
      return json({ error: "El remito sale de una venta: una factura, un recibo X o un pedido interno." });
    // V.0.11.239: en el remito, el domicilio de entrega sale de la ficha del cliente.
    let entrega: { domicilio: string; localidad: string; provincia: string; cuit: string } | null = null;
    const cid = (d.datos as { cliente?: { id?: string } } | null)?.cliente?.id;
    if (remito && cid) {
      const [c] = await clientesPorIds([cid]).catch(() => []);
      if (c) entrega = { domicilio: c.domicilio, localidad: c.localidad, provincia: c.provincia, cuit: c.cuit };
    }
    const pdf = await generarPdfPunto(d, await emisorDe(d.sucursal), { remito, entrega });
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${remito ? "remito-" : ""}${nombreArchivo(d)}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch (e) {
    return json({ error: "No pude armar el PDF: " + ((e as Error).message || "error del servidor") + "." });
  }
}
