// Config de precio para pago por TRANSFERENCIA BANCARIA.
//
// Si el cliente paga por transferencia obtiene este descuento.
// Para cambiar el porcentaje, modificá SOLO esta constante y se
// propaga a toda la tienda (ficha, catálogo, home, carrito).
//
// Valor temporal: 10% (confirmar con Damian el valor final).
export const TRANSFER_DISCOUNT_PCT = 10;

// Si en algún momento querés desactivar el precio por transferencia
// (p. ej. una campaña puntual sin descuento), poné esto en false.
export const TRANSFER_DISCOUNT_ENABLED = true;

// Nombre amigable para mostrar en la UI.
export const TRANSFER_LABEL = "por transferencia";

// Calcula el precio con descuento por transferencia a partir del
// precio efectivo (precio actual o precio en oferta, lo que corresponda).
// Redondea al peso.
export function transferPrice(effectivePrice: number): number {
  if (!TRANSFER_DISCOUNT_ENABLED) return effectivePrice;
  const factor = 1 - TRANSFER_DISCOUNT_PCT / 100;
  return Math.round(effectivePrice * factor);
}

// ¿Mostramos el precio por transferencia para este producto?
// Solo lo escondemos si el descuento está desactivado o si el precio
// es 0 / no definido.
export function showTransferPrice(effectivePrice: number): boolean {
  return (
    TRANSFER_DISCOUNT_ENABLED &&
    Number.isFinite(effectivePrice) &&
    effectivePrice > 0
  );
}
