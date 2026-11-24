// node --test scripts/pruebas/punto-sucursales.test.ts
// Un usuario con varias sucursales (V.0.11.233). Damian: "acá me tendría que
// dejar elegir sucursales, más de una".
import { test } from "node:test";
import assert from "node:assert/strict";
import { leerSucursales, guardarSucursales, fueraDeSucursal, nombresSucursales } from "../../src/lib/punto-permisos.ts";

test("leerSucursales: lo guardado como lista", () => {
  assert.equal(leerSucursales(null), null);
  assert.equal(leerSucursales(""), null);
  assert.deepEqual(leerSucursales("tsl"), ["tsl"]);
  assert.deepEqual(leerSucursales("srl,cnc"), ["srl", "cnc"]);
  assert.deepEqual(leerSucursales(" cnc , srl "), ["srl", "cnc"]);
  // Lo que no existe se ignora, pero no abre a todas: queda en ninguna.
  assert.deepEqual(leerSucursales("xyz"), []);
});

test("guardarSucursales: lo que llega de la pantalla", () => {
  assert.equal(guardarSucursales(null), null);
  assert.equal(guardarSucursales(""), null);
  assert.equal(guardarSucursales([]), null);
  assert.equal(guardarSucursales("tsl"), "tsl");
  assert.equal(guardarSucursales(["cnc", "srl"]), "srl,cnc");
  assert.equal(guardarSucursales(["srl", "srl"]), "srl");
  assert.equal(guardarSucursales(["srl", "cnc", "tsl"]), null); // las tres = cualquiera
  assert.equal(guardarSucursales(["srl", "xyz"]), "mal");
  assert.equal(guardarSucursales(5), "mal");
});

test("fueraDeSucursal", () => {
  assert.equal(fueraDeSucursal(null, "tsl"), false);
  assert.equal(fueraDeSucursal(["srl", "cnc"], "cnc"), false);
  assert.equal(fueraDeSucursal(["srl", "cnc"], "tsl"), true);
  assert.equal(fueraDeSucursal([], "tsl"), true);
});

test("nombresSucursales", () => {
  assert.equal(nombresSucursales(["srl", "cnc"]), "CONESA SRL y SANITARIOS CNC");
  assert.equal(nombresSucursales(["tsl"]), "TRASLASIERRA");
});

import { ACCIONES_PUNTO, permisosEfectivos } from "../../src/lib/punto-permisos.ts";
test("permiso Ver Recibo X: lo tienen los de todo, no los de una lista", () => {
  assert.ok(ACCIONES_PUNTO.some((a) => a.id === "recibox"));
  assert.ok(permisosEfectivos(null).includes("recibox"));
  assert.equal(permisosEfectivos(["venta", "caja", "cobrar"]).includes("recibox"), false);
  assert.ok(permisosEfectivos(["venta", "recibox"]).includes("recibox"));
});
