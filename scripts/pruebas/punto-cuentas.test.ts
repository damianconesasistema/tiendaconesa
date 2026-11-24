// Pruebas de las reglas de cuentas y movimientos de Punto (Gerencia, parte 1).
// Se corren con node solo, sin base y sin Next:
//   node --test scripts/pruebas/punto-cuentas.test.ts
// Montos inventados: el repositorio es publico.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diaAR,
  mesAR,
  repartir,
  limpiarPedidoMovimiento,
  saldoDe,
  resumenGastos,
  puedeMover,
  signoOrigen,
  mismoPedido,
  type Cuenta,
  type Movimiento,
  type PedidoMovimiento,
} from "../../src/lib/punto-cuentas-reglas.ts";

const cuenta = (id: string, sucursal: string, tipo: Cuenta["tipo"], extra: Partial<Cuenta> = {}): Cuenta => ({
  id, sucursal, tipo, nombre: id, banco: "", clase: null, saldoInicial: 0, desde: "2026-11-01", activa: true, ...extra,
});
const mov = (id: string, cuentaId: string, sucursal: string, monto: number, fecha: string, extra: Partial<Movimiento> = {}): Movimiento => ({
  id, grupo: id, fecha, cuentaId, sucursal, tipo: "gasto", monto, rubro: "Varios", detalle: "", iva: 0, reparto: null, usuario: "x", anulado: false, ...extra,
});
const pedido = (extra: Record<string, unknown> = {}): PedidoMovimiento => {
  const p = limpiarPedidoMovimiento({ idLocal: "abc123", tipo: "gasto", cuentaId: "efTsl", monto: 1000, rubro: "Varios", detalle: "", ...extra });
  if (typeof p === "string") throw new Error(p);
  return p;
};

test("dia y mes en hora argentina", () => {
  assert.equal(diaAR("2026-11-25T01:30:00.000Z"), "2026-11-24");
  assert.equal(diaAR("2026-11-25T03:00:00.000Z"), "2026-11-25");
  assert.equal(mesAR("2026-12-01T02:59:00.000Z"), "2026-11");
});

test("repartir: las partes suman el total", () => {
  assert.deepEqual(repartir(10001, { srl: 50, cnc: 50 }), { srl: 5001, cnc: 5000 });
  const r = repartir(100000, { srl: 33, cnc: 33, tsl: 34 });
  assert.equal(r.srl + r.cnc + r.tsl, 100000);
  const r2 = repartir(1, { srl: 33, cnc: 33, tsl: 34 });
  assert.equal(r2.srl + r2.cnc + r2.tsl, 1);
});

test("limpiarPedidoMovimiento", () => {
  const base = { idLocal: "abc123", tipo: "gasto", cuentaId: "c1", monto: 15000.5, rubro: "Combustible", detalle: "nafta" };
  const ok = limpiarPedidoMovimiento(base);
  assert.equal(typeof ok, "object");
  assert.equal((ok as PedidoMovimiento).monto, 15000.5);
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: 0 }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: -5 }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: 1e11 }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, monto: "abc" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "otro" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, rubro: "" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "transferencia" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "transferencia", cuentaDestinoId: "c1" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, reparto: { srl: 60, cnc: 30 } }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, reparto: { xyz: 100 } }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "retiro", reparto: { srl: 50, cnc: 50 } }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "ajuste" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, tipo: "ajuste", sentido: "entra" }), "object");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, idLocal: "x" }), "string");
  assert.equal(typeof limpiarPedidoMovimiento({ ...base, iva: 20000 }), "string");
  assert.equal((limpiarPedidoMovimiento({ ...base, detalle: "<b>x</b>" }) as PedidoMovimiento).detalle.includes("<"), false);
  assert.equal((limpiarPedidoMovimiento({ ...base, monto: 10.005 }) as PedidoMovimiento).monto, 10.01);
});

test("signoOrigen", () => {
  assert.equal(signoOrigen(pedido({ tipo: "gasto" })), -1);
  assert.equal(signoOrigen(pedido({ tipo: "pago-proveedor" })), -1);
  assert.equal(signoOrigen(pedido({ tipo: "retiro" })), -1);
  assert.equal(signoOrigen(pedido({ tipo: "transferencia", cuentaDestinoId: "bcoTsl" })), -1);
  assert.equal(signoOrigen(pedido({ tipo: "cobranza" })), 1);
  assert.equal(signoOrigen(pedido({ tipo: "sena" })), 1);
  assert.equal(signoOrigen(pedido({ tipo: "ajuste", sentido: "entra" })), 1);
  assert.equal(signoOrigen(pedido({ tipo: "ajuste", sentido: "sale" })), -1);
});

test("saldo: inicial + movimientos no anulados desde la fecha de la cuenta", () => {
  const c = cuenta("c1", "tsl", "efectivo", { saldoInicial: 1000 });
  const movs = [
    mov("a", "c1", "tsl", -200.1, "2026-11-02T12:00:00Z"),
    mov("b", "c1", "tsl", 50, "2026-11-03T12:00:00Z"),
    mov("c", "c1", "tsl", -999, "2026-11-03T13:00:00Z", { anulado: true }),
    mov("d", "c1", "tsl", -5, "2026-10-31T12:00:00Z"),
    mov("e", "otra", "tsl", -7, "2026-11-03T12:00:00Z"),
  ];
  assert.equal(saldoDe(c, movs), 849.9);
  assert.equal(saldoDe(c, movs, "2026-11-02"), 799.9);
});

