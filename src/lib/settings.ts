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
// disparatado al cliente.
const RECARGO_MAX = 60;

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
