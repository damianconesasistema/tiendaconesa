import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { DocumentoGuardado } from "@/lib/punto-documentos";

// El PDF de lo que se emite en Punto (presupuestos, facturas internas,
// remitos, pedidos internos). Damian, 22/11/2026: "esto si fue emitido
// tendria que bajar el pdf".
//
// Reglas que no se negocian:
// - Nada de aca es un comprobante fiscal. Las facturas de Punto todavia no
//   van a ARCA: no tienen CAE. Por eso no se imprime ni CUIT ni QR, y la
//   factura sale con la marca de agua "SIN CAE". Una hoja que pareciera una
//   factura valida seria peor que no tener hoja.
// - El costo NUNCA sale en el PDF: va al cliente.
// - Todo sale de lo que quedo guardado al emitir (datos.renglones): si
//   mañana cambia la lista, la hoja de hoy no cambia.

const ROJO = "#E63020";
const NEGRO = "#111111";
const GRIS = "#666666";
const BORDE = "#DDDDDD";

/** Lo que va en el encabezado, de la sucursal (tabla Branch). */
export type Emisor = {
  nombre: string;
  direccion?: string;
  telefono?: string;
  email?: string;
};

type Renglon = { cod: string; tit: string; cant: number; contado: number };
type Datos = {
  cliente?: { n?: string; t?: string; doc?: string };
  forma?: string;
  recargo?: number;
  desc?: number;
  deposito?: string;
  renglones?: Renglon[];
  bruto?: number;
  descuento?: number;
  editado?: { en: string; por: string; veces: number } | null;
};

const TITULO: Record<string, string> = {
  presupuesto: "Presupuesto",
  factura: "Factura",
  remito: "Remito",
  "pedido-interno": "Pedido interno",
  "sin-comprobante": "Venta sin comprobante",
  "nota-credito": "Nota de crédito",
  "nota-debito": "Nota de débito",
};

/** "Factura B", "Presupuesto"... como se llama el papel. */
export function tituloDe(d: Pick<DocumentoGuardado, "tipo" | "letra">): string {
  const t = TITULO[d.tipo] ?? "Comprobante";
  const conLetra = d.tipo === "factura" || d.tipo === "nota-credito" || d.tipo === "nota-debito";
  return conLetra && d.letra ? `${t} ${d.letra}` : t;
}

/** "0003-00003301", o "P-2842" en la venta sin comprobante. */
export function numeroDe(d: Pick<DocumentoGuardado, "nroTexto">): string {
  return String(d.nroTexto || "").replace(/^[A-Z] /, "");
}

/** El nombre del archivo, sin nada que un sistema de archivos rechace. */
export function nombreArchivo(d: DocumentoGuardado): string {
  const base = `${tituloDe(d)} ${numeroDe(d)}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 _.-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${base || "comprobante"}.pdf`;
}

function pesos(n: number): string {
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 });
}

const ZONA = "America/Argentina/Buenos_Aires";
function fecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: ZONA });
}
function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: ZONA });
}

/** "01-Efectivo" -> "Efectivo". */
const sinPrefijo = (s: string) => String(s || "").replace(/^\d+[-.]\s*/, "");

