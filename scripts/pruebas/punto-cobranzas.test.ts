// node --test scripts/pruebas/punto-cobranzas.test.ts
// La cuenta corriente de los clientes y sus cobranzas (V.0.11.289).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  type DocCC,
  armarCobranza,
  calcularDeudas,
  deudores,
  detalleCobranza,
  esCuentaCorriente,
  esDelCliente,
  limpiarPedidoCobranza,
  revisarCuenta,
} from "../../src/lib/punto-cobranzas-reglas.ts";

const CC = "08-Cuenta corriente 30 días";
const cli = { id: "ccli000001gbp", n: "GOMEZ JUAN", doc: "20-12345678-3" };
const doc = (o: Partial<DocCC>): DocCC => ({
  id: "doc00000001", tipo: "factura", nro: "B 0006-00000120", sucursal: "srl", fecha: "2026-11-26T15:00:00.000Z",
  total: 100000, forma: CC, cliente: cli, facturaId: null, ...o,
});

test("la forma cuenta corriente", () => {
  assert.equal(esCuentaCorriente(CC), true);
  assert.equal(esCuentaCorriente("08.Cuenta corriente"), true);
  assert.equal(esCuentaCorriente("02-Transferencia"), false);
  assert.equal(esCuentaCorriente(undefined), false);
});

test("lo que debe: ventas en cuenta corriente, menos notas de crédito, más débito, menos lo cobrado", () => {
  const docs = [
    doc({}),
    doc({ id: "doc00000002", tipo: "pedido-interno", nro: "P-3001", total: 50000.5, fecha: "2026-11-20T15:00:00.000Z" }),
    doc({ id: "doc00000003", forma: "01-Efectivo" }),
    doc({ id: "doc00000004", tipo: "remito", nro: "R 0006-00000001" }),
    doc({ id: "doc00000005", tipo: "presupuesto" }),
  ];
  const notas = [
    doc({ id: "nc000000001", tipo: "nota-credito", total: 10000, facturaId: "doc00000001" }),
    doc({ id: "nd000000001", tipo: "nota-debito", total: 2500, facturaId: "doc00000001" }),
  ];
  const cobs = [
    { imputaciones: [{ docId: "doc00000001", nro: "B", monto: 40000 }], anulado: false },
    { imputaciones: [{ docId: "doc00000001", nro: "B", monto: 99999 }], anulado: true },
  ];
  const p = calcularDeudas(docs, notas, cobs);
  assert.deepEqual(p.map((x) => x.docId), ["doc00000002", "doc00000001"]);
  assert.equal(p[1].debe, 52500);
  assert.equal(p[1].notas, -7500);
  assert.equal(p[1].cobrado, 40000);
  assert.equal(p[0].debe, 50000.5);
  const d = deudores(p);
  assert.equal(d.length, 1);
  assert.equal(d[0].debe, 102500.5);
  assert.equal(d[0].ventas, 2);
  assert.equal(d[0].desde, "2026-11-20T15:00:00.000Z");
});

test("el mismo cliente con id y sin id (por su CUIT) es uno solo", () => {
  const p = calcularDeudas(
    [doc({}), doc({ id: "doc00000009", cliente: { id: "", n: "Gomez J", doc: "20123456783" } }),
      doc({ id: "doc00000010", cliente: { id: "", n: "OTRO", doc: "" } })],
    [],
    [],
  );
  assert.equal(p[0].clave, cli.id);
  assert.equal(p[1].clave, cli.id);
  assert.equal(p[2].clave, "n:OTRO");
  assert.equal(deudores(p).length, 2);
  assert.equal(esDelCliente(p[1], { id: cli.id }), true);
  assert.equal(esDelCliente(p[1], { doc: "20-12345678-3" }), true);
  assert.equal(esDelCliente(p[2], { clave: "n:OTRO" }), true);
  assert.equal(esDelCliente(p[2], { id: cli.id }), false);
});

