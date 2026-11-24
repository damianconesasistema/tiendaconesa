// Las reglas del cierre de la caja de efectivo (V.0.11.255).
//
// Damian, 24/11/2026: "caja en efectivo necesito todos los dias cerrar la
// misma y abrir y saber cuanto hay, es decir cuando abro a la mañana con X
// plata que se conto el dia anterior al cierre del dia" y "necesitamos un
// panel donde se ingrese los billetes que hay en la caja de efectivo".
//
// - Cada cierre va desde el cierre anterior hasta ese momento (no por dia
//   calendario): lo vendido despues de cerrar va al cierre siguiente.
// - Lo que tendria que haber = con lo que abrio + lo cobrado en efectivo en
//   ese tiempo (factura, Recibo X y nota de debito; la nota de credito resta)
//   + los movimientos del efectivo (gastos y retiros restan).
// - Lo contado sale de los billetes: cada uno por su valor, mas las monedas.
// - Lo que se retira al cerrar (al banco, al dueño) no puede ser mas que lo
//   contado; lo que queda es con lo que abre el siguiente.
//
// Sin ningun import a proposito: lo usan el servidor y las pruebas con node
// solo (scripts/pruebas/punto-cierres.test.ts).

/** Los billetes que se cuentan, del mas grande al mas chico. */
export const DENOMINACIONES: readonly number[] = [20000, 10000, 2000, 1000, 500, 200, 100, 50, 20, 10];
/** La cantidad mas grande de un billete (un error de tipeo no da millones). */
export const MAX_CANTIDAD = 100_000;
/** El monto mas grande que se acepta (cien mil millones). */
export const MAX_PESOS = 1e11;

export type Billetes = { [denominacion: string]: number };

/** A centavos enteros y de vuelta: la plata se suma sin errores de coma. */
const cent = (n: number) => Math.round(n * 100);
export const pesos = (n: number) => Math.round(n * 100) / 100;

/** Los billetes que manda la pantalla, revisados, y cuanto suman. "monedas"
 *  va en pesos (monedas y lo que no es billete); el resto, en cantidad. */
export function limpiarBilletes(x: unknown): { billetes: Billetes; contado: number } | { error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return { error: "No llegaron los billetes contados." };
  const o = x as Record<string, unknown>;
  const billetes: Billetes = {};
  let total = 0;
  for (const d of DENOMINACIONES) {
    const v = o[String(d)];
    if (v == null || v === "") continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > MAX_CANTIDAD) return { error: `La cantidad de billetes de $${d} no es válida.` };
    if (n > 0) {
      billetes[String(d)] = n;
      total += cent(d) * n;
    }
  }
  const m = o.monedas == null || o.monedas === "" ? 0 : Number(o.monedas);
  if (!Number.isFinite(m) || m < 0 || m > MAX_PESOS) return { error: "Lo de monedas no es un número válido." };
  if (m > 0) {
    billetes.monedas = pesos(m);
    total += cent(m);
  }
  return { billetes, contado: total / 100 };
}

/** Las cuentas del cierre. Todo en pesos con centavos. */
export function cuentaCierre(p: {
  apertura: number;
  ventas: number;
  movimientos: number;
  contado: number;
  retiro: number;
}): { esperado: number; diferencia: number; queda: number } | { error: string } {
  const r = Number(p.retiro) || 0;
  if (!Number.isFinite(r) || r < 0) return { error: "Lo que se retira no es un número válido." };
  if (cent(r) > cent(p.contado)) return { error: "No se puede retirar más de lo que se contó." };
  const esperado = (cent(p.apertura) + cent(p.ventas) + cent(p.movimientos)) / 100;
  return {
    esperado,
    diferencia: (cent(p.contado) - cent(esperado)) / 100,
    queda: (cent(p.contado) - cent(r)) / 100,
  };
}
