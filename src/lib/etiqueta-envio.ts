import PDFDocument from "pdfkit";

// La etiqueta de envio: 10 x 15 cm, el tamaño de las impresoras de
// etiquetas (en A4 sale igual y se recorta).
//
// Rearmada el 16/11/2026 para los envios de Buenos Aires. Lo que tenia mal:
//   - el REMITENTE era siempre Traslasierra (Villa Cura Brochero), tambien en
//     un pedido de Buenos Aires;
//   - no llevaba el codigo postal, ni el piso y depto, ni la zona: lo
//     primero que mira el repartidor para armar el recorrido;
//   - no decia si el envio se cobra o es gratis.
//
// El dibujo esta aca, separado de la base, para poder sacar una muestra con
// datos inventados sin tocar un pedido real.

export type DatosEtiqueta = {
  numero: number;
  fecha: Date;
  retira: boolean;
  envioGratis: boolean;
  /** Lo que se cobro de envio junto con el pedido. 0 = gratis o a coordinar
   *  (los pedidos de antes del 16/11/2026). */
  costoEnvio?: number;
  destinatario: { nombre: string; telefono: string; dni?: string | null };
  domicilio: {
    calle?: string | null;
    numero?: string | null;
    piso?: string | null;
    localidad?: string | null;
    zona?: string | null;
    provincia?: string | null;
    cp?: string | null;
    referencia?: string | null;
  };
  /** Donde se retira, si retira: "Rincón 43, Balvanera". */
  dondeRetira?: string | null;
  remitente: { nombre: string; direccion: string; telefono?: string | null };
  items: { qty: number; title: string }[];
  logo?: Buffer | null;
};

const MM = 2.8346457; // 1 mm en puntos PDF
const NEGRO = "#111111";
const GRIS = "#666666";
const ROJO = "#E63020";
const VERDE = "#0F7A3A";

