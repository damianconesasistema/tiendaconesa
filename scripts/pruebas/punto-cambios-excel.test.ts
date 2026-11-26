// node --test scripts/pruebas/punto-cambios-excel.test.ts
// Cambios de precios por Excel (V.0.11.258).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicarAlArticulo,
  bolsaDelCodigo,
  cadenaAGuardar,
  cadenaDe,
  factorDe,
  fotoDe,
  limpiarCambioExcel,
  limpiarColumnas,
  mismaFoto,
  pareceBolsa,
  volverAFoto,
} from "../../src/lib/punto-cambios-excel.ts";

test("la cadena de FV (5 descuentos) se guarda como GBP: 4 y el quinto como recargo negativo", () => {
  assert.deepEqual(cadenaAGuardar([19.6, 14, 27.2, 20, 20], []), { dtos: [19.6, 14, 27.2, 20], recs: [-20] });
  assert.deepEqual(cadenaAGuardar([31.3, 15, 20, 20], [3]), { dtos: [31.3, 15, 20, 20], recs: [3] });
  assert.equal(typeof cadenaAGuardar([1, 2, 3, 4, 5, 6, 7, 8], [1]), "string");
});

test("y se lee igual que la página: recargo negativo = descuento, descuento negativo = recargo", () => {
  assert.deepEqual(cadenaDe([19.6, 14, 27.2, 20], [-20]), { cadena: [19.6, 14, 27.2, 20, 20], recargos: [] });
  assert.deepEqual(cadenaDe([10, -5], [3, -4]), { cadena: [10, 4], recargos: [3, 5] });
  assert.deepEqual(cadenaDe(undefined, undefined), { cadena: [], recargos: [] });
});

test("el factor: cada descuento sobre el anterior", () => {
  // FV: 19,6 + 8 + 20 + 20 = 0,804 × 0,92 × 0,8 × 0,8
  assert.ok(Math.abs(factorDe([19.6, 8, 20, 20], []) - 0.804 * 0.92 * 0.64) < 1e-12);
  assert.ok(Math.abs(factorDe([10], [5]) - 0.945) < 1e-12);
});

test("un cambio limpio: solo lo que vino; lo que está mal se rechaza", () => {
  const c = limpiarCambioExcel({ cod: " 0100.18-D ", antes: { lista: 8727.17, lista1: 1, lista2: 2 }, despues: { lista: 9000.004, cadena: [31.3, 15, 0, 20, 20] } });
  assert.ok(typeof c === "object");
  if (typeof c === "object") {
    assert.equal(c.cod, "0100.18-D");
    assert.deepEqual(c.despues, { lista: 9000, cadena: [31.3, 15, 20, 20] });
  }
  assert.equal(typeof limpiarCambioExcel({ cod: "X", antes: {}, despues: {} }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "X", antes: {}, despues: { lista: 0 } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "X", antes: {}, despues: { cadena: [100] } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "X", antes: {}, despues: { iva: 19 } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "X", antes: {}, despues: { tit: "  " } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "", antes: {}, despues: { lista: 5 } }), "string");
});

test("aplicar a un artículo: cambia lo que vino y deja el resto (recargos de verdad incluidos)", () => {
  const a = { cod: "A", tit: "X", lista: 100, dtos: [10, 5], recs: [3, -20], lista1: 200, lista2: 250, iva: 21, flete: 50 };
  const n = aplicarAlArticulo(a, { lista: 110, cadena: [19.6, 8, 20, 20, 20] });
  assert.ok(typeof n === "object");
  if (typeof n === "object") {
    assert.equal(n.lista, 110);
    assert.deepEqual(n.dtos, [19.6, 8, 20, 20]);
    assert.deepEqual(n.recs, [3, -20]);
    assert.equal(n.flete, 50);
    assert.equal(n.lista2, 250);
  }
  assert.equal(a.lista, 100);
});

test("la foto sirve para deshacer solo si nadie lo tocó después", () => {
  const a = { lista: 100, dtos: [10], recs: [], lista1: 200, lista2: 250, iva: 21, tit: "X", stockBA: 5 };
  const f = fotoDe(a);
  assert.ok(mismaFoto(f, fotoDe({ ...a, stockBA: 2 })));
  assert.ok(!mismaFoto(f, fotoDe({ ...a, lista2: 251 })));
  assert.ok(!mismaFoto(f, fotoDe({ ...a, dtos: [10, 5] })));
});

test("bolsas: FV por unidad y el sistema por bolsa de N", () => {
  assert.equal(pareceBolsa(4598.4, 919.68), 5);
  assert.equal(pareceBolsa(3856.21, 385.62), 10);
  assert.equal(pareceBolsa(1440.39, 1440.39), 0);
  assert.equal(pareceBolsa(110, 100), 0);
  // La lista subió un 10 %: sin el código no se reconoce; con "-D5", sí.
  assert.equal(pareceBolsa(4598.4, 1011.65), 0);
  assert.equal(pareceBolsa(4598.4, 1011.65, 5), 5);
  assert.equal(bolsaDelCodigo("0100/49.1-D5"), 5);
  assert.equal(bolsaDelCodigo("0451.16-D10"), 10);
  assert.equal(bolsaDelCodigo("0100.18-D"), 0);
  assert.equal(bolsaDelCodigo("0103/D7-CR"), 0);
});

