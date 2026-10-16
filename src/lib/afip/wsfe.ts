import { auth } from "@/lib/afip/wsaa";
import { IVA_21, urls } from "@/lib/afip/config";

// WSFEv1: el servicio de facturación electrónica de ARCA.
//
// Se habla SOAP 1.1 a mano, sin librería: son dos llamadas y meter un cliente
// SOAP entero para eso agrega más problemas que los que resuelve.
//
//   FECompUltimoAutorizado  -> qué número de comprobante va ahora
//   FECAESolicitar          -> emite y devuelve el CAE
//
// ARCA casi nunca responde con un error HTTP: devuelve 200 con un bloque
// <Errors> adentro. Por eso cada respuesta se revisa a mano.

const NS = "http://ar.gov.afip.dif.FEV1/";

function entre(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? m[1] : "";
}

function todos(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

/** Junta los <Err> y <Obs> que devuelve ARCA en un mensaje legible. */
function problemas(xml: string): string[] {
  const msgs: string[] = [];
  for (const bloque of [...todos(xml, "Err"), ...todos(xml, "Obs")]) {
    const code = entre(bloque, "Code");
    const msg = entre(bloque, "Msg");
    if (msg) msgs.push(`${msg}${code ? ` (${code})` : ""}`);
  }
  return msgs;
}

async function llamar(metodo: string, cuerpo: string): Promise<string> {
  const sobre =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:ar="${NS}"><soap:Header/><soap:Body>${cuerpo}</soap:Body></soap:Envelope>`;

  const r = await fetch(urls().wsfe, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: `${NS}${metodo}`,
    },
    body: sobre,
  });
  const texto = await r.text();

  if (!r.ok || texto.includes("<faultstring>")) {
    const motivo = entre(texto, "faultstring") || `HTTP ${r.status}`;
    throw new Error(`ARCA falló en ${metodo}: ${motivo}`);
  }
  return texto;
}

function bloqueAuth(a: { token: string; sign: string; cuit: string }) {
  return (
    `<ar:Auth><ar:Token>${a.token}</ar:Token>` +
    `<ar:Sign>${a.sign}</ar:Sign>` +
    `<ar:Cuit>${a.cuit}</ar:Cuit></ar:Auth>`
  );
}

/** Último comprobante autorizado para ese punto de venta y tipo. */
export async function ultimoAutorizado(
  ptoVta: number,
  cbteTipo: number,
): Promise<number> {
  const a = await auth();
  const xml = await llamar(
    "FECompUltimoAutorizado",
    `<ar:FECompUltimoAutorizado>${bloqueAuth(a)}` +
      `<ar:PtoVta>${ptoVta}</ar:PtoVta>` +
      `<ar:CbteTipo>${cbteTipo}</ar:CbteTipo>` +
      `</ar:FECompUltimoAutorizado>`,
  );

  const errores = problemas(xml);
  // Un punto de venta sin comprobantes devuelve 0, que es válido: arrancamos
  // en 1. Pero si ademas hay errores reales, hay que frenar.
  if (errores.length && !xml.includes("<CbteNro>"))
    throw new Error(`ARCA: ${errores.join(" · ")}`);

  const nro = Number(entre(xml, "CbteNro"));
  if (!Number.isFinite(nro)) throw new Error("ARCA no devolvió el último número");
  return nro;
}

export type Comprobante = {
  ptoVta: number;
  cbteTipo: number;
  /** 80 = CUIT, 96 = DNI, 99 = consumidor final */
  docTipo: number;
  docNro: string;
  /** Fecha del comprobante. Default: hoy. */
  fecha?: Date;
  /** Totales en pesos, con hasta 2 decimales. */
  neto: number;
  iva: number;
  total: number;
  /** Solo para notas de credito: la factura que se esta anulando.
   *  ARCA la exige, si no rechaza el comprobante. */
  asociado?: { cbteTipo: number; ptoVta: number; cbteNro: number; cuit: string; fecha: Date };
};

export type Autorizacion = {
  cae: string;
  caeVto: Date;
  cbteNro: number;
  resultado: string;
  observaciones: string[];
  raw: string;
};

function yyyymmdd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function fechaDeAfip(s: string): Date {
  // ARCA devuelve "20261016"
  return new Date(
    Number(s.slice(0, 4)),
    Number(s.slice(4, 6)) - 1,
    Number(s.slice(6, 8)),
  );
}

function dosDecimales(n: number): string {
  return n.toFixed(2);
}

/** Emite el comprobante y devuelve el CAE. */
export async function solicitarCae(c: Comprobante): Promise<Autorizacion> {
  const a = await auth();
  const ultimo = await ultimoAutorizado(c.ptoVta, c.cbteTipo);
  const nro = ultimo + 1;
  const fecha = yyyymmdd(c.fecha ?? new Date());

  const asoc = c.asociado
    ? `<ar:CbtesAsoc><ar:CbteAsoc>` +
      `<ar:Tipo>${c.asociado.cbteTipo}</ar:Tipo>` +
      `<ar:PtoVta>${c.asociado.ptoVta}</ar:PtoVta>` +
      `<ar:Nro>${c.asociado.cbteNro}</ar:Nro>` +
      `<ar:Cuit>${c.asociado.cuit}</ar:Cuit>` +
      `<ar:CbteFch>${yyyymmdd(c.asociado.fecha)}</ar:CbteFch>` +
      `</ar:CbteAsoc></ar:CbtesAsoc>`
    : "";

  const detalle =
    `<ar:FECAEDetRequest>` +
    `<ar:Concepto>1</ar:Concepto>` + // 1 = productos
    `<ar:DocTipo>${c.docTipo}</ar:DocTipo>` +
    `<ar:DocNro>${c.docNro}</ar:DocNro>` +
    `<ar:CbteDesde>${nro}</ar:CbteDesde>` +
    `<ar:CbteHasta>${nro}</ar:CbteHasta>` +
    `<ar:CbteFch>${fecha}</ar:CbteFch>` +
    asoc +
    `<ar:ImpTotal>${dosDecimales(c.total)}</ar:ImpTotal>` +
    `<ar:ImpTotConc>0</ar:ImpTotConc>` +
    `<ar:ImpNeto>${dosDecimales(c.neto)}</ar:ImpNeto>` +
    `<ar:ImpOpEx>0</ar:ImpOpEx>` +
    `<ar:ImpIVA>${dosDecimales(c.iva)}</ar:ImpIVA>` +
    `<ar:ImpTrib>0</ar:ImpTrib>` +
    `<ar:MonId>PES</ar:MonId>` +
    `<ar:MonCotiz>1</ar:MonCotiz>` +
    `<ar:Iva><ar:AlicIva>` +
    `<ar:Id>${IVA_21}</ar:Id>` +
    `<ar:BaseImp>${dosDecimales(c.neto)}</ar:BaseImp>` +
    `<ar:Importe>${dosDecimales(c.iva)}</ar:Importe>` +
    `</ar:AlicIva></ar:Iva>` +
    `</ar:FECAEDetRequest>`;

  const xml = await llamar(
    "FECAESolicitar",
    `<ar:FECAESolicitar>${bloqueAuth(a)}<ar:FeCAEReq>` +
      `<ar:FeCabReq><ar:CantReg>1</ar:CantReg>` +
      `<ar:PtoVta>${c.ptoVta}</ar:PtoVta>` +
      `<ar:CbteTipo>${c.cbteTipo}</ar:CbteTipo></ar:FeCabReq>` +
      `<ar:FeDetReq>${detalle}</ar:FeDetReq>` +
      `</ar:FeCAEReq></ar:FECAESolicitar>`,
  );

  const resultado = entre(xml, "Resultado"); // A = aprobado, R = rechazado
  const cae = entre(xml, "CAE");
  const vto = entre(xml, "CAEFchVto");
  const avisos = problemas(xml);

  if (resultado !== "A" || !cae) {
    throw new Error(
      avisos.length
        ? `ARCA rechazó el comprobante: ${avisos.join(" · ")}`
        : "ARCA rechazó el comprobante sin dar motivo",
    );
  }

  return {
    cae,
    caeVto: fechaDeAfip(vto),
    cbteNro: nro,
    resultado,
    // Las observaciones no impiden la emisión, pero conviene verlas.
    observaciones: avisos,
    raw: xml,
  };
}
