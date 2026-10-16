import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import { business } from "@/lib/business";
import { legales } from "@/lib/legales";
import { esProduccion } from "@/lib/afip/config";
import {
  codigoComprobante,
  letraComprobante,
  nombreComprobante,
  numeroFormateado,
} from "@/lib/afip/factura";
import { pngQr } from "@/lib/afip/qr";

// PDF de la factura.
//
// El formato lo fija ARCA (RG 1415 y 4892): la letra en un recuadro al medio,
// los datos del emisor arriba a la izquierda, el CAE y el QR al pie. Eso no
// se puede mover. Lo que sí es nuestro es el logo, la tipografía y la banda
// "TIENDA ONLINE", que es lo que distingue estas facturas de las que emite
// el local por el otro sistema.

const ROJO = "#E63020";
const NEGRO = "#111111";
const GRIS = "#666666";
const BORDE = "#DDDDDD";

export type ItemFactura = {
  codigo: string;
  titulo: string;
  qty: number;
  /** Precio unitario final, con IVA adentro. */
  precio: number;
};

export type DatosFactura = {
  cbteTipo: number;
  ptoVta: number;
  cbteNro: number;
  fecha: Date;
  cae: string;
  caeVto: Date;
  neto: number;
  iva: number;
  total: number;
  comprador: {
    nombre: string;
    docTipo: number;
    docNro: string;
    domicilio?: string;
    condicionIva: string;
  };
  items: ItemFactura[];
  /** Número de pedido de la tienda, para poder cruzarlo. */
  orderNumber: number;
};

function pesos(n: number): string {
  return n.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  });
}

function fechaCorta(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function logo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo.png"));
  } catch {
    return null; // sin logo la factura sale igual, solo con el nombre
  }
}

