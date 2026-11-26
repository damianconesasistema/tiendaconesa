// node --test scripts/pruebas/punto-ver-como.test.ts
// Ver Punto como otro perfil o usuario (V.0.11.266).
import { test } from "node:test";
import assert from "node:assert/strict";
import { aplicarVerComo, leerVerComo, limpiarVerComo, textoVerComo, type VerComo } from "../../src/lib/punto-ver-como.ts";

const SUCS = ["srl", "cnc", "tsl"];
const TODO = ["venta", "comprobantes", "clientes", "caja", "cobrar", "recibox", "despachar", "productos", "gerencia", "importar"];
const damian = { usuario: "damian", permisos: TODO, sucursal: null, sucursales: null, adminUsuarios: true };
const CAJERO = ["venta", "comprobantes", "clientes", "caja", "cobrar", "recibox"];

test("un perfil: sus permisos, cruzados con los de verdad", () => {
  const v = limpiarVerComo({ nombre: "Cajero", permisos: CAJERO, sucursales: ["tsl"] }, damian, 111, SUCS);
  assert.ok(typeof v === "object");
  if (typeof v !== "object") return;
  assert.deepEqual(v.permisos, CAJERO);
  assert.deepEqual(v.sucursales, ["tsl"]);
  assert.equal(v.usuario, "damian");
  assert.equal(v.sesion, 111);
});

test("nunca agrega: lo que el de verdad no tiene no entra", () => {
  const mauro = { usuario: "mauro", permisos: ["venta", "comprobantes"], sucursales: ["srl", "cnc"] };
  const v = limpiarVerComo({ nombre: "Gerencia", permisos: null }, mauro, 1, SUCS);
  assert.ok(typeof v === "object");
  if (typeof v === "object") assert.deepEqual(v.permisos, ["venta", "comprobantes"]);
  const w = limpiarVerComo({ nombre: "Cajero", permisos: ["caja", "cobrar", "inventado"] }, mauro, 1, SUCS);
  assert.equal(w, "Con tus permisos, ese perfil no vería nada.");
  assert.equal(limpiarVerComo({ nombre: "Cajero", permisos: CAJERO, sucursales: ["tsl"] }, mauro, 1, SUCS), "Esa sucursal no es de las tuyas.");
  assert.equal(limpiarVerComo({ nombre: "Cajero", permisos: CAJERO, sucursales: ["xyz"] }, mauro, 1, SUCS), "Esa sucursal no existe.");
});

test("lo que no se entiende se rechaza", () => {
  assert.equal(limpiarVerComo(null, damian, 1, SUCS), "No entendí qué querés ver.");
  assert.equal(limpiarVerComo({ nombre: "<script>", permisos: CAJERO }, damian, 1, SUCS), "Elegí un perfil o un usuario.");
  assert.equal(limpiarVerComo({ nombre: "", permisos: CAJERO }, damian, 1, SUCS), "Elegí un perfil o un usuario.");
  assert.equal(limpiarVerComo({ nombre: "Cajero", permisos: "venta" }, damian, 1, SUCS), "No entendí los permisos del perfil.");
  assert.equal(limpiarVerComo({ nombre: "Cajero", permisos: CAJERO, sucursales: [3] }, damian, 1, SUCS), "No entendí la sucursal.");
  // Un nombre de persona con tilde y paréntesis pasa.
  assert.equal(typeof limpiarVerComo({ nombre: "Mauro (SRL y CNC)", permisos: CAJERO }, damian, 1, SUCS), "object");
});

test("la galleta va y vuelve igual; la rota da null", () => {
  const v: VerComo = { usuario: "damian", sesion: 1764100000000, nombre: "Depósito", permisos: ["comprobantes", "despachar"], sucursales: ["tsl"] };
  assert.deepEqual(leerVerComo(textoVerComo(v)), v);
  assert.deepEqual(leerVerComo(textoVerComo({ ...v, sucursales: null })), { ...v, sucursales: null });
  assert.equal(leerVerComo(""), null);
  assert.equal(leerVerComo(undefined), null);
  assert.equal(leerVerComo("no-es-json"), null);
  assert.equal(leerVerComo(Buffer.from('{"u":1}').toString("base64url")), null);
});

test("aplicar: achica permisos y sucursales, saca administrar usuarios", () => {
  const como: VerComo = { usuario: "damian", sesion: 5, nombre: "Cajero", permisos: CAJERO, sucursales: ["tsl"] };
  const yo = aplicarVerComo(damian, como, 5);
  assert.deepEqual(yo.permisos, CAJERO);
  assert.deepEqual(yo.sucursales, ["tsl"]);
  assert.equal(yo.sucursal, "tsl");
  assert.equal(yo.adminUsuarios, false);
  assert.deepEqual(yo.como, { nombre: "Cajero", sucursales: ["tsl"] });
  assert.equal(yo.usuario, "damian", "lo que hace queda a su nombre");
});

test("aplicar: si la galleta no es de él o de esta sesión, nada", () => {
  const como: VerComo = { usuario: "damian", sesion: 5, nombre: "Cajero", permisos: CAJERO, sucursales: null };
  const otra = aplicarVerComo(damian, como, 6);
  assert.equal(otra.como, null);
  assert.deepEqual(otra.permisos, TODO);
  assert.equal(otra.adminUsuarios, true);
  const pedro = { usuario: "pedro", permisos: ["venta"], sucursal: "tsl", sucursales: ["tsl"], adminUsuarios: false };
  assert.equal(aplicarVerComo(pedro, como, 5).como, null);
  assert.equal(aplicarVerComo(damian, null, 5).como, null);
});

test("aplicar con una galleta tocada a mano: igual solo achica", () => {
  const vendedor = { usuario: "mariano", permisos: ["venta", "comprobantes"], sucursal: "tsl", sucursales: ["tsl"], adminUsuarios: false };
  const tocada: VerComo = { usuario: "mariano", sesion: 9, nombre: "Gerencia", permisos: TODO, sucursales: ["srl", "cnc", "tsl"] };
  const yo = aplicarVerComo(vendedor, tocada, 9);
  assert.deepEqual(yo.permisos, ["venta", "comprobantes"]);
  assert.deepEqual(yo.sucursales, ["tsl"]);
  assert.equal(yo.adminUsuarios, false);
  // Sin nada en común, queda como es (no en blanco).
  const nada = aplicarVerComo(vendedor, { ...tocada, permisos: ["gerencia"] }, 9);
  assert.equal(nada.como, null);
  assert.deepEqual(nada.permisos, ["venta", "comprobantes"]);
});
