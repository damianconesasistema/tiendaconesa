// GENERADO AUTOMATICAMENTE - no editar a mano.
// Sale de la demo 'Punto'. Para cambiarla, se regenera este archivo.
//
// Lo sirve src/app/sistema/demo/route.ts, que antes pide la clave DEMO_PASSWORD.
export const PUNTO_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Punto de Mostrador</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* Un sistema de mostrador: barra fija arriba, solapas, y cada modulo a dos
   columnas que se apilan en el telefono. Paleta de ferreteria: papel, acero
   y un verde petroleo de acento. */
:root{
  --bg:#f1efeb; --surface:#ffffff; --surface-2:#f7f5f2; --surface-3:#ebe8e2;
  --line:#d9d4cc; --line-2:#c3bcb1;
  --ink:#14181b; --ink-2:#5a646e; --ink-3:#8b939b;
  --accent:#0b6457; --accent-ink:#ffffff; --accent-soft:#dfece9;
  --ok:#1b7044; --ok-soft:#e0f0e6;
  --warn:#9c5e08; --warn-soft:#f8ecd8;
  --bad:#a93328; --bad-soft:#f8e3e0;
  --font-d:"Barlow Condensed","Arial Narrow",Haettenschweiler,sans-serif;
  --font-b:"IBM Plex Sans",-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-m:"IBM Plex Mono",ui-monospace,"Courier New",monospace;
  --r:10px;
  color-scheme:light;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --bg:#101318; --surface:#181c23; --surface-2:#1f242d; --surface-3:#262c37;
    --line:#2d343f; --line-2:#3c4451;
    --ink:#e9ecf0; --ink-2:#9aa4b1; --ink-3:#6f7987;
    --accent:#35bda6; --accent-ink:#06211d; --accent-soft:#14312c;
    --ok:#4ec283; --ok-soft:#14301f;
    --warn:#e0a53f; --warn-soft:#32260f;
    --bad:#ef6d5e; --bad-soft:#361a17;
    color-scheme:dark;
  }
}
:root[data-theme="dark"]{
  --bg:#101318; --surface:#181c23; --surface-2:#1f242d; --surface-3:#262c37;
  --line:#2d343f; --line-2:#3c4451;
  --ink:#e9ecf0; --ink-2:#9aa4b1; --ink-3:#6f7987;
  --accent:#35bda6; --accent-ink:#06211d; --accent-soft:#14312c;
  --ok:#4ec283; --ok-soft:#14301f;
  --warn:#e0a53f; --warn-soft:#32260f;
  --bad:#ef6d5e; --bad-soft:#361a17;
  color-scheme:dark;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--ink);
  font-family:var(--font-b); font-size:15px; line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4{font-family:var(--font-d); margin:0; line-height:1.08; text-wrap:balance; letter-spacing:.01em}
.num{font-family:var(--font-m); font-variant-numeric:tabular-nums}
button{font-family:inherit; font-size:inherit; cursor:pointer}
input,select{font-family:inherit; font-size:inherit; color:var(--ink)}
:focus-visible{outline:2px solid var(--accent); outline-offset:2px; border-radius:4px}

/* ------------------------------------------------------------- barra */
header{
  position:sticky; top:0; z-index:40;
  background:var(--surface); border-bottom:1px solid var(--line);
}
.bar{
  max-width:1240px; margin:0 auto; padding:10px 16px;
  display:flex; align-items:center; gap:14px; flex-wrap:wrap;
}
.logo{display:flex; align-items:baseline; gap:8px; margin-right:auto}
.logo b{
  font-family:var(--font-d); font-size:27px; font-weight:700;
  letter-spacing:.055em; text-transform:uppercase;
}
.logo span{font-size:12.5px; color:var(--ink-2); max-width:30ch}
.chip-demo{
  font-family:var(--font-d); font-size:12.5px; font-weight:600; letter-spacing:.14em;
  text-transform:uppercase; padding:3px 9px; border-radius:999px;
  background:var(--warn-soft); color:var(--warn); border:1px solid currentColor;
}
.puesto{display:flex; align-items:center; gap:7px; font-size:13px; color:var(--ink-2)}
.puesto select{
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:8px;
  padding:6px 9px; font-weight:600;
}
nav{
  max-width:1240px; margin:0 auto; padding:0 16px 0;
  display:flex; gap:3px; overflow-x:auto; scrollbar-width:thin;
}
nav button{
  flex:0 0 auto; background:none; border:0; border-bottom:2.5px solid transparent;
  padding:9px 13px 10px; color:var(--ink-2); font-weight:600; font-size:13.5px;
  white-space:nowrap;
}
nav button[aria-current="true"]{color:var(--ink); border-bottom-color:var(--accent)}
nav button:hover{color:var(--ink)}

main{max-width:1240px; margin:0 auto; padding:20px 16px 72px}
section[hidden]{display:none}
.head{margin-bottom:16px}
.head h2{font-size:30px; font-weight:700; text-transform:uppercase; letter-spacing:.02em}
.head p{margin:5px 0 0; color:var(--ink-2); font-size:14px; max-width:68ch}

.aviso{
  display:flex; gap:9px; align-items:flex-start;
  background:var(--surface-2); border:1px solid var(--line);
  border-left:3px solid var(--accent);
  border-radius:var(--r); padding:10px 13px; font-size:13px; color:var(--ink-2);
  margin-bottom:16px;
}
.aviso b{color:var(--ink)}

.card{background:var(--surface); border:1px solid var(--line); border-radius:var(--r)}
.card-h{
  padding:11px 14px; border-bottom:1px solid var(--line);
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
}
.card-h h3{font-size:18px; font-weight:600; text-transform:uppercase; letter-spacing:.03em}
.card-h .sub{font-size:12.5px; color:var(--ink-3); margin-left:auto}

.dos{display:grid; grid-template-columns:1fr 390px; gap:16px; align-items:start}
@media (max-width:900px){.dos{grid-template-columns:1fr}}

/* ------------------------------------------------------ mostrador */
.buscar{position:relative}
.buscar input{
  width:100%; padding:15px 15px 15px 44px; font-size:17px; font-weight:500;
  background:var(--surface); border:1.5px solid var(--line-2); border-radius:var(--r);
}
.buscar input:focus{border-color:var(--accent); outline:none}
.buscar svg{position:absolute; left:15px; top:17px; color:var(--ink-3)}
.pistas{display:flex; gap:6px; flex-wrap:wrap; margin-top:9px}
.pistas button{
  background:var(--surface-3); border:1px solid var(--line); border-radius:999px;
  padding:4px 11px; font-size:12.5px; color:var(--ink-2);
}
.pistas button:hover{border-color:var(--accent); color:var(--ink)}

.res{margin-top:14px; display:flex; flex-direction:column; gap:7px}
.item{
  display:grid; grid-template-columns:62px 1fr auto; gap:12px; align-items:center;
  background:var(--surface); border:1px solid var(--line); border-radius:var(--r);
  padding:10px 12px; text-align:left; width:100%;
}
.item:hover{border-color:var(--accent); background:var(--accent-soft)}
.item .cod{
  font-family:var(--font-m); font-size:12.5px; color:var(--ink-2);
  background:var(--surface-3); border-radius:6px; padding:4px 0; text-align:center;
}
.item .tit{font-weight:500; font-size:14px; line-height:1.3}
.item .meta{font-size:11.5px; color:var(--ink-3); margin-top:3px; display:flex; gap:8px; flex-wrap:wrap}
.item .pre{text-align:right}
.item .pre b{font-family:var(--font-m); font-size:15px; font-variant-numeric:tabular-nums}
.item .pre small{display:block; font-size:11px; color:var(--ink-3)}
.sinstock{color:var(--bad); font-weight:600}
.vacio{padding:26px 14px; text-align:center; color:var(--ink-3); font-size:14px}

.ticket{position:sticky; top:106px}
.tk-lineas{padding:6px 0; max-height:42vh; overflow-y:auto}
.tk-l{display:grid; grid-template-columns:1fr auto; gap:8px; padding:9px 14px; border-bottom:1px solid var(--line)}
.tk-l:last-child{border-bottom:0}
.tk-l .n{font-size:13.5px; font-weight:500; line-height:1.25}
.tk-l .c{font-size:11.5px; color:var(--ink-3); margin-top:3px; display:flex; align-items:center; gap:6px}
.tk-l .c button{
  background:var(--surface-3); border:1px solid var(--line); width:22px; height:22px;
  border-radius:5px; color:var(--ink-2); line-height:1; font-weight:600;
}
.tk-l .c button:hover{border-color:var(--accent); color:var(--ink)}
.tk-l .m{font-family:var(--font-m); font-size:13.5px; text-align:right; font-variant-numeric:tabular-nums}
.tk-l .quitar{background:none; border:0; color:var(--ink-3); font-size:11.5px; padding:0; margin-top:4px; display:block}
.tk-l .quitar:hover{color:var(--bad)}
.tk-pago{padding:12px 14px; border-top:1px solid var(--line); border-bottom:1px solid var(--line)}
.tk-pago label{display:block; font-size:11.5px; text-transform:uppercase; letter-spacing:.09em; color:var(--ink-3); margin-bottom:6px; font-weight:600}
.formas{display:flex; flex-direction:column; gap:4px}
.formas button{
  display:flex; justify-content:space-between; gap:8px; align-items:center;
  background:var(--surface-2); border:1px solid var(--line); border-radius:8px;
  padding:7px 10px; font-size:13px; color:var(--ink-2); text-align:left;
}
.formas button[aria-pressed="true"]{
  background:var(--accent-soft); border-color:var(--accent); color:var(--ink); font-weight:600;
}
.formas button span{font-family:var(--font-m); font-size:11.5px}
.tk-tot{padding:12px 14px; display:flex; flex-direction:column; gap:5px}
.tr{display:flex; justify-content:space-between; font-size:13px; color:var(--ink-2)}
.tr b{font-family:var(--font-m); color:var(--ink); font-variant-numeric:tabular-nums}
.tr.big{font-size:15px; color:var(--ink); align-items:baseline; margin-top:3px; padding-top:8px; border-top:1px solid var(--line)}
.tr.big b{font-size:24px; font-family:var(--font-d); font-weight:700}
.tk-acc{padding:0 14px 14px; display:flex; flex-direction:column; gap:7px}
.b1,.b2,.b3{border-radius:8px; padding:11px; font-weight:600; border:1px solid transparent; text-align:center}
.b1{background:var(--accent); color:var(--accent-ink); border-color:var(--accent)}
.b1:hover{filter:brightness(1.1)}
.b2{background:var(--surface-2); color:var(--ink); border-color:var(--line-2)}
.b2:hover{border-color:var(--accent)}
.b3{background:none; color:var(--ink-2); border-color:var(--line); font-weight:500; font-size:13px; padding:8px}
.b3:hover{color:var(--ink); border-color:var(--line-2)}
.b1:disabled,.b2:disabled{opacity:.42; cursor:not-allowed; filter:none}
.nota{font-size:11.5px; color:var(--ink-3); padding:0 14px 13px; line-height:1.45}

/* --------------------------------------------------------- tablas */
.tabla-wrap{overflow-x:auto}
table{width:100%; border-collapse:collapse; font-size:13.5px}
th{
  text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:.09em;
  color:var(--ink-3); font-weight:600; padding:9px 11px;
  border-bottom:1px solid var(--line); white-space:nowrap;
  position:sticky; top:0; background:var(--surface);
}
td{padding:9px 11px; border-bottom:1px solid var(--line); vertical-align:middle}
tr:last-child td{border-bottom:0}
tbody tr:hover{background:var(--surface-2)}
td.r,th.r{text-align:right; font-family:var(--font-m); font-variant-numeric:tabular-nums; white-space:nowrap}
td.nom{min-width:230px; line-height:1.3}
td.nom small{display:block; color:var(--ink-3); font-size:11.5px; margin-top:2px}
.pill{
  display:inline-block; font-size:11px; font-weight:600; padding:2.5px 8px; border-radius:999px;
  white-space:nowrap;
}
.p-ok{background:var(--ok-soft); color:var(--ok)}
.p-warn{background:var(--warn-soft); color:var(--warn)}
.p-bad{background:var(--bad-soft); color:var(--bad)}
.p-n{background:var(--surface-3); color:var(--ink-2)}
.ed{
  width:92px; padding:5px 7px; text-align:right; font-family:var(--font-m);
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:6px;
}
.ed:focus{border-color:var(--accent); outline:none}

.filtros{display:flex; gap:7px; flex-wrap:wrap; align-items:center}
.filtros select,.filtros input[type="number"]{
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:8px; padding:6px 9px;
}
.filtros input[type="number"]{width:78px; font-family:var(--font-m); text-align:right}
.filtros label{font-size:12.5px; color:var(--ink-2); display:flex; align-items:center; gap:6px}

/* ---------------------------------------------------------- tiles */
.tiles{display:grid; grid-template-columns:repeat(auto-fit,minmax(176px,1fr)); gap:12px; margin-bottom:16px}
.tile{background:var(--surface); border:1px solid var(--line); border-radius:var(--r); padding:13px 15px}
.tile .k{font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--ink-3); font-weight:600}
.tile .v{font-family:var(--font-d); font-size:33px; font-weight:700; line-height:1.05; margin-top:5px; font-variant-numeric:tabular-nums}
.tile .d{font-size:12px; color:var(--ink-2); margin-top:3px}
.tile.alerta{border-left:3px solid var(--bad)}
.tile.alerta .v{color:var(--bad)}
.tile.bien{border-left:3px solid var(--ok)}

