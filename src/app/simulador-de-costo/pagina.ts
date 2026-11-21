// La pagina del simulador de costo, entera: HTML, estilo y la cuenta.
//
// Damian, 21/11/2026: "haceme esta pagina como si fuera una pagina para poner
// un costo y que te lo calcula automaticamente fuera del panel y sin usuario
// y sin contraseña ... asi ya se lo mando al jefe que lo quiere". Es el Excel
// "SIMULADOR DE COSTO" (Desktop/CONESA CAPITAL) pasado a una pagina:
//
//   costo sin IVA        = lista del proveedor - hasta 6 descuentos en cascada
//                          ("poneme 6 descuentos", los del proveedor; vacios =
//                          el costo es la lista, como en el Excel)
//   costo con IVA        = costo sin IVA x 1,21
//   venta por mayor      = costo x 1,12            (sin IVA y con IVA)
//   lista 1              = costo x 1,25            (sin IVA y con IVA)
//   lista 2              = lista 1 x 1,25          (sin IVA y con IVA)
//   con descuento 12 %   = lista 2 con IVA x 0,88
//
// Y lo mismo para muchos articulos ("poneme la posibilidad de yo subir un
// excel y que me hagas un calculo gral de precios"): se sube el Excel del
// proveedor, se elige la columna del precio y se baja el mismo Excel con los
// precios agregados a la derecha. El archivo se lee en el navegador de quien
// lo sube: no viaja al servidor ni se guarda en ningun lado. El lector de
// Excel (planillas.js) se baja recien cuando se elige un archivo.
//
// Los porcentajes se pueden cambiar en la pagina, como en las celdas del
// Excel, y al recargar vuelven a los del Excel. No guarda nada ni toca la
// base. Letra de Conesa: Montserrat en titulos y numeros, Inter en el texto,
// las mismas de la tienda (src/app/layout.tsx).
//
// Va suelta, sin la cabecera ni el pie de la tienda (por eso es un route.ts
// y no un page.tsx), y no se publica en Google (noindex). OJO: el JavaScript
// de abajo no usa comillas invertidas ni "${": todo esto es un String.raw.

