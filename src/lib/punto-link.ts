import { createHmac, timingSafeEqual } from "node:crypto";
import { PUNTO_URL } from "@/lib/dominio";

// El link público del PDF de un comprobante de Punto, para mandárselo al
// cliente por WhatsApp. Damian, 22/11/2026, con la captura del link que
// mandaba Punto (conesa.com.ar/c/x000500000908): "eso no funciona". Esa
// dirección nunca existió.
//
// El cliente no tiene usuario, así que el PDF no puede pedir login. Pero
// tampoco puede quedar abierto por número: con /comprobante/<id> cualquiera
// que pruebe ids vería los de otros. La URL lleva una firma (HMAC del id con
// el secreto del servidor), igual que el link de las facturas de la tienda
// (src/lib/afip/link-publico.ts): sin el secreto no se puede fabricar.
//
// "punto:" adelante para que la firma de un comprobante de Punto nunca sirva
// como firma de un pedido de la tienda, aunque coincidieran los ids.

function secreto(): string {
  const s = process.env.ADMIN_COOKIE_SECRET;
  if (!s) throw new Error("Falta ADMIN_COOKIE_SECRET para firmar el link");
  return s;
}

export function firmaDocumento(id: string): string {
  return createHmac("sha256", secreto()).update(`punto:${id}`).digest("base64url").slice(0, 32);
}

export function firmaValida(id: string, firma: string): boolean {
  let esperada: string;
  try {
    esperada = firmaDocumento(id);
  } catch {
    return false;
  }
  const a = Buffer.from(esperada);
  const b = Buffer.from(firma || "");
  // Tiempo constante: comparar con === deja adivinar la firma de a pedazos.
  return a.length === b.length && timingSafeEqual(a, b);
}

/** El link para el cliente, o null si el servidor no puede firmar.
 *  V.0.11.275: en conesa.com.ar (el sistema del local), no en la tienda. */
export function linkDocumento(id: string): string | null {
  try {
    return `${PUNTO_URL}/comprobante/${encodeURIComponent(id)}?f=${firmaDocumento(id)}`;
  } catch {
    return null;
  }
}