.barras{display:flex; flex-direction:column; gap:10px; padding:14px}
.barra{display:grid; grid-template-columns:96px 1fr 104px; gap:11px; align-items:center; font-size:13px}
.barra .et{color:var(--ink-2); font-weight:500}
.barra .pista{height:10px; background:var(--surface-3); border-radius:999px; overflow:hidden}
.barra .fill{height:100%; background:var(--accent); border-radius:999px}
.barra .fill.f2{background:var(--ink-3)}
.barra .vl{text-align:right; font-family:var(--font-m); font-size:12.5px; font-variant-numeric:tabular-nums}

.hallazgos{display:flex; flex-direction:column; gap:0}
.hz{display:flex; gap:11px; padding:12px 14px; border-bottom:1px solid var(--line); align-items:flex-start}
.hz:last-child{border-bottom:0}
.hz .ic{
  flex:0 0 24px; height:24px; border-radius:6px; display:grid; place-items:center;
  font-family:var(--font-d); font-weight:700; font-size:15px; margin-top:1px;
}
.hz.r .ic{background:var(--bad-soft); color:var(--bad)}
.hz.a .ic{background:var(--warn-soft); color:var(--warn)}
.hz.v .ic{background:var(--ok-soft); color:var(--ok)}
.hz p{margin:0; font-size:13.5px; line-height:1.45}
.hz p b{font-weight:600}
.hz p em{font-style:normal; color:var(--ink-2); display:block; margin-top:2px; font-size:12.5px}

/* --------------------------------------------------------- web */
.pedidos{display:flex; flex-direction:column}
.ped{padding:13px 14px; border-bottom:1px solid var(--line)}
.ped:last-child{border-bottom:0}
.ped-h{display:flex; align-items:center; gap:9px; flex-wrap:wrap}
.ped-h .q{font-family:var(--font-m); font-size:12.5px; color:var(--ink-2)}
.ped-h .cl{font-weight:600; font-size:14px}
.ped-h .tot{margin-left:auto; font-family:var(--font-m); font-weight:600; font-variant-numeric:tabular-nums}
.ped ul{margin:8px 0 0; padding-left:17px; font-size:13px; color:var(--ink-2)}
.ped ul li{margin:2px 0}
.ped .acc{margin-top:9px; display:flex; gap:7px; flex-wrap:wrap}
.ped .acc button{padding:6px 11px; font-size:12.5px; border-radius:7px}

/* ------------------------------------------------------- listas */
.sim{padding:14px; display:flex; flex-direction:column; gap:12px}
.sim-fila{display:flex; gap:9px; flex-wrap:wrap; align-items:flex-end}
.campo{display:flex; flex-direction:column; gap:5px}
.campo label{font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--ink-3); font-weight:600}
.campo select,.campo input{
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:8px; padding:8px 10px;
}
.campo input{width:88px; font-family:var(--font-m); text-align:right}
.modo{display:flex; gap:0; border:1px solid var(--line-2); border-radius:8px; overflow:hidden}
.modo button{background:var(--surface-2); border:0; padding:8px 12px; font-size:13px; color:var(--ink-2)}
.modo button[aria-pressed="true"]{background:var(--accent); color:var(--accent-ink); font-weight:600}
.resumen-sim{
  display:flex; gap:16px; flex-wrap:wrap; padding:12px 14px;
  background:var(--surface-2); border-top:1px solid var(--line); border-bottom:1px solid var(--line);
}
.resumen-sim div{font-size:13px}
.resumen-sim b{display:block; font-family:var(--font-d); font-size:26px; font-weight:700; line-height:1.1}
.acc-sim{padding:14px; display:flex; gap:9px; flex-wrap:wrap; border-top:1px solid var(--line)}
.acc-sim button{padding:10px 15px; border-radius:8px}

/* la bandeja de listas que llegaron */
.bandeja{display:grid; grid-template-columns:repeat(auto-fit,minmax(248px,1fr)); gap:11px; padding:14px}
.sobre{
  text-align:left; background:var(--surface-2); border:1px solid var(--line);
  border-radius:var(--r); padding:12px 13px; display:flex; flex-direction:column; gap:7px;
}
.sobre:hover{border-color:var(--accent); background:var(--accent-soft)}
.sobre[aria-pressed="true"]{border-color:var(--accent); background:var(--accent-soft)}
.sobre .via{display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--ink-3); font-weight:600; text-transform:uppercase; letter-spacing:.07em}
.sobre .de{font-family:var(--font-d); font-size:21px; font-weight:700; line-height:1.05}
.sobre .ar{font-family:var(--font-m); font-size:11.5px; color:var(--ink-2); word-break:break-all}
.sobre .cuando{font-size:12px; color:var(--ink-3)}
.lect{padding:14px; display:flex; flex-direction:column; gap:11px}
.lect-fila{display:flex; gap:12px; flex-wrap:wrap}
.lect-dato{background:var(--surface-2); border:1px solid var(--line); border-radius:8px; padding:9px 13px; flex:1 1 128px}
.lect-dato .k{font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-3); font-weight:600}
.lect-dato .v{font-family:var(--font-d); font-size:25px; font-weight:700; line-height:1.1}
.lect-raw{
  font-family:var(--font-m); font-size:11.5px; line-height:1.65; color:var(--ink-2);
  background:var(--surface-2); border:1px solid var(--line); border-left:3px solid var(--line-2);
  border-radius:8px; padding:11px 13px; overflow-x:auto; white-space:pre;
}
.lect-raw b{color:var(--accent)}

/* el semáforo de margen del mostrador */
.sem{width:9px; height:9px; border-radius:50%; display:inline-block; flex:0 0 9px}
.sem-ok{background:var(--ok)} .sem-med{background:var(--warn)} .sem-mal{background:var(--bad)}
.item .tit{display:flex; align-items:center; gap:7px}

/* el asistente */
.chat{padding:14px; display:flex; flex-direction:column; gap:11px; max-height:56vh; overflow-y:auto}
.bur{max-width:88%; padding:10px 13px; border-radius:13px; font-size:13.5px; line-height:1.5}
.bur.yo{align-self:flex-end; background:var(--accent); color:var(--accent-ink); border-bottom-right-radius:4px}
.bur.el{align-self:flex-start; background:var(--surface-2); border:1px solid var(--line); border-bottom-left-radius:4px}
.bur.el b{font-weight:600}
.bur.el ul{margin:7px 0 0; padding-left:18px}
.bur.el li{margin:3px 0}
.bur.el .cifra{font-family:var(--font-m); font-variant-numeric:tabular-nums}
.chat-pie{padding:0 14px 12px; border-top:1px solid var(--line); padding-top:12px}

#toast{
  position:fixed; left:50%; bottom:22px; transform:translate(-50%,130%);
  background:var(--ink); color:var(--bg); padding:11px 18px; border-radius:999px;
  font-size:13.5px; font-weight:500; z-index:90; max-width:calc(100vw - 32px);
  text-align:center; transition:transform .22s ease;
  box-shadow:0 8px 24px rgba(0,0,0,.22);
}
#toast.on{transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){#toast{transition:none}}

footer{
  max-width:1240px; margin:0 auto; padding:0 16px 40px;
  color:var(--ink-3); font-size:12px; line-height:1.6;
}
</style>
</head>
<body>

<header>
  <div class="bar">
    <div class="logo">
      <b>Punto</b>
      <span>lee la lista de tu proveedor antes de que te rompa el margen</span>
    </div>
    <span class="chip-demo">Demo</span>
    <div class="puesto">
      <label for="selPuesto">Estás en</label>
      <select id="selPuesto">
        <option>Mostrador 1</option><option>Mostrador 2</option><option>Mostrador 3</option>
        <option>Mostrador 4</option><option>Mostrador 5</option>
      </select>
    </div>
  </div>
  <nav id="nav">
    <button data-v="mostrador" aria-current="true">Mostrador</button>
    <button data-v="web">Pedidos web</button>
    <button data-v="productos">Productos y costos</button>
    <button data-v="listas">Listas de proveedor</button>
    <button data-v="red">La Red</button>
    <button data-v="caja">Caja del día</button>
    <button data-v="gerencia">Gerencia</button>
    <button data-v="asistente">Asistente</button>
  </nav>
</header>

<main>

<!-- ======================================================== MOSTRADOR -->
<section id="v-mostrador">
  <div class="head">
    <h2>Mostrador</h2>
    <p>Buscá como lo nombra el cliente, en el orden que salga. Un clic lo suma a la venta.</p>
  </div>

  <div class="dos">
    <div>
      <div class="buscar">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/></svg>
        <input id="q" type="text" placeholder="termo 80 electrico · bacha gulliart · 11114 · campana 60" autocomplete="off" spellcheck="false">
      </div>
      <div class="pistas" id="pistas"></div>
      <div class="res" id="res"></div>
    </div>

    <div class="card ticket">
      <div class="card-h">
        <h3>Venta</h3>
        <span class="sub" id="tkPuesto">Mostrador 1</span>
      </div>
      <div class="tk-lineas" id="tkLineas"></div>
      <div class="tk-pago">
        <label>Cómo paga</label>
        <div class="formas" id="formas"></div>
      </div>
      <div class="tk-tot" id="tkTot"></div>
      <div class="tk-acc">
        <button class="b1" id="btnFactura">Vender con factura</button>
        <button class="b2" id="btnSinFactura">Vender sin factura</button>
        <button class="b2" id="btnPresu">Guardar como presupuesto</button>
        <button class="b3" id="btnVaciar">Vaciar</button>
      </div>
      <p class="nota">Una sola venta, un solo registro. <b>Facturada</b> es un dato de la venta, no un libro aparte: la gerencia ve el total real y, dentro, cuánto salió con factura.</p>
    </div>
  </div>
</section>

<!-- ============================================================== WEB -->
<section id="v-web" hidden>
  <div class="head">
    <h2>Pedidos web</h2>
    <p>Lo que entra por la página cae acá, al mismo stock que el mostrador.</p>
  </div>
  <div class="aviso"><span>⚠</span><div><b>El stock es uno solo.</b> Si el Mostrador 3 vende el último termotanque de 80, la web lo deja de ofrecer en el mismo momento. Hoy eso se arregla a mano y por teléfono.</div></div>
  <div class="dos">
    <div class="card">
      <div class="card-h"><h3>Entraron hoy</h3><span class="sub" id="webCount"></span></div>
      <div class="pedidos" id="pedidos"></div>
    </div>
    <div class="card">
      <div class="card-h"><h3>De dónde viene la venta</h3></div>
      <div class="barras" id="canales"></div>
      <p class="nota">La web no compite con el mostrador: le trae el cliente que ya averiguó el precio y viene a buscarlo.</p>
    </div>
  </div>
</section>

<!-- ======================================================= PRODUCTOS -->
<section id="v-productos" hidden>
  <div class="head">
    <h2>Productos y costos</h2>
    <p>Qué deja cada artículo con el precio que tiene puesto hoy.</p>
  </div>
  <div class="aviso"><span>i</span><div><b>Los nombres, los códigos y los precios son los reales del catálogo.</b> Los costos de esta demo están simulados, salvo donde diga lo contrario: en el sistema de verdad salen de la lista del proveedor.</div></div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h">
      <h3>Filtros</h3>
      <div class="filtros" style="margin-left:auto">
        <label>Proveedor <select id="fProv"></select></label>
        <label>Rubro <select id="fRub"></select></label>
        <label>Margen objetivo <input id="fObj" type="number" value="35" min="0" max="90" step="1">%</label>
        <label><input type="checkbox" id="fFlojos"> Solo los que no llegan</label>
      </div>
    </div>
    <div class="tabla-wrap">
      <table>
        <thead><tr>
          <th>Código</th><th>Artículo</th><th>Proveedor</th>
          <th class="r">Costo</th><th class="r">Contado</th><th class="r">1 pago</th>
          <th class="r">Margen</th><th>Estado</th><th class="r">Stock</th>
        </tr></thead>
        <tbody id="tbProd"></tbody>
      </table>
    </div>
    <p class="nota" id="prodPie"></p>
  </div>
</section>

