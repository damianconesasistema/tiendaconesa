// La pagina del simulador de costo, entera: HTML, estilo y la cuenta.
//
// Damian, 21/11/2026: "haceme esta pagina como si fuera una pagina para poner
// un costo y que te lo calcula automaticamente fuera del panel y sin usuario
// y sin contraseña ... asi ya se lo mando al jefe que lo quiere". Es el Excel
// "SIMULADOR DE COSTO" (Desktop/CONESA CAPITAL) pasado a una pagina:
//
//   costo con IVA        = costo sin IVA x 1,21
//   venta por mayor      = costo x 1,12            (sin IVA y con IVA)
//   lista 1              = costo x 1,25            (sin IVA y con IVA)
//   lista 2              = lista 1 x 1,25          (sin IVA y con IVA)
//   con descuento 12 %   = lista 2 con IVA x 0,88
//
// Los porcentajes se pueden cambiar en la pagina, como en las celdas del
// Excel, y al recargar vuelven a los del Excel. No guarda nada ni toca la
// base: todo se calcula en el telefono o la compu de quien la abre.
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
<meta property="og:description" content="Poné el costo sin IVA y te calcula por mayor, Lista 1, Lista 2 y el precio con descuento.">
<meta property="og:image" content="https://tienda.conesa.com.ar/brand/logo-square.png">
<link rel="icon" href="/icon.png">
<style>
  :root {
    --rojo: #e63020;
    --negro: #111111;
    --gris: #6b6b6b;
    --fondo: #f6f5f3;
    --borde: #e6e4e0;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body {
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
    color: var(--negro);
    background: var(--fondo);
    -webkit-text-size-adjust: 100%;
  }
  header {
    background: var(--negro);
    color: #fff;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
  }
  header img { height: 34px; width: auto; background: #fff; border-radius: 6px; padding: 4px 8px; }
  header h1 { font-size: 18px; margin: 0; font-weight: 800; letter-spacing: .2px; }
  main { max-width: 640px; margin: 0 auto; padding: 20px 16px 40px; }
  .caja {
    background: #fff;
    border: 1px solid var(--borde);
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 16px;
  }
  label.titulo { display: block; font-weight: 700; font-size: 15px; margin-bottom: 8px; }
  .costo { position: relative; }
  .costo span {
    position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
    font-size: 26px; font-weight: 700; color: var(--gris);
  }
  #costo {
    width: 100%;
    font-size: 28px;
    font-weight: 800;
    padding: 14px 16px 14px 44px;
    border: 2px solid var(--borde);
    border-radius: 12px;
    outline: none;
    font-family: inherit;
    color: var(--negro);
  }
  #costo:focus { border-color: var(--rojo); }
  .ayuda { color: var(--gris); font-size: 13px; margin: 8px 0 0; }
  table { width: 100%; border-collapse: collapse; }
  th {
    text-align: right; font-size: 12px; text-transform: uppercase; letter-spacing: .5px;
    color: var(--gris); font-weight: 700; padding: 0 0 8px;
  }
  th:first-child { text-align: left; }
  td { padding: 12px 0; border-top: 1px solid var(--borde); font-size: 16px; }
  td.n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; padding-left: 10px; }
  td .que { font-weight: 700; display: block; }
  td .como { color: var(--gris); font-size: 12px; display: block; margin-top: 2px; }
  tr.lista2 td { background: #fff7ed; }
  tr.lista2 td:first-child { padding-left: 10px; border-radius: 10px 0 0 10px; }
  tr.lista2 td:last-child { padding-right: 10px; border-radius: 0 10px 10px 0; }
  tr.lista2 td.n:last-child { font-weight: 800; }
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
  .descuento .que { font-weight: 800; font-size: 15px; }
  .descuento .como { font-size: 12px; opacity: .85; margin-top: 2px; }
  .descuento .n { font-size: 26px; font-weight: 900; white-space: nowrap; font-variant-numeric: tabular-nums; }
  details summary { cursor: pointer; font-weight: 700; font-size: 15px; }
  .porcentajes { display: grid; grid-template-columns: 1fr auto; gap: 10px 12px; align-items: center; margin-top: 14px; }
  .porcentajes label { font-size: 14px; }
  .pct { display: flex; align-items: center; gap: 6px; }
  .pct input {
    width: 76px; font-size: 16px; padding: 8px 10px; text-align: right;
    border: 1px solid var(--borde); border-radius: 8px; font-family: inherit;
  }
  .pct input:focus { outline: 2px solid var(--rojo); border-color: transparent; }
  button {
    margin-top: 14px; background: #fff; border: 1px solid var(--borde); border-radius: 10px;
    padding: 9px 14px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
  }
  button:hover { border-color: var(--negro); }
  #cambiados { color: var(--rojo); font-size: 13px; font-weight: 600; margin: 10px 0 0; display: none; }
  footer { text-align: center; color: var(--gris); font-size: 12px; padding: 0 16px 30px; }
  @media (max-width: 420px) {
    td { font-size: 15px; }
    .descuento .n { font-size: 22px; }
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
    <label class="titulo" for="costo">Costo sin IVA</label>
    <div class="costo">
      <span>$</span>
      <input id="costo" type="text" inputmode="decimal" autocomplete="off" value="100.000" aria-describedby="ayuda">
    </div>
    <p class="ayuda" id="ayuda">Escribí el costo y los precios se calculan solos.</p>
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
      <button type="button" id="volver">Volver a los del Excel</button>
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

  function el(id) { return document.getElementById(id); }

  // Lee lo que escribe la gente: "100.000", "100000", "1.500,50",
  // "1500,50", "1500.50" o "$ 100.000".
  function leer(texto) {
    var t = String(texto || "").replace(/[$\s]/g, "");
    if (!t) return NaN;
    var tienePunto = t.indexOf(".") >= 0, tieneComa = t.indexOf(",") >= 0;
    if (tienePunto && tieneComa) {
      t = t.replace(/\./g, "").replace(",", ".");
    } else if (tieneComa) {
      t = t.replace(/\./g, "").replace(",", ".");
    } else if (tienePunto && /^\d{1,3}(\.\d{3})+$/.test(t)) {
      t = t.replace(/\./g, "");
    }
    if (!/^-?\d*\.?\d*$/.test(t)) return NaN;
    return parseFloat(t);
  }

  var plata = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var numero = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });
  function pesos(n) { return isFinite(n) ? "$ " + plata.format(n) : "—"; }

  function pct(campo) {
    var v = leer(el("p-" + campo).value);
    return isFinite(v) ? v : EXCEL[campo];
  }

  function calcular() {
    var costo = leer(el("costo").value);
    var iva = 1 + pct("iva") / 100;
    var mayor = 1 + pct("mayor") / 100;
    var l1 = 1 + pct("l1") / 100;
    var l2 = 1 + pct("l2") / 100;
    var desc = 1 - pct("desc") / 100;

    // Igual que las celdas del Excel.
    var costoC = costo * iva;          // F2 = D2*C2
    var mayorS = costo * mayor;        // D4 = D2*C4
    var mayorC = costoC * mayor;       // F4 = F2*C4
    var l1S = costo * l1;              // D6 = C6*D2
    var l1C = costoC * l1;             // F6 = F2*C6
    var l2S = l1S * l2;                // D8 = D6*C8
    var l2C = l1C * l2;                // F8 = F6*C8
    var conDesc = l2C * desc;          // F12 = F8*0,88

    el("costo-s").textContent = pesos(costo);
    el("costo-c").textContent = pesos(costoC);
    el("mayor-s").textContent = pesos(mayorS);
    el("mayor-c").textContent = pesos(mayorC);
    el("l1-s").textContent = pesos(l1S);
    el("l1-c").textContent = pesos(l1C);
    el("l2-s").textContent = pesos(l2S);
    el("l2-c").textContent = pesos(l2C);
    el("desc").textContent = pesos(conDesc);

    el("c-iva").textContent = "IVA " + numero.format(pct("iva")) + " %";
    el("c-mayor").textContent = "costo + " + numero.format(pct("mayor")) + " %";
    el("c-l1").textContent = "costo + " + numero.format(pct("l1")) + " %";
    el("c-l2").textContent = "Lista 1 + " + numero.format(pct("l2")) + " %";
    el("t-desc").textContent = "Con descuento " + numero.format(pct("desc")) + " %";

    var distintos = CAMPOS.some(function (c) { return pct(c) !== EXCEL[c]; });
    el("cambiados").style.display = distintos ? "block" : "none";
  }

  function ponerLosDelExcel() {
    CAMPOS.forEach(function (c) { el("p-" + c).value = numero.format(EXCEL[c]); });
    calcular();
  }

  el("costo").addEventListener("input", calcular);
  // Al salir del campo queda escrito lindo: 100000 -> 100.000
  el("costo").addEventListener("blur", function () {
    var v = leer(this.value);
    if (isFinite(v)) this.value = numero.format(v);
  });
  el("costo").addEventListener("focus", function () { this.select(); });
  CAMPOS.forEach(function (c) { el("p-" + c).addEventListener("input", calcular); });
  el("volver").addEventListener("click", ponerLosDelExcel);

  ponerLosDelExcel();
})();
</script>
</body>
</html>
`;