test("resumenGastos: solo gastos, repartidos, por dia y rubro", () => {
  const cuentas = [cuenta("bSrl", "srl", "banco"), cuenta("efTsl", "tsl", "efectivo")];
  const movs = [
    mov("a", "bSrl", "srl", -1000, "2026-11-10T15:00:00Z", { rubro: "Alquiler", reparto: { srl: 50, cnc: 50 } }),
    mov("b", "bSrl", "srl", -500, "2026-11-10T15:00:00Z", { tipo: "pago-proveedor", rubro: "" }),
    mov("c", "efTsl", "tsl", -300, "2026-11-11T15:00:00Z", { tipo: "retiro", rubro: "" }),
    mov("d", "efTsl", "tsl", -250.5, "2026-11-12T01:30:00Z", { rubro: "Combustible" }),
    mov("e", "efTsl", "tsl", -800, "2026-11-12T15:00:00Z", { rubro: "Combustible", anulado: true }),
    mov("f", "efTsl", "tsl", -40, "2026-12-01T15:00:00Z", { rubro: "Varios" }),
  ];
  const r = resumenGastos(movs, cuentas, "2026-11-01", "2026-11-30");
  assert.equal(r.porSucursal.srl.total, 500);
  assert.equal(r.porSucursal.cnc.total, 500);
  assert.equal(r.porSucursal.tsl.total, 250.5);
  assert.equal(r.porSucursal.srl.porRubro.Alquiler, 500);
  assert.equal(r.porSucursal.tsl.porRubro.Combustible, 250.5);
  assert.equal(r.porSucursal.tsl.porDia["2026-11-11"], 250.5);
  assert.equal(r.porSucursal.srl.porDia["2026-11-10"], 500);
});

test("puedeMover", () => {
  const efTsl = cuenta("efTsl", "tsl", "efectivo");
  const efSrl = cuenta("efSrl", "srl", "efectivo");
  const bcoTsl = cuenta("bcoTsl", "tsl", "banco");
  const bcoSrl = cuenta("bcoSrl", "srl", "banco");
  const inactiva = cuenta("vieja", "tsl", "efectivo", { activa: false });
  const cajeroTsl = { permisos: ["caja"], sucursal: "tsl" };
  const cajeroLibre = { permisos: ["caja"], sucursal: null };
  const gerente = { permisos: ["caja", "cuentas"], sucursal: null };
  const vendedor = { permisos: ["venta"], sucursal: "tsl" };

  assert.equal(puedeMover(cajeroTsl, pedido(), efTsl, null), null);
  assert.equal(typeof puedeMover(cajeroTsl, pedido(), efSrl, null), "string");
  assert.equal(typeof puedeMover(cajeroTsl, pedido(), bcoTsl, null), "string");
  assert.equal(typeof puedeMover(cajeroTsl, pedido({ reparto: { srl: 50, cnc: 50 } }), efTsl, null), "string");
  assert.equal(puedeMover(cajeroTsl, pedido({ tipo: "transferencia", cuentaDestinoId: "bcoTsl" }), efTsl, bcoTsl), null);
  assert.equal(typeof puedeMover(cajeroTsl, pedido({ tipo: "transferencia", cuentaDestinoId: "bcoSrl" }), efTsl, bcoSrl), "string");
  assert.equal(puedeMover(cajeroLibre, pedido(), efSrl, null), null);
  assert.equal(puedeMover(gerente, pedido({ reparto: { srl: 50, cnc: 50 } }), bcoSrl, null), null);
  assert.equal(puedeMover(gerente, pedido({ tipo: "transferencia", cuentaId: "bcoSrl", cuentaDestinoId: "efTsl" }), bcoSrl, efTsl), null);
  assert.equal(typeof puedeMover(vendedor, pedido(), efTsl, null), "string");
  assert.equal(typeof puedeMover(gerente, pedido(), inactiva, null), "string");
  assert.equal(typeof puedeMover(cajeroTsl, pedido(), inactiva, null), "string");
  // Final review: lo que el formulario de Caja no ofrece, el servidor tampoco lo acepta del cajero.
  assert.equal(typeof puedeMover(cajeroTsl, pedido({ fecha: "2026-10-01T15:00:00Z" }), efTsl, null), "string");
  assert.equal(typeof puedeMover(cajeroTsl, pedido({ tipo: "ajuste", sentido: "entra" }), efTsl, null), "string");
  assert.equal(typeof puedeMover(cajeroTsl, pedido({ iva: 100 }), efTsl, null), "string");
  assert.equal(puedeMover(gerente, pedido({ fecha: "2026-10-01T15:00:00Z", iva: 100 }), efTsl, null), null);
});

test("mismoPedido: el reintento con otros datos no se confunde con el guardado", () => {
  const guardado = [mov("x", "efTsl", "tsl", -1000, "2026-11-24T15:00:00Z", { grupo: "abc123" })];
  assert.equal(mismoPedido(guardado, pedido({ monto: 1000 })), true);
  assert.equal(mismoPedido(guardado, pedido({ monto: 999 })), false);
  assert.equal(mismoPedido(guardado, pedido({ tipo: "retiro" })), false);
  assert.equal(mismoPedido(guardado, pedido({ cuentaId: "otra" })), false);
});

import { AREAS_PUNTO, permisosEfectivos } from "../../src/lib/punto-permisos.ts";
test("permiso cuentas", () => {
  assert.ok(AREAS_PUNTO.some((a) => a.id === "cuentas"));
  assert.ok(permisosEfectivos(null).includes("cuentas"));
  assert.equal(permisosEfectivos(["caja"]).includes("cuentas"), false);
});