<!-- ========================================================= LISTAS -->
<section id="v-listas" hidden>
  <div class="head">
    <h2>Listas de proveedor</h2>
    <p>La lista llega como llega: por WhatsApp, por mail, en PDF o en Excel. Acá entra sin que nadie la cargue a mano.</p>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Llegaron estas</h3><span class="sub">sin abrir</span></div>
    <div class="bandeja" id="bandeja"></div>
    <p class="nota">Ninguna se aplica sola. Se lee, se cruza con tu catálogo y se te muestra qué te rompe. Vos firmás.</p>
  </div>

  <div class="card" id="lectura" hidden style="margin-bottom:16px">
    <div class="card-h"><h3>Lo que leí</h3><span class="sub" id="lecturaDe"></span></div>
    <div class="lect" id="lecturaCuerpo"></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Qué pasa si…</h3><span class="sub">o probalo a mano</span></div>
    <div class="sim">
      <div class="sim-fila">
        <div class="campo">
          <label for="sProv">Proveedor</label>
          <select id="sProv"></select>
        </div>
        <div class="campo">
          <label>Qué cambió</label>
          <div class="modo" id="sModo">
            <button data-m="sube" aria-pressed="true">Sube la lista</button>
            <button data-m="desc" aria-pressed="false">Me bajan el descuento</button>
          </div>
        </div>
        <div class="campo" id="cSube">
          <label for="sPct">Sube un</label>
          <input id="sPct" type="number" value="18" min="0" max="200" step="0.5">
        </div>
        <div class="campo" id="cD1" hidden>
          <label for="sD1">Tenía</label>
          <input id="sD1" type="number" value="45" min="0" max="90" step="0.5">
        </div>
        <div class="campo" id="cD2" hidden>
          <label for="sD2">Pasa a</label>
          <input id="sD2" type="number" value="40" min="0" max="90" step="0.5">
        </div>
        <button class="b1" id="btnSim" style="padding:10px 18px">Ver qué pasa</button>
      </div>
    </div>
    <div class="resumen-sim" id="simResumen" hidden></div>
    <div class="tabla-wrap">
      <table>
        <thead><tr>
          <th>Código</th><th>Artículo</th>
          <th class="r">Costo hoy</th><th class="r">Costo nuevo</th>
          <th class="r">Precio hoy</th><th class="r">Margen que queda</th>
          <th class="r">Precio sugerido</th><th class="r">Sube al cliente</th>
        </tr></thead>
        <tbody id="tbSim"></tbody>
      </table>
    </div>
    <div class="acc-sim" id="simAcc" hidden>
      <button class="b2" id="btnAplicarCosto">Aceptar los costos y dejar los precios</button>
      <button class="b1" id="btnAplicarTodo">Aceptar los costos y subir al sugerido</button>
    </div>
    <p class="nota">El precio sugerido es el que vuelve a dejar el margen objetivo, redondeado a los $100 de arriba. Nada se aplica hasta que lo apretás.</p>
  </div>
</section>

<!-- ========================================================== LA RED -->
<section id="v-red" hidden>
  <div class="head">
    <h2>La Red</h2>
    <p>Cuando un comercio carga una lista, deja de ser trabajo para todos los demás. Y por primera vez se puede saber si el descuento que te dan es bueno o es un verso.</p>
  </div>

  <div class="aviso" style="border-left-color:var(--warn)"><span>⚠</span><div><b>Esto es la idea del producto, no algo que exista hoy.</b> Los números de la red de esta pantalla están inventados para mostrar cómo se vería. Lo que sí es real es el problema: hoy el proveedor sabe qué descuento le da a cada uno y vos no sabés nada.</div></div>

  <div class="tiles" id="redTiles"></div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h">
      <h3>Tu descuento contra el de la red</h3>
      <span class="sub">comercios del mismo tamaño que el tuyo</span>
    </div>
    <div class="tabla-wrap">
      <table>
        <thead><tr>
          <th>Proveedor</th><th class="r">Le comprás por año (estimado)</th>
          <th class="r">Tu descuento</th><th class="r">La red</th><th class="r">El mejor</th>
          <th class="r">Te deja de costar</th><th>Cómo estás</th>
        </tr></thead>
        <tbody id="tbRed"></tbody>
      </table>
    </div>
    <p class="nota"><b>Se comparten costos, nunca precios de venta.</b> Lo primero te hace fuerte contra el proveedor. Lo segundo sería ponerse de acuerdo entre competidores, que además de estar mal, es ilegal. Antes de salir a vender esto hay que sentarse con un abogado de defensa de la competencia: es la parte delicada de la idea y prefiero decírtelo ahora.</p>
  </div>

  <div class="dos">
    <div class="card">
      <div class="card-h"><h3>Listas al día</h3><span class="sub">quién las cargó</span></div>
      <div class="tabla-wrap">
        <table>
          <thead><tr><th>Proveedor</th><th>Última lista</th><th>La cargó</th><th>Estado</th></tr></thead>
          <tbody id="tbListas"></tbody>
        </table>
      </div>
      <p class="nota">Las que dice “otro comercio” no las tocó nadie de acá. Llegaron solas.</p>
    </div>
    <div class="card">
      <div class="card-h"><h3>Por qué esto cambia el juego</h3></div>
      <div class="hallazgos" id="redPorque"></div>
    </div>
  </div>
</section>

<!-- ====================================================== ASISTENTE -->
<section id="v-asistente" hidden>
  <div class="head">
    <h2>Asistente</h2>
    <p>Preguntale en castellano en vez de aprender a sacar un reporte.</p>
  </div>
  <div class="dos">
    <div class="card">
      <div class="card-h"><h3>Conversación</h3><span class="sub">sobre los datos de esta pantalla</span></div>
      <div class="chat" id="chat"></div>
      <div class="chat-pie">
        <div class="buscar" style="margin-bottom:9px">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>
          <input id="preg" type="text" placeholder="Preguntá lo que quieras" autocomplete="off" style="font-size:15px;padding:12px 12px 12px 42px">
        </div>
        <div class="pistas" id="sugeridas"></div>
      </div>
      <p class="nota">Las respuestas se calculan sobre los números que estás viendo en las otras solapas: si cambiás un costo, cambia la respuesta. No están escritas de antemano. En el sistema de verdad, esta parte la hago yo leyendo tus datos.</p>
    </div>
    <div class="card">
      <div class="card-h"><h3>Lo que sabe hacer</h3></div>
      <div class="hallazgos" id="sabeHacer"></div>
    </div>
  </div>
</section>

<!-- =========================================================== CAJA -->
<section id="v-caja" hidden>
  <div class="head">
    <h2>Caja del día</h2>
    <p>Lo que entró, por dónde entró y en qué mostrador.</p>
  </div>
  <div class="tiles" id="cajaTiles"></div>
  <div class="dos">
    <div class="card">
      <div class="card-h"><h3>Movimientos</h3><span class="sub" id="cajaCount"></span></div>
      <div class="tabla-wrap" style="max-height:62vh; overflow-y:auto">
        <table>
          <thead><tr><th>Hora</th><th>Puesto</th><th>Artículos</th><th>Pago</th><th>Comprobante</th><th class="r">Total</th></tr></thead>
          <tbody id="tbCaja"></tbody>
        </table>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por forma de pago</h3></div>
        <div class="barras" id="porPago"></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Por mostrador</h3></div>
        <div class="barras" id="porPuesto"></div>
      </div>
    </div>
  </div>
</section>

<!-- ======================================================= GERENCIA -->
<section id="v-gerencia" hidden>
  <div class="head">
    <h2>Gerencia</h2>
    <p>Los cinco mostradores y la web, en una pantalla.</p>
  </div>
  <div class="tiles" id="gerTiles"></div>
  <div class="dos">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Lo que encontré en los números de hoy</h3><span class="sub">calculado, no opinado</span></div>
        <div class="hallazgos" id="hallazgos"></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>Artículos que no llegan al objetivo</h3><span class="sub" id="gerAlertCount"></span></div>
        <div class="tabla-wrap">
          <table>
            <thead><tr><th>Código</th><th>Artículo</th><th>Proveedor</th><th class="r">Costo</th><th class="r">Contado</th><th class="r">Margen</th><th class="r">Stock</th></tr></thead>
            <tbody id="tbAlert"></tbody>
          </table>
        </div>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Margen por mostrador</h3></div>
        <div class="barras" id="gerPuesto"></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Facturado y sin facturar</h3></div>
        <div class="barras" id="gerFact"></div>
        <p class="nota">Un solo registro con el dato adentro. Lo que se factura se factura; lo que no, igual aparece acá, porque si no, la gerencia no sabe cuánto vendió.</p>
      </div>
      <div class="card">
        <div class="card-h"><h3>Lo que más margen dejó</h3></div>
        <div class="barras" id="gerTop"></div>
      </div>
    </div>
  </div>
</section>

</main>

<footer>
  <p><b>Qué es esto.</b> Una demo navegable de un sistema de gestión para un corralón o casa de sanitarios con cinco mostradores, venta online y gerencia. Los artículos, los códigos, los rubros y los dos precios son los reales del catálogo de Sanitarios Conesa. Los costos, el stock y las ventas del día están simulados para poder mostrar las pantallas funcionando: ningún número de caja de esta página salió de una venta real.</p>
  <p><b>Qué es de verdad y qué es la idea.</b> Las solapas de Mostrador, Productos, Listas, Caja y Gerencia muestran cosas que se pueden construir con lo que ya existe. <b>La Red es la apuesta:</b> hoy no existe, y sus números están inventados. Lo que sí es real es el problema que resuelve — el proveedor sabe qué descuento le da a cada comercio y ningún comercio sabe nada del resto. Si se construye, hay que resolver antes la parte legal: se pueden compartir costos, nunca precios de venta.</p>
  <p>Nada de lo que se aprieta acá toca la tienda, el facturador ni el sistema que usan hoy. Se puede probar sin miedo.</p>
</footer>

<div id="toast" role="status" aria-live="polite"></div>

<script>
"use strict";

/* ===================================================== los artículos
   codigo, titulo, rubro, precio 1 pago, precio contado/transferencia.
   Los cinco datos son los reales del catálogo publicado. */
