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

// --------------------------------------------- una sucursal, un certificado
//
// Las dos tiendas las atiende el mismo servidor y son dos contribuyentes
// distintos. Cada una factura con SU certificado, igual que cobra en SU
// cuenta de MercadoPago.
//
// La variable de cada una es la de siempre con el slug pegado atras:
// AFIP_CERT_BSAS, AFIP_KEY_BSAS, AFIP_CUIT_BSAS, AFIP_PTO_VTA_BSAS.

/** Como se llama esta variable para esta sucursal.
 *
 *  Sin sucursal devuelve el nombre pelado, que es el que habia cuando la
 *  tienda era una sola. */
export function variableDe(nombre: string, sucursal?: string | null): string {
  if (!sucursal) return nombre;
  return nombre + "_" + sucursal.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

/** El valor que le toca a esta sucursal: el suyo, o el general.
 *
 *  El respaldo existe porque Traslasierra factura con las variables peladas
 *  desde antes de que hubiera dos locales. Moverlas seria tocar lo unico que
 *  hoy esta emitiendo comprobantes con validez fiscal, y no hace falta.
 *
 *  Que el respaldo pueda devolver el certificado del otro contribuyente no
 *  es un descuido: antes de pedir el CAE, emitir.ts compara el CUIT de la
 *  sucursal del pedido con el que se va a usar y no emite si no coinciden.
 *  El respaldo deja todo andando; el freno impide que ande mal. */
function valor(nombre: string, sucursal?: string | null): string {
  const propia = process.env[variableDe(nombre, sucursal)];
  if (propia && propia.trim()) return propia.trim();
  return (process.env[nombre] || "").trim();
}

/** Si esta sucursal tiene SU certificado cargado.
 *
 *  Si no lo tiene, usa el general, que es de la otra: todo parece andar y no
 *  hay ningun error a la vista. Por eso el panel lo dice. */
export function afipClavePropia(sucursal?: string | null): boolean {
  if (!sucursal) return false;
  const c = process.env[variableDe("AFIP_CERT", sucursal)];
  return !!(c && c.trim());
}

export function afipConfigurado(sucursal?: string | null): boolean {
  return (
    !!valor("AFIP_CUIT", sucursal) &&
    !!valor("AFIP_CERT", sucursal) &&
    !!valor("AFIP_KEY", sucursal) &&
    !!valor("AFIP_PTO_VTA", sucursal)
  );
}

export function cuit(sucursal?: string | null): string {
  const c = valor("AFIP_CUIT", sucursal).replace(/\D/g, "");
  if (c.length !== 11)
    throw new Error(
      `${variableDe("AFIP_CUIT", sucursal)} tiene que tener 11 dígitos`,
    );
  return c;
}

/** El CUIT que se va a usar, o "" si no hay uno valido.
 *
 *  Para el freno de emitir.ts, que necesita comparar sin romperse cuando
 *  falta el dato: un freno que explota es un freno que deja de facturar. */
export function cuitSiHay(sucursal?: string | null): string {
  const c = valor("AFIP_CUIT", sucursal).replace(/\D/g, "");
  return c.length === 11 ? c : "";
}

export function puntoVenta(sucursal?: string | null): number {
  const p = Number(valor("AFIP_PTO_VTA", sucursal));
  if (!Number.isInteger(p) || p <= 0)
    throw new Error(
      `${variableDe("AFIP_PTO_VTA", sucursal)} tiene que ser un número de punto de venta`,
    );
  return p;
}

/** El .crt y el .key, decodificados de base64 a texto PEM. */
export function certificado(sucursal?: string | null): { cert: string; key: string } {
  const cert = Buffer.from(valor("AFIP_CERT", sucursal), "base64").toString("utf8");
  const key = Buffer.from(valor("AFIP_KEY", sucursal), "base64").toString("utf8");
  if (!cert.includes("BEGIN CERTIFICATE"))
    throw new Error(
      `${variableDe("AFIP_CERT", sucursal)} no parece un certificado en base64`,
    );
  if (!key.includes("PRIVATE KEY"))
    throw new Error(
      `${variableDe("AFIP_KEY", sucursal)} no parece una clave privada en base64`,
    );
  return { cert, key };
}
