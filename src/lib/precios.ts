// Cálculo de precios según la forma de pago.
//
// REGLA DE NEGOCIO
// En la base guardamos SIEMPRE el precio de contado, que desde el 31/10/2026
// es el de TRANSFERENCIA y solo ese: Damian saco el efectivo del descuento,
// y el mismo dia subio ese descuento de 10% a 12%.
// Ese es el que le queda neto al negocio. Los demás se derivan.
//
// POR QUÉ SE DIVIDE Y NO SE MULTIPLICA
// MercadoPago cobra su comisión sobre el TOTAL de la transacción. Si el precio
// de contado es 100.000 y el descuento es 12%, cobrar 112.000 y descontar el
// 12% deja 98.560, no 100.000. Hay que cobrar 100.000 / 0,88 = 113.640, que
// menos el 12% da exactamente 100.000.
//
// EFECTO BUSCADO
// Con la vitrina en 113.640, el contado (100.000) es exactamente un 12% menos.
// Por eso el cartel "12% de descuento por transferencia" es literalmente
// cierto y no publicidad engañosa. Y ese porcentaje no esta escrito a mano
// en ningun cartel: sale de descuentoContadoPct().

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
 * Descuento real del contado respecto de la vitrina. Se calcula en vez de
 * asumirlo: si alguien cambia el recargo desde el panel, el cartel sigue
 * diciendo la verdad sin que nadie tenga que acordarse de tocarlo.
 */
export function descuentoContadoPct(vitrina: number, contado: number): number {
  if (vitrina <= 0 || contado >= vitrina) return 0;
  return Math.round(((vitrina - contado) / vitrina) * 100);
}

/**
 * Lo mismo, pero a partir del recargo solo, sin necesitar un precio.
 *
 * Sirve para los textos que explican la cuenta ("el contado sale X% menos")
 * antes de tener un producto delante. El recargo y el descuento NO son el
 * mismo numero porque se miden sobre bases distintas: 13,64% de recargo es
 * 12% de descuento.
 */
export function descuentoDelRecargo(recargoPct: number): number {
  if (recargoPct <= 0) return 0;
  return Math.round((recargoPct / (100 + recargoPct)) * 100);
}
