// Configuracion de la tienda, editable desde el panel (tabla Setting).
//
// RECARGOS DE MERCADOPAGO
// El precio que se muestra en la tienda es "efectivo o transferencia" mas un
// recargo, porque MercadoPago cobra por cobrar y por financiar.
//
// DE DONDE SALEN LOS NUMEROS
// Del simulador de costos de MercadoPago (app > Tu negocio > Costos): se pone
// cuanto se quiere RECIBIR y dice cuanto tiene que PAGAR el cliente.
// Medido en oct 2026, Checkout + tarjeta, cobro al instante:
//   1 pago   -> para recibir 100.000 el cliente paga 108.683,84 => 8,68%
//   6 cuotas -> para recibir 100.000 el cliente paga 125.711,84 => 25,71%
// El desglose eran 6,60% por cobro + 10,30% por financiar, mas IVA.
//
// Son DOS recargos distintos porque financiar cuesta mucho mas que cobrar.
// Con Checkout Pro el monto se fija ANTES de que el cliente elija, asi que el
// cliente elige 1 PAGO o CUOTAS en nuestro checkout y despues le limitamos las
// cuotas en MercadoPago para que no pague en mas de las que abono de recargo.

import { prisma } from "@/lib/db";

export const SETTING_RECARGO_1PAGO = "recargo_mp_1pago_pct";
export const SETTING_RECARGO_CUOTAS = "recargo_mp_cuotas_pct";
export const SETTING_CUOTAS_MAX = "mp_cuotas_max";

// Valores por defecto, del simulador de MercadoPago (oct 2026).
// Se editan desde el panel: Configuración.
// 11,11% y no 8,68% (el costo real) a pedido del comercio: con 11,11% el
// descuento del contado da exactamente 10%, asi que el cartel "10% OFF"
// es cierto y pega mas fuerte. La diferencia queda a favor del negocio.
const DEFAULT_1PAGO = 11.11;
const DEFAULT_CUOTAS_PCT = 25.71;
const DEFAULT_CUOTAS = 6;

// Tope de cordura: un error de tipeo (ej. 1000) no puede generar un cobro
// disparatado al cliente. A 18 cuotas el recargo real ronda 65%, asi que el
// tope tiene que dar lugar a eso.
const RECARGO_MAX = 120;

// --- PLANES DE CUOTAS ---
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

export const SETTING_COSTO_COBRO = "mp_costo_cobro_pct";
export const SETTING_IVA = "mp_iva_pct";
export const SETTING_PLANES = "mp_planes";

const DEFAULT_COSTO_COBRO = 6.6;
const DEFAULT_IVA = 21;
// cuotas -> costo del plan segun MercadoPago (sin IVA, sin el costo de cobro)
const DEFAULT_PLANES: Array<{ cuotas: number; costo: number }> = [
  { cuotas: 3, costo: 6.2 },
  { cuotas: 6, costo: 10.3 },
  { cuotas: 9, costo: 15.3 },
  { cuotas: 12, costo: 19.5 },
  { cuotas: 18, costo: 26.1 },
];

export type PlanCuotas = {
  cuotas: number;
  /** Recargo ya calculado, listo para aplicar al precio de contado. */
  recargoPct: number;
};

export async function getPlanesCuotas(): Promise<PlanCuotas[]> {
  const [cobroRaw, ivaRaw, planesRaw] = await Promise.all([
    getSetting(SETTING_COSTO_COBRO),
    getSetting(SETTING_IVA),
    getSetting(SETTING_PLANES),
  ]);

  const cobro = parsePct(cobroRaw, DEFAULT_COSTO_COBRO);
  const iva = parsePct(ivaRaw, DEFAULT_IVA);

  let planes = DEFAULT_PLANES;
  if (planesRaw) {
    try {
      const parsed = JSON.parse(planesRaw);
      if (Array.isArray(parsed) && parsed.length) {
        planes = parsed
          .map((p) => ({ cuotas: Number(p.cuotas), costo: Number(p.costo) }))
          .filter(
            (p) =>
              Number.isFinite(p.cuotas) &&
              p.cuotas >= 2 &&
              p.cuotas <= 24 &&
              Number.isFinite(p.costo) &&
              p.costo >= 0,
          );
      }
    } catch {
      /* JSON roto: seguimos con los defaults */
    }
  }

  return planes
    .map((p) => {
      const costoTotal = ((cobro + p.costo) * (1 + iva / 100)) / 100;
      // Si por un dato mal cargado el costo diera >= 100%, el plan no sirve.
      if (costoTotal >= 0.95) return null;
      const recargo = (1 / (1 - costoTotal) - 1) * 100;
      return {
        cuotas: p.cuotas,
        recargoPct: Math.min(Math.round(recargo * 100) / 100, RECARGO_MAX),
      };
    })
    .filter((p): p is PlanCuotas => p !== null)
    .sort((a, b) => a.cuotas - b.cuotas);
}

export async function getSetting(key: string): Promise<string | null> {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s?.value ?? null;
  } catch {
    // Si la migracion todavia no corrio, no rompemos el checkout.
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

function parsePct(raw: string | null, fallback: number): number {
  // OJO: Number(null) es 0, no NaN. Sin este chequeo, una config vacia se
  // interpretaba como "0%" en vez de usar el valor por defecto.
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, RECARGO_MAX);
}

export type RecargosMp = {
  unPago: number;
  cuotas: number;
  cuotasMax: number;
};

export async function getRecargosMp(): Promise<RecargosMp> {
  const [d, c, q] = await Promise.all([
    getSetting(SETTING_RECARGO_1PAGO),
    getSetting(SETTING_RECARGO_CUOTAS),
    getSetting(SETTING_CUOTAS_MAX),
  ]);
  const cuotas = Number(q);
  return {
    unPago: parsePct(d, DEFAULT_1PAGO),
    cuotas: parsePct(c, DEFAULT_CUOTAS_PCT),
    cuotasMax:
      Number.isFinite(cuotas) && cuotas > 0
        ? Math.min(Math.floor(cuotas), 24)
        : DEFAULT_CUOTAS,
  };
}

/** Recargo en pesos sobre un subtotal, redondeado al peso. */
export function calcularRecargo(subtotal: number, pct: number): number {
  if (pct <= 0) return 0;
  return Math.round(subtotal * (pct / 100));
}