export async function generarFacturaPdf(f: DatosFactura): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const listo = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const M = 40; // margen
  const W = 595.28; // ancho A4
  const anchoUtil = W - M * 2;

  // ---------------------------------------------------------------- CABECERA
  // El recuadro de la letra va centrado y pisa la línea divisoria: así lo
  // define el formato oficial y es como lo espera cualquiera que la mire.
  const cajaLetraX = W / 2 - 25;
  const topeCaja = 40;
  // El alto tiene que alcanzar para el logo MAS las cinco lineas de datos
  // fiscales debajo. Con el alto viejo el texto se montaba sobre el logo.
  const altoCab = 112;

  doc.rect(M, topeCaja, anchoUtil, altoCab).strokeColor(BORDE).lineWidth(1).stroke();
  doc
    .moveTo(W / 2, topeCaja)
    .lineTo(W / 2, topeCaja + altoCab)
    .stroke();

  // Emisor (izquierda). El logo es 232x77, asi que a 130 de ancho ocupa unos
  // 43 de alto: el texto arranca despues de eso.
  const img = logo();
  if (img) doc.image(img, M + 14, topeCaja + 10, { width: 130 });
  else
    doc
      .fillColor(NEGRO)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(business.name.toUpperCase(), M + 14, topeCaja + 20);

  // Los datos fiscales del emisor que exige el formato. Los que no tenemos
  // cargados simplemente no se imprimen: una factura con un dato inventado
  // es peor que una sin el dato.
  const datosEmisor = [
    legales.razonSocial || business.name,
    `${business.address.street}, ${business.address.city}`,
    `Tel: ${business.phone.display}`,
    legales.ingresosBrutos ? `Ingresos Brutos: ${legales.ingresosBrutos}` : "",
    legales.inicioActividades
      ? `Inicio de actividades: ${legales.inicioActividades}`
      : "",
  ].filter(Boolean);

  doc
    .fillColor(GRIS)
    .font("Helvetica")
    .fontSize(7)
    .text(datosEmisor.join("\n"), M + 14, topeCaja + 58, {
      width: 225,
      lineGap: 1,
    });

  // Comprobante (derecha).
  // Arranca DESPUES del recuadro de la letra, no desde el medio de la hoja:
  // el recuadro esta centrado y pisa la division, asi que empezar en W/2 hace
  // que el titulo se superponga con la letra.
  const dx = cajaLetraX + 50 + 16;
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(nombreComprobante(f.cbteTipo), dx, topeCaja + 16);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(NEGRO)
    .text(
      `Nº ${numeroFormateado(f.ptoVta, f.cbteNro)}`,
      dx,
      topeCaja + 38,
    )
    .fillColor(GRIS)
    .fontSize(8)
    .text(`Fecha de emisión: ${fechaCorta(f.fecha)}`, dx, topeCaja + 54)
    .text(`CUIT: ${legales.cuit || "-"}`, dx, topeCaja + 66)
    .text("Condición frente al IVA: Responsable Inscripto", dx, topeCaja + 78);

  // Recuadro de la letra, encima de todo
  doc
    .rect(cajaLetraX, topeCaja - 10, 50, 48)
    .fillColor("#FFFFFF")
    .fillAndStroke("#FFFFFF", NEGRO);
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(28)
    .text(letraComprobante(f.cbteTipo), cajaLetraX, topeCaja - 4, {
      width: 50,
      align: "center",
    });
  doc
    .font("Helvetica")
    .fontSize(6)
    .fillColor(GRIS)
    .text(`CÓD. ${codigoComprobante(f.cbteTipo)}`, cajaLetraX, topeCaja + 27, {
      width: 50,
      align: "center",
    });

  // ------------------------------------------------- BANDA "TIENDA ONLINE"
  // Lo que pidió Damián: que se vea de una que esta factura salió de la web
  // y no del mostrador.
  let y = topeCaja + altoCab + 12;
  doc.rect(M, y, anchoUtil, 24).fillColor(ROJO).fill();
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(
      `TIENDA ONLINE · ${legales.cuit ? "conesa.com.ar" : business.name}`,
      M + 12,
      y + 8,
    );
  doc
    .font("Helvetica")
    .fontSize(8)
    .text(`Pedido web #${f.orderNumber}`, M, y + 8.5, {
      width: anchoUtil - 12,
      align: "right",
    });

  // ---------------------------------------------------------------- COMPRADOR
  y += 38;
  const docEtiqueta =
    f.comprador.docTipo === 80
      ? "CUIT"
      : f.comprador.docTipo === 96
        ? "DNI"
        : "Doc.";

  doc.rect(M, y, anchoUtil, 58).strokeColor(BORDE).stroke();
  doc
    .fillColor(GRIS)
    .font("Helvetica")
    .fontSize(7)
    .text("CLIENTE", M + 12, y + 8);
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(f.comprador.nombre, M + 12, y + 20);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GRIS)
    .text(
      `${docEtiqueta}: ${f.comprador.docNro} · ${f.comprador.condicionIva}` +
        (f.comprador.domicilio ? `\n${f.comprador.domicilio}` : ""),
      M + 12,
      y + 35,
      { width: anchoUtil - 24 },
    );

  // ----------------------------------------------------------------- DETALLE
  y += 74;
  // Las columnas se miden desde el margen derecho hacia atras, asi ninguna
  // se pasa del borde por mas largo que sea el importe.
  const der = W - M; // 555
  const anchoTot = 85;
  const anchoUnit = 75;
  const anchoCant = 35;
  const col = {
    cod: M + 10,
    desc: M + 80,
    cant: der - anchoTot - anchoUnit - anchoCant - 10,
    unit: der - anchoTot - anchoUnit - 5,
    tot: der - anchoTot - 10,
  };
  const anchoDesc = col.cant - col.desc - 10;
  const topeTabla = y;

  doc.rect(M, y, anchoUtil, 20).fillColor("#F5F5F5").fill();
  doc.fillColor(GRIS).font("Helvetica-Bold").fontSize(7.5);
  doc.text("CÓDIGO", col.cod, y + 7, { width: 65 });
  doc.text("DESCRIPCIÓN", col.desc, y + 7, { width: anchoDesc });
  doc.text("CANT.", col.cant, y + 7, { width: anchoCant, align: "right" });
  doc.text("P. UNIT.", col.unit, y + 7, { width: anchoUnit, align: "right" });
  doc.text("IMPORTE", col.tot, y + 7, { width: anchoTot, align: "right" });

  y += 20;
  for (const it of f.items) {
    const alto =
      Math.max(16, doc.fontSize(8).heightOfString(it.titulo, { width: anchoDesc })) + 10;
    doc
      .fillColor(GRIS)
      .font("Helvetica")
      .fontSize(7)
      .text(it.codigo, col.cod, y + 6, { width: 65, lineBreak: false, ellipsis: true });
    doc
      .fillColor(NEGRO)
      .fontSize(8)
      .text(it.titulo, col.desc, y + 5, { width: anchoDesc });
    doc.text(String(it.qty), col.cant, y + 5, { width: anchoCant, align: "right" });
    doc.text(pesos(it.precio), col.unit, y + 5, { width: anchoUnit, align: "right" });
    doc.text(pesos(it.precio * it.qty), col.tot, y + 5, {
      width: anchoTot,
      align: "right",
    });
    y += alto;
    doc.moveTo(M, y).lineTo(der, y).strokeColor("#F0F0F0").lineWidth(0.5).stroke();
  }
  // Marco de la tabla, para que los renglones queden contenidos y no sueltos.
  doc
    .rect(M, topeTabla, anchoUtil, y - topeTabla)
    .strokeColor(BORDE)
    .lineWidth(1)
    .stroke();

  // ----------------------------------------------------------------- TOTALES
  y += 14;
  const tx = W - M - 220;
  const linea = (etiqueta: string, valor: string, fuerte = false) => {
    doc
      .font(fuerte ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fuerte ? 11 : 8.5)
      .fillColor(fuerte ? NEGRO : GRIS)
      .text(etiqueta, tx, y, { width: 120, align: "right" })
      .fillColor(NEGRO)
      .text(valor, tx + 125, y, { width: 95, align: "right" });
    y += fuerte ? 20 : 14;
  };

  // En la Factura B el IVA NO se discrimina: el precio que ve el consumidor
  // ya lo lleva adentro. En la A sí, porque el comprador lo computa.
  if (letraComprobante(f.cbteTipo) === "A") {
    linea("Neto gravado", pesos(f.neto));
    linea("IVA 21%", pesos(f.iva));
  } else {
    linea("Subtotal", pesos(f.total));
  }
  doc.moveTo(tx, y).lineTo(W - M, y).strokeColor(BORDE).stroke();
  y += 8;
  linea("TOTAL", pesos(f.total), true);

  // -------------------------------------------------------------- PIE: CAE+QR
  const pieY = 700;
  doc.rect(M, pieY, anchoUtil, 92).strokeColor(BORDE).stroke();

  const qr = await pngQr({
    fecha: f.fecha,
    cuit: (legales.cuit || "").replace(/\D/g, ""),
    ptoVta: f.ptoVta,
    tipoCmp: f.cbteTipo,
    nroCmp: f.cbteNro,
    importe: f.total,
    tipoDocRec: f.comprador.docTipo,
    nroDocRec: f.comprador.docNro,
    cae: f.cae,
  });
  doc.image(qr, M + 12, pieY + 12, { width: 68 });

  doc
    .fillColor(GRIS)
    .font("Helvetica")
    .fontSize(7)
    .text("Comprobante autorizado por ARCA", M + 92, pieY + 16);
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(`CAE ${f.cae}`, M + 92, pieY + 28);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(GRIS)
    .text(`Vencimiento del CAE: ${fechaCorta(f.caeVto)}`, M + 92, pieY + 46);
  doc
    .fontSize(6.5)
    .text(
      "Escaneá el QR para verificar este comprobante en afip.gob.ar",
      M + 92,
      pieY + 62,
    );

  // En homologación hay que gritarlo: una prueba no es una factura.
  if (!esProduccion()) {
    doc
      .save()
      .rotate(-30, { origin: [W / 2, 420] })
      .fillColor(ROJO)
      .opacity(0.12)
      .font("Helvetica-Bold")
      .fontSize(52)
      .text("SIN VALOR FISCAL", 60, 390, { width: 480, align: "center" })
      .restore()
      .opacity(1);
  }

  doc.end();
  return listo;
}
