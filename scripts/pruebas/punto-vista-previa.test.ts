// node --test scripts/pruebas/punto-vista-previa.test.ts
// El link del comprobante por WhatsApp: en conesa.com.ar y con vista previa
// de Sanitarios Conesa (V.0.11.275).
import { test } from "node:test";
import assert from "node:assert/strict";
import { esVistaPrevia, paginaVistaPrevia, pesosAR } from "../../src/lib/punto-vista-previa.ts";
import { PUNTO_URL, quedaEnLaViejaDireccion } from "../../src/lib/dominio.ts";

test("WhatsApp y Facebook piden la vista previa; un celular no", () => {
  assert.equal(esVistaPrevia("WhatsApp/2.24.8.78 A"), true);
  assert.equal(esVistaPrevia("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"), true);
  assert.equal(esVistaPrevia("TelegramBot (like TwitterBot)"), true);
  assert.equal(esVistaPrevia("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36"), false);
  assert.equal(esVistaPrevia(""), false);
  assert.equal(esVistaPrevia(null), false);
});

test("la página de la vista previa: título de Sanitarios Conesa, sin HTML colado", () => {
  const h = paginaVistaPrevia({ titulo: "Factura A N° 0006-00000001 · Sanitarios Conesa", descripcion: "Total $ 50.303,03 <b>", imagen: "https://conesa.com.ar/brand/logo-square.png", url: "https://conesa.com.ar/comprobante/abc?f=x&y=1" });
  assert.match(h, /<meta property="og:title" content="Factura A N° 0006-00000001 · Sanitarios Conesa">/);
  assert.match(h, /<meta property="og:site_name" content="Sanitarios Conesa">/);
  assert.match(h, /Total \$ 50\.303,03 &lt;b&gt;/);
  assert.match(h, /f=x&amp;y=1/);
  assert.doesNotMatch(h, /tienda\./);
});

test("plata como en Argentina", () => {
  assert.equal(pesosAR(50303.03), "$ 50.303,03");
  assert.equal(pesosAR(1234567.5), "$ 1.234.567,50");
  assert.equal(pesosAR(0), "$ 0,00");
});

test("el link va a conesa.com.ar y ahí se queda (no manda a la tienda)", () => {
  assert.equal(PUNTO_URL, "https://conesa.com.ar");
  assert.equal(quedaEnLaViejaDireccion("GET", "/comprobante/cmwxxjtwb0009uv7dlucds4c0"), true);
  assert.equal(quedaEnLaViejaDireccion("GET", "/sistema"), true);
  assert.equal(quedaEnLaViejaDireccion("GET", "/tienda"), false);
});