const CRUDO = [
["3674+3688","COMBO BOSCA ECO 360 · CALEFACTOR + KIT DE INSTALACION","SALAMANDRAS",1231680,1083878],
["3672+3688","COMBO BOSCA ECO 350 · CALEFACTOR + KIT DE INSTALACION","SALAMANDRAS",1107656,974737],
["3780+3779","COMBO FLOWATER BENNETTON NEGRO MATE · INODORO LARGO CON DEPÓSITO DUAL Y ASIENTO + BIDET 1 AGUJERO","SANITARIOS",955185,840563],
["3440+3443+3442","COMBO PRINGLES JADE MAX · INODORO + DEPÓSITO + BIDET 1 AGUJERO","SANITARIOS",913505,803884],
["3674","CALEFACTOR BOSCA ECO 360","SALAMANDRAS",864127,760432],
["3672","CALEFACTOR BOSCA ECO 350","SALAMANDRAS",740105,651292],
["3443+3442","COMBO PRINGLES JADE MAX · INODORO + DEPÓSITO","SANITARIOS",669991,589592],
["3599+9961+9284","COMBO PRINGLES DIONISO · INODORO + DEPÓSITO + BIDET 1 AGUJERO","SANITARIOS",653772,575319],
["10041+3599+9961","COMBO PRINGLES DIONISO · INODORO + DEPÓSITO + BIDET 3 AGUJEROS","SANITARIOS",653772,575319],
["3698","TROMEN DUOMO 80","SALAMANDRAS",616047,542121],
["10633","ANAFE A GAS TST SULATA · 4 HORNALLAS","COCINA Y VENTILACIÓN",548103,482331],
["3495+3493","COMBO PIAZZA AMALFI · INODORO + DEPÓSITO + ASIENTO + BIDET 1 AGUJERO","SANITARIOS",543687,478445],
["3494+3493","COMBO PIAZZA AMALFI · INODORO + DEPÓSITO + ASIENTO + BIDET 3 AGUJEROS","SANITARIOS",543687,478445],
["3483+3484","COMBO FLOWATER BENNETTON INODORO LARGO + BIDET MONOCOMANDO","SANITARIOS",536997,472557],
["10960","TANQUE DE AGUA TRICAPA ROT-AR 2500 LTS","TANQUES",529206,465701],
["3480+3641","COMBO FLOWATER NOWEN · INODORO LARGO COMPLETO + BIDET 1 AGUJERO","SANITARIOS",479657,422098],
["3480+3640","COMBO FLOWATER NOWEN · INODORO LARGO COMPLETO + BIDET 3 AGUJEROS","SANITARIOS",479657,422098],
["10697","CAMPANA DE COCINA TST PUELO 60 CM","COCINA Y VENTILACIÓN",434412,382283],
["00100+3485","COMBO FLOWATER PRUSIA · INODORO LARGO CON DEPÓSITO Y ASIENTO SUAVE + BIDET 1 AGUJERO","SANITARIOS",389078,342389],
["00100+3486","COMBO FLOWATER PRUSIA · INODORO LARGO CON DEPÓSITO Y ASIENTO SUAVE + BIDET 3 AGUJEROS","SANITARIOS",389078,342389],
["9771","ANAFE A GAS TST SULATA · 2 HORNALLAS","COCINA Y VENTILACIÓN",386645,340248],
["9898+22100+9577","COMBO PRINGLES JADE 3 PIEZAS INODORO, DEPOSITO Y BIDET 3 AGUJEROS","SANITARIOS",368577,324348],
["3688","KIT INSTALACION BOSCA BASE 6´X 4 MT","SALAMANDRAS",367552,323446],
["11104","CAMPANA DE COCINA TST CIRCULAR 60 CM · 3 VELOCIDADES","COCINA Y VENTILACIÓN",320345,281904],
["10781","CAMPANA DE COCINA TST LANÍN 60 CM · 3 VELOCIDADES","COCINA Y VENTILACIÓN",320345,281904],
["10634","CAMPANA DE COCINA TST TRAFUL 60 CM · 3 VELOCIDADES","COCINA Y VENTILACIÓN",320345,281904],
["3813+3814+3811","COMBO PIAZZA LOGOS NEGRO · LAVATORIO + BIDET + DUCHA EMBUTIR","GRIFERÍA",311318,273960],
["8030+11180+9297+3429","COMBO PRINGLES ONIX · INODORO + DEPÓSITO + BIDET 1 AGUJERO + ASIENTO","SANITARIOS",303961,267486],
["8030+11180+9297+7243","COMBO PRINGLES ONIX · INODORO + DEPÓSITO + BIDET 3 AGUJEROS + ASIENTO","SANITARIOS",303961,267486],
["3452+03593+01590","COMBO PIAZZA EMBLEM · BAÑERA + LAVATORIO + BIDET","GRIFERÍA",298583,262753],
["09138+09458+05504","COMBO PIAZZA LOGOS · BAÑERA + LAVATORIO + BIDET","GRIFERÍA",267645,235528],
["10769","EXTRACTOR DE AIRE TST P500 · 6 PULGADAS","COCINA Y VENTILACIÓN",246792,217177],
["10005","EXTRACTOR DE AIRE TST P500 · 8 PULGADAS","COCINA Y VENTILACIÓN",246792,217177],
["3720+4268","COMBO PIAZZA ICON · BAÑERA + BIDET","GRIFERÍA",240570,211702],
["10157+3477+00060","COMBO HYDROS LINK · LAVATORIO + BIDET + DUCHA EMBUTIR","GRIFERÍA",226440,199267],
["10949","CÁMARA SÉPTICA ROT-AR 1000 LTS","TANQUES",212010,186569],
["10955","TANQUE DE AGUA TRICAPA ROT-AR 1100 LTS","TANQUES",183916,161846],
["3810","SET BAÑO HYDROS NOVA CRUZ (LAV+BIDET+DUCHA EMBUTIR)","GRIFERÍA",178987,157509],
["3764","PULIDORA DOGO ARRANQUE PROGRESIVO · 180 MM · 1650 W","HERRAMIENTAS",167767,147635],
["10951","TANQUE DE AGUA BICAPA ROT-AR 1100 LTS","TANQUES",159875,140690],
["3809","PIAZZA SET BAÑO VIVA NOVA (LAV+BIDET+DUCHA EMBUTIR)","GRIFERÍA",152016,133774],
["10954","TANQUE DE AGUA TRICAPA ROT-AR 850 LTS","TANQUES",148981,131103],
["10886","EXTRACTOR DE AIRE TST S300 · 4 PULGADAS","COCINA Y VENTILACIÓN",148520,130698],
["8876","EXTRACTOR DE AIRE TST S300 · 6 PULGADAS","COCINA Y VENTILACIÓN",148520,130698],
["3776","COMBO VANITORY 60 DOBLE DECK CON BACHA+ESPEJO REDONDO","ACCESORIOS",146039,128514],
["10956","CÁMARA SÉPTICA ROT-AR 500 LTS","TANQUES",141986,124948],
["11114","GULLIART BACHA BELLA 1 AGUJERO","SANITARIOS",138276,121683],
["11115","GULLIART BACHA BELLA 3 AG.","SANITARIOS",138276,121683],
["00396","ROTOMARTILLO DOGO SDS PLUS · 26 MM · 850 W","HERRAMIENTAS",132591,116680],
["3741","COMBO VANITORY 50 DOBLE DECK CON BACHA+ESPEJO REDONDO","ACCESORIOS",131250,115500],
["3719","BACHA DE MESADA FLOWATER 1 AGUJERO · 51,5 X 40 X 17 CM","SANITARIOS",118014,103852],
["3153","BACHA DE MESADA FLOWATER 3 AGUJEROS · 51,5 X 40 X 17 CM","SANITARIOS",118014,103852],
["10953","TANQUE DE AGUA TRICAPA ROT-AR 550 LTS","TANQUES",111209,97864],
["00988","AMOLADORA ANGULAR DOGO · 115 MM · 900 W","HERRAMIENTAS",96228,84681],
["11045","GULLIART BACHA DUE 25X42 1 AGUJERO","SANITARIOS",92178,81117],
["3160","BACHA DE APOYO FLOWATER ISIDRA · 1 AGUJERO","SANITARIOS",86812,76395],
["00153","SIERRA CALADORA DOGO · 55 MM · 550 W","HERRAMIENTAS",84205,74100],
["11046","GULLIART BACHA MAX 30 X 31 1 AGUJEROS","SANITARIOS",81810,71993],
["11047","GULLIART BACHA MAX 30 X 31 3 AGUJEROS","SANITARIOS",81810,71993],
["10096","GULLIART BACHA DE APOYAR NAZCA 43X14X42","SANITARIOS",77906,68557],
["3489","ACCESORIOS DE BAÑO FLOWATER ATREUS · 6 PIEZAS","ACCESORIOS",77273,68000],
["10098","GULLIART BACHA DE APOYAR TERRA 43X14X42","SANITARIOS",74114,65220],
["3714","ACCESORIOS DE BAÑO FLOWATER KUBITZA · 6 PIEZAS","ACCESORIOS",71985,63347],
["10475","AMOLADORA ANGULAR DOGO · 115 MM · 720 W","HERRAMIENTAS",70618,62144],
["00029","TALADRO PERCUTOR DOGO · 13 MM · 700 W","HERRAMIENTAS",70618,62144],
["10090","GULLIART BACHA DE APOYAR PALMAR 43X14X42","SANITARIOS",66794,58779],
["11119","GULLIART BACHA COLISEO","SANITARIOS",66275,58322],
["3399","BACHA DE APOYO LYG CHICHEN · 47 X 33,5 X 14 CM","SANITARIOS",61091,53760],
["3716","ACCESORIOS DE BAÑO FLOWATER SOFY · 7 PIEZAS","ACCESORIOS",60402,53154],
["9449","EXTRACTOR DE AIRE TST CP6 · 6 PULGADAS","COCINA Y VENTILACIÓN",58420,51410],
["10089","GULLIART BACHA DE APOYAR CALA 43X14X42","SANITARIOS",57825,50886],
["11118","GULLIART BACHA CUENCO","SANITARIOS",53848,47386],
["01113","PISTOLA DE CALOR DOGO CON ACCESORIOS · 2000 W","HERRAMIENTAS",50727,44640],
["3718","ACCESORIOS DE BAÑO FLOWATER SOFY · 6 PIEZAS","ACCESORIOS",50689,44606],
["11117","GULLIART BACHA INCA","SANITARIOS",47503,41803],
["00677","ASIENTO DE INODORO LYG BARI · NYLON BLANCO","SANITARIOS",46803,41187],
["11116","GULLIART BACHA RONDA","SANITARIOS",46462,40887],
["11079","FILTROS DE CARBÓN TST · CONJUNTO DE CARTUCHOS","COCINA Y VENTILACIÓN",22737,20009],
["11105","PERSIANA PLÁSTICA MÓVIL TST · BLANCA","COCINA Y VENTILACIÓN",9105,8012],
["8419","CÁMARA SÉPTICA ROT-AR 300 LTS","TANQUES",145241,127812],
["3586","TERMOTANQUE HEINEKEN 120 LTS A GAS NATURAL O ENVASADO","TERMOTANQUES Y CALEFONES",557432,490540],
["2624","TERMOTANQUE HEINEKEN 120 LTS ELÉCTRICO","TERMOTANQUES Y CALEFONES",501689,441486],
["8821","TERMOTANQUE HEINEKEN 120 LTS ELÉCTRICO ALTA RECUPERACIÓN","TERMOTANQUES Y CALEFONES",608839,535778],
["3783","TERMOTANQUE HEINEKEN 150 LTS A GAS NATURAL O ENVASADO","TERMOTANQUES Y CALEFONES",701951,617717],
["2353","TERMOTANQUE HEINEKEN 165 LTS ELÉCTRICO","TERMOTANQUES Y CALEFONES",622672,547951],
["8354","TERMOTANQUE HEINEKEN 165 LTS ELÉCTRICO ALTA RECUPERACIÓN","TERMOTANQUES Y CALEFONES",766140,674203],
["00662","TERMOTANQUE HEINEKEN 30 LTS ELÉCTRICO","TERMOTANQUES Y CALEFONES",365034,321230],
["01088","TERMOTANQUE HEINEKEN 40 LTS A GAS NATURAL O ENVASADO ALTA RECUPERACIÓN · CONEXIÓN INFERIOR PARA COLGAR","TERMOTANQUES Y CALEFONES",580240,510611],
["3438","TERMOTANQUE HEINEKEN 50 LTS A GAS NATURAL O ENVASADO","TERMOTANQUES Y CALEFONES",454205,399700],
["1957","TERMOTANQUE HEINEKEN 50 LTS ELÉCTRICO","TERMOTANQUES Y CALEFONES",406719,357913],
["8976","TERMOTANQUE HEINEKEN 50 LTS ELÉCTRICO ALTA RECUPERACIÓN","TERMOTANQUES Y CALEFONES",491778,432765],
["1992","TERMOTANQUE HEINEKEN 50 LTS ELÉCTRICO · CONEXIÓN INFERIOR","TERMOTANQUES Y CALEFONES",425300,374264],
["3521","TERMOTANQUE HEINEKEN 80 LTS A GAS NATURAL O ENVASADO","TERMOTANQUES Y CALEFONES",474849,417867],
["2120","TERMOTANQUE HEINEKEN 80 LTS ELÉCTRICO","TERMOTANQUES Y CALEFONES",441405,388436],
["8850","TERMOTANQUE HEINEKEN 80 LTS ELÉCTRICO ALTA RECUPERACIÓN","TERMOTANQUES Y CALEFONES",532245,468376],
["01087","TERMOTANQUE HEINEKEN 80 LTS ELÉCTRICO · CONEXIÓN INFERIOR PARA COLGAR","TERMOTANQUES Y CALEFONES",462462,406967]
];

/* Las marcas que aparecen en los títulos hacen de proveedor. */
const MARCAS = ["BOSCA","TROMEN","TST","FLOWATER","PRINGLES","PIAZZA","HYDROS","GULLIART","ROT-AR","DOGO","LYG","HEINEKEN"];

/* Palabras con las que se pide cada rubro en el mostrador, aunque no estén
   escritas en el título. */
const ALIAS = {
  "TERMOTANQUES Y CALEFONES":"termo termotanque calefon agua caliente electrico gas",
  "SALAMANDRAS":"salamandra estufa calefactor lena hogar calefaccion",
  "COCINA Y VENTILACIÓN":"campana extractor anafe cocina ventilacion hornalla aire",
  "TANQUES":"tanque cisterna camara septica agua pozo",
  "SANITARIOS":"inodoro bidet lavatorio bacha pileta deposito sanitario loza asiento",
  "GRIFERÍA":"griferia canilla monocomando ducha mezclador grifo juego",
  "HERRAMIENTAS":"herramienta taladro amoladora maquina electrica",
  "ACCESORIOS":"accesorio toallero jabonera espejo vanitory mueble bano juego"
};

const plano = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");

/* Azar repetible, para que los costos y las ventas simuladas sean siempre
   los mismos y la demo no cambie entre una visita y otra. */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
let _sem=987654321;
function az(){_sem=(Math.imul(_sem,1103515245)+12345)&0x7fffffff;return _sem/0x7fffffff;}

const RECARGO_1PAGO = 1.1363636363636365;   // lo que agrega la tarjeta en 1 pago
const MULT = {
  "Transferencia o efectivo":1,
  "Débito o 1 pago":RECARGO_1PAGO,
  "3 cuotas":1.2273,
  "6 cuotas":1.3636
};

const PRODUCTOS = CRUDO.map(([cod,tit,rub,unPago,contado],i)=>{
  const prov = MARCAS.find(m=>tit.includes(m)) || "VARIOS";
  const r = hash(cod+tit);
  // El margen de arranque. La línea de termotanques va fina a propósito: es
  // el caso que le interesa a la gerencia, porque el precio de venta ES la
  // lista del proveedor y el proveedor decide el margen.
  let m;
  if (prov==="HEINEKEN") m = 0.13 + r*0.10;
  else if (prov==="GULLIART") m = 0.17 + r*0.14;
  else m = 0.23 + r*0.27;
  const costo = Math.round(contado/(1+m));
  return {
    cod, tit, rub, prov,
    unPago, contado,
    costo, costoBase:costo,
    stock: 1 + Math.floor(hash(tit+cod)*16),
    blob: plano(cod+" "+tit+" "+rub+" "+prov+" "+(ALIAS[rub]||""))
  };
});

/* El 5135 de verdad, el que apareció en el Excel que mandó el proveedor:
   costo real $109.044 y la lista 2 a $114.657. Se vende por debajo del costo
   y nadie lo sabía. Va marcado, porque es el único número real de costo. */
PRODUCTOS.push({
  cod:"5135",
  tit:"FERRUM MUEBLE COLGAR 1 PUERTA LAVATORIO 1 AGUJERO TRAFUL · 50 X 35 X 45 CM",
  rub:"ACCESORIOS", prov:"FERRUM",
  unPago:114657, contado:100898,
  costo:109044, costoBase:109044, stock:20, real:true,
  blob:plano("5135 mueble colgar puerta lavatorio traful ferrum jt103-bd pta lavat vanitory accesorios bano espejo mueble")
});

const margen = p => (p.contado - p.costo) / p.costo * 100;
const fmt = n => "$" + Math.round(n).toLocaleString("es-AR");
const fmt0 = n => Math.round(n).toLocaleString("es-AR");
const pct = n => (n>=0?"":"−") + Math.abs(n).toFixed(1).replace(".",",") + "%";

