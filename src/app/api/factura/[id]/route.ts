import { NextRequest, NextResponse } from "next/server";
import { pdfDeComprobante } from "@/lib/afip/armar-pdf";
import { tokenValido } from "@/lib/afip/link-publico";

// Link público al comprobante, el que se le manda al cliente por mail o
// WhatsApp. No tiene login: lo protege el token de la URL.
//
//   /api/factura/<id>?t=<token>          -> factura
//   /api/factura/<id>?t=<token>&tipo=nc  -> nota de crédito

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const t = req.nextUrl.searchParams.get("t") || "";
  const tipo = req.nextUrl.searchParams.get("tipo") === "nc" ? "nc" : "factura";

  if (!tokenValido(id, tipo, t))
    return NextResponse.json({ error: "Link inválido" }, { status: 403 });

  const r = await pdfDeComprobante(id, tipo);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 404 });

  return new NextResponse(new Uint8Array(r.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${r.nombre}"`,
      // El link es privado aunque la ruta sea pública: que no lo cachee nadie.
      "Cache-Control": "private, no-store",
    },
  });
}
