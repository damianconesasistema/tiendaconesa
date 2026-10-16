import { createHmac, timingSafeEqual } from "node:crypto";

// Link público al PDF del comprobante, para mandárselo al cliente.
//
// El cliente no tiene usuario en el panel, así que el PDF no puede estar
// detrás del login. Pero tampoco puede quedar abierto: con la URL
// /api/factura/<id> cualquiera que pruebe ids ve facturas ajenas.
//
// Solución: la URL lleva un token que es un HMAC del id del pedido con el
// secreto del servidor. Sin el secreto no se puede fabricar, y cambiar un
// dígito del id invalida el token.

function secreto(): string {
  // Se reusa el secreto que ya protege la sesión del panel.
  const s = process.env.ADMIN_COOKIE_SECRET;
  if (!s) throw new Error("Falta ADMIN_COOKIE_SECRET para firmar el link");
  return s;
}

export function tokenComprobante(orderId: string, tipo: "factura" | "nc"): string {
  return createHmac("sha256", secreto())
    .update(`${orderId}:${tipo}`)
    .digest("base64url")
    .slice(0, 32);
}

export function tokenValido(
  orderId: string,
  tipo: "factura" | "nc",
  token: string,
): boolean {
  const esperado = tokenComprobante(orderId, tipo);
  const a = Buffer.from(esperado);
  const b = Buffer.from(token || "");
  // Comparación de tiempo constante: comparar con === filtra por timing.
  return a.length === b.length && timingSafeEqual(a, b);
}

export function linkComprobante(
  siteUrl: string,
  orderId: string,
  tipo: "factura" | "nc" = "factura",
): string {
  const t = tokenComprobante(orderId, tipo);
  const sufijo = tipo === "nc" ? "&tipo=nc" : "";
  return `${siteUrl}/api/factura/${orderId}?t=${t}${sufijo}`;
}
