// node --test scripts/pruebas/freno-ingreso.test.ts
// El freno a los que prueban contraseñas (V.0.11.243).
import { test } from "node:test";
import assert from "node:assert/strict";
import { Freno, MAX_CONEXION, MAX_USUARIO, MAX_USUARIO_CONEXION, VENTANA_MS, minutosTxt } from "../../src/lib/freno-ingreso.ts";

const T = 1_000_000;

test("5 equivocadas con el mismo usuario y conexion: frena 15 minutos", () => {
  const f = new Freno();
  for (let i = 1; i < MAX_USUARIO_CONEXION; i++) assert.equal(f.fallo("1.1.1.1", "damian", T + i), false);
  assert.equal(f.espera("1.1.1.1", "damian", T + 10), 0);
  assert.equal(f.fallo("1.1.1.1", "damian", T + 10), true);
  assert.equal(f.espera("1.1.1.1", "damian", T + 10), VENTANA_MS);
  // Otro usuario desde la misma conexion sigue pudiendo; el mismo desde otra, tambien.
  assert.equal(f.espera("1.1.1.1", "daniel", T + 10), 0);
  assert.equal(f.espera("2.2.2.2", "damian", T + 10), 0);
  // Pasado el tiempo, vuelve a poder.
  assert.equal(f.espera("1.1.1.1", "damian", T + 10 + VENTANA_MS), 0);
});

test("las equivocadas viejas (mas de 15 minutos) no cuentan", () => {
  const f = new Freno();
  for (let i = 0; i < MAX_USUARIO_CONEXION - 1; i++) f.fallo("1.1.1.1", "damian", T);
  assert.equal(f.fallo("1.1.1.1", "damian", T + VENTANA_MS + 1), false);
});

test("entrar bien borra lo anotado de ese usuario en esa conexion", () => {
  const f = new Freno();
  for (let i = 0; i < MAX_USUARIO_CONEXION - 1; i++) f.fallo("1.1.1.1", "damian", T);
  f.entro("1.1.1.1", "damian");
  assert.equal(f.fallo("1.1.1.1", "damian", T + 1), false);
});

test("20 equivocadas desde una conexion a usuarios distintos: frena la conexion", () => {
  const f = new Freno();
  let frenado = false;
  for (let i = 0; i < MAX_CONEXION; i++) frenado = f.fallo("3.3.3.3", "u" + i, T + i);
  assert.equal(frenado, true);
  assert.ok(f.espera("3.3.3.3", "cualquiera", T + 100) > 0);
  assert.equal(f.espera("4.4.4.4", "cualquiera", T + 100), 0);
});

test("30 equivocadas al mismo usuario desde conexiones distintas: frena el usuario", () => {
  const f = new Freno();
  let frenado = false;
  for (let i = 0; i < MAX_USUARIO; i++) frenado = f.fallo("10.0.0." + i, "damian", T + i);
  assert.equal(frenado, true);
  assert.ok(f.espera("99.9.9.9", "damian", T + 100) > 0);
  assert.equal(f.espera("99.9.9.9", "daniel", T + 100), 0);
});

test("liberar: borra lo del usuario y el freno de su conexion", () => {
  const f = new Freno();
  // El local: todos salen por la misma conexion. Mariano se equivoca 5 veces
  // y otros 15 intentos fallidos completan las 20 de la conexion.
  for (let i = 0; i < MAX_USUARIO_CONEXION; i++) f.fallo("5.5.5.5", "mariano", T + i);
  for (let i = 0; i < MAX_CONEXION - MAX_USUARIO_CONEXION; i++) f.fallo("5.5.5.5", "x" + i, T + 10 + i);
  assert.equal(f.frenado("mariano", T + 100), true);
  assert.ok(f.espera("5.5.5.5", "pedro", T + 100) > 0, "la conexion del local quedo frenada");
  assert.equal(f.liberar("mariano", T + 100), true);
  assert.equal(f.frenado("mariano", T + 100), false);
  assert.equal(f.espera("5.5.5.5", "mariano", T + 100), 0);
  assert.equal(f.espera("5.5.5.5", "pedro", T + 100), 0, "liberar a uno destraba la conexion del local");
  assert.equal(f.liberar("mariano", T + 100), false, "ya no estaba frenado");
});

test("liberar no confunde usuarios que terminan igual", () => {
  const f = new Freno();
  for (let i = 0; i < MAX_USUARIO_CONEXION; i++) f.fallo("6.6.6.6", "mariano", T + i);
  f.liberar("ano", T + 10);
  assert.equal(f.frenado("mariano", T + 10), true);
});

test("minutosTxt", () => {
  assert.equal(minutosTxt(VENTANA_MS), "15 minutos");
  assert.equal(minutosTxt(30_000), "1 minuto");
});
