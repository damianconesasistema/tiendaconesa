// node --test scripts/pruebas/punto-asociar.test.ts
// Asociar los artículos con los proveedores de la lista (V.0.11.288).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aplicarAsociaciones,
  claveAsoc,
  esRubroGbp,
  limpiarAsociaciones,
  proveedorAsociado,
} from "../../src/lib/punto-asociar-reglas.ts";

const asoc = {
  porNombre: { [claveAsoc("COOPERATIVA FENIX LTDA")]: "COOP.FENIX LTDA.", [claveAsoc("CAÑOS BRAGANZA")]: "BRAGANZA SA" },
  porMarca: { [claveAsoc("TST")]: "TST SA" },
};

test("rubro de GBP o proveedor", () => {
  assert.equal(esRubroGbp("09.SANITARIOS"), true);
  assert.equal(esRubroGbp("20.ZISCONTINUADOS"), true);
  assert.equal(esRubroGbp(""), true);
  assert.equal(esRubroGbp("FV S.A."), false);
  assert.equal(esRubroGbp("F.S.JUSTO"), false);
});

test("el proveedor asociado: por nombre, o por marca si trae un rubro", () => {
  assert.equal(proveedorAsociado({ cat: "COOPERATIVA FENIX LTDA", prov: "FENIX" }, asoc), "COOP.FENIX LTDA.");
  assert.equal(proveedorAsociado({ cat: "Caños Braganza ", prov: "BRAGANZA" }, asoc), "BRAGANZA SA");
  assert.equal(proveedorAsociado({ cat: "09.SANITARIOS", prov: "TST" }, asoc), "TST SA");
  // Un proveedor que no está asociado queda como está, aunque la marca sí lo esté.
  assert.equal(proveedorAsociado({ cat: "FV S.A.", prov: "TST" }, asoc), "FV S.A.");
  assert.equal(proveedorAsociado({ cat: "09.SANITARIOS", prov: "PIAZZA" }, asoc), "09.SANITARIOS");
});

test("aplicar: cambia solo los asociados y guarda el de GBP", () => {
  const arts = [{ cod: "1", cat: "09.SANITARIOS", prov: "TST" }, { cod: "2", cat: "FV S.A.", prov: "FV" }];
  const r = aplicarAsociaciones(arts, asoc);
  assert.deepEqual(r[0], { cod: "1", cat: "TST SA", prov: "TST", catGbp: "09.SANITARIOS" });
  assert.equal(r[1], arts[1]);
  assert.deepEqual(aplicarAsociaciones(arts, { porNombre: {}, porMarca: {} }), arts);
});

test("limpiar: claves normalizadas, lo vacío se saca", () => {
  const a = limpiarAsociaciones({ porNombre: { "Cooperativa Fénix Ltda": " COOP.FENIX LTDA. ", "X": "" }, porMarca: { tst: "TST SA" } });
  assert.deepEqual(a, { porNombre: { COOPERATIVAFENIXLTDA: "COOP.FENIX LTDA." }, porMarca: { TST: "TST SA" } });
  assert.equal(typeof limpiarAsociaciones(null), "string");
  assert.equal(typeof limpiarAsociaciones({ porNombre: [] }), "string");
});