export function dibujarEtiqueta(d: DatosEtiqueta): Promise<Buffer> {
  const W = 100 * MM;
  const H = 150 * MM;
  const M = 6 * MM;
  const util = W - M * 2;

  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const listo = new Promise<Buffer>((r) => doc.on("end", () => r(Buffer.concat(chunks))));

  // --- Arriba: logo a la izquierda, numero de pedido a la derecha.
  if (d.logo) {
    try {
      doc.image(d.logo, M, M, { width: 36 * MM });
    } catch {
      doc.font("Helvetica-Bold").fontSize(13).fillColor(NEGRO).text("Sanitarios Conesa", M, M);
    }
  } else {
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NEGRO).text("Sanitarios Conesa", M, M);
  }
  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(NEGRO)
    .text(`#${d.numero}`, M, M, { width: util, align: "right" });
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GRIS)
    .text(`Pedido · ${d.fecha.toLocaleDateString("es-AR")}`, M, M + 8 * MM, {
      width: util,
      align: "right",
    });

  // --- Tipo de entrega
  let y = M + 15 * MM;
  doc.rect(M, y, util, 8 * MM).fillColor(d.retira ? NEGRO : ROJO).fill();
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(d.retira ? "RETIRA EN EL LOCAL" : "ENVÍO A DOMICILIO", M, y + 2.3 * MM, {
      width: util,
      align: "center",
    });
  y += 11 * MM;

  // --- Zona y codigo postal, grandes: con esto se arma el recorrido.
  if (!d.retira) {
    const alto = 15 * MM;
    doc.rect(M, y, util, alto).lineWidth(1.2).strokeColor(NEGRO).stroke();
    const mitad = util * 0.62;
    doc.moveTo(M + mitad, y).lineTo(M + mitad, y + alto).stroke();
    doc.font("Helvetica").fontSize(7).fillColor(GRIS).text("ZONA", M + 2.5 * MM, y + 1.8 * MM);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(NEGRO)
      .text((d.domicilio.zona || "—").toUpperCase(), M + 2.5 * MM, y + 6 * MM, {
        width: mitad - 5 * MM,
        height: 8 * MM,
        ellipsis: true,
      });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(GRIS)
      .text("CÓDIGO POSTAL", M + mitad + 2.5 * MM, y + 1.8 * MM);
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor(NEGRO)
      .text(d.domicilio.cp || "—", M + mitad, y + 5.2 * MM, {
        width: util - mitad,
        align: "center",
      });
    y += alto + 4 * MM;
  }

  // --- Destinatario
  doc.font("Helvetica").fontSize(7).fillColor(GRIS).text("DESTINATARIO", M, y);
  y += 3.5 * MM;
  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .fillColor(NEGRO)
    .text(d.destinatario.nombre.toUpperCase(), M, y, { width: util });
  doc.font("Helvetica").fontSize(11).fillColor(NEGRO);
  if (d.retira) {
    doc.text(`Retira en: ${d.dondeRetira || "el local"}`, { width: util });
  } else {
    const calle = [d.domicilio.calle, d.domicilio.numero].filter(Boolean).join(" ");
    doc
      .font("Helvetica-Bold")
      .text(
        [calle || "(sin domicilio cargado)", d.domicilio.piso].filter(Boolean).join(", "),
        { width: util },
      );
    doc
      .font("Helvetica")
      .text(
        [d.domicilio.localidad, d.domicilio.provincia].filter(Boolean).join(", "),
        { width: util },
      );
    if (d.domicilio.referencia)
      doc
        .fontSize(9)
        .fillColor(GRIS)
        .text(`Entre calles / ref.: ${d.domicilio.referencia}`, { width: util });
  }
  doc
    .moveDown(0.3)
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(NEGRO)
    .text(`Tel: ${d.destinatario.telefono}`, { width: util, continued: !!d.destinatario.dni });
  if (d.destinatario.dni)
    doc.font("Helvetica").fontSize(10).text(`     DNI: ${d.destinatario.dni}`);

  // --- Si se cobra el envio: lo primero que pregunta el que entrega. Desde
  // el 16/11/2026 el envio se cobra con el pedido, asi que en la puerta no
  // se cobra nada: ni el gratis ni el que ya se pago.
  if (!d.retira) {
    y = doc.y + 3 * MM;
    const yaPago = !d.envioGratis && (d.costoEnvio ?? 0) > 0;
    const color = d.envioGratis || yaPago ? VERDE : NEGRO;
    doc.rect(M, y, util, 8 * MM).lineWidth(1.5).strokeColor(color).stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(color)
      .text(
        d.envioGratis
          ? "ENVÍO GRATIS · NO COBRAR ENVÍO"
          : yaPago
            ? "ENVÍO INCLUIDO · NO COBRAR"
            : "ENVÍO A COORDINAR CON EL CLIENTE",
        M,
        y + 2.4 * MM,
        { width: util, align: "center" },
      );
    y += 8 * MM;
  } else {
    y = doc.y;
  }

  // --- Contenido
  y += 3 * MM;
  const unidades = d.items.reduce((s, i) => s + i.qty, 0);
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(GRIS)
    .text(`CONTENIDO · ${unidades} ${unidades === 1 ? "unidad" : "unidades"}`, M, y);
  doc
    .fontSize(7.5)
    .fillColor(NEGRO)
    .text(d.items.map((i) => `${i.qty}× ${i.title}`).join("  ·  "), M, doc.y + 0.8 * MM, {
      width: util,
      height: 10 * MM,
      ellipsis: true,
    });

  // --- Remitente, abajo de todo.
  const yRem = H - M - 19 * MM;
  doc.moveTo(M, yRem).lineTo(W - M, yRem).lineWidth(0.6).strokeColor("#CCCCCC").stroke();
  doc.font("Helvetica").fontSize(7).fillColor(GRIS).text("REMITENTE", M, yRem + 2 * MM);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(NEGRO)
    .text(d.remitente.nombre, M, yRem + 5.5 * MM, { width: util });
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .text(
      [d.remitente.direccion, d.remitente.telefono ? `Tel: ${d.remitente.telefono}` : null]
        .filter(Boolean)
        .join(" · "),
      { width: util },
    );
  doc
    .fontSize(6.5)
    .fillColor("#999999")
    .text("Mercadería sujeta a revisión al momento de la entrega.", M, H - M - 2.5 * MM, {
      width: util,
      align: "center",
    });

  doc.end();
  return listo;
}
