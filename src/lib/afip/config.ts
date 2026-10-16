// Configuración de la facturación electrónica de ARCA (ex AFIP).
//
// Variables en Railway:
//   AFIP_CUIT       CUIT del emisor, sin guiones. Ej: 20275870685
//   AFIP_PTO_VTA    punto de venta habilitado como "RECE para aplicativo y
//                   web services". El de la tienda es el 6 (TIENDA ONLINE).
//   AFIP_CERT       certificado .crt que devolvió ARCA, en base64
//   AFIP_KEY        clave privada .key que generamos nosotros, en base64
//   AFIP_ENV        "homologacion" (default) o "produccion"
//
// El certificado y la clave van en base64 porque son archivos de varias
// líneas y las variables de entorno no las manejan bien.
//
// REGLA: si falta algo, facturar falla con un mensaje claro y el pedido
// queda intacto. Nunca se inventa un comprobante a medias.

export type Ambiente = "homologacion" | "produccion";

export function ambiente(): Ambiente {
  return process.env.AFIP_ENV === "produccion" ? "produccion" : "homologacion";
}

/** En homologación los comprobantes NO tienen validez fiscal. */
export function esProduccion() {
  return ambiente() === "produccion";
}

export const URLS = {
  homologacion: {
    wsaa: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  },
  produccion: {
    wsaa: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
    wsfe: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
  },
} as const;

export function urls() {
  return URLS[ambiente()];
}

/** Tipos de comprobante que usamos. El resto no aplica a la tienda. */
export const CBTE = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
} as const;

/** Tipos de documento del comprador, según la tabla de ARCA. */
export const DOC = {
  CUIT: 80,
  DNI: 96,
  CONSUMIDOR_FINAL: 99,
} as const;

/** Id 5 = 21%, que es la alícuota de todo lo que vende la tienda. */
export const IVA_21 = 5;
export const IVA_PCT = 0.21;

export function afipConfigurado(): boolean {
  return (
    !!process.env.AFIP_CUIT &&
    !!process.env.AFIP_CERT &&
    !!process.env.AFIP_KEY &&
    !!process.env.AFIP_PTO_VTA
  );
}

export function cuit(): string {
  const c = (process.env.AFIP_CUIT || "").replace(/\D/g, "");
  if (c.length !== 11) throw new Error("AFIP_CUIT tiene que tener 11 dígitos");
  return c;
}

export function puntoVenta(): number {
  const p = Number(process.env.AFIP_PTO_VTA);
  if (!Number.isInteger(p) || p <= 0)
    throw new Error("AFIP_PTO_VTA tiene que ser un número de punto de venta");
  return p;
}

/** El .crt y el .key, decodificados de base64 a texto PEM. */
export function certificado(): { cert: string; key: string } {
  const cert = Buffer.from(process.env.AFIP_CERT || "", "base64").toString("utf8");
  const key = Buffer.from(process.env.AFIP_KEY || "", "base64").toString("utf8");
  if (!cert.includes("BEGIN CERTIFICATE"))
    throw new Error("AFIP_CERT no parece un certificado en base64");
  if (!key.includes("PRIVATE KEY"))
    throw new Error("AFIP_KEY no parece una clave privada en base64");
  return { cert, key };
}