export const PAGINA = String.raw`<!DOCTYPE html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#111111">
<title>Simulador de costo · Sanitarios Conesa</title>
<meta property="og:title" content="Simulador de costo · Sanitarios Conesa">
<meta property="og:description" content="Poné la lista del proveedor y sus descuentos, o subí el Excel, y te calcula el costo, por mayor, Lista 1, Lista 2 y el precio con descuento.">
<meta property="og:image" content="https://tienda.conesa.com.ar/brand/logo-square.png">
<link rel="icon" href="/icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@500;600;700;800;900&display=swap">
<style>
  :root {
    --rojo: #e63020;
    --negro: #111111;
    --gris: #6b6b6b;
    --fondo: #f6f5f3;
    --borde: #e6e4e0;
    --texto: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    --display: "Montserrat", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: var(--texto);
    color: var(--negro);
    background: var(--fondo);
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
  }
  /* Los numeros, con la letra de los precios de la tienda */
  .n, input, .num { font-family: var(--display); font-variant-numeric: tabular-nums; }
  header {
    background: var(--negro);
    color: #fff;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  header img { height: 34px; width: auto; background: #fff; border-radius: 6px; padding: 4px 8px; }
  header h1 { font-family: var(--display); font-size: 18px; margin: 0; font-weight: 900; letter-spacing: .2px; text-transform: uppercase; }
  main { max-width: 680px; margin: 0 auto; padding: 20px 16px 40px; }
  .caja {
    background: #fff;
    border: 1px solid var(--borde);
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 16px;
  }
  h2 { font-family: var(--display); font-size: 17px; font-weight: 900; text-transform: uppercase; margin: 0 0 6px; letter-spacing: .2px; }
  /* Los titulos de los campos, como en el panel */
  .rotulo {
    display: block; font-family: var(--display); font-size: 12px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .06em; color: var(--gris); margin-bottom: 8px;
  }
  .costo { position: relative; }
  .costo span {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    font-family: var(--display); font-size: 26px; font-weight: 800; color: var(--gris);
  }
  #lista {
    width: 100%;
    font-size: 28px;
    font-weight: 900;
    padding: 14px 16px 14px 44px;
    border: 2px solid var(--borde);
    border-radius: 12px;
    outline: none;
    color: var(--negro);
  }
  #lista:focus { border-color: var(--rojo); }
  .ayuda { color: var(--gris); font-size: 13px; margin: 8px 0 0; line-height: 1.45; }
  .rotulo.sub { margin-top: 18px; }
  .descuentos { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
  .pct { display: flex; align-items: center; gap: 6px; font-family: var(--display); font-weight: 700; color: var(--gris); }
  .pct input {
    width: 76px; font-size: 16px; font-weight: 700; padding: 9px 10px; text-align: right;
    border: 1px solid var(--borde); border-radius: 10px; color: var(--negro);
  }
  .descuentos .pct { gap: 4px; }
  .descuentos .pct input { width: 100%; }
  .pct input:focus { outline: 2px solid var(--rojo); border-color: transparent; }
  .pct input.mal { outline: 2px solid var(--rojo); border-color: transparent; background: #fff1f0; }
  .resultado-costo {
    margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--borde);
    display: flex; justify-content: space-between; align-items: baseline; gap: 4px 12px; flex-wrap: wrap;
  }
  .resultado-costo .que { font-family: var(--display); font-weight: 800; font-size: 15px; text-transform: uppercase; }
  .resultado-costo .n { font-weight: 900; font-size: 26px; white-space: nowrap; }
  .resultado-costo .como { width: 100%; color: var(--gris); font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: right; font-family: var(--display); font-size: 11px; text-transform: uppercase; letter-spacing: .06em;
    color: var(--gris); font-weight: 700; padding: 0 0 8px;
  }
  th:first-child { text-align: left; }
  td { padding: 12px 0; border-top: 1px solid var(--borde); font-size: 16px; }
  td.n { text-align: right; white-space: nowrap; padding-left: 10px; font-weight: 700; }
  td .que { font-family: var(--display); font-weight: 800; display: block; }
  td .como { color: var(--gris); font-size: 12px; display: block; margin-top: 2px; }
  tr.lista2 td { background: #fff7ed; }
  tr.lista2 td:first-child { padding-left: 10px; border-radius: 10px 0 0 10px; }
  tr.lista2 td:last-child { padding-right: 10px; border-radius: 0 10px 10px 0; }
  tr.lista2 td.n:last-child { font-weight: 900; }
  .descuento {
    margin-top: 14px;
    background: var(--rojo);
    color: #fff;
    border-radius: 14px;
    padding: 16px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .descuento .que { font-family: var(--display); font-weight: 900; font-size: 15px; text-transform: uppercase; }
  .descuento .como { font-size: 12px; opacity: .9; margin-top: 2px; }
  .descuento .n { font-size: 26px; font-weight: 900; white-space: nowrap; }
  details summary { cursor: pointer; font-family: var(--display); font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: .03em; }
  .porcentajes { display: grid; grid-template-columns: 1fr auto; gap: 10px 12px; align-items: center; margin-top: 14px; }
  .porcentajes label { font-size: 14px; }
  .boton {
    display: inline-flex; align-items: center; gap: 8px;
    margin-top: 14px; background: #fff; border: 1px solid var(--borde); border-radius: 999px;
    padding: 10px 18px; font-family: var(--display); font-size: 13px; font-weight: 800; text-transform: uppercase;
    letter-spacing: .03em; cursor: pointer; color: var(--negro);
  }
  .boton:hover { border-color: var(--negro); }
  .boton.rojo { background: var(--rojo); border-color: var(--rojo); color: #fff; }
  .boton.rojo:hover { background: #c82614; }
  .boton[disabled] { opacity: .5; cursor: default; }
  #cambiados { color: var(--rojo); font-size: 13px; font-weight: 600; margin: 10px 0 0; display: none; }
  /* Muchos articulos */
  #archivo { position: absolute; width: 1px; height: 1px; opacity: 0; }
  #estado { font-size: 14px; margin: 12px 0 0; }
  #estado.error { color: var(--rojo); font-weight: 600; }
  #opciones { display: none; margin-top: 16px; }
  .elegir { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .elegir select, .elegir input {
    width: 100%; font-size: 15px; padding: 10px 12px; border: 1px solid var(--borde); border-radius: 10px;
    background: #fff; color: var(--negro); font-family: var(--texto);
  }
  .elegir input { font-family: var(--display); font-weight: 700; }
  #resumen { font-size: 14px; font-weight: 600; margin: 14px 0 0; }
  .tabla-planilla { overflow-x: auto; margin-top: 12px; border: 1px solid var(--borde); border-radius: 12px; }
  .tabla-planilla table { min-width: 720px; }
  .tabla-planilla th, .tabla-planilla td { padding: 8px 10px; font-size: 13px; }
  .tabla-planilla th { background: var(--fondo); padding-top: 10px; }
  .tabla-planilla td { border-top: 1px solid var(--borde); }
  .tabla-planilla td.n { font-weight: 600; }
  .tabla-planilla td.art { max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .tabla-planilla td.fuerte { font-weight: 800; background: #fff7ed; }
  .tabla-planilla td.rojo { font-weight: 800; color: var(--rojo); }
  #mas { color: var(--gris); font-size: 12px; margin: 8px 0 0; }
  footer { text-align: center; color: var(--gris); font-size: 12px; padding: 0 16px 30px; }
  @media (max-width: 520px) {
    .descuentos { grid-template-columns: repeat(3, 1fr); }
    .elegir { grid-template-columns: 1fr; }
    td { font-size: 15px; }
    .descuento .n { font-size: 22px; }
  }
  /* Montserrat es mas ancha: en el celular los numeros van un poco mas
     chicos para que la tabla no se apriete */
  @media (max-width: 420px) {
    header h1 { font-size: 16px; }
    td.n { font-size: 13.5px; padding-left: 6px; }
    td .que { font-size: 14px; }
    td .como { white-space: nowrap; font-size: 11px; }
    .resultado-costo .n { font-size: 23px; }
    .tabla-planilla td.art { max-width: 160px; }
  }
</style>
</head>
<body>
<header>
  <img src="/brand/logo.png" alt="Sanitarios Conesa">
  <h1>Simulador de costo</h1>
</header>
<main>
  <div class="caja">
    <label class="rotulo" for="lista">Precio de lista del proveedor (sin IVA)</label>
    <div class="costo">
      <span>$</span>
      <input id="lista" type="text" inputmode="decimal" autocomplete="off" value="100.000" aria-describedby="ayuda">
    </div>
    <p class="ayuda" id="ayuda">Escribí el precio y los descuentos, y los precios se calculan solos. Si no hay descuentos, dejalos vacíos: el costo es el precio de lista.</p>

    <span class="rotulo sub">Descuentos del proveedor (uno después del otro)</span>
    <div class="descuentos">
      <div class="pct"><input id="d1" type="text" inputmode="decimal" aria-label="Descuento 1">%</div>
      <div class="pct"><input id="d2" type="text" inputmode="decimal" aria-label="Descuento 2">%</div>
      <div class="pct"><input id="d3" type="text" inputmode="decimal" aria-label="Descuento 3">%</div>
      <div class="pct"><input id="d4" type="text" inputmode="decimal" aria-label="Descuento 4">%</div>
      <div class="pct"><input id="d5" type="text" inputmode="decimal" aria-label="Descuento 5">%</div>
      <div class="pct"><input id="d6" type="text" inputmode="decimal" aria-label="Descuento 6">%</div>
    </div>

    <div class="resultado-costo">
      <span class="que">Costo sin IVA</span>
      <span class="n" id="costo-neto"></span>
      <span class="como" id="como-costo"></span>
    </div>
  </div>

  <div class="caja">
    <table>
      <thead>
        <tr><th></th><th>Sin IVA</th><th>Con IVA</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="que">Costo</span><span class="como" id="c-iva">IVA 21 %</span></td>
          <td class="n" id="costo-s"></td>
          <td class="n" id="costo-c"></td>
        </tr>
        <tr>
          <td><span class="que">Venta por mayor</span><span class="como" id="c-mayor">costo + 12 %</span></td>
          <td class="n" id="mayor-s"></td>
          <td class="n" id="mayor-c"></td>
        </tr>
        <tr>
          <td><span class="que">Lista 1</span><span class="como" id="c-l1">costo + 25 %</span></td>
          <td class="n" id="l1-s"></td>
          <td class="n" id="l1-c"></td>
        </tr>
        <tr class="lista2">
          <td><span class="que">Lista 2</span><span class="como" id="c-l2">Lista 1 + 25 %</span></td>
          <td class="n" id="l2-s"></td>
          <td class="n" id="l2-c"></td>
        </tr>
      </tbody>
    </table>
    <div class="descuento">
      <div>
        <div class="que" id="t-desc">Con descuento 12 %</div>
        <div class="como">Lista 2 con IVA, menos el descuento</div>
      </div>
      <div class="n" id="desc"></div>
    </div>
  </div>

  <div class="caja">
    <h2>Muchos artículos a la vez</h2>
    <p class="ayuda">Subí el Excel del proveedor (.xlsx, .xls o .csv), elegí la columna del precio y bajá el mismo Excel con todos los precios calculados a la derecha. Usa los descuentos y los porcentajes de esta página. El archivo se lee en tu compu: no se sube a ningún lado.</p>
    <label class="boton rojo" for="archivo">Elegir Excel</label>
    <input id="archivo" type="file" accept=".xlsx,.xls,.xlsm,.csv,.ods">
    <p id="estado"></p>
    <div id="opciones">
      <div class="elegir">
        <div id="caja-hoja">
          <label class="rotulo" for="hoja">Hoja</label>
          <select id="hoja"></select>
        </div>
        <div>
          <label class="rotulo" for="fila-titulos">Fila de los títulos</label>
          <input id="fila-titulos" type="number" min="1" step="1">
        </div>
        <div>
          <label class="rotulo" for="col-precio">Columna del precio de lista</label>
          <select id="col-precio"></select>
        </div>
        <div>
          <label class="rotulo" for="col-nombre">Columna del artículo</label>
          <select id="col-nombre"></select>
        </div>
      </div>
      <p id="resumen"></p>
      <div class="tabla-planilla">
        <table>
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Lista prov.</th>
              <th>Costo s/IVA</th>
              <th>Por mayor c/IVA</th>
              <th>Lista 1 c/IVA</th>
              <th>Lista 2 c/IVA</th>
              <th id="th-desc">Con 12 %</th>
            </tr>
          </thead>
          <tbody id="filas"></tbody>
        </table>
      </div>
      <p id="mas"></p>
      <button type="button" class="boton rojo" id="bajar">Bajar Excel con los precios</button>
    </div>
  </div>

  <div class="caja">
    <details>
      <summary>Cambiar los porcentajes</summary>
      <div class="porcentajes">
        <label for="p-iva">IVA</label>
        <div class="pct"><input id="p-iva" type="text" inputmode="decimal"> %</div>
        <label for="p-mayor">Venta por mayor (sobre el costo)</label>
        <div class="pct"><input id="p-mayor" type="text" inputmode="decimal"> %</div>
        <label for="p-l1">Lista 1 (sobre el costo)</label>
        <div class="pct"><input id="p-l1" type="text" inputmode="decimal"> %</div>
        <label for="p-l2">Lista 2 (sobre la Lista 1)</label>
        <div class="pct"><input id="p-l2" type="text" inputmode="decimal"> %</div>
        <label for="p-desc">Descuento (sobre la Lista 2)</label>
        <div class="pct"><input id="p-desc" type="text" inputmode="decimal"> %</div>
      </div>
      <button type="button" class="boton" id="volver">Volver a los del Excel</button>
    </details>
    <p id="cambiados">Ojo: estás usando porcentajes distintos a los del Excel.</p>
  </div>
</main>
<footer>Sanitarios Conesa · las mismas cuentas que el Excel "Simulador de costo"</footer>

<script>
(function () {
  // Los del Excel: C2 1,21 · C4 1,12 · C6 1,25 · C8 1,25 · F12 0,88.
  var EXCEL = { iva: 21, mayor: 12, l1: 25, l2: 25, desc: 12 };
  var CAMPOS = ["iva", "mayor", "l1", "l2", "desc"];
  var DESCUENTOS = ["d1", "d2", "d3", "d4", "d5", "d6"];

  function el(id) { return document.getElementById(id); }

  // Lee lo que escribe la gente o lo que trae una celda: 100000, "100.000",
  // "1.500,50", "1500,50", "1500.50", "1,500.50", "$ 100.000", "35 %".
  function leer(texto) {
    if (typeof texto === "number") return texto;
    if (texto instanceof Date) return NaN;
    var t = String(texto == null ? "" : texto).replace(/u\$s|usd|ars|[$%\s]/gi, "");
    if (!t) return NaN;
    var punto = t.lastIndexOf("."), coma = t.lastIndexOf(",");
    if (punto >= 0 && coma >= 0) {
      // El que va ultimo es el de los decimales.
      t = coma > punto ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
    } else if (coma >= 0) {
      t = /^-?\d{1,3}(,\d{3}){2,}$/.test(t) ? t.replace(/,/g, "") : t.replace(",", ".");
    } else if (punto >= 0 && /^-?\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, "");
    }
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return parseFloat(t);
  }

  var plata = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
  function pesos(n) { return isFinite(n) ? "$ " + plata.format(n) : "—"; }
  function escapar(t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function pct(campo) {
    var v = leer(el("p-" + campo).value);
    return isFinite(v) ? v : EXCEL[campo];
  }

  // Los descuentos del proveedor que valen. Vacio = no hay; uno que no es un
  // numero entre 0 y 100 se marca en rojo y no se usa.
  function descuentos() {
    var lista = [];
    DESCUENTOS.forEach(function (id) {
      var campo = el(id);
      var vacio = !String(campo.value).trim();
      var v = leer(campo.value);
      var mal = !vacio && (!isFinite(v) || v < 0 || v >= 100);
      campo.classList.toggle("mal", mal);
      if (!vacio && !mal && v > 0) lista.push(v);
    });
    return lista;
  }

  function factores() {
    var ds = descuentos();
    var neto = 1;
    ds.forEach(function (d) { neto = neto * (1 - d / 100); });
    return {
      ds: ds,
      neto: neto,
      iva: 1 + pct("iva") / 100,
      mayor: 1 + pct("mayor") / 100,
      l1: 1 + pct("l1") / 100,
      l2: 1 + pct("l2") / 100,
      desc: 1 - pct("desc") / 100
    };
  }

  // La cuenta de un articulo, igual que las celdas del Excel.
  function precios(lista, f) {
    var costo = lista * f.neto;        // la lista menos los descuentos
    var costoC = costo * f.iva;        // F2 = D2*C2
    var l1S = costo * f.l1;            // D6 = C6*D2
    var l1C = costoC * f.l1;           // F6 = F2*C6
    return {
      costo: costo,
      costoC: costoC,
      mayorS: costo * f.mayor,         // D4 = D2*C4
      mayorC: costoC * f.mayor,        // F4 = F2*C4
      l1S: l1S,
      l1C: l1C,
      l2S: l1S * f.l2,                 // D8 = D6*C8
      l2C: l1C * f.l2,                 // F8 = F6*C8
      conDesc: l1C * f.l2 * f.desc     // F12 = F8*0,88
    };
  }

  function calcular() {
    var f = factores();
    var p = precios(leer(el("lista").value), f);

    el("costo-neto").textContent = pesos(p.costo);
    el("como-costo").textContent = f.ds.length
      ? "Lista " + f.ds.map(function (d) { return "− " + numero.format(d) + " %"; }).join(" ") +
        " · descuento total " + numero.format((1 - f.neto) * 100) + " %"
      : "Sin descuentos: es el precio de lista.";

    el("costo-s").textContent = pesos(p.costo);
    el("costo-c").textContent = pesos(p.costoC);
    el("mayor-s").textContent = pesos(p.mayorS);
    el("mayor-c").textContent = pesos(p.mayorC);
    el("l1-s").textContent = pesos(p.l1S);
    el("l1-c").textContent = pesos(p.l1C);
    el("l2-s").textContent = pesos(p.l2S);
    el("l2-c").textContent = pesos(p.l2C);
    el("desc").textContent = pesos(p.conDesc);

    el("c-iva").textContent = "IVA " + numero.format(pct("iva")) + " %";
    el("c-mayor").textContent = "costo + " + numero.format(pct("mayor")) + " %";
    el("c-l1").textContent = "costo + " + numero.format(pct("l1")) + " %";
    el("c-l2").textContent = "Lista 1 + " + numero.format(pct("l2")) + " %";
    el("t-desc").textContent = "Con descuento " + numero.format(pct("desc")) + " %";
    el("th-desc").textContent = "Con " + numero.format(pct("desc")) + " %";

    var distintos = CAMPOS.some(function (c) { return pct(c) !== EXCEL[c]; });
    el("cambiados").style.display = distintos ? "block" : "none";

    pintarPlanilla();
  }

  function ponerLosDelExcel() {
    CAMPOS.forEach(function (c) { el("p-" + c).value = numero.format(EXCEL[c]); });
    calcular();
  }

  // ------------------------------------------------ muchos articulos

  // planilla = { nombre, libro, filas, desdeFila, desdeCol, columnas, titulos }
  var planilla = null;

  function estado(texto, error) {
    el("estado").textContent = texto;
    el("estado").className = error ? "error" : "";
  }

  function cargarLector(listo) {
    if (window.XLSX) return listo();
    var s = document.createElement("script");
    s.src = "/simulador-de-costo/planillas.js";
    s.onload = listo;
    s.onerror = function () { estado("No se pudo cargar el lector de Excel. Revisá la conexión y probá de nuevo.", true); };
    document.head.appendChild(s);
  }

  function vacio(v) { return v == null || (typeof v === "string" && !v.trim()); }
  function esNumero(v) { return !vacio(v) && isFinite(leer(v)); }

  // La fila de los titulos: la primera con dos o mas textos que tiene numeros
  // abajo (los Excel de proveedor suelen traer logo y datos arriba).
  function filaDeTitulos(filas) {
    for (var i = 0; i < Math.min(filas.length, 40); i++) {
      var fila = filas[i] || [];
      var textos = fila.filter(function (v) { return !vacio(v) && !esNumero(v); }).length;
      if (textos < 2) continue;
      var abajo = filas.slice(i + 1, i + 6).some(function (f) { return (f || []).some(esNumero); });
      if (abajo) return i;
    }
    return 0;
  }

  function nombreDeColumna(c) {
    var letra = XLSX.utils.encode_col(planilla.desdeCol + c);
    var titulo = planilla.titulos[c];
    return vacio(titulo) ? "Columna " + letra : letra + " · " + String(titulo).trim();
  }

  // Adivina la columna del precio (la que se llama "lista", "precio",
  // "costo"... y trae numeros) y la del articulo (descripcion, detalle...).
  function adivinarColumnas() {
    var datos = planilla.filas.slice(planilla.fila0 + 1);
    var numericas = [];
    for (var c = 0; c < planilla.columnas; c++) {
      var llenas = 0, nums = 0, largo = 0;
      datos.forEach(function (f) {
        var v = (f || [])[c];
        if (vacio(v)) return;
        llenas++;
        if (esNumero(v) && leer(v) > 0) nums++;
        else largo += String(v).length;
      });
      numericas.push({ c: c, llenas: llenas, nums: nums, largo: llenas ? largo / llenas : 0 });
    }
    function titulo(c) { return String(planilla.titulos[c] == null ? "" : planilla.titulos[c]); }
    var buenas = numericas.filter(function (x) { return x.llenas && x.nums / x.llenas >= 0.5; });
    var precio =
      buenas.filter(function (x) { return /lista/i.test(titulo(x.c)); })[0] ||
      buenas.filter(function (x) { return /precio|costo|importe|valor|neto|p\.\s*u/i.test(titulo(x.c)); })[0] ||
      buenas[buenas.length - 1];
    var nombre =
      numericas.filter(function (x) { return /descrip|detalle|art[ií]culo|producto|nombre/i.test(titulo(x.c)) && x.llenas; })[0] ||
      numericas.slice().sort(function (a, b) { return b.largo - a.largo; })[0];
    el("col-precio").value = precio ? String(precio.c) : "0";
    el("col-nombre").value = nombre ? String(nombre.c) : "0";
  }

  function armarColumnas() {
    var fila0 = planilla.fila0;
    planilla.titulos = planilla.filas[fila0] || [];
    var opciones = "";
    for (var c = 0; c < planilla.columnas; c++) {
      opciones += '<option value="' + c + '">' + escapar(nombreDeColumna(c)) + "</option>";
    }
    el("col-precio").innerHTML = opciones;
    el("col-nombre").innerHTML = opciones;
    el("fila-titulos").value = String(planilla.desdeFila + fila0 + 1);
    adivinarColumnas();
  }

  function elegirHoja(nombre) {
    var ws = planilla.libro.Sheets[nombre];
    var filas = ws && ws["!ref"] ? XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null, blankrows: true }) : [];
    var rango = ws && ws["!ref"] ? XLSX.utils.decode_range(ws["!ref"]) : { s: { r: 0, c: 0 } };
    planilla.hoja = nombre;
    planilla.filas = filas;
    planilla.desdeFila = rango.s.r;
    planilla.desdeCol = rango.s.c;
    planilla.columnas = filas.reduce(function (m, f) { return Math.max(m, (f || []).length); }, 0);
    if (!filas.length || !planilla.columnas) {
      el("opciones").style.display = "none";
      estado("Esa hoja está vacía. Elegí otra.", true);
      el("opciones").style.display = planilla.libro.SheetNames.length > 1 ? "block" : "none";
      return;
    }
    planilla.fila0 = filaDeTitulos(filas);
    armarColumnas();
    el("opciones").style.display = "block";
    estado(planilla.archivo + " · " + (filas.length - planilla.fila0 - 1) + " filas debajo de los títulos");
    pintarPlanilla();
  }

  function nombreDeFila(fila) {
    var c = Number(el("col-nombre").value);
    var v = fila[c];
    return vacio(v) ? "" : String(v);
  }

  function pintarPlanilla() {
    if (!planilla || !planilla.filas || !planilla.columnas) return;
    var f = factores();
    var col = Number(el("col-precio").value);
    var con = 0, sin = 0, html = [];
    for (var i = planilla.fila0 + 1; i < planilla.filas.length; i++) {
      var fila = planilla.filas[i] || [];
      if (!fila.some(function (v) { return !vacio(v); })) continue;
      var v = leer(fila[col]);
      if (!(v > 0)) { sin++; continue; }
      con++;
      if (html.length >= 50) continue;
      var p = precios(v, f);
      html.push(
        "<tr>" +
          '<td class="art" title="' + escapar(nombreDeFila(fila)) + '">' + escapar(nombreDeFila(fila)) + "</td>" +
          '<td class="n">' + pesos(v) + "</td>" +
          '<td class="n">' + pesos(p.costo) + "</td>" +
          '<td class="n">' + pesos(p.mayorC) + "</td>" +
          '<td class="n">' + pesos(p.l1C) + "</td>" +
          '<td class="n fuerte">' + pesos(p.l2C) + "</td>" +
          '<td class="n rojo">' + pesos(p.conDesc) + "</td>" +
        "</tr>"
      );
    }
    el("filas").innerHTML = html.join("");
    el("resumen").textContent =
      con + (con === 1 ? " artículo calculado" : " artículos calculados") +
      (sin ? " · " + sin + (sin === 1 ? " fila" : " filas") + " sin precio en esa columna (quedan igual, sin calcular)" : "");
    el("mas").textContent = con > 50 ? "Se ven los primeros 50. El Excel que bajás tiene los " + con + "." : "";
    el("bajar").disabled = con === 0;
  }

  function bajar() {
    if (!planilla) return;
    var f = factores();
    var col = Number(el("col-precio").value);
    var n = planilla.columnas;
    var dTxt = numero.format(pct("desc"));
    var titulos = [
      "Costo s/IVA", "Costo c/IVA", "Por mayor s/IVA", "Por mayor c/IVA",
      "Lista 1 s/IVA", "Lista 1 c/IVA", "Lista 2 s/IVA", "Lista 2 c/IVA",
      "Lista 2 c/IVA con " + dTxt + " % desc."
    ];
    var salida = planilla.filas.map(function (fila, i) {
      var base = [];
      for (var c = 0; c < n; c++) base.push(fila && fila[c] != null ? fila[c] : null);
      if (i === planilla.fila0) return base.concat(titulos);
      if (i < planilla.fila0) return base;
      var v = leer(base[col]);
      if (!(v > 0)) return base;
      var p = precios(v, f);
      // A centavos: sin esto quedaba 55575,00000000001 al copiar la celda.
      return base.concat([p.costo, p.costoC, p.mayorS, p.mayorC, p.l1S, p.l1C, p.l2S, p.l2C, p.conDesc].map(function (x) {
        return Math.round(x * 100) / 100;
      }));
    });
    var ws = XLSX.utils.aoa_to_sheet(salida);
    for (var r = planilla.fila0 + 1; r < salida.length; r++) {
      for (var c = n; c < n + titulos.length; c++) {
        var celda = ws[XLSX.utils.encode_cell({ r: r, c: c })];
        if (celda && typeof celda.v === "number") celda.z = '"$" #,##0.00';
      }
    }
    var anchos = [];
    for (var k = 0; k < n; k++) anchos.push({ wch: k === Number(el("col-nombre").value) ? 45 : 14 });
    titulos.forEach(function () { anchos.push({ wch: 18 }); });
    ws["!cols"] = anchos;

    var como = XLSX.utils.aoa_to_sheet([
      ["Cómo se calculó"],
      [],
      ["Archivo", planilla.archivo],
      ["Hoja", planilla.hoja],
      ["Columna del precio de lista", nombreDeColumna(col)],
      ["Descuentos del proveedor", f.ds.length ? f.ds.map(function (d) { return numero.format(d) + " %"; }).join(" + ") + " (uno después del otro)" : "ninguno"],
      ["IVA", numero.format(pct("iva")) + " %"],
      ["Venta por mayor", "+ " + numero.format(pct("mayor")) + " % sobre el costo"],
      ["Lista 1", "+ " + numero.format(pct("l1")) + " % sobre el costo"],
      ["Lista 2", "+ " + numero.format(pct("l2")) + " % sobre la Lista 1"],
      ["Descuento", dTxt + " % sobre la Lista 2 con IVA"]
    ]);
    como["!cols"] = [{ wch: 28 }, { wch: 50 }];

    var libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, ws, "Precios");
    XLSX.utils.book_append_sheet(libro, como, "Cómo se calculó");
    XLSX.writeFile(libro, planilla.nombre + " - precios.xlsx");
  }

  el("archivo").addEventListener("change", function () {
    var archivo = this.files && this.files[0];
    this.value = "";
    if (!archivo) return;
    estado("Leyendo " + archivo.name + "…");
    cargarLector(function () {
      var lector = new FileReader();
      lector.onload = function (e) {
        try {
          var libro = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
          planilla = { archivo: archivo.name, nombre: archivo.name.replace(/\.[^.]+$/, ""), libro: libro };
          el("hoja").innerHTML = libro.SheetNames.map(function (h) {
            return "<option>" + escapar(h) + "</option>";
          }).join("");
          el("caja-hoja").style.display = libro.SheetNames.length > 1 ? "block" : "none";
          elegirHoja(libro.SheetNames[0]);
        } catch (err) {
          planilla = null;
          el("opciones").style.display = "none";
          estado("No pude leer ese archivo. ¿Es un Excel (.xlsx o .xls) o un .csv?", true);
        }
      };
      lector.onerror = function () { estado("No pude abrir ese archivo.", true); };
      lector.readAsArrayBuffer(archivo);
    });
  });
  el("hoja").addEventListener("change", function () { elegirHoja(this.value); });
  el("fila-titulos").addEventListener("change", function () {
    if (!planilla) return;
    var i = Math.round(Number(this.value)) - 1 - planilla.desdeFila;
    if (!(i >= 0 && i < planilla.filas.length)) {
      this.value = String(planilla.desdeFila + planilla.fila0 + 1);
      return;
    }
    planilla.fila0 = i;
    armarColumnas();
    pintarPlanilla();
  });
  el("col-precio").addEventListener("change", pintarPlanilla);
  el("col-nombre").addEventListener("change", pintarPlanilla);
  el("bajar").addEventListener("click", bajar);

  // ------------------------------------------------ un articulo

  el("lista").addEventListener("input", calcular);
  // Al salir del campo queda escrito lindo: 100000 -> 100.000
  el("lista").addEventListener("blur", function () {
    var v = leer(this.value);
    if (isFinite(v)) this.value = numero.format(v);
  });
  el("lista").addEventListener("focus", function () { this.select(); });
  DESCUENTOS.forEach(function (id) { el(id).addEventListener("input", calcular); });
  CAMPOS.forEach(function (c) { el("p-" + c).addEventListener("input", calcular); });
  el("volver").addEventListener("click", ponerLosDelExcel);

  ponerLosDelExcel();
})();
</script>
</body>
</html>
`;
