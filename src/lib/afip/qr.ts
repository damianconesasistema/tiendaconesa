import QRCode from "qrcode";

// QR obligatorio en los comprobantes electrónicos (RG 4892/2020).
//
// No es un QR que apunte a nuestra web: tiene que llevar a afip.gob.ar/fe/qr/
// con los datos del comprobante codificados en base64, para que cualquiera
// pueda verificar que la factura existe de verdad.

export type DatosQr = {
  fecha: Date;
  cuit: string;
  ptoVta: number;
  tipoCmp: number;
  nroCmp: number;
  importe: number;
  tipoDocRec: number;
  nroDocRec: string;
  cae: string;
};

function iso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function urlQr(d: DatosQr): string {
  // El orden de las claves lo fija la norma; no es decorativo.
  const datos = {
    ver: 1,
    fecha: iso(d.fecha),
    cuit: Number(d.cuit),
    ptoVta: d.ptoVta,
    tipoCmp: d.tipoCmp,
    nroCmp: d.nroCmp,
    importe: Number(d.importe.toFixed(2)),
    moneda: "PES",
    ctz: 1,
    tipoDocRec: d.tipoDocRec,
    nroDocRec: Number(d.nroDocRec) || 0,
    tipoCodAut: "E", // E = CAE
    codAut: Number(d.cae),
  };
  const b64 = Buffer.from(JSON.stringify(datos), "utf8").toString("base64");
  return `https://www.afip.gob.ar/fe/qr/?p=${b64}`;
}

/** PNG del QR, listo para meter en el PDF. */
export async function pngQr(d: DatosQr): Promise<Buffer> {
  return QRCode.toBuffer(urlQr(d), {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 300,
  });
}
