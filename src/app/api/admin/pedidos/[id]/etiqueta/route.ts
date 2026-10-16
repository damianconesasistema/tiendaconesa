import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { business } from "@/lib/business";

// Etiqueta de envío, 10x15 cm (el tamaño estándar de las impresoras de
// etiquetas, y si se imprime en A4 queda igual, recortable).
//
// Sirve tanto para un envío como para identificar un paquete que espera en
// el local a que lo retiren: en ese caso la etiqueta lo dice en grande.

const MM = 2.8346457; // 1 mm en puntos PDF

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
    include: { customer: true, items: true },
  });
  if (!order)
    return NextResponse.json({ error: "Pedido inexistente" }, { status: 404 });

  const W = 100 * MM;
  const H = 150 * MM;
  const M = 7 * MM;
  const util = W - M * 2;

  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const listo = new Promise<Buffer>((r) =>
    doc.on("end", () => r(Buffer.concat(chunks))),
  );

  const retira = order.shipping === "retiro";

  // --- Encabezado: logo y tipo de entrega
  try {
    const logo = fs.readFileSync(
      path.join(process.cwd(), "public", "brand", "logo.png"),
    );
    doc.image(logo, M, M, { width: 42 * MM });
  } catch {
    doc.font("Helvetica-Bold").fontSize(14).text(business.name, M, M);
  }

  let y = M + 17 * MM;
  doc
    .rect(M, y, util, 9 * MM)
    .fillColor(retira ? "#111111" : "#E63020")
    .fill();
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(retira ? "RETIRA EN EL LOCAL" : "ENVÍO A DOMICILIO", M, y + 2.6 * MM, {
      width: util,
      align: "center",
    });

  // --- Destinatario
  y += 14 * MM;
  doc
    .fillColor("#666666")
    .font("Helvetica")
    .fontSize(8)
    .text("DESTINATARIO", M, y);
  y += 5 * MM;
  doc
    .fillColor("#111111")
    .font("Helvetica-Bold")
    .fontSize(16)
    .text(
      `${order.customer.firstName} ${order.customer.lastName}`.trim().toUpperCase(),
      M,
      y,
      { width: util },
    );

  y = doc.y + 2 * MM;
  const domicilio = retira
    ? `${business.address.street}, ${business.address.city}`
    : [order.street, order.streetNumber].filter(Boolean).join(" ");
  doc.font("Helvetica").fontSize(12).fillColor("#111111");
  doc.text(domicilio || "(sin domicilio cargado)", M, y, { width: util });
  if (!retira && order.locality)
    doc.text(order.locality, { width: util });
  if (order.reference)
    doc
      .fontSize(9)
      .fillColor("#666666")
      .text(`Ref: ${order.reference}`, { width: util });

  doc
    .moveDown(0.4)
    .fontSize(11)
    .fillColor("#111111")
    .text(`Tel: ${order.customer.phone}`, { width: util });
  if (order.customer.dni)
    doc.fontSize(9).fillColor("#666666").text(`DNI: ${order.customer.dni}`);

  // --- Remitente
  y = doc.y + 6 * MM;
  doc.moveTo(M, y).lineTo(W - M, y).strokeColor("#DDDDDD").stroke();
  y += 3 * MM;
  doc.fillColor("#666666").font("Helvetica").fontSize(8).text("REMITENTE", M, y);
  doc
    .fillColor("#111111")
    .fontSize(10)
    .text(
      `${business.name}\n${business.address.street}, ${business.address.city}\nTel: ${business.phone.display}`,
      M,
      doc.y + 1 * MM,
      { width: util, lineGap: 1 },
    );

  // --- Pedido y contenido
  y = doc.y + 5 * MM;
  doc.rect(M, y, util, 26 * MM).strokeColor("#111111").lineWidth(1).stroke();
  doc
    .fillColor("#111111")
    .font("Helvetica-Bold")
    .fontSize(22)
    .text(`PEDIDO #${order.number}`, M, y + 3 * MM, {
      width: util,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#666666")
    .text(
      `${order.items.reduce((s, i) => s + i.qty, 0)} ${
        order.items.reduce((s, i) => s + i.qty, 0) === 1 ? "unidad" : "unidades"
      } · ${order.createdAt.toLocaleDateString("es-AR")}`,
      M,
      y + 13 * MM,
      { width: util, align: "center" },
    );
  doc
    .fontSize(7.5)
    .text(
      order.items.map((i) => `${i.qty}× ${i.title}`).join("  ·  "),
      M + 3 * MM,
      y + 18 * MM,
      { width: util - 6 * MM, align: "center", height: 7 * MM, ellipsis: true },
    );

  doc
    .fontSize(7)
    .fillColor("#999999")
    .text(
      "Mercadería sujeta a revisión al momento de la entrega.",
      M,
      H - M - 4 * MM,
      { width: util, align: "center" },
    );

  doc.end();
  const pdf = await listo;

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="etiqueta-pedido-${order.number}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
