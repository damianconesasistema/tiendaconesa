// node --test scripts/pruebas/punto-facturas-prv.test.ts
// Las facturas de cada proveedor (V.0.11.285).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clavePrv,
  conDescuentoPago,
  conceptoDeFactura,
  limpiarFactura,
  mismaFactura,
  nroEnTexto,
  nroFactura,
  tipoEnTexto,
} from "../../src/lib/punto-facturas-prv-reglas.ts";

test("el número de factura, como lo escriben las facturas", () => {
  assert.equal(nroFactura("0001-00001234"), "0001-00001234");
  assert.equal(nroFactura("1-1234"), "0001-00001234");
  assert.equal(nroFactura(" 0110 - 891348 "), "0110-00891348");
  assert.equal(nroFactura("00012-00000045"), "00012-00000045");
  assert.equal(nroFactura("000100001234"), "0001-00001234");
  assert.equal(nroFactura("rem 55"), "REM 55");
  assert.equal(nroFactura(""), "");
});

test("en el concepto: el número y el tipo", () => {
  assert.equal(nroEnTexto("Factura A 0001-00001234, saldo de la cuenta"), "0001-00001234");
  assert.equal(nroEnTexto("cheque 30 días"), "");
  assert.equal(tipoEnTexto("Factura A 0001-00001234"), "A");
  assert.equal(tipoEnTexto("FC B 3-55"), "B");
  assert.equal(tipoEnTexto("saldo"), "");
  assert.equal(conceptoDeFactura({ tipo: "A", nro: "0001-00001234" }), "Factura A 0001-00001234");
  assert.equal(conceptoDeFactura({ tipo: "", nro: "0001-00001234" }), "Factura 0001-00001234");
});

test("el mismo proveedor aunque se escriba distinto", () => {
  assert.equal(clavePrv("FV S.A."), clavePrv("fv sa"));
  assert.equal(clavePrv("Cerámica Cortines SA"), clavePrv("CERAMICA CORTINES S.A."));
  assert.equal(mismaFactura({ proveedor: "FV S.A.", tipo: "A", nro: "0001-00000001" }, { proveedor: "fv sa", tipo: "", nro: "0001-00000001" }), true);
  assert.equal(mismaFactura({ proveedor: "FV S.A.", tipo: "A", nro: "0001-00000001" }, { proveedor: "FV S.A.", tipo: "B", nro: "0001-00000001" }), false);
});

test("limpiar: lo que hace falta y lo que no se entiende", () => {
  const f = limpiarFactura({ proveedor: " FV S.A. ", tipo: "a", nro: "1-1234", fecha: "2026-11-20", vence: "2026-12-20", monto: 1850000.555, dtoPago: 5 });
  assert.deepEqual(f, { proveedorId: null, proveedor: "FV S.A.", tipo: "A", nro: "0001-00001234", fecha: "2026-11-20", vence: "2026-12-20", monto: 1850000.56, dtoPago: 5, nota: "" });
  assert.equal(typeof limpiarFactura({ proveedor: "", nro: "1-1" }), "string");
  assert.equal(typeof limpiarFactura({ proveedor: "FV", nro: "" }), "string");
  assert.equal(typeof limpiarFactura({ proveedor: "FV", nro: "1-1", tipo: "Z" }), "string");
  assert.equal(typeof limpiarFactura({ proveedor: "FV", nro: "1-1", vence: "20/12/2026" }), "string");
  assert.equal(typeof limpiarFactura({ proveedor: "FV", nro: "1-1", dtoPago: 100 }), "string");
  assert.equal(typeof limpiarFactura({ proveedor: "FV", nro: "1-1", monto: -5 }), "string");
});

test("el descuento por pago en término, al centavo", () => {
  assert.equal(conDescuentoPago(1000, 5), 950);
  assert.equal(conDescuentoPago(1850000.55, 3), 1794500.53);
  assert.equal(conDescuentoPago(1000, 0), 1000);
});
