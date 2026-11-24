// node --test scripts/pruebas/punto-pagos.test.ts
// La agenda de pagos a proveedores (V.0.11.257).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  armarCuotas,
  detalleMovimiento,
  diasEntre,
  limpiarCambioPago,
  limpiarPedidoPagar,
  limpiarPedidoPago,
  restoDe,
  resumenAgenda,
  situacion,
  sumarDias,
} from "../../src/lib/punto-pagos-reglas.ts";

const BASE = {
  idLocal: "pg-abc123",
  proveedor: "  FV  S.A. ",
  sucursal: "srl",
  concepto: "Factura A 0001-00001234",
  monto: 1000,
  vence: "2026-12-10",
};

test("cargar uno: limpia el texto, avisa 3 días antes y va en una cuota", () => {
  const p = limpiarPedidoPago(BASE);
  assert.ok(typeof p === "object");
  if (typeof p === "object") {
    assert.equal(p.proveedor, "FV S.A.");
    assert.equal(p.avisar, 3);
    assert.equal(p.cuotas, 1);
    assert.equal(p.forma, "");
    assert.equal(p.proveedorId, null);
  }
});

test("cargar uno: lo que falta o está mal se rechaza", () => {
  assert.equal(typeof limpiarPedidoPago({ ...BASE, proveedor: " " }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, sucursal: "xyz" }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, monto: 0 }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, monto: -5 }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, vence: "2026-02-30" }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, forma: "trueque" }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, avisar: 99 }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, idLocal: "x" }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, cuotas: 0 }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, cuotas: 3, cada: 0 }), "string");
  assert.equal(typeof limpiarPedidoPago({ ...BASE, proveedorId: "<script>" }), "string");
});

test("las cuotas reparten el total en centavos y lo que sobra va en la última", () => {
  const c = armarCuotas({ monto: 1000, vence: "2026-12-10", cuotas: 3, cada: 30 });
  assert.deepEqual(c, [
    { cuota: 1, monto: 333.33, vence: "2026-12-10" },
    { cuota: 2, monto: 333.33, vence: "2027-01-09" },
    { cuota: 3, monto: 333.34, vence: "2027-02-08" },
  ]);
  const suma = c.reduce((s, x) => s + Math.round(x.monto * 100), 0);
  assert.equal(suma, 100000);
});

test("una sola cuota es el monto entero", () => {
  assert.deepEqual(armarCuotas({ monto: 1234.56, vence: "2026-12-31", cuotas: 1, cada: 30 }), [
    { cuota: 1, monto: 1234.56, vence: "2026-12-31" },
  ]);
});

test("días: sumar y contar cruzando meses y años", () => {
  assert.equal(sumarDias("2026-12-25", 10), "2027-01-04");
  assert.equal(sumarDias("2026-03-01", -1), "2026-02-28");
  assert.equal(diasEntre("2026-11-24", "2026-11-27"), 3);
  assert.equal(diasEntre("2026-11-24", "2026-11-20"), -4);
});

test("la situación: vencido, hoy, pronto (dentro del aviso) o después", () => {
  const hoy = "2026-11-24";
  const p = (vence: string, avisar = 3) => ({ estado: "pendiente" as const, vence, avisar });
  assert.equal(situacion(p("2026-11-23"), hoy), "vencido");
  assert.equal(situacion(p("2026-11-24"), hoy), "hoy");
  assert.equal(situacion(p("2026-11-27"), hoy), "pronto");
  assert.equal(situacion(p("2026-11-28"), hoy), "despues");
  assert.equal(situacion(p("2026-11-25", 0), hoy), "despues");
  assert.equal(situacion({ estado: "pagado", vence: "2026-11-01", avisar: 3 }, hoy), "pagado");
});

test("el resumen suma solo lo pendiente, en centavos", () => {
  const hoy = "2026-11-24";
  const r = resumenAgenda(
    [
      { estado: "pendiente", vence: "2026-11-20", avisar: 3, monto: 0.1 },
      { estado: "pendiente", vence: "2026-11-21", avisar: 3, monto: 0.2 },
      { estado: "pendiente", vence: "2026-11-24", avisar: 3, monto: 500 },
      { estado: "pendiente", vence: "2026-11-26", avisar: 3, monto: 700 },
      { estado: "pendiente", vence: "2026-12-30", avisar: 3, monto: 900 },
      { estado: "pagado", vence: "2026-11-20", avisar: 3, monto: 9999 },
      { estado: "anulado", vence: "2026-11-20", avisar: 3, monto: 9999 },
    ],
    hoy,
  );
  assert.deepEqual(r, {
    vencido: { n: 2, total: 0.3 },
    hoy: { n: 1, total: 500 },
    pronto: { n: 1, total: 700 },
    despues: { n: 1, total: 900 },
  });
});

test("pagar: el monto, la cuenta y la fecha (hoy = null, más adelante no)", () => {
  const hoy = "2026-11-24";
  const ok = limpiarPedidoPagar({ id: "p1", version: 2, idLocal: "pagar-123456", cuentaId: "c1", monto: "500.5", dia: hoy }, hoy);
  assert.ok(typeof ok === "object");
  if (typeof ok === "object") {
    assert.equal(ok.monto, 500.5);
    assert.equal(ok.dia, null);
    assert.equal(ok.cuentaId, "c1");
  }
  const sinCuenta = limpiarPedidoPagar({ id: "p1", version: 2, idLocal: "pagar-123456", cuentaId: "", monto: 10, dia: "2026-11-20" }, hoy);
  assert.ok(typeof sinCuenta === "object" && sinCuenta.cuentaId === null && sinCuenta.dia === "2026-11-20");
  assert.equal(typeof limpiarPedidoPagar({ id: "p1", version: 2, idLocal: "pagar-123456", monto: 10, dia: "2026-11-25" }, hoy), "string");
  assert.equal(typeof limpiarPedidoPagar({ id: "p1", idLocal: "pagar-123456", monto: 10 }, hoy), "string");
  assert.equal(typeof limpiarPedidoPagar({ id: "p1", version: 1, idLocal: "pagar-123456", monto: 0 }, hoy), "string");
});

test("cambiar: pide la versión y valida igual que al cargar", () => {
  assert.equal(typeof limpiarCambioPago({ ...BASE, id: "p1" }), "string");
  const c = limpiarCambioPago({ ...BASE, id: "p1", version: 3, avisar: 0 });
  assert.ok(typeof c === "object" && c.avisar === 0 && c.version === 3);
});

test("pagar menos deja el resto; pagar más (recargo) no deja nada", () => {
  assert.equal(restoDe(1000, 600.4), 399.6);
  assert.equal(restoDe(1000, 1000), 0);
  assert.equal(restoDe(1000, 1200), 0);
});

test("el detalle del movimiento dice a quién y qué cuota", () => {
  assert.equal(detalleMovimiento({ proveedor: "FV S.A.", concepto: "FA 1234", cuota: 2, cuotas: 3 }, ""), "FV S.A. · FA 1234 · cuota 2/3");
  assert.equal(detalleMovimiento({ proveedor: "FV S.A.", concepto: "", cuota: 1, cuotas: 1 }, "transf. 55"), "FV S.A. · transf. 55");
});
