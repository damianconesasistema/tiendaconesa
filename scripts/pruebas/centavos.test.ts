// node --test scripts/pruebas/centavos.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { ajustarCentavos } from "../../src/lib/punto-pdf.ts";

const suma = (l: number[]) => l.reduce((a, b) => a + b, 0);

test("ajustarCentavos: los renglones suman exacto el total", () => {
  // 3 renglones con 12% de descuento: 1000,00 / 333,33 / 0,07 -> 880 / 293,3304 / 0,0616
  const crudos = [88000, 29333.04, 6.16];
  const r = ajustarCentavos(crudos, 117339);
  assert.equal(suma(r), 117339);
  assert.ok(r.every((c, i) => Math.abs(c - crudos[i]) < 1.5));
});

test("ajustarCentavos: el total redondeado a pesos (descuento redondeado) baja centavos", () => {
  const crudos = [1030852.8, 905520.24]; // suman 1936373,04
  const r = ajustarCentavos(crudos, 1936300); // 73 centavos menos: no se reparte (más que 1 por renglón)
  assert.equal(r, null);
  const r2 = ajustarCentavos([10.4, 20.4, 30.4], 60);
  assert.deepEqual(r2, [10, 20, 30]);
  const r3 = ajustarCentavos([10.6, 20.6, 30.6], 63);
  assert.deepEqual(r3, [11, 21, 31]);
});

test("ajustarCentavos: sin renglones o total imposible", () => {
  assert.deepEqual(ajustarCentavos([], 0), []);
  assert.equal(ajustarCentavos([100], 500), null);
});
