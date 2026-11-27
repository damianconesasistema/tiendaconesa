// node --test scripts/pruebas/punto-precio.test.ts
// La Lista 2 de Punto calculada en el servidor (V.0.11.295), la que toma la web.
import { test } from "node:test";
import assert from "node:assert/strict";
import { claveProv, cruzarWebConPunto, dolarDelArticulo, listaDosDePunto } from "../../src/lib/punto-precio-reglas.ts";

const ctx = { blue: 1655, bna: 1550, formador: 1600, fletePct: (cat: string) => (claveProv(cat) === "genebre sa" ? 10 : 0) };

test("sin flete ni dólar: la Lista 2 tal cual", () => {
  assert.equal(listaDosDePunto({ cod: "1", lista: 100000, lista1: 80000, lista2: 90000, iva: 21 }, ctx), 90000);
});

test("en dólares: sigue al dólar de hoy (BNA, Blue o fijo)", () => {
  const a = { cod: "U", mon: "USD", dolarRef: 1600, lista: 100, lista1: 250000, lista2: 312500, iva: 21 };
  assert.equal(listaDosDePunto(a, ctx), 302734.38);
  assert.equal(listaDosDePunto({ ...a, dolarTipo: "blue" }, ctx), 323242.19);
  assert.equal(listaDosDePunto({ ...a, dolar: 1500 }, ctx), 292968.75);
  assert.equal(dolarDelArticulo(a, { ...ctx, bna: 0 }), 1600);
});

test("el flete % del proveedor sube la Lista 2 en la misma proporción", () => {
  // Sin descuentos: costo = Lista 1 / 1,25 = 80.000; flete 10 % = 8.000.
  const a = { cod: "F", cat: "Genebre  S.A.", lista1: 100000, lista2: 125000, iva: 21 };
  assert.equal(listaDosDePunto({ ...a, cat: "GENEBRE SA" }, ctx), 137500);
  // Flete fijo: le gana al %.
  assert.equal(listaDosDePunto({ ...a, cat: "GENEBRE SA", flete: 4000 }, ctx), 131250);
});

test("con los descuentos de GBP el costo sale de la lista", () => {
  // 100.000 × 0,6 × 1,21 = 72.600; otro costo 7.260 => factor 1,1.
  const a = { cod: "D", lista: 100000, dtos: [40], recs: [], lista1: 90000, lista2: 110000, iva: 21, otroCosto: 7260 };
  assert.equal(listaDosDePunto(a, ctx), 121000);
});

test("los combos de Punto no van: la web arma los suyos", () => {
  assert.equal(listaDosDePunto({ cod: "C", lista1: 1, lista2: 2, combo: { piezas: [{}] } }, ctx), null);
  assert.equal(listaDosDePunto({ cod: "Z", lista1: 0, lista2: 0 }, ctx), null);
});

test("la web: cruza por código de sistema, SKU o código del sitio, en pesos enteros", () => {
  const arts = [
    { cod: "3674", lista1: 80000, lista2: 90000.49, iva: 21 },
    { cod: "PRB-9", lista1: 10000, lista2: 12345.5, iva: 21 },
    { cod: "777", lista1: 1, lista2: 1000, iva: 21 },
    { cod: "C1", lista1: 1, lista2: 2, combo: { piezas: [{}] } },
  ];
  const w = (o: Partial<{ itemId: string; sku: string | null; codigoSistema: string | null; locked: boolean; salePrice: number | null }>) => ({
    itemId: "X", sku: null, title: "T", category: "otros", brand: null, codigoSistema: null, locked: false, salePrice: null, ...o,
  });
  const r = cruzarWebConPunto(
    [w({ itemId: "FV-3674", salePrice: 5000 }), w({ itemId: "a1", sku: "PRB-9", locked: true }), w({ itemId: "b2", codigoSistema: "777" }),
      w({ itemId: "z", codigoSistema: "NO" }), w({ itemId: "C1" }), w({ itemId: "b2", codigoSistema: "777" })],
    arts,
    ctx,
  );
  assert.deepEqual(r.raw.map((x) => [x.codigo, x.codigo_sistema, x.precio]), [["FV-3674", "3674", 90000], ["a1", "PRB-9", 12346], ["b2", "777", 1000]]);
  assert.equal(r.noEstan, 1);
  assert.equal(r.sinPrecio, 1);
  assert.equal(r.conOferta, 1);
  assert.equal(r.conCandado, 1);
});
