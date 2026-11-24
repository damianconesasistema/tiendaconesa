// node --test scripts/pruebas/punto-cierres.test.ts
// El cierre de la caja de efectivo (V.0.11.255).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cuentaCierre, limpiarBilletes } from "../../src/lib/punto-cierres-reglas.ts";

test("los billetes suman por su valor, más las monedas", () => {
  const r = limpiarBilletes({ "20000": 12, "10000": 31, "2000": 18, "1000": 25, "500": 9, monedas: 1350.5 });
  assert.ok("contado" in r);
  if ("contado" in r) {
    assert.equal(r.contado, 240000 + 310000 + 36000 + 25000 + 4500 + 1350.5);
    assert.deepEqual(r.billetes, { "20000": 12, "10000": 31, "2000": 18, "1000": 25, "500": 9, monedas: 1350.5 });
  }
});

test("vacío cuenta cero; los ceros no se guardan", () => {
  const r = limpiarBilletes({ "20000": 0, "10": "", monedas: "" });
  assert.ok("contado" in r);
  if ("contado" in r) {
    assert.equal(r.contado, 0);
    assert.deepEqual(r.billetes, {});
  }
});

test("cantidades raras se rechazan", () => {
  assert.ok("error" in limpiarBilletes({ "1000": -1 }));
  assert.ok("error" in limpiarBilletes({ "1000": 2.5 }));
  assert.ok("error" in limpiarBilletes({ "1000": 1e9 }));
  assert.ok("error" in limpiarBilletes({ monedas: -3 }));
  assert.ok("error" in limpiarBilletes(null));
});

test("el ejemplo: faltan $1.350, se retiran 500.000 y quedan 116.850", () => {
  const r = cuentaCierre({ apertura: 100000, ventas: 520000, movimientos: -1800, contado: 616850, retiro: 500000 });
  assert.deepEqual(r, { esperado: 618200, diferencia: -1350, queda: 116850 });
});

test("sobra plata: diferencia positiva", () => {
  const r = cuentaCierre({ apertura: 0, ventas: 1000, movimientos: 0, contado: 1100, retiro: 0 });
  assert.deepEqual(r, { esperado: 1000, diferencia: 100, queda: 1100 });
});

test("centavos sin errores de coma", () => {
  const r = cuentaCierre({ apertura: 0.1, ventas: 0.2, movimientos: 0, contado: 0.3, retiro: 0 });
  assert.deepEqual(r, { esperado: 0.3, diferencia: 0, queda: 0.3 });
});

test("no se retira más de lo contado", () => {
  assert.ok("error" in cuentaCierre({ apertura: 0, ventas: 0, movimientos: 0, contado: 100, retiro: 101 }));
  assert.ok("error" in cuentaCierre({ apertura: 0, ventas: 0, movimientos: 0, contado: 100, retiro: -1 }));
});