function logo(): Buffer | null {
  try {
    return fs.readFileSync(path.join(process.cwd(), "public", "brand", "logo.png"));
  } catch {
    return null;
  }
}

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function generarPdfPunto(d: DocumentoGuardado, emisor: Emisor): Promise<Buffer> {
  const dt = (d.datos && typeof d.datos === "object" ? d.datos : {}) as Datos;
  const renglones = Array.isArray(dt.renglones) ? dt.renglones : [];
  const cli = dt.cliente ?? {};

  // bufferPages: el pie ("Hoja 1 de 3") se escribe al final, en cada hoja.
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, info: { Title: `${tituloDe(d)} ${numeroDe(d)}`, Author: "Sanitarios Conesa" } });
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
  // Las notas de credito y de debito (V.0.99.96) van como la factura: internas, sin CAE.
  const esFactura = d.tipo === "factura" || d.tipo === "nota-credito" || d.tipo === "nota-debito";
  const letra = d.letra || "";

  // Marca de agua de la factura interna: en todas las hojas, abajo de todo.
  const marcaDeAgua = () => {
    if (!esFactura) return;
    doc
      .save()
      .rotate(-30, { origin: [W / 2, 430] })
      .fillColor(ROJO)
      .opacity(0.1)
      .font("Helvetica-Bold")
      .fontSize(38)
      .text("SIN CAE · SIN VALOR FISCAL", -60, 410, { width: W + 120, align: "center", lineBreak: false })
      .restore()
      .opacity(1);
  };
  marcaDeAgua();

  // ---------------------------------------------------------------- CABECERA
  const tope = 40;
  const altoCab = 108;
  const cajaX = W / 2 - 25;
  doc.rect(M, tope, anchoUtil, altoCab).strokeColor(BORDE).lineWidth(1).stroke();
  if (letra) doc.moveTo(W / 2, tope + 38).lineTo(W / 2, tope + altoCab).strokeColor(BORDE).stroke();

  const img = logo();
  if (img) doc.image(img, M + 14, tope + 10, { width: 120 });
  else doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(16).text("SANITARIOS CONESA", M + 14, tope + 18);

  const lineasEmisor = [emisor.direccion, emisor.telefono ? `Tel: ${emisor.telefono}` : "", emisor.email].filter(
    (x): x is string => !!x,
  );
  doc.fillColor(NEGRO).font("Helvetica-Bold").fontSize(8.5).text(emisor.nombre, M + 14, tope + 56, { width: 215 });
  doc
    .fillColor(GRIS)
    .font("Helvetica")
    .fontSize(7.5)
    .text(lineasEmisor.join("\n"), M + 14, tope + 68, { width: 215, lineGap: 1 });

  // Derecha: que es, que numero, que dia.
  const dx = letra ? cajaX + 66 : W / 2 + 10;
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(tituloDe(d).toUpperCase(), dx, tope + 14, { width: der - dx - 10 });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(NEGRO)
    .text(d.letra ? `Nº ${numeroDe(d)}` : `Pedido P-${d.pedido}`, dx, tope + 36)
    .fillColor(GRIS)
    .fontSize(8)
    .text(`Fecha: ${fecha(d.createdAt)} · ${hora(d.createdAt)}`, dx, tope + 52)
    .text(d.letra ? `Pedido P-${d.pedido}` : "", dx, tope + 64)
    .text(`Vendedor: ${d.vendedor}`, dx, tope + 76, { width: der - dx - 10 });
  if (dt.editado && dt.editado.en)
    doc.text(`Modificado el ${fecha(dt.editado.en)} · ${hora(dt.editado.en)}`, dx, tope + 88, { width: der - dx - 10 });

  // La letra en su recuadro, al medio, como cualquier comprobante.
  if (letra) {
    doc.rect(cajaX, tope - 10, 50, 48).fillAndStroke("#FFFFFF", NEGRO);
    doc
      .fillColor(NEGRO)
      .font("Helvetica-Bold")
      .fontSize(28)
      .text(letra, cajaX, tope - 4, { width: 50, align: "center" });
    doc
      .font("Helvetica")
      .fontSize(5.5)
      .fillColor(GRIS)
      .text(esFactura ? "INTERNA" : "NO FISCAL", cajaX, tope + 28, { width: 50, align: "center" });
  }

  // --------------------------------------------------- BANDA DE ADVERTENCIA
  let y = tope + altoCab + 10;
  doc.rect(M, y, anchoUtil, 20).fillColor(esFactura || d.eliminado ? ROJO : NEGRO).fill();
  doc
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      (d.eliminado ? `ELIMINADO EL ${fecha(d.eliminado.en)} · ` : "") +
        (esFactura ? "COMPROBANTE INTERNO SIN CAE · NO VÁLIDO COMO FACTURA" : "DOCUMENTO NO VÁLIDO COMO FACTURA"),
      M,
      y + 6.5,
      { width: anchoUtil, align: "center" },
    );

  // ---------------------------------------------------------------- CLIENTE
  y += 30;
  doc.rect(M, y, anchoUtil, 50).strokeColor(BORDE).lineWidth(1).stroke();
  doc.fillColor(GRIS).font("Helvetica").fontSize(7).text("CLIENTE", M + 12, y + 8);
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(cli.n || d.cliente || "Consumidor final", M + 12, y + 19, { width: anchoUtil - 24, lineBreak: false, ellipsis: true });
  const sobreCliente = [cli.doc && cli.doc !== "—" ? `Doc.: ${cli.doc}` : "", cli.t || "", dt.forma ? `Forma de pago: ${sinPrefijo(dt.forma)}` : ""]
    .filter(Boolean)
    .join(" · ");
  doc.font("Helvetica").fontSize(8).fillColor(GRIS).text(sobreCliente, M + 12, y + 34, { width: anchoUtil - 24 });

  // ----------------------------------------------------------------- DETALLE
  y += 64;
  const anchoTot = 85;
  const anchoUnit = 80;
  const anchoCant = 40;
  const col = {
    cod: M + 10,
    desc: M + 92,
    cant: der - anchoTot - anchoUnit - anchoCant - 15,
    unit: der - anchoTot - anchoUnit - 10,
    tot: der - anchoTot - 8,
  };
  const anchoDesc = col.cant - col.desc - 10;
  const PIE = H - 70; // hasta donde puede llegar un renglon

  const cabeceraTabla = () => {
    doc.rect(M, y, anchoUtil, 20).fillColor("#F5F5F5").fill();
    doc.fillColor(GRIS).font("Helvetica-Bold").fontSize(7.5);
    doc.text("CÓDIGO", col.cod, y + 7, { width: 78 });
    doc.text("DESCRIPCIÓN", col.desc, y + 7, { width: anchoDesc });
    doc.text("CANT.", col.cant, y + 7, { width: anchoCant, align: "right" });
    doc.text("P. UNIT.", col.unit, y + 7, { width: anchoUnit, align: "right" });
    doc.text("IMPORTE", col.tot, y + 7, { width: anchoTot, align: "right" });
    y += 20;
  };
  let pagina = 1;
  const otraHoja = () => {
    doc.addPage({ size: "A4", margin: 0 });
    pagina++;
    marcaDeAgua();
    y = 40;
    doc
      .fillColor(GRIS)
      .font("Helvetica")
      .fontSize(8)
      .text(`${tituloDe(d)} ${numeroDe(d)} · sigue (hoja ${pagina})`, M, y, { width: anchoUtil });
    y += 18;
    cabeceraTabla();
  };

  cabeceraTabla();
  for (const r of renglones) {
    const cant = num(r.cant);
    const unit = num(r.contado);
    const tit = String(r.tit ?? "");
    doc.font("Helvetica").fontSize(8);
    const alto = Math.max(16, doc.heightOfString(tit, { width: anchoDesc })) + 8;
    if (y + alto > PIE) otraHoja();
    doc
      .fillColor(GRIS)
      .font("Helvetica")
      .fontSize(7)
      .text(String(r.cod ?? ""), col.cod, y + 5, { width: 78, lineBreak: false, ellipsis: true });
    doc.fillColor(NEGRO).fontSize(8).text(tit, col.desc, y + 4, { width: anchoDesc });
    doc.text(String(cant), col.cant, y + 4, { width: anchoCant, align: "right" });
    doc.text(pesos(unit), col.unit, y + 4, { width: anchoUnit, align: "right" });
    doc.text(pesos(unit * cant), col.tot, y + 4, { width: anchoTot, align: "right" });
    y += alto;
    doc.moveTo(M, y).lineTo(der, y).strokeColor("#EEEEEE").lineWidth(0.5).stroke();
  }

  // ----------------------------------------------------------------- TOTALES
  // Los precios de los renglones son los de contado. Abajo, lo que los
  // lleva al total: el descuento y el recargo de la forma de pago.
  const bruto = num(dt.bruto) || renglones.reduce((a, r) => a + num(r.contado) * num(r.cant), 0);
  const descuento = num(dt.descuento);
  const recargo = Math.round((d.total - (bruto - descuento)) * 100) / 100;
  const filas: [string, string, boolean][] = [["Subtotal", pesos(bruto), false]];
  if (descuento > 0.004) filas.push([`Descuento ${num(dt.desc) ? num(dt.desc) + "%" : ""}`.trim(), `- ${pesos(descuento)}`, false]);
  if (Math.abs(recargo) >= 0.5)
    filas.push([`${recargo > 0 ? "Recargo" : "Ajuste"} ${dt.forma ? sinPrefijo(dt.forma) : "forma de pago"}`, pesos(recargo), false]);
  filas.push(["TOTAL", pesos(d.total), true]);

  const altoTotales = filas.length * 15 + 30;
  if (y + 14 + altoTotales > PIE) otraHoja();
  y += 14;
  const tx = der - 230;
  for (const [etq, valor, fuerte] of filas) {
    if (fuerte) {
      doc.moveTo(tx, y).lineTo(der, y).strokeColor(BORDE).lineWidth(1).stroke();
      y += 7;
    }
    doc
      .font(fuerte ? "Helvetica-Bold" : "Helvetica")
      .fontSize(fuerte ? 12 : 8.5)
      .fillColor(fuerte ? NEGRO : GRIS)
      .text(etq, tx, y, { width: 125, align: "right" })
      .fillColor(NEGRO)
      .text(valor, tx + 130, y, { width: 100, align: "right" });
    y += fuerte ? 20 : 14;
  }

  // ------------------------------------------------------------------- PIE
  // En todas las hojas: que es y que no es este papel.
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    doc
      .fillColor(GRIS)
      .font("Helvetica")
      .fontSize(7)
      .text(
        esFactura
          ? "Comprobante interno del sistema Punto. Todavía no fue autorizado por ARCA: no tiene CAE y no es válido como factura."
          : "Documento no válido como factura.",
        M,
        H - 50,
        { width: anchoUtil - 60, lineBreak: true },
      )
      .text(`Hoja ${i - rango.start + 1} de ${rango.count}`, der - 60, H - 50, { width: 60, align: "right" });
  }

  doc.end();
  return listo;
}