/* ====================================================== estado */
const S = {
  puesto:"Mostrador 1",
  forma:"Transferencia o efectivo",
  linea:[],            // la venta que se está armando
  ventas:[],           // lo del día
  presupuestos:0,
  objetivo:35,
  sim:null
};

/* ------------------------------------------- las ventas del día */
(function sembrar(){
  const pesos = ["Transferencia o efectivo","Transferencia o efectivo","Débito o 1 pago","Débito o 1 pago","3 cuotas","6 cuotas"];
  const horas = [];
  for(let i=0;i<46;i++) horas.push(8.5 + az()*10.2);
  horas.sort((a,b)=>a-b);
  for(let i=0;i<46;i++){
    const n = 1 + Math.floor(az()*2.4);
    const lin = [];
    for(let j=0;j<n;j++){
      const p = PRODUCTOS[Math.floor(az()*PRODUCTOS.length)];
      if (lin.some(l=>l.cod===p.cod)) continue;
      lin.push({cod:p.cod, cant: 1 + (az()>0.78?1:0)});
    }
    if(!lin.length) continue;
    const h = horas[i];
    S.ventas.push({
      hora: String(Math.floor(h)).padStart(2,"0")+":"+String(Math.floor((h%1)*60)).padStart(2,"0"),
      puesto: "Mostrador " + (1 + Math.floor(az()*5)),
      forma: pesos[Math.floor(az()*pesos.length)],
      facturada: az() < 0.63,
      web: az() < 0.12,
      linea: lin
    });
  }
})();

const prod = c => PRODUCTOS.find(p=>p.cod===c);
/* Lo que la venta deja: el recargo de tarjeta no es ganancia, lo paga la
   tarjeta. Así que el margen se mide siempre contra el precio de contado. */
function ventaBase(v){ return v.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0); }
function ventaCobrado(v){ return ventaBase(v) * MULT[v.forma]; }
function ventaMargen(v){ return v.linea.reduce((a,l)=>{const p=prod(l.cod); return a+(p.contado-p.costo)*l.cant;},0); }

/* ================================================== navegación */
const vistas = ["mostrador","web","productos","listas","red","caja","gerencia","asistente"];
document.getElementById("nav").addEventListener("click",e=>{
  const b = e.target.closest("button[data-v]"); if(!b) return;
  for(const v of vistas) document.getElementById("v-"+v).hidden = (v !== b.dataset.v);
  for(const x of document.querySelectorAll("#nav button")) x.setAttribute("aria-current", String(x===b));
  window.scrollTo({top:0,behavior:"instant"});
  if(b.dataset.v==="productos") pintarProd();
  if(b.dataset.v==="caja") pintarCaja();
  if(b.dataset.v==="gerencia") pintarGerencia();
  if(b.dataset.v==="web") pintarWeb();
  if(b.dataset.v==="red") pintarRed();
  if(b.dataset.v==="asistente") pintarAsistente();
});

let tt;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(tt); tt = setTimeout(()=>t.classList.remove("on"), 3400);
}

document.getElementById("selPuesto").addEventListener("change",e=>{
  S.puesto = e.target.value;
  document.getElementById("tkPuesto").textContent = S.puesto;
});

/* =================================================== MOSTRADOR */
const EJEMPLOS = ["termo 80 electrico","bacha gulliart","campana 60","11114","tanque 1100","dogo","combo inodoro bidet","5135"];
document.getElementById("pistas").innerHTML =
  EJEMPLOS.map(e=>'<button data-q="'+e+'">'+e+'</button>').join("");
document.getElementById("pistas").addEventListener("click",e=>{
  const b = e.target.closest("button"); if(!b) return;
  const q = document.getElementById("q"); q.value = b.dataset.q; buscar(); q.focus();
});

function buscar(){
  const q = plano(document.getElementById("q").value.trim());
  const caja = document.getElementById("res");
  if(!q){
    caja.innerHTML = '<div class="vacio">Escribí lo que te están pidiendo. Entra en cualquier orden: <b>“electrico termo 80”</b> encuentra lo mismo que <b>“termo 80 electrico”</b>.</div>';
    return;
  }
  const toks = q.split(/\\s+/).filter(Boolean);
  const hits = PRODUCTOS
    .filter(p=>toks.every(t=>p.blob.includes(t)))
    .map(p=>{
      let s = 0;
      if(plano(p.cod)===q) s += 1000;
      if(plano(p.tit).startsWith(toks[0])) s += 50;
      for(const t of toks) if(new RegExp("(^|[ ·(])"+t.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\$&")).test(p.blob)) s += 10;
      return {p, s};
    })
    .sort((a,b)=>b.s-a.s || a.p.contado-b.p.contado)
    .slice(0,14);

  if(!hits.length){
    caja.innerHTML = '<div class="vacio">Nada con <b>“'+document.getElementById("q").value+'”</b>. Probá con menos palabras.</div>';
    return;
  }
  caja.innerHTML = hits.map(({p})=>{
    const st = p.stock>0 ? p.stock+" en stock" : '<span class="sinstock">sin stock</span>';
    // El semáforo: el del mostrador ve si deja plata, sin ver el costo.
    const m = margen(p);
    const sem = '<span class="sem '+(m>=S.objetivo?"sem-ok":(m>=10?"sem-med":"sem-mal"))+
      '" title="'+(m>=S.objetivo?"deja bien":(m>=10?"deja poco":"no deja: avisá al encargado"))+'"></span>';
    return '<button class="item" data-cod="'+p.cod+'">'+
      '<span class="cod">'+p.cod.split("+")[0]+'</span>'+
      '<span><span class="tit">'+sem+'<span>'+p.tit+'</span></span>'+
        '<span class="meta"><span>'+p.rub+'</span><span>'+p.prov+'</span><span>'+st+'</span></span></span>'+
      '<span class="pre"><b>'+fmt(p.contado)+'</b><small>'+fmt(p.unPago)+' en 1 pago</small></span>'+
    '</button>';
  }).join("");
}
document.getElementById("q").addEventListener("input", buscar);
document.getElementById("res").addEventListener("click",e=>{
  const b = e.target.closest(".item"); if(!b) return;
  sumar(b.dataset.cod);
});

function sumar(cod){
  const l = S.linea.find(x=>x.cod===cod);
  if(l) l.cant++; else S.linea.push({cod, cant:1});
  pintarTicket();
}

document.getElementById("formas").innerHTML = Object.keys(MULT).map(f=>{
  const m = MULT[f];
  const et = m===1 ? "sin recargo" : "+"+((m-1)*100).toFixed(1).replace(".",",")+"%";
  return '<button data-f="'+f+'" aria-pressed="'+(f===S.forma)+'">'+f+'<span>'+et+'</span></button>';
}).join("");
document.getElementById("formas").addEventListener("click",e=>{
  const b = e.target.closest("button[data-f]"); if(!b) return;
  S.forma = b.dataset.f;
  for(const x of document.querySelectorAll("#formas button")) x.setAttribute("aria-pressed", String(x===b));
  pintarTicket();
});

function pintarTicket(){
  const cont = document.getElementById("tkLineas");
  if(!S.linea.length){
    cont.innerHTML = '<div class="vacio" style="padding:30px 14px">Buscá un artículo y tocalo.<br>La venta se arma acá.</div>';
  } else {
    cont.innerHTML = S.linea.map(l=>{
      const p = prod(l.cod);
      const u = p.contado * MULT[S.forma];
      return '<div class="tk-l"><div>'+
        '<div class="n">'+p.tit+'</div>'+
        '<div class="c"><button data-m="-" data-cod="'+l.cod+'">−</button><span>'+l.cant+'</span>'+
        '<button data-m="+" data-cod="'+l.cod+'">+</button><span>× '+fmt(u)+'</span></div>'+
        '<button class="quitar" data-m="x" data-cod="'+l.cod+'">quitar</button>'+
      '</div><div class="m">'+fmt(u*l.cant)+'</div></div>';
    }).join("");
  }

  const base = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
  const total = base * MULT[S.forma];
  const marg = S.linea.reduce((a,l)=>{const p=prod(l.cod); return a+(p.contado-p.costo)*l.cant;},0);
  const mp = base>0 ? marg/(base-marg)*100 : 0;
  const cls = mp>=S.objetivo ? "p-ok" : (mp>=10 ? "p-warn" : "p-bad");

  document.getElementById("tkTot").innerHTML =
    (S.linea.length ? '<div class="tr"><span>'+S.linea.reduce((a,l)=>a+l.cant,0)+' artículos, de contado</span><b>'+fmt(base)+'</b></div>'+
      (MULT[S.forma]!==1 ? '<div class="tr"><span>Recargo '+S.forma.toLowerCase()+'</span><b>'+fmt(total-base)+'</b></div>' : '')+
      '<div class="tr"><span>Deja de margen <span class="pill '+cls+'">'+pct(mp)+'</span></span><b>'+fmt(marg)+'</b></div>'
      : '')+
    '<div class="tr big"><span>Total</span><b>'+fmt(total)+'</b></div>';

  const vacio = S.linea.length===0;
  document.getElementById("btnFactura").disabled = vacio;
  document.getElementById("btnSinFactura").disabled = vacio;
  document.getElementById("btnPresu").disabled = vacio;
}

document.getElementById("tkLineas").addEventListener("click",e=>{
  const b = e.target.closest("button[data-m]"); if(!b) return;
  const l = S.linea.find(x=>x.cod===b.dataset.cod); if(!l) return;
  if(b.dataset.m==="+") l.cant++;
  if(b.dataset.m==="-") l.cant = Math.max(1, l.cant-1);
  if(b.dataset.m==="x") S.linea = S.linea.filter(x=>x.cod!==b.dataset.cod);
  pintarTicket();
});

function cerrar(facturada){
  const total = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0) * MULT[S.forma];
  const h = new Date();
  S.ventas.push({
    hora: String(h.getHours()).padStart(2,"0")+":"+String(h.getMinutes()).padStart(2,"0"),
    puesto: S.puesto, forma: S.forma, facturada, web:false,
    linea: S.linea.map(l=>({...l}))
  });
  for(const l of S.linea){ const p = prod(l.cod); p.stock = Math.max(0, p.stock - l.cant); }
  S.linea = []; pintarTicket(); buscar();
  toast((facturada?"Venta facturada":"Venta registrada sin factura")+" por "+fmt(total)+" en "+S.puesto+". Ya está en caja y en gerencia.");
}
document.getElementById("btnFactura").addEventListener("click",()=>cerrar(true));
document.getElementById("btnSinFactura").addEventListener("click",()=>cerrar(false));
document.getElementById("btnPresu").addEventListener("click",()=>{
  const total = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0) * MULT[S.forma];
  S.presupuestos++; S.linea = []; pintarTicket();
  toast("Presupuesto guardado por "+fmt(total)+". No mueve stock ni caja: queda esperando al cliente.");
});
document.getElementById("btnVaciar").addEventListener("click",()=>{ S.linea=[]; pintarTicket(); });

/* ========================================================= WEB */
const PEDIDOS = [
  {q:"WEB-4471", cl:"Mariela Ferreyra", loc:"Villa Dolores", est:"nuevo",
   lin:[["2120",1],["3719",1]]},
  {q:"WEB-4470", cl:"Corralón San Javier", loc:"Mina Clavero", est:"preparando",
   lin:[["10955",2],["10953",1]]},
  {q:"WEB-4469", cl:"Rubén Ceballos", loc:"Nono", est:"preparando",
   lin:[["3674",1]]},
  {q:"WEB-4468", cl:"Ana Lucía Pérez", loc:"Las Rabonas", est:"despachado",
   lin:[["11114",1],["3716",1],["00677",2]]}
];
function pintarWeb(){
  document.getElementById("webCount").textContent = PEDIDOS.length + " pedidos";
  document.getElementById("pedidos").innerHTML = PEDIDOS.map((p,i)=>{
    const tot = p.lin.reduce((a,[c,n])=>a+prod(c).contado*n,0);
    const cls = p.est==="nuevo"?"p-warn":(p.est==="preparando"?"p-n":"p-ok");
    return '<div class="ped"><div class="ped-h">'+
      '<span class="q">'+p.q+'</span><span class="cl">'+p.cl+'</span>'+
      '<span class="pill '+cls+'">'+p.est+'</span>'+
      '<span class="tot">'+fmt(tot)+'</span></div>'+
      '<div style="font-size:12.5px;color:var(--ink-3);margin-top:3px">'+p.loc+'</div>'+
      '<ul>'+p.lin.map(([c,n])=>'<li>'+n+' × '+prod(c).tit+'</li>').join("")+'</ul>'+
      '<div class="acc"><button class="b2" data-p="'+i+'">Pasarlo al mostrador</button></div></div>';
  }).join("");
}
document.getElementById("pedidos").addEventListener("click",e=>{
  const b = e.target.closest("button[data-p]"); if(!b) return;
  const p = PEDIDOS[+b.dataset.p];
  for(const [c,n] of p.lin){ const l = S.linea.find(x=>x.cod===c); if(l) l.cant+=n; else S.linea.push({cod:c,cant:n}); }
  pintarTicket();
  document.querySelector('#nav button[data-v="mostrador"]').click();
  toast("El pedido "+p.q+" está cargado en la venta del "+S.puesto+".");
});

