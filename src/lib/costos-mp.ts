// La cuenta de las cuotas: de los costos de Mercado Pago al recargo que paga
// el cliente. La usan la tienda (src/lib/settings.ts, getPlanesCuotas) y la
// pantalla "Mercado Pago" del panel, que muestra la cuenta en vivo mientras se
// cargan los costos del mes. Una sola cuenta: lo que se ve en el panel es lo
// que cobra la tienda.
//
// Este archivo no toca la base.
//
// MercadoPago publica los costos SIN IVA y el "costo por cobro" se suma
// siempre, ademas del costo del plan de cuotas:
//
//   costo total = (costo_cobro + costo_plan) x (1 + IVA)
//   recargo     = 1 / (1 - costo_total) - 1
//
// Verificado contra el simulador (oct 2026, al instante):
//   1 pago  -> formula 108.680 | simulador 108.684
//   6 cuotas-> formula 125.706 | simulador 125.712
// (la diferencia es el redondeo del 6,60% que muestra la app)

export type PlanCosto = { cuotas: number; costo: number };

export type CostosMp = {
  /** Costo por cobrar, sin IVA (el del plazo de acreditacion elegido). */
  cobro: number;
  iva: number;
  /** Costo de cada plan de cuotas, sin IVA y sin el costo por cobrar. */
  planes: PlanCosto[];
};

/** Los de octubre de 2026 (al instante), si nunca se cargaron otros. */
export const COSTOS_MP_DE_ARRANQUE: CostosMp = {
  cobro: 6.6,
  iva: 21,
  planes: [
    { cuotas: 3, costo: 6.2 },
    { cuotas: 6, costo: 10.3 },
    { cuotas: 9, costo: 15.3 },
    { cuotas: 12, costo: 19.5 },
    { cuotas: 18, costo: 26.1 },
  ],
};

/** Tope de cordura: un error de tipeo no puede generar un cobro disparatado.
 *  A 18 cuotas el recargo real ronda 65%. */
export const RECARGO_MAX = 120;

/** Lo que se lleva Mercado Pago de cada venta, con IVA, en %. */
export function costoTotalPct(cobro: number, plan: number, iva: number): number {
  return (cobro + plan) * (1 + iva / 100);
}

/** El recargo que hace falta para que, despues de lo que se lleva Mercado
 *  Pago, llegue el precio de contado entero. null si el costo no deja nada. */
export function recargoParaCubrir(costoTotal: number): number | null {
  const c = costoTotal / 100;
  if (!Number.isFinite(c) || c < 0 || c >= 0.95) return null;
  return Math.min(Math.round((1 / (1 - c) - 1) * 100 * 100) / 100, RECARGO_MAX);
}

export type PlanConRecargo = {
  cuotas: number;
  /** El costo del plan que publica Mercado Pago (sin IVA). */
  costo: number;
  /** Todo lo que se lleva Mercado Pago, con IVA. */
  costoTotal: number;
  /** Lo que se le suma al precio de contado. */
  recargoPct: number;
};

/** Cada plan con su recargo, de menos a mas cuotas. Los que no cierran (un
 *  dato mal cargado que da un costo de casi todo) quedan afuera. */
export function planesConRecargo(c: CostosMp): PlanConRecargo[] {
  return c.planes
    .map((p) => {
      const costoTotal = costoTotalPct(c.cobro, p.costo, c.iva);
      const recargoPct = recargoParaCubrir(costoTotal);
      return recargoPct === null ? null : { cuotas: p.cuotas, costo: p.costo, costoTotal, recargoPct };
    })
    .filter((p): p is PlanConRecargo => p !== null)
    .sort((a, b) => a.cuotas - b.cuotas);
}

/** Los planes guardados como JSON, solo los que tienen sentido. */
export function leerPlanes(raw: string | null): PlanCosto[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const planes = parsed
      .map((p) => ({ cuotas: Number(p?.cuotas), costo: Number(p?.costo) }))
      .filter(
        (p) =>
          Number.isFinite(p.cuotas) &&
          p.cuotas >= 2 &&
          p.cuotas <= 24 &&
          Number.isFinite(p.costo) &&
          p.costo >= 0,
      );
    return planes.length ? planes : null;
  } catch {
    return null;
  }
}

/** Cada cuanto hay que mirar los costos: Mercado Pago los cambia mes a mes. */
export const DIAS_PARA_REVISAR = 30;

/** Dias desde que se revisaron (null si nunca). */
export function diasDesdeRevisados(revisados: string | null, ahora: number = Date.now()): number | null {
  if (!revisados) return null;
  const t = new Date(revisados).getTime();
  return Number.isFinite(t) ? Math.max(0, Math.floor((ahora - t) / 86_400_000)) : null;
}

/** Si toca revisarlos: nunca se revisaron, o paso un mes. */
export function tocaRevisarCostos(revisados: string | null): boolean {
  const d = diasDesdeRevisados(revisados);
  return d === null || d >= DIAS_PARA_REVISAR;
}
