import path from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";
import type { DocumentoGuardado } from "@/lib/punto-documentos";
import type { ArcaPunto } from "@/lib/punto-arca";

// Repartir centavos (V.0.11.227). Damian, 24/11/2026: "necesito que se vean
// los precios con lista 2 y con descuento, y luego pones el total, pero el
// descuento que lo haga por item" (factura A y B, presupuesto y sin factura).
// Cada renglon con su descuento redondeado puede no sumar el total del
// comprobante (el que ya tiene ARCA): el centavo que sobra o falta va a los
// renglones que mas cerca estaban de redondear para ese lado. Aca y no en un
// modulo aparte: el simulador y las pruebas cargan este archivo con node solo.
/** Los renglones en centavos enteros que suman exacto `total` (centavos),
 *  moviendo cada uno a lo sumo un centavo de su redondeo para abajo. null si
 *  para llegar haria falta mover mas (ahi se muestra un "Redondeo" aparte). */
export function ajustarCentavos(crudos: readonly number[], total: number): number[] | null {
  const meta = Math.round(total);
  if (!crudos.length) return meta === 0 ? [] : null;
  const base = crudos.map((c) => Math.floor(c));
  let falta = meta - base.reduce((a, b) => a + b, 0);
  if (falta < -crudos.length || falta > crudos.length) return null;
  const orden = crudos
    .map((c, i) => ({ i, frac: c - Math.floor(c) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const out = base.slice();
  // Para arriba: a los de mayor fraccion. Para abajo: a los de menor.
  for (let j = 0; falta > 0; j++, falta--) out[orden[j].i] += 1;
  for (let j = orden.length - 1; falta < 0; j--, falta++) out[orden[j].i] -= 1;
  return out;
}

/** Lo que autorizo ARCA (datos.arca), si tiene CAE. Aca y no importado de
 *  punto-arca: el PDF no carga lo de ARCA (la base, los certificados) para un
 *  presupuesto. El QR se carga solo si hace falta. */
function arcaDe(datos: unknown): ArcaPunto | null {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return null;
  const a = (datos as Record<string, unknown>).arca as ArcaPunto | undefined;
  return a && typeof a.cae === "string" && a.cae && Number.isInteger(a.cbteNro) ? a : null;
}

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
  /** Lo fiscal (V.0.99.98), para la factura con CAE. */
  razonSocial?: string;
  cuit?: string;
  iibb?: string;
  inicioAct?: string;
};

/** La condicion de IVA del receptor, como la manda Punto a ARCA. */
const COND_IVA: Record<number, string> = {
  1: "IVA Responsable Inscripto",
  4: "IVA Sujeto Exento",
  5: "Consumidor Final",
  6: "Responsable Monotributo",
  7: "Sujeto No Categorizado",
};

type Renglon = { cod: string; tit: string; cant: number; contado: number; iva?: number };
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
  /** Notas de credito y de debito: la factura que modifican. */
  facturaNro?: string;
  motivo?: string;
};

const TITULO: Record<string, string> = {
  presupuesto: "Presupuesto",
  factura: "Factura",
  remito: "Remito",
  "pedido-interno": "Pedido interno",
  // V.0.11.229 (Damian: "entregar sin comprobante no pongas eso, tiene que
  // ser un recibo X"): el papel de lo vendido sin factura es un Recibo X.
  "sin-comprobante": "Recibo",
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

/** remito (V.0.11.229): el remito de esa venta, para que firme el que recibe:
 *  los mismos articulos y cantidades, sin precios. No es otro comprobante (no
 *  tiene numero propio ni mueve stock: eso ya lo hizo la venta). */
export async function generarPdfPunto(d: DocumentoGuardado, emisor: Emisor, opciones: { remito?: boolean } = {}): Promise<Buffer> {
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
  // Damian, 24/11/2026: "falta la posibilidad de hacer REMITO, no la veo en
  // cada comprobante". El remito es no fiscal aunque la venta tenga CAE.
  const remito = !!opciones.remito;
  const arca = remito ? null : arcaDe(d.datos);
  // Interna = sin CAE. La que autorizo ARCA (V.0.99.98) es la de verdad.
  const esFactura = (d.tipo === "factura" || d.tipo === "nota-credito" || d.tipo === "nota-debito") && !arca && !remito;
  // El Recibo X (lo vendido sin factura, V.0.11.229) lleva la caja de la X
  // como el presupuesto: no fiscal.
  const letra = remito ? "X" : d.letra || (d.tipo === "sin-comprobante" ? "X" : "");
  // La Factura A con CAE: los renglones sin IVA y el IVA discriminado abajo.
  const sinIva = !!arca && letra === "A";

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
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .text(arca && emisor.razonSocial ? emisor.razonSocial : emisor.nombre, M + 14, tope + 56, { width: 215 });
  doc
    .fillColor(GRIS)
    .font("Helvetica")
    .fontSize(7.5)
    .text((arca ? [...lineasEmisor.slice(0, 1), "IVA Responsable Inscripto", ...lineasEmisor.slice(1)] : lineasEmisor).join("\n"), M + 14, tope + 68, {
      width: 215,
      lineGap: 1,
    });

  // Derecha: que es, que numero, que dia.
  const dx = letra ? cajaX + 66 : W / 2 + 10;
  doc
    .fillColor(NEGRO)
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(remito ? "REMITO" : tituloDe(d).toUpperCase(), dx, tope + 14, { width: der - dx - 10 });
  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(NEGRO)
    .text(
      remito
        ? `De ${tituloDe(d)} ${d.letra ? numeroDe(d) : `P-${d.pedido}`}`
        : d.letra
          ? `Nº ${numeroDe(d)}`
          : `Pedido P-${d.pedido}`,
      dx,
      tope + 36,
    )
    .fillColor(GRIS)
    .fontSize(8)
    .text(`Fecha: ${fecha(d.createdAt)} · ${hora(d.createdAt)}`, dx, tope + 52)
    .text(arca ? `CUIT: ${emisor.cuit || arca.cuit}` : d.letra ? `Pedido P-${d.pedido}` : `Vendedor: ${d.vendedor}`, dx, tope + 64)
    .text(
      arca
        ? `Ing. Brutos: ${emisor.iibb || "-"} · Inicio act.: ${emisor.inicioAct || "-"}`
        : d.letra
          ? `Vendedor: ${d.vendedor}`
          : "",
      dx,
      tope + 76,
      { width: der - dx - 10 },
    );
  if (arca) doc.text(`Pedido P-${d.pedido} · Vendedor: ${d.vendedor}`, dx, tope + 88, { width: der - dx - 10 });
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
      .text(arca ? `COD. ${String(arca.cbteTipo).padStart(3, "0")}` : esFactura ? "INTERNA" : "NO FISCAL", cajaX, tope + 28, {
        width: 50,
        align: "center",
      });
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
        (arca
          ? `ORIGINAL · COMPROBANTE AUTORIZADO POR ARCA${dt.facturaNro ? ` · DE LA FACTURA ${dt.facturaNro}` : ""}`
          : esFactura
            ? "COMPROBANTE INTERNO SIN CAE · NO VÁLIDO COMO FACTURA"
            : "DOCUMENTO NO VÁLIDO COMO FACTURA"),
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
  const docArca = arca
    ? arca.docTipo === 80
      ? `CUIT: ${arca.docNro.replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3")}`
      : arca.docTipo === 96
        ? `DNI: ${arca.docNro}`
        : ""
    : "";
  const sobreCliente = [
    arca ? docArca : cli.doc && cli.doc !== "—" ? `Doc.: ${cli.doc}` : "",
    arca ? COND_IVA[arca.condIva] || "" : cli.t || "",
    dt.forma ? `Forma de pago: ${sinPrefijo(dt.forma)}` : "",
    dt.motivo ? `Motivo: ${dt.motivo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  doc.font("Helvetica").fontSize(8).fillColor(GRIS).text(sobreCliente, M + 12, y + 34, { width: anchoUtil - 24 });

  // ----------------------------------------------------------------- DETALLE
  y += 64;
  // V.0.11.227: con descuento, cada renglon lo lleva puesto ("el descuento
  // que lo haga por item"): el precio de lista, el precio con el descuento y
  // el importe con el descuento. Abajo, el total.
  const pctDto = !remito && num(dt.desc) > 0 && num(dt.descuento) > 0.004 ? num(dt.desc) : 0;
  const porItem = pctDto > 0;
  const anchoTot = porItem ? 78 : 85;
  const anchoUnit = porItem ? 70 : 80;
  const anchoDto = porItem ? 70 : 0;
  const anchoCant = porItem ? 32 : 40;
  const col = {
    cod: M + 10,
    desc: M + 92,
    // El remito: sin precios, la cantidad a la derecha de todo.
    cant: remito ? der - 70 : der - anchoTot - anchoDto - anchoUnit - anchoCant - (porItem ? 20 : 15),
    unit: der - anchoTot - anchoDto - anchoUnit - (porItem ? 15 : 10),
    dto: der - anchoTot - anchoDto - 10,
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
    if (remito) {
      y += 20;
      return;
    }
    if (porItem) {
      const pctTxt = String(pctDto).replace(".", ",") + "%";
      doc.text(sinIva ? "LISTA S/IVA" : "P. LISTA", col.unit, y + 7, { width: anchoUnit, align: "right" });
      doc.text(sinIva ? `CON ${pctTxt} S/IVA` : `CON ${pctTxt}`, col.dto, y + 7, { width: anchoDto, align: "right" });
    } else doc.text(sinIva ? "P. UNIT. S/IVA" : "P. UNIT.", col.unit, y + 7, { width: anchoUnit, align: "right" });
    doc.text(sinIva ? "IMPORTE S/IVA" : "IMPORTE", col.tot, y + 7, { width: anchoTot, align: "right" });
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
  const bruto = num(dt.bruto) || renglones.reduce((a, r) => a + num(r.contado) * num(r.cant), 0);
  const descuento = num(dt.descuento);
  const recargo = Math.round((d.total - (bruto - descuento)) * 100) / 100;
  const unitDe = (r: Renglon) =>
    sinIva ? Math.round((num(r.contado) / (1 + (num(r.iva) || 21) / 100)) * 100) / 100 : num(r.contado);
  // Con descuento por renglon: lo que tienen que sumar los renglones es lo
  // que dice el comprobante (sin IVA en la A: el neto que tiene ARCA, si no
  // hay recargo de por medio).
  const crudos = renglones.map((r) => unitDe(r) * num(r.cant) * (1 - pctDto / 100) * 100);
  const meta = !porItem
    ? null
    : sinIva
      ? arca && Math.abs(recargo) < 0.5
        ? Math.round(arca.neto * 100)
        : null
      : Math.round((bruto - descuento) * 100);
  const importesCent = porItem ? ((meta != null && ajustarCentavos(crudos, meta)) || crudos.map((c) => Math.round(c))) : null;
  let netoRenglones = 0;
  for (const [i, r] of renglones.entries()) {
    const cant = num(r.cant);
    const unit = unitDe(r);
    const importe = importesCent ? importesCent[i] / 100 : unit * cant;
    netoRenglones += importe;
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
    if (!remito) {
      doc.text(pesos(unit), col.unit, y + 4, { width: anchoUnit, align: "right" });
      if (porItem)
        doc.text(pesos(Math.round(unit * (1 - pctDto / 100) * 100) / 100), col.dto, y + 4, { width: anchoDto, align: "right" });
      doc.text(pesos(importe), col.tot, y + 4, { width: anchoTot, align: "right" });
    }
    y += alto;
    doc.moveTo(M, y).lineTo(der, y).strokeColor("#EEEEEE").lineWidth(0.5).stroke();
  }

  // ------------------------------------------- EL REMITO: UNIDADES Y FIRMA
  if (remito) {
    const unidades = renglones.reduce((a, r) => a + num(r.cant), 0);
    if (y + 130 > PIE) otraHoja();
    y += 12;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(NEGRO)
      .text(`${unidades} ${unidades === 1 ? "unidad" : "unidades"} en ${renglones.length} ${renglones.length === 1 ? "renglón" : "renglones"}`, M, y, {
        width: anchoUtil,
        align: "right",
      });
    y += 30;
    doc.rect(M, y, anchoUtil, 86).strokeColor(BORDE).lineWidth(1).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(NEGRO).text("RECIBÍ CONFORME", M + 12, y + 10);
    const linea = (x: number, ancho: number, etq: string) => {
      doc.moveTo(x, y + 62).lineTo(x + ancho, y + 62).strokeColor(GRIS).lineWidth(0.6).stroke();
      doc.font("Helvetica").fontSize(7.5).fillColor(GRIS).text(etq, x, y + 66, { width: ancho, align: "center" });
    };
    const ancho = (anchoUtil - 24 - 30) / 4;
    linea(M + 12, ancho, "Firma");
    linea(M + 12 + (ancho + 10), ancho, "Aclaración");
    linea(M + 12 + (ancho + 10) * 2, ancho, "DNI");
    linea(M + 12 + (ancho + 10) * 3, ancho, "Fecha");
    y += 96;
  }

  // ----------------------------------------------------------------- TOTALES
  if (!remito) {
  // Los precios de los renglones son los de contado. Abajo, lo que los
  // lleva al total: el descuento y el recargo de la forma de pago.
  // En la A, el subtotal sin IVA y el ajuste solo si hubo descuento o recargo
  // de verdad: si no, la diferencia de centavos de redondear cada renglon
  // aparecia como "Descuento -$ 0,01".
  // Con el descuento por renglon (V.0.11.227) ya no es un ajuste de abajo.
  const hayAjuste = (descuento > 0.004 && !porItem) || Math.abs(recargo) >= 0.5;
  const filas: [string, string, boolean][] = sinIva
    ? hayAjuste
      ? [["Subtotal sin IVA", pesos(netoRenglones), false]]
      : []
    : porItem
      ? Math.abs(recargo) >= 0.5
        ? [["Subtotal", pesos(bruto - descuento), false]]
        : []
      : [["Subtotal", pesos(bruto), false]];
  if (!sinIva && descuento > 0.004 && !porItem) filas.push([`Descuento ${num(dt.desc) ? num(dt.desc) + "%" : ""}`.trim(), `- ${pesos(descuento)}`, false]);
  // Lo que no entro repartiendo de a un centavo por renglon.
  if (porItem && !sinIva) {
    const redondeo = Math.round((bruto - descuento - netoRenglones) * 100) / 100;
    if (Math.abs(redondeo) >= 0.01) filas.push(["Redondeo", pesos(redondeo), false]);
  }
  if (!sinIva && Math.abs(recargo) >= 0.5)
    filas.push([`${recargo > 0 ? "Recargo" : "Ajuste"} ${dt.forma ? sinPrefijo(dt.forma) : "forma de pago"}`, pesos(recargo), false]);
  if (arca && letra === "A") {
    // El descuento o el recargo de la forma de pago, sin IVA.
    const ajuste = Math.round((arca.neto - netoRenglones) * 100) / 100;
    if (hayAjuste && Math.abs(ajuste) >= 0.01)
      filas.push([ajuste < 0 ? "Descuento sin IVA" : `Recargo ${dt.forma ? sinPrefijo(dt.forma) : "forma de pago"} sin IVA`, pesos(ajuste), false]);
    else if (porItem && Math.abs(ajuste) >= 0.01) filas.push(["Redondeo sin IVA", pesos(ajuste), false]);
    filas.push(["Neto gravado", pesos(arca.neto), false]);
    for (const a of arca.alicuotas) filas.push([`IVA ${String(a.pct).replace(".", ",")} %`, pesos(a.importe), false]);
  }
  filas.push(["TOTAL", pesos(d.total), true]);
  // Lo que se ahorro, ya puesto en cada renglon (en la A, sin IVA como los renglones).
  if (porItem) {
    const listaRenglones = renglones.reduce((a, r) => a + unitDe(r) * num(r.cant), 0);
    const ahorro = sinIva ? Math.round((listaRenglones - netoRenglones) * 100) / 100 : descuento;
    filas.push([`Descuento ${String(pctDto).replace(".", ",")}% ya aplicado en cada artículo${sinIva ? " (sin IVA)" : ""}`, pesos(ahorro), false]);
  }
  if (arca && letra === "B") filas.push(["IVA contenido (Ley 27.743)", pesos(arca.iva), false]);

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

  }

  // --------------------------------------------------------- CAE Y QR (ARCA)
  if (arca) {
    if (y + 96 > PIE) otraHoja();
    y += 10;
    doc.rect(M, y, anchoUtil, 84).strokeColor(BORDE).lineWidth(1).stroke();
    try {
      const { pngQr } = await import("@/lib/afip/qr");
      const qr = await pngQr({
        fecha: new Date(arca.fecha + "T12:00:00"),
        cuit: arca.cuit,
        ptoVta: arca.ptoVta,
        tipoCmp: arca.cbteTipo,
        nroCmp: arca.cbteNro,
        importe: d.total,
        tipoDocRec: arca.docTipo,
        nroDocRec: arca.docNro,
        cae: arca.cae,
      });
      doc.image(qr, M + 8, y + 7, { width: 70 });
    } catch {
      // Sin QR el CAE igual vale; se ve abajo.
    }
    const vto = arca.caeVto.split("-").reverse().join("/");
    doc
      .fillColor(NEGRO)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`CAE Nº ${arca.cae}`, M + 92, y + 16)
      .font("Helvetica")
      .fontSize(8.5)
      .text(`Vencimiento del CAE: ${vto}`, M + 92, y + 32)
      .fillColor(GRIS)
      .fontSize(7.5)
      .text("Comprobante autorizado por ARCA. Escaneá el QR para verificarlo.", M + 92, y + 50, { width: anchoUtil - 110 });
    y += 84;
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
        arca
          ? `${tituloDe(d)} ${numeroDe(d)} · CAE ${arca.cae}`
          : esFactura
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
