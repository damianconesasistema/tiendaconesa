// node --test scripts/pruebas/punto-notas.test.ts
// Lo que piden los clientes y no tenemos (V.0.11.260).
import { test } from "node:test";
import assert from "node:assert/strict";
import { agruparNotas, claveNota, limpiarPedidoNota, limpiarResolver, type NotaCliente } from "../../src/lib/punto-notas-reglas.ts";

test("una nota limpia: texto, cantidad y sucursal", () => {
  const n = limpiarPedidoNota({ idLocal: "nota-abc123", texto: "  Grifería <b>FV</b>   Allegro cocina ", cantidad: "2", sucursal: "tsl", porVoz: true });
  assert.ok(typeof n === "object");
  if (typeof n === "object") {
    assert.equal(n.texto, "Grifería bFV/b Allegro cocina");
    assert.equal(n.cantidad, 2);
    assert.equal(n.porVoz, true);
  }
  assert.equal(typeof limpiarPedidoNota({ idLocal: "nota-abc123", texto: "x", sucursal: "tsl" }), "string");
  assert.equal(typeof limpiarPedidoNota({ idLocal: "nota-abc123", texto: "tanque 1000", sucursal: "xx" }), "string");
  assert.equal(typeof limpiarPedidoNota({ idLocal: "nota-abc123", texto: "tanque 1000", sucursal: "tsl", cantidad: 0 }), "string");
  assert.equal(typeof limpiarPedidoNota({ idLocal: "x", texto: "tanque 1000", sucursal: "tsl" }), "string");
});

test("la clave junta lo mismo dicho distinto", () => {
  assert.equal(claveNota("Grifería cocina FV Allegro"), claveNota("me pidieron una griferia allegro de cocina, FV"));
  assert.equal(claveNota("Tanques de agua 1000 litros"), claveNota("tanque agua 1000 litro"));
  assert.notEqual(claveNota("tanque 1000"), claveNota("tanque 500"));
});

const nota = (texto: string, extra: Partial<NotaCliente> = {}): NotaCliente => ({
  id: Math.random().toString(36).slice(2), texto, porVoz: false, cantidad: null, cliente: "", sucursal: "tsl", usuario: "mariano",
  creadoEn: "2026-11-25T12:00:00.000Z", estado: "nueva", resueltoEn: null, resueltoPor: null, motivo: "", ...extra,
});

test("agrupar: lo más pedido primero, con veces, unidades y sucursales", () => {
  const g = agruparNotas([
    nota("tanque 1000 litros", { cantidad: 2, creadoEn: "2026-11-25T10:00:00.000Z" }),
    nota("Tanque de 1000 litro", { sucursal: "srl", usuario: "mauro", creadoEn: "2026-11-25T11:00:00.000Z" }),
    nota("Grifería Allegro cocina", { cantidad: 1 }),
    nota("tanques 1000", { cantidad: 3, estado: "pedida", creadoEn: "2026-11-24T10:00:00.000Z" }),
  ]);
  // "tanques 1000" (2 palabras) entra en el único grupo que las tiene a las dos.
  assert.equal(g.length, 2);
  assert.equal(g[0].veces, 3);
  assert.equal(g[0].unidades, 5);
  assert.deepEqual(g[0].sucursales.sort(), ["srl", "tsl"]);
  assert.equal(g[0].texto, "Tanque de 1000 litro");
  assert.equal(g[0].nuevas, 2);
});

test("agrupar: lo dicho con menos palabras va con el único grupo que lo contiene", () => {
  const g = agruparNotas([
    nota("Grifería FV Allegro de cocina"),
    nota("me pidieron allegro cocina FV"),
    nota("tanque de 1000 litros negro"),
    nota("Tanque de agua 1000 litros negro"),
    nota("tanque 500 negro"),
  ]);
  assert.deepEqual(g.map((x) => x.veces).sort(), [1, 2, 2]);
  // "tanque" solo no se junta con nada: está en dos grupos distintos.
  const h = agruparNotas([nota("tanque 1000 negro"), nota("tanque 500 negro"), nota("tanque negro")]);
  assert.equal(h.length, 3);
});

test("resolver: ids, estado y motivo", () => {
  const r = limpiarResolver({ ids: ["a1", "a1", "b2", "<x>"], estado: "pedida", motivo: "OC-0012" });
  assert.deepEqual(r, { ids: ["a1", "b2"], estado: "pedida", motivo: "OC-0012" });
  assert.equal(typeof limpiarResolver({ ids: [], estado: "pedida" }), "string");
  assert.equal(typeof limpiarResolver({ ids: ["a1"], estado: "borrada" }), "string");
});
