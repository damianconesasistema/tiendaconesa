// Cálculo de precios según la forma de pago.
//
// REGLA DE NEGOCIO
// En la base guardamos SIEMPRE el precio de contado (efectivo/transferencia).
// Ese es el que le queda neto al negocio. Los demás se derivan.
//
// POR QUÉ SE DIVIDE Y NO SE MULTIPLICA
// MercadoPago cobra su comisión sobre el TOTAL de la transacción. Si el precio
// de contado es 100.000 y la comisión es 10%, cobrar 110.000 deja 99.000, no
// 100.000. Hay que cobrar 100.000 / 0,90 = 111.111, que menos el 10% da
// exactamente 100.000.
//
// EFECTO BUSCADO
// Con la vitrina en 111.111, el contado (100.000) es exactamente un 10% menos.
// Por eso el cartel "10% de descuento en efectivo o transferencia" es
// literalmente cierto y no publicidad engañosa.

/**
 * Recargo DIRECTO sobre el precio de contado.
 *
 * El número sale del simulador de costos de MercadoPago: ahí se pone cuánto
 * se quiere recibir y devuelve cuánto tiene que pagar el cliente. Ejemplo real
 * (oct 2026, cobro al instante, 6 cuotas): para recibir 100.000 el cliente
 * paga 125.711,84 => recargo 25,71%.
 *
 * ANTES ESTO ESTABA MAL: se dividía por (1 - comisión), asumiendo que la
 * comisión era un único descuento sobre el total. En realidad son dos costos
 * distintos (cobro + financiación, más IVA) y esa cuenta daba de más: 35%
 * en vez de 25,7%. Se cobraba casi 10% de más al cliente.
 */
function conRecargo(contado: number, recargoPct: number): number {
  if (recargoPct <= 0) return contado;
  return Math.round(contado * (1 + recargoPct / 100));
}

/** Precio de vitrina: el que se muestra en la tienda (débito o 1 pago). */
export function precioVitrina(contado: number, recargoPct: number): number {
  return conRecargo(contado, recargoPct);
}

/** Precio pagando en cuotas. */
export function precioCuotas(contado: number, recargoPct: number): number {
  return conRecargo(contado, recargoPct);
}

/**
 * Descuento real del contado respecto de la vitrina. Con la fórmula de arriba
 * da exactamente la comisión (10% => 10%), pero lo calculamos en vez de
 * asumirlo: si alguien cambia la fórmula, el cartel sigue diciendo la verdad.
 */
export function descuentoContadoPct(vitrina: number, contado: number): number {
  if (vitrina <= 0 || contado >= vitrina) return 0;
  return Math.round(((vitrina - contado) / vitrina) * 100);
}