test("las columnas de la lista del proveedor", () => {
  const c = limpiarColumnas({ fila: 5, cod: 0, precio: 2, descuentos: [4, 5, 6, 7, 8, 2, 4], conIva: false, titulos: ["Cod Art"] });
  assert.deepEqual(c, { fila: 5, cod: 0, precio: 2, descuentos: [4, 5, 6, 7, 8], conIva: false, titulos: ["Cod Art"] });
  assert.equal(limpiarColumnas({ fila: 0, cod: 0, precio: 2 }), null);
  assert.equal(limpiarColumnas({ fila: 1, cod: 2, precio: 2 }), null);
});

// V.0.11.282: cambios masivos desde Artículos (subrubro, flete, contado,
// "se compra de a" y cómo se vende), con deshacer.
test("los campos masivos se limpian: null o vacío lo saca", () => {
  const c = limpiarCambioExcel({ cod: "A1", antes: {}, despues: { subrubro: " ducha ", flete: 1500.555, contado: { pct: 5, dias: 60 }, bulto: 6, vende: { suelto: true, combo: false } } });
  assert.equal(typeof c, "object");
  if (typeof c === "string") return;
  assert.deepEqual(c.despues, { subrubro: "DUCHA", flete: 1500.56, contado: { pct: 5, dias: 60 }, bulto: 6, vende: { suelto: true, combo: false } });
  const s = limpiarCambioExcel({ cod: "A1", antes: {}, despues: { subrubro: "", flete: 0, contado: null, bulto: 1, vende: { suelto: true, combo: true } } });
  if (typeof s === "string") throw new Error(s);
  assert.deepEqual(s.despues, { subrubro: null, flete: null, contado: null, bulto: null, vende: null });
  assert.equal(typeof limpiarCambioExcel({ cod: "A1", antes: {}, despues: { contado: { pct: 100, dias: 60 } } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "A1", antes: {}, despues: { contado: { pct: 5, dias: 400 } } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "A1", antes: {}, despues: { bulto: 2.5 } }), "string");
  assert.equal(typeof limpiarCambioExcel({ cod: "A1", antes: {}, despues: { vende: { suelto: false, combo: false } } }), "string");
  const ch = limpiarCambioExcel({ cod: "A1", antes: {}, despues: { contado: { pct: 3, dias: 90, cheques: [30, 60, 90] } } });
  if (typeof ch === "string") throw new Error(ch);
  assert.deepEqual(ch.despues.contado, { pct: 3, dias: 90, cheques: [30, 60, 90] });
});

test("aplicar y deshacer los masivos: vuelve a como estaba", () => {
  const a = { cod: "A1", lista: 100, lista1: 125, lista2: 156.25, iva: 21, tit: "X", subrubro: "LAVATORIO", contado: { pct: 5, dias: 60 } };
  const n = aplicarAlArticulo(a, { subrubro: "DUCHA", flete: 900, contado: null, bulto: 6 });
  if (typeof n === "string") throw new Error(n);
  assert.equal(n.subrubro, "DUCHA");
  assert.equal((n as Record<string, unknown>).flete, 900);
  assert.equal("contado" in n, false);
  assert.equal((n as Record<string, unknown>).bulto, 6);
  const antes = fotoDe(a), despues = fotoDe(n);
  assert.equal(mismaFoto(antes, despues), false);
  // Solo cambia el subrubro: igual es un cambio.
  const m = aplicarAlArticulo(a, { subrubro: "DUCHA" });
  if (typeof m === "string") throw new Error(m);
  assert.equal(mismaFoto(fotoDe(a), fotoDe(m)), false);
  const v = volverAFoto(n, antes);
  assert.deepEqual(v, a);
});

test("una foto de antes (sin los masivos) igual se puede deshacer", () => {
  const vieja = { lista: 100, lista1: 125, lista2: 150, iva: 21, tit: "X" };
  const a = { cod: "A1", lista: 100, lista1: 125, lista2: 150, iva: 21, tit: "X", subrubro: "DUCHA", flete: 500 };
  assert.equal(mismaFoto(fotoDe(a), vieja), true);
  const v = volverAFoto(a, { lista: 90, lista1: 110, lista2: 140, iva: 21, tit: "X" });
  // Lo masivo queda como está: la foto vieja no lo traía.
  assert.equal(v.subrubro, "DUCHA");
  assert.equal(v.flete, 500);
  assert.equal(v.lista, 90);
});
