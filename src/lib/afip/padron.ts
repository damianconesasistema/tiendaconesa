import { ambiente, cuit } from "@/lib/afip/config";
import { ticketAcceso } from "@/lib/afip/wsaa";

// Padron de ARCA: los datos de un CUIT (razon social, condicion de IVA,
// domicilio fiscal) para dar de alta un cliente sin tipear. Damian,
// 22/11/2026: "Si yo pongo un DNI o un cuit, ¿podes traer todos los datos
// reales? ... conectalo. Asi podes acceder a las datas de Arca".
//
// Es SOLO CONSULTA: no emite nada ni toca la facturacion. Usa el mismo
// certificado que la factura de la tienda (el de Traslasierra, Carlos Daniel
// Conesa), pero con otro servicio de ARCA, "ws_sr_constancia_inscripcion"
// (constancia de inscripcion, metodo getPersona_v2). Ese servicio tiene que
// estar habilitado para el certificado en ARCA (Administrador de Relaciones):
// si no lo esta, ARCA lo dice al pedir el ticket y se devuelve ese aviso.
//
// Con DNI: ARCA no busca por DNI en este servicio, pero el CUIT de una
// persona es su DNI con un prefijo (20, 27, 23 o 24) y un digito
// verificador. Se prueban esos y se devuelve el que exista.

const SERVICIO = "ws_sr_constancia_inscripcion";
const URL_A5 = {
  homologacion: "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5",
  produccion: "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5",
} as const;

export type DatosPadron = {
  /** Si ARCA contesto con la constancia en error: que revisar a mano. */
  aviso: string;
  cuit: string;
  razonSocial: string;
  condicionIva: "Responsable Inscripto" | "Monotributo" | "IVA Exento" | "Consumidor Final";
  domicilio: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
};

/** El digito verificador de un CUIT de 10 digitos, o -1 si no tiene (da 10). */
export function digitoCuit(diez: string): number {
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((a, p, i) => a + p * Number(diez[i]), 0);
  const r = 11 - (suma % 11);
  if (r === 11) return 0;
  if (r === 10) return -1;
  return r;
}

/** Los CUIT posibles de un DNI (persona humana): 20, 27, 23 y 24. */
export function cuitsDeDni(dni: string): string[] {
  const d = dni.padStart(8, "0");
  const salida: string[] = [];
  for (const pre of ["20", "27", "23", "24"]) {
    const dv = digitoCuit(pre + d);
    if (dv >= 0) salida.push(pre + d + dv);
  }
  return salida;
}

function entre(xml: string, tag: string): string {
  const m = new RegExp(`<(?:\\w+:)?${tag}>([\\s\\S]*?)</(?:\\w+:)?${tag}>`).exec(xml);
  return m ? m[1] : "";
}
function texto(xml: string, tag: string): string {
  return entre(xml, tag)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[<>]/g, "")
    .trim();
}

/** Que se le dice a la pantalla cuando ARCA no deja usar el servicio. */
export class PadronNoHabilitado extends Error {}

/** Los datos de un CUIT, o null si ARCA no lo conoce. */
export async function consultarCuit(numero: string): Promise<DatosPadron | null> {
  let ta;
  try {
    // null = el certificado de siempre (el de la factura de la tienda).
    ta = await ticketAcceso(null, SERVICIO);
  } catch (e) {
    const m = (e as Error).message || "";
    if (/notAuthorized|no autorizado|not authorized/i.test(m)) throw new PadronNoHabilitado(m);
    if (/ya posee un TA/i.test(m))
      throw new Error("ARCA ya entregó un permiso para la consulta hace un rato y todavía no lo puedo usar: probá en unos minutos");
    throw e;
  }
  const sobre =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:a5="http://a5.soap.ws.server.puc.sr/">` +
    `<soapenv:Header/><soapenv:Body><a5:getPersona_v2>` +
    `<token>${ta.token}</token><sign>${ta.sign}</sign>` +
    `<cuitRepresentada>${cuit(null)}</cuitRepresentada><idPersona>${numero}</idPersona>` +
    `</a5:getPersona_v2></soapenv:Body></soapenv:Envelope>`;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 15000);
  let xml: string;
  try {
    const r = await fetch(URL_A5[ambiente()], {
      method: "POST",
      headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      body: sobre,
      signal: ctl.signal,
    });
    xml = await r.text();
    if (!r.ok && !/faultstring/.test(xml)) throw new Error(`ARCA respondió ${r.status}`);
  } finally {
    clearTimeout(t);
  }

  // "No existe persona con ese Id" llega como fault: ese CUIT no esta.
  const falla = texto(xml, "faultstring");
  if (falla) {
    if (/no existe|inexistente|not found/i.test(falla)) return null;
    throw new Error(`ARCA: ${falla}`);
  }
  if (!/getPersona_v2Response/.test(xml)) throw new Error("ARCA no contestó como se esperaba");
  const persona = entre(xml, "personaReturn");
  if (!persona) return null;

  const generales = entre(persona, "datosGenerales");
  const errorConstancia = entre(persona, "errorConstancia");
  const base = generales || errorConstancia;
  if (!base) return null;
  const razon = texto(base, "razonSocial");
  const nombre = [texto(base, "apellido"), texto(base, "nombre")].filter(Boolean).join(" ");
  const domicilio = entre(generales, "domicilioFiscal");

  // La condicion de IVA: monotributo si tiene datos de monotributo; si no,
  // por el impuesto inscripto (30 = IVA, 32 = IVA exento).
  const regimen = entre(persona, "datosRegimenGeneral");
  const impuestos = [...regimen.matchAll(/<(?:\w+:)?idImpuesto>(\d+)</g)].map((m) => Number(m[1]));
  // Con la constancia en error (sin datos generales) no se sabe la condicion:
  // queda Consumidor Final, pero con aviso, para que se revise a mano.
  const condicionIva: DatosPadron["condicionIva"] = entre(persona, "datosMonotributo")
    ? "Monotributo"
    : impuestos.includes(30)
      ? "Responsable Inscripto"
      : impuestos.includes(32)
        ? "IVA Exento"
        : "Consumidor Final";

  return {
    aviso: !generales && errorConstancia ? texto(errorConstancia, "error").slice(0, 200) || "ARCA no dio la constancia completa: revisá la condición de IVA." : "",
    cuit: numero,
    razonSocial: (razon || nombre).slice(0, 160),
    condicionIva,
    domicilio: texto(domicilio, "direccion").slice(0, 160),
    localidad: texto(domicilio, "localidad").slice(0, 80),
    provincia: texto(domicilio, "descripcionProvincia").slice(0, 80),
    codigoPostal: texto(domicilio, "codPostal").slice(0, 10),
  };
}

/** Con CUIT (11 digitos) o DNI (7 u 8): los datos del primero que ARCA conoce. */
export async function buscarEnPadron(doc: string): Promise<DatosPadron | null> {
  const n = doc.replace(/\D/g, "");
  if (n.length === 11) return consultarCuit(n);
  if (n.length === 7 || n.length === 8) {
    for (const c of cuitsDeDni(n)) {
      const d = await consultarCuit(c);
      if (d) return d;
    }
    return null;
  }
  return null;
}
