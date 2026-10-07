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

/** Precio de vitrina: el que se muestra en la tienda (incluye la comisión de 1 pago). */
export function precioVitrina(contado: number, comisionPct: number): number {
  if (comisionPct <= 0 || comisionPct >= 100) return contado;
  return Math.round(contado / (1 - comisionPct / 100));
}

/** Precio pagando en cuotas (incluye la comisión, más alta, de cuotas). */
export function precioCuotas(contado: number, comisionPct: number): number {
  if (comisionPct <= 0 || comisionPct >= 100) return contado;
  return Math.round(contado / (1 - comisionPct / 100));
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
