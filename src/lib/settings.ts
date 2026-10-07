// Configuracion de la tienda, editable desde el panel (tabla Setting).
//
// RECARGOS DE MERCADOPAGO
// El precio que se muestra en la tienda es "efectivo o transferencia".
// MercadoPago cobra comision, y es MUY distinta segun en cuantos pagos:
//   1 pago (debito o credito)      ~10%
//   hasta 6 cuotas sin interes     ~26%
//
// Por eso NO sirve un recargo unico: con Checkout Pro el monto se fija ANTES
// de que el cliente elija como paga, asi que cobrar 26% a todos castigaria al
// que paga en 1 pago, y cobrar 10% a todos nos haria perder plata en cuotas.
//
// Solucion: el cliente elige 1 PAGO o CUOTAS en nuestro checkout, y a cada
// preferencia le limitamos las cuotas en MercadoPago para que no pueda pagar
// en mas cuotas de las que pago de recargo.

import { prisma } from "@/lib/db";

export const SETTING_RECARGO_1PAGO = "recargo_mp_1pago_pct";
export const SETTING_RECARGO_CUOTAS = "recargo_mp_cuotas_pct";
export const SETTING_CUOTAS_MAX = "mp_cuotas_max";

// Valores por defecto (los que informó el comercio en 2026-10).
const DEFAULT_1PAGO = 10;
const DEFAULT_CUOTAS_PCT = 26;
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
