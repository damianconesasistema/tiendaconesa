import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { business } from "@/lib/business";
import { dibujarEtiqueta } from "@/lib/etiqueta-envio";

// Etiqueta de envío, 10x15 cm. El dibujo esta en src/lib/etiqueta-envio.ts;
// aca solo se juntan los datos del pedido.
//
// Sirve tanto para un envío como para identificar un paquete que espera en
// el local a que lo retiren: en ese caso la etiqueta lo dice en grande.

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

  let logo: Buffer | null = null;
  try {
    logo = fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo.png"));
  } catch {
    logo = null;
  }

  // El remitente es el local del pedido. Antes era siempre Traslasierra, y un
  // envio de Buenos Aires salia diciendo que lo mandaba Villa Cura Brochero.
  // Los pedidos viejos sin sucursal cargada siguen con los datos de siempre.
  const b = order.branch;
  const direccionLocal = b
    ? [b.address, b.city].filter(Boolean).join(", ")
    : `${business.address.street}, ${business.address.city}`;
  const remitente = {
    // "SANITARIOS CONESA S.R.L. · Buenos Aires": la razon social es la que
    // despacha, y el local dice a donde se devuelve si no se entrega.
    nombre: b ? `${b.razonSocial || business.name} · ${b.name}` : business.name,
    direccion: direccionLocal,
    telefono: b ? b.phone || b.whatsapp || null : business.phone.display,
  };

  const pdf = await dibujarEtiqueta({
    numero: order.number,
    fecha: order.createdAt,
    retira: order.shipping === "retiro",
    envioGratis: order.envioGratis,
    costoEnvio: order.shippingCost,
    destinatario: {
      nombre: `${order.customer.firstName} ${order.customer.lastName}`.trim(),
      telefono: order.customer.phone,
      dni: order.customer.dni || null,
    },
    domicilio: {
      calle: order.street,
      numero: order.streetNumber,
      piso: order.floor,
      localidad: order.locality,
      zona: order.zonaEnvio,
      provincia: order.province,
      cp: order.postalCode,
      referencia: order.reference,
    },
    dondeRetira: direccionLocal,
    remitente,
    items: order.items.map((i) => ({ qty: i.qty, title: i.title })),
    logo,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="etiqueta-pedido-${order.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