/* =================================================== PRODUCTOS */
function llenarSelects(){
  const provs = [...new Set(PRODUCTOS.map(p=>p.prov))].sort();
  const rubs = [...new Set(PRODUCTOS.map(p=>p.rub))].sort();
  document.getElementById("fProv").innerHTML = '<option value="">Todos</option>'+provs.map(p=>'<option>'+p+'</option>').join("");
  document.getElementById("fRub").innerHTML = '<option value="">Todos</option>'+rubs.map(r=>'<option>'+r+'</option>').join("");
  const porProv = provs.map(p=>[p, PRODUCTOS.filter(x=>x.prov===p).length]).sort((a,b)=>b[1]-a[1]);
  document.getElementById("sProv").innerHTML = porProv.map(([p,n])=>'<option'+(p==="HEINEKEN"?" selected":"")+'>'+p+'</option>').join("");
}
llenarSelects();

function estadoPill(m){
  if(m < 0) return '<span class="pill p-bad">pierde plata</span>';
  if(m < 10) return '<span class="pill p-bad">muy flojo</span>';
  if(m < S.objetivo) return '<span class="pill p-warn">abajo del objetivo</span>';
  return '<span class="pill p-ok">bien</span>';
}

function pintarProd(){
  S.objetivo = +document.getElementById("fObj").value || 35;
  const fp = document.getElementById("fProv").value;
  const fr = document.getElementById("fRub").value;
  const solo = document.getElementById("fFlojos").checked;
  const lista = PRODUCTOS
    .filter(p=>(!fp||p.prov===fp) && (!fr||p.rub===fr) && (!solo || margen(p) < S.objetivo))
    .sort((a,b)=>margen(a)-margen(b));

  document.getElementById("tbProd").innerHTML = lista.map(p=>{
    const m = margen(p);
    return '<tr><td class="num" style="font-size:12.5px">'+p.cod.split("+")[0]+'</td>'+
      '<td class="nom">'+p.tit+(p.real?' <span class="pill p-n">costo real</span>':'')+'<small>'+p.rub+'</small></td>'+
      '<td>'+p.prov+'</td>'+
      '<td class="r"><input class="ed" type="number" data-cod="'+p.cod+'" value="'+p.costo+'" step="100" min="0" aria-label="costo"></td>'+
      '<td class="r">'+fmt(p.contado)+'</td><td class="r" style="color:var(--ink-3)">'+fmt(p.unPago)+'</td>'+
      '<td class="r" style="font-weight:600;color:'+(m<0?"var(--bad)":(m<S.objetivo?"var(--warn)":"var(--ok)"))+'">'+pct(m)+'</td>'+
      '<td>'+estadoPill(m)+'</td><td class="r">'+p.stock+'</td></tr>';
  }).join("") || '<tr><td colspan="9" class="vacio">Nada con esos filtros.</td></tr>';

  const bajo = PRODUCTOS.filter(p=>margen(p)<0);
  const flojos = PRODUCTOS.filter(p=>{const m=margen(p); return m>=0 && m<S.objetivo;});
  document.getElementById("prodPie").innerHTML =
    "Se ven <b>"+lista.length+"</b> de "+PRODUCTOS.length+" artículos. En todo el catálogo: <b>"+bajo.length+
    "</b> se venden por debajo del costo y <b>"+flojos.length+"</b> no llegan al "+S.objetivo+
    "%. El costo se puede corregir acá mismo y el margen se recalcula solo.";
}
for(const id of ["fProv","fRub","fObj","fFlojos"]) document.getElementById(id).addEventListener("input",pintarProd);
document.getElementById("tbProd").addEventListener("change",e=>{
  const i = e.target.closest("input[data-cod]"); if(!i) return;
  const p = prod(i.dataset.cod); if(!p) return;
  p.costo = Math.max(0, +i.value||0);
  pintarProd();
  toast("Costo de "+p.cod.split("+")[0]+" cambiado a "+fmt(p.costo)+". El margen ya está recalculado.");
});

/* ===================================================== LISTAS */
document.getElementById("sModo").addEventListener("click",e=>{
  const b = e.target.closest("button[data-m]"); if(!b) return;
  for(const x of document.querySelectorAll("#sModo button")) x.setAttribute("aria-pressed", String(x===b));
  const sube = b.dataset.m==="sube";
  document.getElementById("cSube").hidden = !sube;
  document.getElementById("cD1").hidden = sube;
  document.getElementById("cD2").hidden = sube;
});

function redondear(n){ return Math.ceil(n/100)*100; }

document.getElementById("btnSim").addEventListener("click",()=>{
  const provSel = document.getElementById("sProv").value;
  const modo = document.querySelector('#sModo button[aria-pressed="true"]').dataset.m;
  let factor;
  if(modo==="sube"){
    factor = 1 + (+document.getElementById("sPct").value||0)/100;
  } else {
    const d1 = (+document.getElementById("sD1").value||0)/100;
    const d2 = (+document.getElementById("sD2").value||0)/100;
    if(d1>=1||d2>=1){ toast("El descuento tiene que ser menor que 100%."); return; }
    factor = (1-d2)/(1-d1);
  }
  const obj = S.objetivo = +document.getElementById("fObj").value || 35;
  const filas = PRODUCTOS.filter(p=>p.prov===provSel).map(p=>{
    const nuevo = Math.round(p.costo*factor);
    const mQueda = (p.contado - nuevo)/nuevo*100;
    const sugerido = redondear(nuevo*(1+obj/100));
    return {p, nuevo, mQueda, sugerido, sube:(sugerido-p.contado)/p.contado*100};
  }).sort((a,b)=>a.mQueda-b.mQueda);

  S.sim = {provSel, factor, filas};

  const bajoCosto = filas.filter(f=>f.mQueda<0).length;
  const flojos = filas.filter(f=>f.mQueda>=0 && f.mQueda<obj).length;
  const enStock = filas.filter(f=>f.mQueda<0).reduce((a,f)=>a+(f.p.contado-f.nuevo)*f.p.stock,0);

  document.getElementById("simResumen").hidden = false;
  document.getElementById("simResumen").innerHTML =
    '<div><b>'+filas.length+'</b>artículos de '+provSel+'</div>'+
    '<div style="color:var(--bad)"><b>'+bajoCosto+'</b>quedarían abajo del costo</div>'+
    '<div style="color:var(--warn)"><b>'+flojos+'</b>no llegarían al '+obj+'%</div>'+
    '<div><b>'+fmt(Math.abs(enStock))+'</b>'+(enStock<0?"se pierden":"quedan")+' con el stock que hay</div>';

  document.getElementById("tbSim").innerHTML = filas.map(f=>
    '<tr><td class="num" style="font-size:12.5px">'+f.p.cod.split("+")[0]+'</td>'+
    '<td class="nom">'+f.p.tit+'</td>'+
    '<td class="r" style="color:var(--ink-3)">'+fmt(f.p.costo)+'</td>'+
    '<td class="r" style="font-weight:600">'+fmt(f.nuevo)+'</td>'+
    '<td class="r">'+fmt(f.p.contado)+'</td>'+
    '<td class="r" style="font-weight:600;color:'+(f.mQueda<0?"var(--bad)":(f.mQueda<obj?"var(--warn)":"var(--ok)"))+'">'+pct(f.mQueda)+'</td>'+
    '<td class="r" style="color:var(--accent);font-weight:600">'+fmt(f.sugerido)+'</td>'+
    '<td class="r">'+pct(f.sube)+'</td></tr>').join("")
    || '<tr><td colspan="8" class="vacio">Ese proveedor no tiene artículos cargados.</td></tr>';

  document.getElementById("simAcc").hidden = filas.length===0;
  toast(filas.length+" artículos de "+provSel+" revisados. Todavía no se aplicó nada.");
});

document.getElementById("btnAplicarCosto").addEventListener("click",()=>{
  if(!S.sim) return;
  for(const f of S.sim.filas) f.p.costo = f.nuevo;
  toast("Costos nuevos de "+S.sim.provSel+" aplicados. Los precios quedaron como estaban: mirá Gerencia.");
  document.getElementById("btnSim").click();
  pintarProd();
});
document.getElementById("btnAplicarTodo").addEventListener("click",()=>{
  if(!S.sim) return;
  for(const f of S.sim.filas){
    f.p.costo = f.nuevo;
    f.p.contado = f.sugerido;
    f.p.unPago = redondear(f.sugerido*RECARGO_1PAGO);
  }
  toast("Costos y precios de "+S.sim.provSel+" actualizados. El mostrador y la web ya venden con los nuevos.");
  document.getElementById("btnSim").click();
  pintarProd();
});

/* ======================================================= CAJA */
function barra(et, v, max, f2){
  return '<div class="barra"><span class="et">'+et+'</span>'+
    '<span class="pista"><span class="fill'+(f2?" f2":"")+'" style="width:'+(max>0?Math.max(2,v/max*100):0).toFixed(1)+'%"></span></span>'+
    '<span class="vl">'+fmt(v)+'</span></div>';
}
function pintarCaja(){
  const vs = S.ventas;
  const cobrado = vs.reduce((a,v)=>a+ventaCobrado(v),0);
  const base = vs.reduce((a,v)=>a+ventaBase(v),0);
  const marg = vs.reduce((a,v)=>a+ventaMargen(v),0);

  document.getElementById("cajaTiles").innerHTML =
    tile("Entró hoy", fmt(cobrado), vs.length+" ventas") +
    tile("Valor de contado", fmt(base), "sin el recargo de tarjeta") +
    tile("Ticket promedio", fmt(cobrado/vs.length), "por venta") +
    tile("Presupuestos abiertos", fmt0(S.presupuestos), "sin cobrar todavía") +
    tile("Margen bruto", fmt(marg), pct(marg/(base-marg)*100)+" sobre el costo");

  document.getElementById("cajaCount").textContent = vs.length + " ventas";
  document.getElementById("tbCaja").innerHTML = vs.slice().reverse().map(v=>{
    const n = v.linea.reduce((a,l)=>a+l.cant,0);
    const q = v.linea.map(l=>prod(l.cod).tit).join(" + ");
    return '<tr><td class="num" style="font-size:12.5px">'+v.hora+'</td>'+
      '<td>'+(v.web?'<span class="pill p-n">web</span> ':'')+v.puesto.replace("Mostrador ","M")+'</td>'+
      '<td class="nom" style="min-width:260px">'+n+' art. <small>'+q.slice(0,72)+(q.length>72?"…":"")+'</small></td>'+
      '<td style="font-size:12.5px;color:var(--ink-2)">'+v.forma+'</td>'+
      '<td>'+(v.facturada?'<span class="pill p-ok">factura</span>':'<span class="pill p-n">sin factura</span>')+'</td>'+
      '<td class="r">'+fmt(ventaCobrado(v))+'</td></tr>';
  }).join("");

  const pagos = {};
  for(const v of vs) pagos[v.forma] = (pagos[v.forma]||0) + ventaCobrado(v);
  const mx1 = Math.max(...Object.values(pagos));
  document.getElementById("porPago").innerHTML = Object.entries(pagos)
    .sort((a,b)=>b[1]-a[1]).map(([k,v])=>barra(k.replace("Transferencia o efectivo","Transf./efectivo"), v, mx1)).join("");

  const pu = {};
  for(const v of vs) pu[v.puesto] = (pu[v.puesto]||0) + ventaCobrado(v);
  const mx2 = Math.max(...Object.values(pu));
  document.getElementById("porPuesto").innerHTML = Object.keys(pu).sort()
    .map(k=>barra(k, pu[k], mx2)).join("");
}
function tile(k,v,d,cls){
  return '<div class="tile'+(cls?" "+cls:"")+'"><div class="k">'+k+'</div><div class="v">'+v+'</div><div class="d">'+d+'</div></div>';
}