test("limpiar el pedido de cobro", () => {
  const ok = { idLocal: "cb12345678", forma: "transferencia", cuentaId: "c902", dia: "2026-11-26", imputaciones: [{ docId: "doc00000001", monto: 100.004 }] };
  const p = limpiarPedidoCobranza(ok, "2026-11-27");
  assert.equal(typeof p, "object");
  if (typeof p === "string") return;
  assert.equal(p.dia, "2026-11-26");
  assert.equal(p.imputaciones[0].monto, 100);
  assert.equal((limpiarPedidoCobranza({ ...ok, dia: "2026-11-27" }, "2026-11-27") as { dia: null }).dia, null);
  assert.equal(typeof limpiarPedidoCobranza({ ...ok, dia: "2026-11-28" }, "2026-11-27"), "string");
  assert.equal(typeof limpiarPedidoCobranza({ ...ok, cuentaId: "" }, "2026-11-27"), "string");
  assert.equal(typeof limpiarPedidoCobranza({ ...ok, forma: "cheque", cuentaId: "" }, "2026-11-27"), "object");
  assert.equal(typeof limpiarPedidoCobranza({ ...ok, imputaciones: [] }, "2026-11-27"), "string");
  assert.equal(typeof limpiarPedidoCobranza({ ...ok, imputaciones: [ok.imputaciones[0], ok.imputaciones[0]] }, "2026-11-27"), "string");
  assert.equal(typeof limpiarPedidoCobranza({ ...ok, imputaciones: [{ docId: "doc00000001", monto: 0 }] }, "2026-11-27"), "string");
});

test("armar el cobro: no más de lo que debe, mismo cliente y misma razón social", () => {
  const pend = calcularDeudas(
    [doc({}), doc({ id: "doc00000002", nro: "B 0006-00000121", fecha: "2026-11-27T12:00:00.000Z" }),
      doc({ id: "doc00000003", sucursal: "cnc" }), doc({ id: "doc00000004", cliente: { id: "ccli000002gbp", n: "PEREZ", doc: "" } })],
    [],
    [{ imputaciones: [{ docId: "doc00000002", nro: "", monto: 100000 }], anulado: false }],
  );
  const base = { idLocal: "cb12345678", forma: "transferencia" as const, cuentaId: "c902", dia: null, operacion: "", nota: "" };
  const a = armarCobranza({ ...base, imputaciones: [{ docId: "doc00000001", monto: 60000 }] }, pend);
  assert.equal(typeof a, "object");
  if (typeof a !== "string") {
    assert.equal(a.monto, 60000);
    assert.equal(a.sucursal, "srl");
    assert.equal(a.imputaciones[0].nro, "B 0006-00000120");
    assert.match(detalleCobranza(a, 7, "transferencia", "op 123"), /GOMEZ JUAN · B 0006-00000120 · recibo 00000007 · Transferencia op 123/);
  }
  assert.match(String(armarCobranza({ ...base, imputaciones: [{ docId: "doc00000001", monto: 100000.01 }] }, pend)), /quedan \$ 100\.000,00/);
  assert.match(String(armarCobranza({ ...base, imputaciones: [{ docId: "doc00000002", monto: 1 }] }, pend)), /ya se pagó todo/);
  assert.match(String(armarCobranza({ ...base, imputaciones: [{ docId: "doc00000001", monto: 1 }, { docId: "doc00000003", monto: 1 }] }, pend)), /razones sociales/);
  assert.match(String(armarCobranza({ ...base, imputaciones: [{ docId: "doc00000001", monto: 1 }, { docId: "doc00000004", monto: 1 }] }, pend)), /clientes distintos/);
  assert.match(String(armarCobranza({ ...base, imputaciones: [{ docId: "doc00000099", monto: 1 }] }, pend)), /ya no figura/);
});

test("la cuenta: de la razón social de la venta y del tipo que va con la forma", () => {
  const banco = { tipo: "banco", sucursal: "srl", activa: true };
  assert.equal(revisarCuenta("transferencia", banco, "srl"), null);
  assert.equal(revisarCuenta("transferencia", { ...banco, tipo: "mercadopago" }, "srl"), null);
  assert.match(String(revisarCuenta("transferencia", banco, "cnc")), /misma razón social/);
  assert.match(String(revisarCuenta("efectivo", banco, "srl")), /caja de efectivo/);
  assert.match(String(revisarCuenta("transferencia", { ...banco, activa: false }, "srl")), /de baja/);
  assert.equal(revisarCuenta("cheque", null, "srl"), null);
  assert.match(String(revisarCuenta("transferencia", null, "srl")), /Elegí/);
});
