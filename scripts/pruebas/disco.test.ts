// node --test scripts/pruebas/disco.test.ts
// El aviso de poco lugar en el disco del servidor (V.0.11.273).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cuentaDisco, DISCO_MAL, DISCO_OJO } from "../../src/lib/disco.ts";

const GB = 1024 ** 3, B = 4096;
const bloques = (gb: number) => Math.round((gb * GB) / B);

test("como el 26/11: 30 GB llenos", () => {
  const d = cuentaDisco(bloques(30), B, 0, bloques(1.5));
  assert.ok(d);
  assert.equal(d!.nivel, "mal");
  assert.equal(d!.pct, 100);
  assert.equal(d!.libreGb, 0);
});

test("despues de limpiar: 42 % es ok", () => {
  const d = cuentaDisco(bloques(30), B, bloques(17), bloques(18.5));
  assert.equal(d!.nivel, "ok");
  assert.ok(d!.pct > 40 && d!.pct < 46, String(d!.pct));
  assert.equal(d!.libreGb, 17);
});

test("los cortes: 80 amarillo, 90 rojo", () => {
  assert.equal(DISCO_OJO, 80);
  assert.equal(DISCO_MAL, 90);
  // 100 bloques, sin reserva de root.
  assert.equal(cuentaDisco(100, B, 21)!.nivel, "ok");
  assert.equal(cuentaDisco(100, B, 20)!.nivel, "ojo");
  assert.equal(cuentaDisco(100, B, 11)!.nivel, "ojo");
  assert.equal(cuentaDisco(100, B, 10)!.nivel, "mal");
});

test("datos que no sirven: null", () => {
  assert.equal(cuentaDisco(0, B, 0), null);
  assert.equal(cuentaDisco(100, 0, 10), null);
  assert.equal(cuentaDisco(NaN, B, 10), null);
});
