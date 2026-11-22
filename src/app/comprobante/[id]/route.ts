import { documentoPorId } from "@/lib/punto-documentos";
import { emisorDe } from "@/lib/punto-emisor";
import { firmaValida } from "@/lib/punto-link";
import { generarPdfPunto, nombreArchivo } from "@/lib/punto-pdf";

// El PDF de un comprobante de Punto para el CLIENTE, sin usuario:
// tienda.conesa.com.ar/comprobante/<id>?f=<firma>. Es el link que Punto pone
// en el mensaje de WhatsApp (ver src/lib/punto-link.ts). Sin la firma
// correcta no se ve nada, y un comprobante eliminado deja de estar.
//
// Se abre en el navegador (inline), no se descarga: en el celular el cliente
// lo ve de una y desde ahi lo guarda si quiere.

export const dynamic = "force-dynamic";

function aviso(texto: string, status = 404): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comprobante</title>
<body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:90vh;background:#f5f4f2;margin:0;padding:20px">
<div style="max-width:420px;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:28px;text-align:center">
<h1 style="font-size:19px;margin:0 0 8px">Sanitarios Conesa</h1>
<p style="color:#555;font-size:15px;margin:0">${texto}</p></div></body>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await ctx.params;
  const firma = new URL(req.url).searchParams.get("f") ?? "";
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id) || !firmaValida(id, firma))
    return aviso("Este link no es válido. Pedile al local que te lo mande de nuevo.");
  try {
    const d = await documentoPorId(id);
    if (!d || d.eliminado) return aviso("Este comprobante ya no está disponible. Consultá en el local.");
    const pdf = await generarPdfPunto(d, await emisorDe(d.sucursal));
    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${nombreArchivo(d)}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    // 200 y no 500: Cloudflare tapa los 5xx con su propia pagina.
    return aviso("No pudimos armar el comprobante en este momento. Probá de nuevo en un rato.", 200);
  }
}