/* =================================================== GERENCIA */
function pintarGerencia(){
  S.objetivo = +document.getElementById("fObj").value || 35;
  const vs = S.ventas;
  const base = vs.reduce((a,v)=>a+ventaBase(v),0);
  const cobrado = vs.reduce((a,v)=>a+ventaCobrado(v),0);
  const marg = vs.reduce((a,v)=>a+ventaMargen(v),0);
  const fact = vs.filter(v=>v.facturada).reduce((a,v)=>a+ventaCobrado(v),0);
  const bajo = PRODUCTOS.filter(p=>margen(p)<0);
  const flojos = PRODUCTOS.filter(p=>{const m=margen(p); return m>=0 && m<S.objetivo;});
  const expuesto = bajo.reduce((a,p)=>a+(p.costo-p.contado)*p.stock,0);

  document.getElementById("gerTiles").innerHTML =
    tile("Vendido hoy", fmt(cobrado), vs.length+" ventas en 5 mostradores + web") +
    tile("Margen bruto", fmt(marg), pct(marg/(base-marg)*100)+" sobre el costo", "bien") +
    tile("Salió con factura", (fact/cobrado*100).toFixed(0)+"%", fmt(fact)+" de "+fmt(cobrado)) +
    tile("Se venden bajo costo", fmt0(bajo.length), "artículos del catálogo", bajo.length?"alerta":"") +
    tile("Plata en riesgo", fmt(expuesto), "si se vende todo ese stock", expuesto>0?"alerta":"");

  /* Los hallazgos son cuentas sobre los datos de arriba, no opiniones. */
  const hz = [];
  if(bajo.length){
    const peor = bajo.slice().sort((a,b)=>margen(a)-margen(b))[0];
    hz.push(["r","1","<b>"+bajo.length+" artículos se venden por debajo de lo que cuestan.</b> El peor es "+
      peor.cod.split("+")[0]+", "+peor.tit.slice(0,46)+"…: cuesta "+fmt(peor.costo)+" y se vende a "+fmt(peor.contado)+
      ", "+fmt(peor.costo-peor.contado)+" de pérdida por unidad, y hay "+peor.stock+" en depósito.",
      "Nadie lo ve porque el precio de venta se copia de la lista del proveedor."]);
  }
  const porProv = {};
  for(const p of PRODUCTOS){ (porProv[p.prov] = porProv[p.prov]||[]).push(margen(p)); }
  const peorProv = Object.entries(porProv).filter(([,a])=>a.length>=4)
    .map(([k,a])=>[k, a.reduce((x,y)=>x+y,0)/a.length, a.length]).sort((a,b)=>a[1]-b[1])[0];
  if(peorProv) hz.push(["a","2","<b>"+peorProv[0]+" es el proveedor que menos deja:</b> "+pct(peorProv[1])+
    " promedio en "+peorProv[2]+" artículos.","Con ese proveedor hay que negociar el descuento o subir el precio, no vender más."]);

  const recargo = cobrado - base;
  hz.push(["a","3","<b>"+fmt(recargo)+" de lo que entró hoy es recargo de tarjeta, no ganancia.</b> Se lo lleva la tarjeta.",
    "Por eso el margen se mide contra el precio de contado y no contra lo que entró a la caja."]);

  const pm = {};
  for(const v of vs){ const k=v.puesto; pm[k]=pm[k]||{v:0,m:0}; pm[k].v+=ventaBase(v); pm[k].m+=ventaMargen(v); }
  const ord = Object.entries(pm).map(([k,o])=>[k, o.m/(o.v-o.m)*100]).sort((a,b)=>b[1]-a[1]);
  if(ord.length>1) hz.push(["v","4","<b>"+ord[0][0]+" vende con "+pct(ord[0][1])+" de margen y "+
    ord[ord.length-1][0]+" con "+pct(ord[ord.length-1][1])+".</b> No venden distinto: venden cosas distintas.",
    "Sirve para saber qué mostrador necesita qué mercadería, no para retar a nadie."]);

  const sinFact = vs.filter(v=>!v.facturada).reduce((a,v)=>a+ventaCobrado(v),0);
  hz.push(["v","5","<b>"+fmt(sinFact)+" salió sin factura hoy</b>, el "+(100-fact/cobrado*100).toFixed(0)+"% del día.",
    "Está en el mismo registro que el resto: un solo libro, con el dato adentro. Si no, la gerencia no sabe cuánto vendió de verdad."]);

  document.getElementById("hallazgos").innerHTML = hz.map(([c,n,t,e])=>
    '<div class="hz '+c+'"><span class="ic">'+n+'</span><p>'+t+'<em>'+e+'</em></p></div>').join("");

  const al = bajo.concat(flojos.sort((a,b)=>margen(a)-margen(b))).slice(0,16);
  document.getElementById("gerAlertCount").textContent = (bajo.length+flojos.length)+" artículos";
  document.getElementById("tbAlert").innerHTML = al.map(p=>{
    const m = margen(p);
    return '<tr><td class="num" style="font-size:12.5px">'+p.cod.split("+")[0]+'</td>'+
      '<td class="nom">'+p.tit.slice(0,58)+(p.tit.length>58?"…":"")+'</td><td>'+p.prov+'</td>'+
      '<td class="r">'+fmt(p.costo)+'</td><td class="r">'+fmt(p.contado)+'</td>'+
      '<td class="r" style="font-weight:600;color:'+(m<0?"var(--bad)":"var(--warn)")+'">'+pct(m)+'</td>'+
      '<td class="r">'+p.stock+'</td></tr>';
  }).join("");

  const mxm = Math.max(...Object.values(pm).map(o=>o.m));
  document.getElementById("gerPuesto").innerHTML = Object.keys(pm).sort()
    .map(k=>barra(k, pm[k].m, mxm)).join("");

  document.getElementById("gerFact").innerHTML =
    barra("Con factura", fact, cobrado) + barra("Sin factura", cobrado-fact, cobrado, true);

  const top = {};
  for(const v of vs) for(const l of v.linea){ const p=prod(l.cod); top[p.cod]=(top[p.cod]||0)+(p.contado-p.costo)*l.cant; }
  const t5 = Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const mxt = t5.length?t5[0][1]:1;
  document.getElementById("gerTop").innerHTML = t5.map(([c,v])=>
    barra(prod(c).tit.split(/[·(]/)[0].slice(0,26), v, mxt)).join("");
}

/* ============================================ LISTAS QUE LLEGARON
   El corazón del producto: la lista entra como la mandó el proveedor y
   el sistema la cruza solo. Nadie la carga a mano. */
const SOBRES = [
  {via:"WhatsApp", icono:"foto", prov:"FERRUM", archivo:"IMG-20261103-WA0014.jpg",
   cuando:"ayer 18:42, del vendedor de la zona", modo:"sube", valor:14.5,
   renglones:141, cruzados:134,
   muestra:[
     ["MUEBLE COLG 1 PTA LAVAT 1 AG TRAFUL 50X35X45 JT103-BD","5135","MUEBLE COLGAR 1 PUERTA LAVATORIO TRAFUL"],
     ["INOD CORTO BCO ANDINA C/DEP Y TAPA","—","no está en tu catálogo: lo doy de alta?"],
     ["BACHA APOYO ISIDRA 1 AG","3160","BACHA DE APOYO FLOWATER ISIDRA · 1 AGUJERO"]
   ]},
  {via:"Mail", icono:"PDF", prov:"HEINEKEN", archivo:"Lista_Noviembre_2026_v2.pdf",
   cuando:"hoy 07:15, de ventas@heineken-termos", modo:"sube", valor:18,
   renglones:62, cruzados:62,
   muestra:[
     ["TERMOTANQUE 80 LTS ELECTRICO","2120","TERMOTANQUE HEINEKEN 80 LTS ELÉCTRICO"],
     ["TT 80 ELEC ALTA REC.","8850","TERMOTANQUE HEINEKEN 80 LTS ELÉCTRICO ALTA RECUPERACIÓN"],
     ["TERMOT. 165 LTS ELECTRICO","2353","TERMOTANQUE HEINEKEN 165 LTS ELÉCTRICO"]
   ]},
  {via:"Excel", icono:"XLSX", prov:"GULLIART", archivo:"gulliart-bachas-nov.xlsx",
   cuando:"hoy 09:30, lo subió Caja 2", modo:"desc", d1:42, d2:38,
   renglones:28, cruzados:27,
   muestra:[
     ["BACHA BELLA 1 AGUJ.","11114","GULLIART BACHA BELLA 1 AGUJERO"],
     ["BACHA MAX 30X31 3 AGUJ","11047","GULLIART BACHA MAX 30 X 31 3 AGUJEROS"],
     ["BACHA CUENCO S/AGUJERO","11118","GULLIART BACHA CUENCO"]
   ]}
];

document.getElementById("bandeja").innerHTML = SOBRES.map((s,i)=>
  '<button class="sobre" data-s="'+i+'" aria-pressed="false">'+
    '<span class="via"><span class="pill p-n">'+s.icono+'</span>'+s.via+'</span>'+
    '<span class="de">'+s.prov+'</span>'+
    '<span class="ar">'+s.archivo+'</span>'+
    '<span class="cuando">'+s.cuando+'</span>'+
  '</button>').join("");

document.getElementById("bandeja").addEventListener("click",e=>{
  const b = e.target.closest("button[data-s]"); if(!b) return;
  for(const x of document.querySelectorAll("#bandeja .sobre")) x.setAttribute("aria-pressed", String(x===b));
  const s = SOBRES[+b.dataset.s];

  document.getElementById("lectura").hidden = false;
  document.getElementById("lecturaDe").textContent = s.archivo;
  // Los que enganchan son los que de verdad están en el catálogo cargado.
  // Inventar un número más lindo haría que la pantalla se contradiga sola.
  const enganchados = PRODUCTOS.filter(p=>p.prov===s.prov).length;
  const sinCruzar = Math.max(0, s.renglones - enganchados);
  document.getElementById("lecturaCuerpo").innerHTML =
    '<div class="lect-fila">'+
      '<div class="lect-dato"><div class="k">Renglones en la lista</div><div class="v">'+s.renglones+'</div></div>'+
      '<div class="lect-dato"><div class="k">Los tenés cargados</div><div class="v" style="color:var(--ok)">'+enganchados+'</div></div>'+
      '<div class="lect-dato"><div class="k">No los trabajás</div><div class="v" style="color:var(--ink-3)">'+sinCruzar+'</div></div>'+
      '<div class="lect-dato"><div class="k">'+(s.modo==="sube"?"Sube":"Descuento")+'</div><div class="v">'+
        (s.modo==="sube"? "+"+String(s.valor).replace(".",",")+"%" : s.d1+"→"+s.d2+"%")+'</div></div>'+
    '</div>'+
    '<div class="lect-raw">'+s.muestra.map(([crudo,cod,tit])=>
      'venía así  '+crudo+'\\n'+
      'lo leí como  <b>'+(cod==="—"?tit:cod+"  "+tit)+'</b>').join("\\n\\n")+'</div>'+
    '<p class="nota" style="padding:0">Así escribe el proveedor y así lo entiende el sistema. '+
    'Esta demo tiene cargados '+PRODUCTOS.length+' artículos, así que de la lista engancha '+enganchados+
    '; con los 10.000 del sistema de verdad engancharía casi toda. Lo que no reconoce queda marcado para que lo mires vos: nunca lo adivina.</p>';

  // Carga el simulador de abajo con lo que dice la lista y lo corre.
  document.getElementById("sProv").value = s.prov;
  const btnModo = document.querySelector('#sModo button[data-m="'+s.modo+'"]');
  if(btnModo) btnModo.click();
  if(s.modo==="sube") document.getElementById("sPct").value = s.valor;
  else { document.getElementById("sD1").value = s.d1; document.getElementById("sD2").value = s.d2; }
  document.getElementById("btnSim").click();
  document.getElementById("lectura").scrollIntoView({behavior:"smooth", block:"start"});
});

/* =================================================== LA RED
   Los números de la red son inventados: la pantalla lo dice. Lo que se
   calcula de verdad es lo que te cuesta la diferencia, sobre tus compras. */
const RED = {
  FERRUM:{tuyo:45,red:48.2,mejor:52,com:41}, HEINEKEN:{tuyo:38,red:41.5,mejor:45,com:67},
  PIAZZA:{tuyo:44,red:44.8,mejor:49,com:58}, FLOWATER:{tuyo:46,red:45.1,mejor:50,com:39},
  GULLIART:{tuyo:40,red:43.9,mejor:47,com:28}, TST:{tuyo:42,red:42.4,mejor:46,com:52},
  "ROT-AR":{tuyo:47,red:46.2,mejor:51,com:44}, BOSCA:{tuyo:35,red:35.4,mejor:38,com:71},
  DOGO:{tuyo:43,red:46.8,mejor:50,com:33}, PRINGLES:{tuyo:45,red:45.3,mejor:49,com:36},
  HYDROS:{tuyo:44,red:44.1,mejor:48,com:22}, TROMEN:{tuyo:37,red:38.9,mejor:41,com:49},
  LYG:{tuyo:41,red:43.2,mejor:46,com:19}
};
const ROTACION = 1.5;   // veces que se da vuelta el stock en un año
function comprasAnuales(prov){
  return PRODUCTOS.filter(p=>p.prov===prov).reduce((a,p)=>a+p.costo*p.stock,0) * ROTACION;
}
function ahorroSi(prov){
  const r = RED[prov]; if(!r) return 0;
  return comprasAnuales(prov) * (1 - (1-r.red/100)/(1-r.tuyo/100));
}
const LISTAS_RED = [
  ["HEINEKEN","hoy 07:15","vos","al día"], ["GULLIART","hoy 09:30","vos","al día"],
  ["FERRUM","ayer 18:42","vos","al día"], ["PIAZZA","hace 2 días","otro comercio","al día"],
  ["ROT-AR","hace 3 días","otro comercio","al día"], ["TST","hace 4 días","otro comercio","al día"],
  ["BOSCA","hace 6 días","el proveedor","al día"], ["DOGO","hace 9 días","otro comercio","al día"],
  ["TROMEN","hace 1 mes","otro comercio","vieja"], ["LYG","hace 2 meses","nadie","vieja"]
];

function pintarRed(){
  const provs = Object.keys(RED).filter(p=>PRODUCTOS.some(x=>x.prov===p));
  const ahorroTotal = provs.reduce((a,p)=>a+Math.max(0,ahorroSi(p)),0);
  const sinCargar = LISTAS_RED.filter(l=>l[2]!=="vos").length;

  document.getElementById("redTiles").innerHTML =
    tile("Comercios en la red","312","cargando listas todos los días") +
    tile("Listas al día","41 de 47","de tus proveedores") +
    tile("Te llegaron sin cargarlas", String(sinCargar), "de "+LISTAS_RED.length+" proveedores") +
    tile("Estás pagando de más", fmt(ahorroTotal), "por año, contra el promedio", ahorroTotal>0?"alerta":"bien");

  document.getElementById("tbRed").innerHTML = provs
    .map(p=>({p, r:RED[p], compras:comprasAnuales(p), ah:ahorroSi(p)}))
    .sort((a,b)=>b.ah-a.ah)
    .map(({p,r,compras,ah})=>{
      const d = r.red - r.tuyo;
      const est = d <= 0 ? '<span class="pill p-ok">mejor que el promedio</span>'
        : d < 1.5 ? '<span class="pill p-n">parejo</span>'
        : '<span class="pill p-bad">te cobran de más</span>';
      return '<tr><td style="font-weight:600">'+p+'</td>'+
        '<td class="r">'+fmt(compras)+'</td>'+
        '<td class="r" style="font-weight:600">'+String(r.tuyo).replace(".",",")+'%</td>'+
        '<td class="r">'+String(r.red).replace(".",",")+'%</td>'+
        '<td class="r" style="color:var(--ink-3)">'+String(r.mejor).replace(".",",")+'%</td>'+
        '<td class="r" style="font-weight:600;color:'+(ah>0?"var(--bad)":"var(--ok)")+'">'+
          (ah>0? fmt(ah) : "—")+'</td>'+
        '<td>'+est+'</td></tr>';
    }).join("");

  document.getElementById("tbListas").innerHTML = LISTAS_RED.map(([p,c,q,e])=>
    '<tr><td style="font-weight:600">'+p+'</td><td style="font-size:12.5px">'+c+'</td>'+
    '<td style="font-size:12.5px;color:'+(q==="vos"?"var(--ink)":"var(--ink-2)")+'">'+q+'</td>'+
    '<td>'+(e==="al día"?'<span class="pill p-ok">al día</span>':'<span class="pill p-warn">vieja</span>')+'</td></tr>'
  ).join("");

  const peor = provs.map(p=>({p, ah:ahorroSi(p), r:RED[p]})).sort((a,b)=>b.ah-a.ah)[0];
  document.getElementById("redPorque").innerHTML = [
    ["r","1","<b>Hoy el proveedor es el único que sabe.</b> Sabe qué descuento le da a cada corralón de la provincia. Vos sabés el tuyo y nada más, así que negociás a ciegas.",
      "Con la red, la mesa se da vuelta: vos sabés lo que saca el resto."],
    ["a","2","<b>Con "+peor.p+" tenés "+String(peor.r.tuyo).replace(".",",")+"% y la red saca "+
      String(peor.r.red).replace(".",",")+"%.</b> Sobre lo que le comprás por año son "+fmt(peor.ah)+".",
      "Eso es una llamada telefónica, no un proyecto."],
    ["v","3","<b>La lista se carga una vez para todos.</b> Hoy la misma lista de FERRUM la carga a mano un empleado en cada uno de los 312 comercios.",
      "Ese trabajo multiplicado por 312 es el que desaparece."],
    ["v","4","<b>El que entra primero gana dos veces:</b> arregla su margen y además empieza a recibir listas que no cargó.",
      "Y cuanto más grande es la red, más difícil es que alguien la copie. Eso es lo que la hace un negocio y no una función."]
  ].map(([c,n,t,e])=>'<div class="hz '+c+'"><span class="ic">'+n+'</span><p>'+t+'<em>'+e+'</em></p></div>').join("");
}

/* ================================================= EL ASISTENTE
   Cada respuesta se calcula sobre los datos de arriba en el momento. */
const PREGUNTAS = [
  {b:"¿Qué pierde plata?", k:["pierde","perdiendo","perdida","bajo costo","debajo","rojo","mal"], f(){
    const mal = PRODUCTOS.filter(p=>margen(p)<0).sort((a,b)=>margen(a)-margen(b));
    if(!mal.length) return "Ahora mismo <b>no hay ninguno</b> vendiéndose por debajo del costo. Con los precios y costos que están cargados en esta pantalla, todos dejan algo.";
    const plata = mal.reduce((a,p)=>a+(p.costo-p.contado)*p.stock,0);
    const uno = mal.length === 1;
    return "Hay <b>"+mal.length+"</b> "+(uno?"artículo que se vende":"artículos que se venden")+
      " por menos de lo que "+(uno?"cuesta":"cuestan")+". Si se vende todo el stock que hay, "+
      (uno?"es":"son")+" <b class='cifra'>"+fmt(plata)+"</b> de pérdida.<ul>"+
      mal.slice(0,5).map(p=>"<li>"+p.cod.split("+")[0]+" · "+p.tit.slice(0,46)+" — cuesta <span class='cifra'>"+fmt(p.costo)+"</span>, se vende a <span class='cifra'>"+fmt(p.contado)+"</span>, hay "+p.stock+"</li>").join("")+
      "</ul>"+(mal.length>5?"Y "+(mal.length-5)+" más. Están todos en Gerencia.":"");
  }},
  {b:"¿Cuánto vendimos hoy?", k:["vendimos","venta","vendi","hoy","caja","cuanto entro","facturado"], f(){
    const vs = S.ventas;
    const cob = vs.reduce((a,v)=>a+ventaCobrado(v),0);
    const base = vs.reduce((a,v)=>a+ventaBase(v),0);
    const mg = vs.reduce((a,v)=>a+ventaMargen(v),0);
    const fa = vs.filter(v=>v.facturada).reduce((a,v)=>a+ventaCobrado(v),0);
    return "Entraron <b class='cifra'>"+fmt(cob)+"</b> en "+vs.length+" ventas.<ul>"+
      "<li>De eso, <span class='cifra'>"+fmt(cob-base)+"</span> es recargo de tarjeta: se lo lleva la tarjeta, no es tuyo.</li>"+
      "<li>Margen bruto: <span class='cifra'>"+fmt(mg)+"</span>, el "+pct(mg/(base-mg)*100)+" sobre el costo.</li>"+
      "<li>Con factura salió el "+(fa/cob*100).toFixed(0)+"%.</li>"+
      "<li>Ticket promedio: <span class='cifra'>"+fmt(cob/vs.length)+"</span>.</li></ul>";
  }},
  {b:"¿A quién le renegocio?", k:["renegoci","negoci","proveedor","descuento","red","conviene","llamar"], f(){
    const provs = Object.keys(RED).filter(p=>PRODUCTOS.some(x=>x.prov===p));
    const orden = provs.map(p=>({p, ah:ahorroSi(p), r:RED[p]})).sort((a,b)=>b.ah-a.ah).filter(x=>x.ah>0);
    if(!orden.length) return "Con todos estás igual o mejor que el promedio de la red. No hay llamada urgente.";
    return "Por plata, en este orden:<ul>"+orden.slice(0,3).map((x,i)=>
      "<li><b>"+x.p+"</b> — tenés "+String(x.r.tuyo).replace(".",",")+"%, la red saca "+String(x.r.red).replace(".",",")+
      "% y el mejor "+String(x.r.mejor).replace(".",",")+"%. Son <span class='cifra'>"+fmt(x.ah)+"</span> al año.</li>").join("")+
      "</ul>Arrancá por "+orden[0].p+": es el que más te cuesta y además tenés el dato de que "+orden[0].r.com+" comercios consiguen más.";
  }},
  {b:"¿Qué compro esta semana?", k:["compro","comprar","reponer","reposicion","pedido","falta","stock"], f(){
    const bajo = PRODUCTOS.filter(p=>p.stock<=3).sort((a,b)=>a.stock-b.stock);
    const porProv = {};
    for(const p of bajo){ (porProv[p.prov]=porProv[p.prov]||[]).push(p); }
    const lineas = Object.entries(porProv).sort((a,b)=>b[1].length-a[1].length).slice(0,4);
    const costo = bajo.reduce((a,p)=>a+p.costo*(6-p.stock),0);
    return "Hay <b>"+bajo.length+"</b> artículos con 3 o menos en depósito. Reponiendo hasta 6 de cada uno, el pedido sale <b class='cifra'>"+fmt(costo)+"</b>.<ul>"+
      lineas.map(([pr,arr])=>"<li><b>"+pr+"</b>: "+arr.length+" artículos — "+arr.slice(0,3).map(p=>p.tit.split("·")[0].slice(0,30)).join(", ")+(arr.length>3?"…":"")+"</li>").join("")+
      "</ul>Antes de mandar el pedido a "+lineas[0][0]+", mirá La Red: puede que el descuento esté atrasado.";
  }},
  {b:"¿Y si FERRUM sube 15%?", k:["si sube","subiera","aumento","aumenta","ferrum","que pasa si","simul"], f(){
    const prov = "FERRUM";
    const arts = PRODUCTOS.filter(p=>p.prov===prov);
    if(!arts.length) return "No tengo artículos de FERRUM cargados en esta demo.";
    const f = 1.15;
    const rotos = arts.filter(p=>(p.contado - p.costo*f) < 0);
    const plata = rotos.reduce((a,p)=>a+(p.costo*f - p.contado)*p.stock,0);
    return "Con un 15% de aumento sobre los <b>"+arts.length+"</b> artículos de FERRUM que tenés:<ul>"+
      "<li><b>"+rotos.length+"</b> pasarían a venderse por debajo del costo.</li>"+
      "<li>Con el stock que hay, son <span class='cifra'>"+fmt(plata)+"</span> de pérdida.</li></ul>"+
      "En Listas de proveedor podés probar cualquier número y, si querés, aplicar los precios sugeridos de una.";
  }},
  {b:"¿Qué mostrador anda mejor?", k:["mostrador","puesto","vendedor","empleado","quien vende","mejor"], f(){
    const pm = {};
    for(const v of S.ventas){ const k=v.puesto; pm[k]=pm[k]||{v:0,m:0,n:0}; pm[k].v+=ventaBase(v); pm[k].m+=ventaMargen(v); pm[k].n++; }
    const o = Object.entries(pm).map(([k,x])=>({k, mg:x.m, pc:x.m/(x.v-x.m)*100, n:x.n})).sort((a,b)=>b.mg-a.mg);
    return "Por margen dejado hoy:<ul>"+o.map(x=>"<li><b>"+x.k+"</b> — <span class='cifra'>"+fmt(x.mg)+
      "</span> en "+x.n+" ventas, "+pct(x.pc)+"</li>").join("")+
      "</ul>Ojo con leer esto como quién trabaja más: el de arriba puede estar vendiendo termotanques y el de abajo tornillos. Sirve para saber qué mercadería mandar a cada mostrador.";
  }}
];

let chatArrancado = false;
function burbuja(quien, html){
  const c = document.getElementById("chat");
  const d = document.createElement("div");
  d.className = "bur " + quien;
  d.innerHTML = html;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function responder(txt){
  burbuja("yo", txt);
  const t = plano(txt);
  const hit = PREGUNTAS.find(p=>p.k.some(k=>t.includes(k)));
  setTimeout(()=>{
    if(hit) burbuja("el", hit.f());
    else burbuja("el","Esa no la sé contestar con los datos de esta demo. Lo que sí puedo: qué artículos pierden plata, cuánto se vendió hoy y cuánto dejó, a qué proveedor conviene renegociarle, qué hay que reponer, qué pasa si un proveedor aumenta, y cómo viene cada mostrador.<br><br>En el sistema de verdad esto no tiene lista de preguntas: leo tus datos y contesto lo que preguntes.");
  }, 260);
}
function pintarAsistente(){
  if(!chatArrancado){
    chatArrancado = true;
    burbuja("el","Hola. Veo tus ventas de hoy, tu catálogo con costos y las listas de tus proveedores. Preguntame lo que quieras, o tocá una de abajo.");
    document.getElementById("sugeridas").innerHTML = PREGUNTAS.map((p,i)=>'<button data-p="'+i+'">'+p.b+'</button>').join("");
    document.getElementById("sabeHacer").innerHTML = [
      ["v","A","<b>Leer la lista del proveedor como llega.</b> PDF, Excel, o la foto del papel que mandaron por WhatsApp.","Es la parte que ningún sistema hace y la que más horas come hoy."],
      ["v","B","<b>Escribir las descripciones para la web</b> a partir de como está cargado el artículo en el sistema viejo.","“MUEBLE COLG 1 PTA LAVAT 1 AG TRAFUL” no se puede publicar. Pasarlo a mano son 10.000 artículos."],
      ["v","C","<b>Contestar preguntas sobre tus números</b> sin que nadie aprenda a sacar un reporte.","La queja número uno de los sistemas que hay es justo esa."],
      ["a","D","<b>Avisarte antes, no después.</b> Que te diga que un precio te va a dejar en rojo el día que llega la lista, no tres meses más tarde.","Es la diferencia entre un sistema que registra y uno que te cuida."]
    ].map(([c,n,t,e])=>'<div class="hz '+c+'"><span class="ic">'+n+'</span><p>'+t+'<em>'+e+'</em></p></div>').join("");
  }
}
document.getElementById("sugeridas").addEventListener("click",e=>{
  const b = e.target.closest("button[data-p]"); if(!b) return;
  responder(PREGUNTAS[+b.dataset.p].b);
});
document.getElementById("preg").addEventListener("keydown",e=>{
  if(e.key!=="Enter") return;
  const v = e.target.value.trim(); if(!v) return;
  e.target.value = ""; responder(v);
});

/* ======================================================= inicio */
pintarTicket(); buscar(); pintarProd(); pintarWeb();
</script>
</body>
</html>
`;
