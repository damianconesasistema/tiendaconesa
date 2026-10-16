import { CBTE, DOC, IVA_PCT } from "@/lib/afip/config";

// Traduce un pedido de la tienda a lo que espera ARCA.
//
// Los precios de la tienda son FINALES: lo que el cliente ve es lo que paga,
// con IVA adentro. Para facturar hay que partirlo en neto + IVA, que es al
// revés de como se suele pensar el precio.
//
//   neto = total / 1,21     iva = total - neto
//
// Se redondea a 2 decimales y el IVA se calcula por diferencia, nunca
// multiplicando: si se redondean los dos por separado, la suma puede dar un
// centavo distinto del total y ARCA rechaza el comprobante.

export function partirIva(total: number): { neto: number; iva: number } {
  const neto = Math.round((total / (1 + IVA_PCT)) * 100) / 100;
  const iva = Math.round((total - neto) * 100) / 100;
  return { neto, iva };
}

export type DatosComprador = {
  dni?: string | null;
  cuit?: string | null;
};

/** Qué tipo de factura corresponde y con qué documento se identifica. */
export function tipoDeComprobante(c: DatosComprador) {
  const cuit = (c.cuit || "").replace(/\D/g, "");
  if (cuit.length === 11) {
    // Con CUIT va Factura A, que discrimina el IVA en el papel.
    return { cbteTipo: CBTE.FACTURA_A, docTipo: DOC.CUIT, docNro: cuit };
  }

  const dni = (c.dni || "").replace(/\D/g, "");
  if (dni.length >= 7 && dni.length <= 8) {
    return { cbteTipo: CBTE.FACTURA_B, docTipo: DOC.DNI, docNro: dni };
  }

  // Sin documento válido: consumidor final sin identificar. ARCA solo lo
  // acepta por debajo de cierto monto, asi que el checkout pide el DNI.
  return { cbteTipo: CBTE.FACTURA_B, docTipo: DOC.CONSUMIDOR_FINAL, docNro: "0" };
}

export function nombreComprobante(cbteTipo: number): string {
  if (cbteTipo === CBTE.FACTURA_A) return "FACTURA A";
  if (cbteTipo === CBTE.FACTURA_B) return "FACTURA B";
  if (cbteTipo === CBTE.NOTA_CREDITO_A) return "NOTA DE CRÉDITO A";
  if (cbteTipo === CBTE.NOTA_CREDITO_B) return "NOTA DE CRÉDITO B";
  return `COMPROBANTE ${cbteTipo}`;
}

/** La letra grande del recuadro del medio. */
export function letraComprobante(cbteTipo: number): string {
  if (cbteTipo === CBTE.FACTURA_A || cbteTipo === CBTE.NOTA_CREDITO_A) return "A";
  return "B";
}

/** Código de comprobante que va abajo de la letra, como exige el formato. */
export function codigoComprobante(cbteTipo: number): string {
  return String(cbteTipo).padStart(3, "0");
}

/** "0006-00000001" */
export function numeroFormateado(ptoVta: number, cbteNro: number): string {
  return `${String(ptoVta).padStart(4, "0")}-${String(cbteNro).padStart(8, "0")}`;
}
