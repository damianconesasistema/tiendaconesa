import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { Emisor } from "@/lib/punto-pdf";
import type { FormaCobro } from "@/lib/punto-cobranzas-reglas";

// El recibo de una cobranza de cuenta corriente (V.0.11.289). Damian,
// 27/11/2026: al confirmar el pago sale un recibo para mandarle al cliente.
// No es fiscal y no se llama "Recibo X": asi se llama en Conesa lo vendido
// sin factura. Mismo estilo que los comprobantes (src/lib/punto-pdf.ts).

export type ReciboDatos = {
  numero: number;
  sucursal: string;
  dia: string;
  creadoEn: string;
  cliente: string;
  clienteDoc: string;
  forma: FormaCobro;
  cuentaNombre: string;
  operacion: string;
  nota: string;
  monto: number;
  imputaciones: { nro: string; monto: number }[];
  anulado: boolean;
  /** El que lo cobro (nombre para mostrar). */
  cobro: string;
};

// Sin imports de valores a proposito: el simulador lo carga con node solo.
const NOMBRE_FORMA: Record<string, string> = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  mercadopago: "Mercado Pago",
  cheque: "Cheque",
};
const nroRecibo = (n: number): string => String(Math.max(0, Math.round(n))).padStart(8, "0");

const ROJO = "#E63020";
const NEGRO = "#111111";
const GRIS = "#666666";
const BORDE = "#DDDDDD";
const ZONA = "America/Argentina/Buenos_Aires";

const pesos = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });
const diaTxt = (d: string) => String(d || "").split("-").reverse().join("/");
const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });
/** "20-12345678-3" o el DNI como vino. */
const docTxt = (d: string) => (/^\d{11}$/.test(d) ? `CUIT ${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` : d ? `DNI ${d}` : "");

function logo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo.png"));
  } catch {
    return null;
  }
}

export function nombreArchivoRecibo(r: Pick<ReciboDatos, "numero">): string {
  return `Recibo-de-cobranza-${nroRecibo(r.numero)}.pdf`;
}

