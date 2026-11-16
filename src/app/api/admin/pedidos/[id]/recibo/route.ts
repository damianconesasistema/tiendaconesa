import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { business } from "@/lib/business";
import { llenarReciboMP } from "@/lib/recibo-mercadopago";

// El "Recibo de entrega de producto" de MercadoPago, completado con los datos
// del pedido, para imprimir y hacer firmar cuando el cliente retira en el
// local. Ver src/lib/recibo-mercadopago.ts.

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
    include: { customer: true, items: true, branch: true },
  });
  if (!order)
    return NextResponse.json({ error: "Pedido inexistente" }, { status: 404 });

  let plantilla: Buffer;
  try {
    plantilla = fs.readFileSync(
      path.join(process.cwd(), "public", "formularios", "recibo-entrega-mercadopago.pdf"),
    );
  } catch {
    return NextResponse.json(
      { error: "Falta el formulario de MercadoPago en el servidor" },
      { status: 500 },
    );
  }

  const b = order.branch;
  const direccionLocal = b
    ? [b.address, b.city].filter(Boolean).join(", ")
    : `${business.address.street}, ${business.address.city}`;

  const pdf = await llenarReciboMP(plantilla, {
    nombre: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
    dni: order.customer.dni || null,
    telefono: order.customer.phone,
    direccion:
      order.shipping === "retiro"
        ? `Retira en el local: ${direccionLocal}`
        : [
            [order.street, order.streetNumber].filter(Boolean).join(" "),
            order.floor,
            order.locality,
            order.postalCode ? `CP ${order.postalCode}` : null,
          ]
            .filter(Boolean)
            .join(", "),
    articulos: order.items.map((i) => ({ qty: i.qty, title: i.title })),
    // El numero de la operacion en MercadoPago es lo que ellos buscan en un
    // contracargo. Si no se pago por MercadoPago, queda el numero de pedido.
    numeroOperacion: order.mpPaymentId
      ? `${order.mpPaymentId} · Pedido #${order.number}`
      : `Pedido #${order.number}`,
    apodoComprador: order.customer.email,
    apodoVendedor: b ? `${b.razonSocial || business.name} · ${b.name}` : business.name,
    lugar: b?.city || business.address.city,
    // La fecha de hoy: se imprime en el momento en que el cliente retira.
    fecha: new Date(),
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="recibo-entrega-pedido-${order.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
