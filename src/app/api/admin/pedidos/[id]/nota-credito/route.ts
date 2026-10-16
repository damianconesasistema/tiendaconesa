import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { pdfDeComprobante } from "@/lib/afip/armar-pdf";

// PDF de la nota de crédito, desde el panel.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const r = await pdfDeComprobante(id, "nc");
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });

  return new NextResponse(new Uint8Array(r.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${r.nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
