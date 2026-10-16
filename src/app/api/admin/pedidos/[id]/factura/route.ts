import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { generarFacturaPdf } from "@/lib/afip/pdf";
import { numeroFormateado } from "@/lib/afip/factura";
import { DOC } from "@/lib/afip/config";

// Descarga el PDF de la factura de un pedido.
//
// El PDF se arma en el momento a partir de lo guardado (CAE, numero, totales),
// no se almacena: mientras esten esos datos, siempre sale igual, y asi no hay
// archivos que respaldar ni que se desincronicen.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { customer: true, items: { include: { product: true } } },
  });

  if (!order)
    return NextResponse.json({ error: "Pedido inexistente" }, { status: 404 });
  if (!order.cae || !order.cbteNro || !order.cbteTipo || !order.ptoVta)
    return NextResponse.json(
      { error: "Este pedido todavía no está facturado" },
      { status: 400 },
    );

  const dni = (order.customer.dni || "").replace(/\D/g, "");

  const pdf = await generarFacturaPdf({
    cbteTipo: order.cbteTipo,
    ptoVta: order.ptoVta,
    cbteNro: order.cbteNro,
    fecha: order.facturadoAt ?? order.createdAt,
    cae: order.cae,
    caeVto: order.caeVto ?? new Date(),
    neto: order.facturaNeto ?? 0,
    iva: order.facturaIva ?? 0,
    total: order.total,
    comprador: {
      nombre: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      docTipo: dni ? DOC.DNI : DOC.CONSUMIDOR_FINAL,
      docNro: dni || "0",
      domicilio:
        order.shipping === "envio"
          ? [order.street, order.streetNumber, order.locality]
              .filter(Boolean)
              .join(" ")
          : undefined,
      condicionIva: "Consumidor Final",
    },
    items: order.items.map((it) => ({
      codigo: it.product?.sku || it.product?.itemId || "-",
      titulo: it.title,
      qty: it.qty,
      precio: it.price,
    })),
    orderNumber: order.number,
  });

  const nombre = `factura-${numeroFormateado(order.ptoVta, order.cbteNro)}.pdf`;
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