export async function generarReciboPdf(r: ReciboDatos, emisor: Emisor): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    bufferPages: true,
    info: { Title: `Recibo de cobranza ${nroRecibo(r.numero)}`, Author: "Sanitarios Conesa" },
  });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const listo = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const M = 40;
  const W = 595.28;
  const H = 841.89;
  const der = W - M;
  const anchoUtil = W - M * 2;
  const PIE = H - 70;

  if (r.anulado)
    doc
      .save()
      .rotate(-30, { origin: [W / 2, 430] })
      .fillColor(ROJO)
      .opacity(0.12)
      .font("Helvetica-Bold")
      .fontSize(64)
      .text("ANULADO", -60, 400, { width: W + 120, align: "center", lineBreak: false })
      .restore()
      .opacity(1);

  // ---------------------------------------------------------------- CABECERA
  const tope = 40;
  const altoCab = 108;
  doc.rect(M, tope, anchoUtil, altoCab).strokeColor(BORDE).lineWidth(1).stroke();
  const img = logo();
  if (img) doc.image(img, M + 14, tope + 10, { width: 120 });
  else doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(16).text("SANITARIOS CONESA", M + 14, tope + 18);
  const lineasEmisor = [emisor.direccion, emisor.telefono ? `Tel: ${emisor.telefono}` : "", emisor.email].filter((x): x is string => !!x);
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(8.5).text(emisor.nombre, M + 14, tope + 56, { width: 215 });
  doc.fillColor(GRIS).font("Helvetica").fontSize(7.5).text(lineasEmisor.join("\n"), M + 14, tope + 68, { width: 215, lineGap: 1 });

  const dx = W / 2 + 10;
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(15).text("RECIBO DE COBRANZA", dx, tope + 14, { width: der - dx - 10 });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(NEGRO)
    .text(`Nº ${nroRecibo(r.numero)}`, dx, tope + 36)
    .fillColor(GRIS)
    .fontSize(8)
    .text(`Fecha del pago: ${diaTxt(r.dia)}`, dx, tope + 52)
    .text(`Hecho el ${fechaHora(r.creadoEn)}`, dx, tope + 64)
    .text(`Cobró: ${r.cobro}`, dx, tope + 76, { width: der - dx - 10 });

  // ----------------------------------------------------------------- CLIENTE
  let y = tope + altoCab + 16;
  doc.rect(M, y, anchoUtil, 46).strokeColor(BORDE).lineWidth(1).stroke();
  doc.fillColor(GRIS).font("Helvetica").fontSize(7.5).text("RECIBIMOS DE", M + 12, y + 8);
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(11).text(r.cliente || "-", M + 12, y + 19, { width: anchoUtil - 200 });
  if (r.clienteDoc) doc.fillColor(GRIS).font("Helvetica").fontSize(8).text(docTxt(r.clienteDoc), M + 12, y + 33);
  doc.fillColor(GRIS).font("Helvetica").fontSize(7.5).text("LA SUMA DE", der - 180, y + 8, { width: 168, align: "right" });
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(13).text(pesos(r.monto), der - 180, y + 19, { width: 168, align: "right" });
  y += 62;

  // ------------------------------------------------------------- LO QUE PAGA
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(9).text("En pago de", M, y);
  y += 16;
  doc.rect(M, y, anchoUtil, 20).fill("#F4F4F4");
  doc.fillColor(GRIS).font("Helvetica-Bold").fontSize(7.5).text("COMPROBANTE", M + 10, y + 7).text("IMPORTE", der - 130, y + 7, { width: 120, align: "right" });
  y += 20;
  for (const i of r.imputaciones) {
    if (y + 18 > PIE - 160) {
      doc.addPage();
      y = M;
    }
    doc.fillColor(NEGRO).font("Helvetica").fontSize(9).text(i.nro, M + 10, y + 5, { width: anchoUtil - 160 });
    doc.text(pesos(i.monto), der - 130, y + 5, { width: 120, align: "right" });
    y += 18;
    doc.moveTo(M, y).lineTo(der, y).strokeColor(BORDE).lineWidth(0.5).stroke();
  }
  y += 8;
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(12).text("Total", der - 260, y, { width: 120, align: "right" });
  doc.text(pesos(r.monto), der - 130, y, { width: 120, align: "right" });
  y += 28;

  // ------------------------------------------------------------ COMO PAGO
  const como =
    `${NOMBRE_FORMA[r.forma] ?? r.forma}` +
    (r.cuentaNombre ? (r.forma === "efectivo" ? ` (${r.cuentaNombre})` : ` a ${r.cuentaNombre}`) : r.forma === "cheque" ? " (en cartera)" : "") +
    (r.operacion ? ` · ${r.forma === "cheque" ? "cheque" : "operación"} ${r.operacion}` : "");
  doc.fillColor(GRIS).font("Helvetica").fontSize(8).text("FORMA DE PAGO", M, y);
  doc.fillColor(NEGRO).font("Helvetica").fontSize(9.5).text(como, M, y + 11, { width: anchoUtil });
  y += 30;
  if (r.nota) {
    doc.fillColor(GRIS).font("Helvetica").fontSize(8).text("NOTA", M, y);
    doc.fillColor(NEGRO).font("Helvetica").fontSize(9).text(r.nota, M, y + 11, { width: anchoUtil });
    y += 30;
  }

  // ----------------------------------------------------------------- FIRMA
  const fy = Math.max(y + 50, PIE - 70);
  doc.moveTo(der - 200, fy).lineTo(der, fy).strokeColor(GRIS).lineWidth(0.7).stroke();
  doc.fillColor(GRIS).font("Helvetica").fontSize(7.5).text("Firma y aclaración", der - 200, fy + 5, { width: 200, align: "center" });

  // ------------------------------------------------------------------- PIE
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor(GRIS)
      .font("Helvetica")
      .fontSize(7)
      .text(
        r.anulado ? "Este recibo está ANULADO: no vale como constancia de pago." : "Recibo de cobranza de cuenta corriente. Documento no válido como factura.",
        M,
        H - 50,
        { width: anchoUtil - 60 },
      )
      .text(`Hoja ${i - rango.start + 1} de ${rango.count}`, der - 60, H - 50, { width: 60, align: "right" });
  }
  doc.end();
  return listo;
}
