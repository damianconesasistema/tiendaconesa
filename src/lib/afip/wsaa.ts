import forge from "node-forge";
import { prisma } from "@/lib/db";
import { ambiente, certificado, cuit, urls } from "@/lib/afip/config";

// WSAA: el login de ARCA.
//
// Para poder facturar hay que pedir primero un "ticket de acceso" (TA), que
// es un token que dura 12 horas. Para pedirlo hay que firmar un XML con el
// certificado digital, en formato CMS (PKCS#7) y mandarlo en base64.
//
// Ese TA se guarda en la tabla Setting y se reusa hasta que vence. Pedir uno
// nuevo cuando todavía hay uno válido da error en ARCA ("El CEE ya posee un
// TA valido"), así que el cache no es una optimización: es obligatorio.

export type TicketAcceso = { token: string; sign: string; expira: Date };

function claveCache() {
  return `afip:ta:wsfe:${ambiente()}`;
}

/** Arma el XML que pide ARCA y lo firma con el certificado. */
function firmarLoginTicketRequest(): string {
  const { cert, key } = certificado();
  const ahora = Date.now();
  // Se pide con 10 minutos de margen hacia atrás y 10 hacia adelante para
  // tolerar diferencias de reloj entre nuestro servidor y el de ARCA.
  const desde = new Date(ahora - 10 * 60 * 1000).toISOString();
  const hasta = new Date(ahora + 10 * 60 * 1000).toISOString();

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<loginTicketRequest version="1.0">` +
    `<header>` +
    `<uniqueId>${Math.floor(ahora / 1000)}</uniqueId>` +
    `<generationTime>${desde}</generationTime>` +
    `<expirationTime>${hasta}</expirationTime>` +
    `</header>` +
    `<service>wsfe</service>` +
    `</loginTicketRequest>`;

  const p7 = forge.pkcs7.createSignedData();
  p7.content = forge.util.createBuffer(xml, "utf8");
  p7.addCertificate(forge.pki.certificateFromPem(cert));
  p7.addSigner({
    key: forge.pki.privateKeyFromPem(key),
    certificate: forge.pki.certificateFromPem(cert),
    digestAlgorithm: forge.pki.oids.sha256,
    authenticatedAttributes: [
      { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
      { type: forge.pki.oids.messageDigest },
      { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
    ],
  });
  p7.sign();

  const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
  return forge.util.encode64(der);
}

function entre(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(xml);
  return m ? m[1] : "";
}

function desescapar(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Pide un TA nuevo a ARCA. */
async function pedirTicket(): Promise<TicketAcceso> {
  const cms = firmarLoginTicketRequest();
  const sobre =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" ` +
    `xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">` +
    `<soapenv:Header/><soapenv:Body><wsaa:loginCms><wsaa:in0>${cms}</wsaa:in0>` +
    `</wsaa:loginCms></soapenv:Body></soapenv:Envelope>`;

  const r = await fetch(urls().wsaa, {
    method: "POST",
    headers: { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
    body: sobre,
  });
  const texto = await r.text();

  if (!r.ok || texto.includes("<faultstring>")) {
    const motivo = entre(texto, "faultstring") || `HTTP ${r.status}`;
    throw new Error(`ARCA rechazó el login: ${motivo}`);
  }

  // La respuesta trae el ticket como XML escapado dentro de loginCmsReturn.
  const ta = desescapar(entre(texto, "loginCmsReturn"));
  const token = entre(ta, "token");
  const sign = entre(ta, "sign");
  const expira = entre(ta, "expirationTime");
  if (!token || !sign) throw new Error("ARCA no devolvió el ticket de acceso");

  return { token, sign, expira: new Date(expira) };
}

/** Devuelve un TA válido: el guardado si todavía sirve, o uno nuevo. */
export async function ticketAcceso(): Promise<TicketAcceso> {
  const clave = claveCache();
  const guardado = await prisma.setting.findUnique({ where: { key: clave } });

  if (guardado) {
    try {
      const ta = JSON.parse(guardado.value) as {
        token: string;
        sign: string;
        expira: string;
      };
      // 10 minutos de colchón: no sirve un ticket que vence mientras lo usamos.
      if (new Date(ta.expira).getTime() - Date.now() > 10 * 60 * 1000) {
        return { token: ta.token, sign: ta.sign, expira: new Date(ta.expira) };
      }
    } catch {
      // Si el cache quedó corrupto se pide uno nuevo y listo.
    }
  }

  const ta = await pedirTicket();
  const valor = JSON.stringify({
    token: ta.token,
    sign: ta.sign,
    expira: ta.expira.toISOString(),
  });
  await prisma.setting.upsert({
    where: { key: clave },
    create: { key: clave, value: valor },
    update: { value: valor },
  });
  return ta;
}

/** El bloque <Auth> que acompaña a cada llamada de facturación. */
export async function auth() {
  const ta = await ticketAcceso();
  return { token: ta.token, sign: ta.sign, cuit: cuit() };
}
