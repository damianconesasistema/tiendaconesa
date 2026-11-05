// GENERADO AUTOMATICAMENTE - no editar a mano.
// Sale de la demo 'Punto'. Para cambiarla, se regenera este archivo.
//
// Lo sirve src/app/demo/route.ts, que antes pide la clave DEMO_PASSWORD.
export const PUNTO_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Punto — Sanitarios Conesa</title>
<meta name="theme-color" content="#ffffff">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800;900&display=swap" rel="stylesheet">
<style>
/* Un sistema de mostrador: barra fija arriba, solapas, y cada modulo a dos
   columnas que se apilan en el telefono.
   Los colores, las dos tipografias y el redondeo son los del panel y la
   tienda de Sanitarios Conesa (globals.css): blanco, el rojo #e63020 y
   negro, con Montserrat para titulos y numeros e Inter para el texto.
   No hay modo oscuro, igual que el panel: siempre claro, para que al
   mostrarlo se vea igual en cualquier maquina. */
:root{
  --bg:#f6f5f3; --surface:#ffffff; --surface-2:#faf9f8; --surface-3:#efedea;
  --line:#e6e4e0; --line-2:#d6d2cc;
  --ink:#0a0a0a; --ink-2:#4a4845; --ink-3:#6e6b66;
  --accent:#e63020; --accent-ink:#ffffff; --accent-soft:#fdeae7;
  --accent-hover:#c82614;
  --ok:#0f7a3d; --ok-soft:#e6f3ec;
  --warn:#a35a06; --warn-soft:#fbf0dd;
  /* El rojo de aviso va mas oscuro que el de la marca para que un error no
     se confunda con un boton. */
  --bad:#8f1d12; --bad-soft:#fae4e1;
  --font-d:"Montserrat",-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-b:"Inter",-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-m:"Inter",-apple-system,"Segoe UI",Roboto,sans-serif;
  --font-raw:ui-monospace,Consolas,"SF Mono",Menlo,"Courier New",monospace;
  --r:14px;
  color-scheme:light;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{
  background:var(--bg); color:var(--ink);
  font-family:var(--font-b); font-size:15px; line-height:1.5;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3,h4{font-family:var(--font-d); margin:0; line-height:1.1; text-wrap:balance; letter-spacing:-.012em}
.num{font-family:var(--font-m); font-variant-numeric:tabular-nums}
button{font-family:inherit; font-size:inherit; cursor:pointer}
input,select{font-family:inherit; font-size:inherit; color:var(--ink)}
:focus-visible{outline:2px solid var(--accent); outline-offset:2px; border-radius:4px}

/* ------------------------------------------------------------- barra */
/* El encabezado es el mismo del panel admin (AdminShell.tsx): barra blanca
   pegada arriba, el nombre en rojo con el chip de version al lado, el reloj
   y el usuario a la derecha, y abajo las solapas con el subrayado rojo. */
header{
  position:sticky; top:0; z-index:40;
  background:var(--surface); border-bottom:1px solid var(--line);
}
.bar{
  max-width:none; margin:0; padding:11px 24px;
  display:flex; align-items:center; gap:12px; flex-wrap:wrap;
}
.marca{display:block; height:30px; width:auto}
.bar-sep{width:1px; height:20px; background:var(--line)}
.app{
  font-family:var(--font-d); font-size:12px; font-weight:700;
  text-transform:uppercase; letter-spacing:.35em; color:var(--accent);
}
.ver{
  border:1px solid var(--line); background:var(--surface-2); border-radius:999px;
  padding:1px 8px; font-size:10px; font-weight:700; color:var(--ink-2);
  font-variant-numeric:tabular-nums;
}
.org{font-size:14px; color:var(--ink-2)}
.relo{margin-left:auto; font-size:11px; color:var(--ink-2); font-variant-numeric:tabular-nums}
.user{font-size:14px; color:var(--ink-2)}
.user b{color:var(--ink); font-weight:600}
.user b::before{content:"· "; color:var(--ink-3); font-weight:400}
.user select{
  border:0; background:none; font-family:var(--font-b); font-size:14px;
  font-weight:600; color:var(--ink); padding:0 2px;
}
.salir{
  border:1px solid var(--line); border-radius:999px; padding:7px 16px; background:none;
  font-family:var(--font-d); font-size:13px; font-weight:700;
  text-transform:uppercase; letter-spacing:.05em; color:var(--ink);
}
.salir:hover{border-color:var(--accent); color:var(--accent)}
/* En pantalla angosta se va lo decorativo (el reloj, el nombre largo),
   pero el usuario y la sucursal se quedan: sin eso no se sabe con qué
   razón social se está vendiendo. */
@media (max-width:980px){ .org,.relo{display:none} }
@media (max-width:820px){
  .bar{gap:8px 10px; padding:9px 14px}
  .bar-sep{display:none}
  .user{font-size:13px}
  .marca{height:26px; width:auto}
}

/* La franja de contexto, como la verde de "Estás editando Traslasierra". */
.banda{
  border-top:1px solid rgba(0,0,0,.08);
  background:var(--warn-soft); color:var(--warn);
}
.banda > div, .banda{display:block}
.banda-et{
  font-family:var(--font-d); font-size:10px; font-weight:700;
  text-transform:uppercase; letter-spacing:.3em; opacity:.85;
}
.banda strong{
  font-family:var(--font-d); font-size:16px; font-weight:900;
  text-transform:uppercase; letter-spacing:.04em; margin-left:7px;
}
.banda-n{font-size:12px; opacity:.9; margin-left:10px}
.banda{max-width:none; padding:0}
.banda{display:flex}
.banda{align-items:baseline; gap:0; flex-wrap:wrap; padding:7px 24px}

.puesto{display:flex; align-items:center; gap:7px; font-size:12px; color:var(--ink-3); margin-left:auto}
.puesto label{text-transform:uppercase; letter-spacing:.07em; font-weight:600}
.puesto select{
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:999px;
  padding:5px 11px; font-weight:600; font-size:12.5px; color:var(--ink);
}
/* El cliente, arriba de todo: sin saber a quien le vendes no hay cuenta
   corriente, ni factura A, ni precio de corralon. */
.tk-cli{padding:11px 14px; border-bottom:1px solid var(--line); background:var(--surface-2)}
.tk-cli > label{
  display:block; font-size:11px; text-transform:uppercase; letter-spacing:.08em;
  color:var(--ink-3); font-weight:600; margin-bottom:5px;
}
.tk-cli select{
  width:100%; background:var(--surface); border:1px solid var(--line-2);
  border-radius:10px; padding:9px 11px; font-weight:600; font-size:14px; color:var(--ink);
}
.tk-cli select:focus{border-color:var(--accent); outline:none}
.tk-cli-info{margin-top:8px; font-size:12px; color:var(--ink-2); display:flex; gap:7px 12px; flex-wrap:wrap; align-items:center}
.tk-cli-info b{color:var(--ink); font-variant-numeric:tabular-nums}
nav{
  max-width:none; margin:0; padding:0 24px;
  display:flex; gap:2px; overflow-x:auto; scrollbar-width:thin;
  border-top:1px solid var(--line);
}
nav button{
  flex:0 0 auto; display:inline-flex; align-items:center; gap:8px;
  background:none; border:0; border-bottom:2px solid transparent;
  padding:12px 15px; color:var(--ink-2); white-space:nowrap;
  font-family:var(--font-d); font-size:12px; font-weight:700;
  text-transform:uppercase; letter-spacing:.06em;
}
nav button svg{width:15px; height:15px; flex:0 0 15px}
nav button[aria-current="true"]{color:var(--accent); border-bottom-color:var(--accent)}
nav button:not([aria-current="true"]):hover{color:var(--ink)}

main{max-width:none; margin:0; padding:28px 24px 72px}
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
.card-h .sub{font-size:12.5px; font-weight:500; color:var(--ink-2); margin-left:auto}

.dos{display:grid; grid-template-columns:minmax(0,1fr) 420px; gap:18px; align-items:start}
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
.tr.big b{font-size:21px; font-family:var(--font-d); font-weight:700}
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
td.nom small{display:block; color:var(--ink-2); font-size:12px; font-weight:500; margin-top:2px}
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
.tile .v{font-family:var(--font-d); font-size:28px; font-weight:700; line-height:1.05; margin-top:5px; font-variant-numeric:tabular-nums}
.tile .d{font-size:12.5px; font-weight:500; color:var(--ink-2); margin-top:3px}
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
.resumen-sim b{display:block; font-family:var(--font-d); font-size:23px; font-weight:700; line-height:1.1}
.acc-sim{padding:14px; display:flex; gap:9px; flex-wrap:wrap; border-top:1px solid var(--line)}
.acc-sim button{padding:10px 15px; border-radius:8px}

/* pedidos: el cliente y su cuenta */
.cli{padding:13px 14px; display:flex; gap:12px; flex-wrap:wrap; align-items:center}
.cli select{
  flex:1 1 230px; background:var(--surface-2); border:1px solid var(--line-2);
  border-radius:8px; padding:10px 11px; font-weight:600; font-size:15px;
}
.cli-datos{display:flex; gap:14px; flex-wrap:wrap; font-size:12.5px; color:var(--ink-2)}
.cli-datos div span{display:block; font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-3); font-weight:600}
.cli-datos div b{font-family:var(--font-m); font-size:14px; font-weight:600; color:var(--ink)}
.siempre{padding:0 14px 13px; display:flex; gap:6px; flex-wrap:wrap; align-items:center}
.siempre .et{font-size:11.5px; color:var(--ink-3); font-weight:600; text-transform:uppercase; letter-spacing:.07em; margin-right:3px}
.siempre button{
  background:var(--accent-soft); border:1px solid var(--accent); border-radius:999px;
  padding:4px 11px; font-size:12.5px; color:var(--ink); font-weight:500;
}
.siempre button:hover{filter:brightness(.96)}

/* la grilla densa de renglones */
table.densa td{padding:8px 10px; font-size:14px; font-weight:500}
/* Los dos listados que el vendedor mira todo el día, más grandes. */
.res-t td, .lin-t td{font-size:14.5px; padding:9px 10px}
.res-t td.nom, .lin-t td.nom{font-size:14.5px; font-weight:600}
.res-t td.nom small, .lin-t td.nom small{font-size:12.5px; font-weight:500}
.res-t td.num, .lin-t td.num{font-size:13.5px !important; font-weight:600}
.res-t th, .lin-t th{font-size:11.5px}
.res-t .stk{font-size:13.5px; min-width:38px; padding:3px 9px}
.res-t input.cant, .lin-t input{font-size:14.5px; font-weight:600}
.res-t button.sumar{font-size:12.5px; padding:5px 14px}
.por-rubro{margin:0 0 8px; padding:9px 12px; background:var(--warn-soft);
  color:var(--warn); border-radius:10px; font-size:13px; font-weight:500}
table.densa th{padding:8px 10px; font-size:11.5px}
.cant{
  width:62px; padding:4px 6px; text-align:right; font-family:var(--font-m);
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:6px;
}
.cant:focus{border-color:var(--accent); outline:none}
.quitar-fila{background:none; border:0; color:var(--ink-3); font-size:16px; line-height:1; padding:2px 5px}
.quitar-fila:hover{color:var(--bad)}
.entrega-datos{padding:12px 14px; display:flex; flex-direction:column; gap:6px}
.entrega-datos label{font-size:11px; text-transform:uppercase; letter-spacing:.09em; color:var(--ink-3); font-weight:600}
.entrega-datos input{
  background:var(--surface-2); border:1px solid var(--line-2); border-radius:8px;
  padding:9px 10px; width:100%;
}
.entrega-datos input:focus{border-color:var(--accent); outline:none}

/* la bandeja de listas que llegaron */
.bandeja{display:grid; grid-template-columns:repeat(auto-fit,minmax(248px,1fr)); gap:11px; padding:14px}
.sobre{
  text-align:left; background:var(--surface-2); border:1px solid var(--line);
  border-radius:var(--r); padding:12px 13px; display:flex; flex-direction:column; gap:7px;
}
.sobre:hover{border-color:var(--accent); background:var(--accent-soft)}
.sobre[aria-pressed="true"]{border-color:var(--accent); background:var(--accent-soft)}
.sobre .via{display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--ink-3); font-weight:600; text-transform:uppercase; letter-spacing:.07em}
.sobre .de{font-family:var(--font-d); font-size:19px; font-weight:700; line-height:1.05}
.sobre .ar{font-family:var(--font-m); font-size:11.5px; color:var(--ink-2); word-break:break-all}
.sobre .cuando{font-size:12px; color:var(--ink-3)}
.lect{padding:14px; display:flex; flex-direction:column; gap:11px}
.lect-fila{display:flex; gap:12px; flex-wrap:wrap}
.lect-dato{background:var(--surface-2); border:1px solid var(--line); border-radius:8px; padding:9px 13px; flex:1 1 128px}
.lect-dato .k{font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-3); font-weight:600}
.lect-dato .v{font-family:var(--font-d); font-size:22px; font-weight:700; line-height:1.1}
.lect-raw{
  font-family:var(--font-raw); font-size:11.5px; line-height:1.65; color:var(--ink-2);
  background:var(--surface-2); border:1px solid var(--line); border-left:3px solid var(--line-2);
  border-radius:8px; padding:11px 13px; overflow-x:auto; white-space:pre;
}
.lect-raw b{color:var(--accent)}

.busca-fila{display:flex; gap:10px; align-items:flex-end}
.busca-fila .buscar{flex:1; min-width:0}
.busca-fila .cant-fija{flex:0 0 96px}
.ayuda-busca{margin:7px 0 0; font-size:12px; color:var(--ink-2)}
.ayuda-busca b{color:var(--ink)}
.pistas .et{
  font-size:10.5px; text-transform:uppercase; letter-spacing:.09em;
  color:var(--ink-3); font-weight:600; align-self:center; margin-right:1px;
}
.pistas .et + button{margin-left:0}
.pistas button.on{background:var(--accent); border-color:var(--accent); color:var(--accent-ink)}

/* La franja del dia: lo facturado y lo no facturado, uno al lado del otro.
   No son dos libros: es el mismo registro mirado por la marca de la venta. */
.busca-pie{padding:12px 14px; border-top:1px solid var(--line); background:var(--surface-2)}
.lin-t .c{display:inline-flex; align-items:center; gap:6px}
.lin-t .c button{
  width:24px; height:24px; border-radius:7px; border:1px solid var(--line-2);
  background:var(--surface-2); color:var(--ink); font-size:15px; line-height:1;
}
.lin-t .c button:hover{border-color:var(--accent); color:var(--accent)}
.lin-t .c b{min-width:20px; text-align:center; font-variant-numeric:tabular-nums}
.lin-t td{vertical-align:middle}
.res-t td{vertical-align:middle}
.res-t .sem{margin-right:7px; vertical-align:middle}
.res-t input.cant{width:58px}
.res-t button.sumar{
  background:var(--accent-soft); color:var(--accent); border:1px solid var(--accent);
  border-radius:999px; padding:4px 13px; font-size:12px; font-weight:700;
  font-family:var(--font-d); text-transform:uppercase; letter-spacing:.05em; white-space:nowrap;
}
.res-t button.sumar:hover{background:var(--accent); color:var(--accent-ink)}
.res-t tr:hover{background:var(--surface-2)}
.tk-pago select{
  width:100%; background:var(--surface); border:1px solid var(--line-2);
  border-radius:10px; padding:9px 11px; font-size:14px; font-weight:600;
  color:var(--ink); font-family:var(--font-b);
}
.tk-pago select:focus{border-color:var(--accent); outline:none}

/* La tarjeta donde se arma la venta o el pedido va remarcada: es lo
   unico de la pantalla que el vendedor esta tocando. */
.card.armando{
  border:2px solid var(--accent); box-shadow:0 2px 14px rgba(230,48,32,.10);
}
.card.armando>.card-h{
  background:var(--accent-soft); border-bottom:1px solid var(--accent);
}
.card.armando>.card-h h3{color:var(--accent)}

/* Se tiene que ver cual estoy por tocar. */
.res-t tbody tr:hover{background:var(--accent-soft) !important; box-shadow:inset 3px 0 0 var(--accent)}
.res-t tbody tr:hover .nom{color:var(--accent)}
/* Y se tiene que ver lo que acabo de agregar. */
@keyframes recien{from{background:var(--accent-soft)} to{background:transparent}}
.lin-t tr.nuevo td, table.densa tr.nuevo td{animation:recien 1.4s ease-out}

/* El cartel para mandar el presupuesto o la factura. */
.envio{position:fixed; inset:0; z-index:95; background:rgba(10,10,10,.42);
  display:flex; align-items:center; justify-content:center; padding:20px}
.envio[hidden]{display:none}
.envio-caja{background:var(--surface); border:1px solid var(--line-2); border-radius:var(--r);
  width:min(620px,100%); max-height:88vh; overflow:auto; box-shadow:0 18px 50px rgba(0,0,0,.22)}
.envio-h{display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--line)}
.envio-h h3{margin:0; font-family:var(--font-d); font-size:14px; font-weight:800;
  text-transform:uppercase; letter-spacing:.06em}
.envio-h .x{margin-left:auto; border:0; background:none; font-size:24px; line-height:1; color:var(--ink-2)}
.envio-h .x:hover{color:var(--accent)}
.envio-n{margin:0; padding:12px 16px 0; font-size:13px; color:var(--ink-2)}
.envio textarea{display:block; width:calc(100% - 32px); margin:10px 16px 0;
  border:1px solid var(--line-2); border-radius:10px; padding:11px 12px;
  font-family:var(--font-b); font-size:13px; line-height:1.55; color:var(--ink);
  background:var(--surface-2); resize:vertical}
.envio-link{padding:12px 16px 0}
.envio-link label{display:block; font-family:var(--font-d); font-size:10.5px; font-weight:800;
  text-transform:uppercase; letter-spacing:.09em; color:var(--ink-2); margin-bottom:5px}
.envio-link input{width:100%; border:1px solid var(--line-2); border-radius:10px;
  padding:9px 11px; font-family:var(--font-raw); font-size:12.5px; color:var(--ink); background:var(--surface-2)}
.envio-acc{display:flex; flex-wrap:wrap; gap:8px; padding:14px 16px 16px}
.envio-acc .b1,.envio-acc .b2{flex:1 1 auto; text-align:center; text-decoration:none; line-height:1.3}

/* El semáforo del stock, el mismo en la venta y en el pedido.
   Más de 10: tranquilo. De 1 a 10: se está por acabar. En cero: no hay. */
.stk{
  display:inline-block; min-width:34px; padding:2px 8px; border-radius:999px;
  font-size:12.5px; font-weight:700; font-variant-numeric:tabular-nums; text-align:center;
}
.stk-ok{background:var(--ok-soft); color:var(--ok)}
.stk-poco{background:var(--warn-soft); color:var(--warn)}
.stk-no{background:var(--bad-soft); color:var(--bad)}
.stk-otro{display:block; font-size:10.5px; font-weight:500; color:var(--ink-2); margin-top:2px}

/* La barrita de los cuadros de rentabilidad. */
.mini{display:block; height:7px; border-radius:999px; background:var(--surface-3); overflow:hidden}
.mini i{display:block; height:100%; background:var(--accent); border-radius:999px}

/* El botón de hablarle al asistente. */
.con-mic{position:relative}
.con-mic input{padding-right:46px !important}
.mic{
  position:absolute; right:7px; top:50%; transform:translateY(-50%);
  width:32px; height:32px; border-radius:50%; border:1px solid var(--line-2);
  background:var(--surface); color:var(--ink-2); display:flex;
  align-items:center; justify-content:center;
}
.mic:hover{border-color:var(--accent); color:var(--accent)}
.mic.on{background:var(--accent); border-color:var(--accent); color:var(--accent-ink); animation:late 1.1s ease-in-out infinite}
@keyframes late{0%,100%{box-shadow:0 0 0 0 rgba(230,48,32,.45)} 50%{box-shadow:0 0 0 7px rgba(230,48,32,0)}}

/* El segundo botón grande: igual de claro, pero no es el principal. */
.tk-acc .b1.suave{
  background:var(--surface); color:var(--accent); border:2px solid var(--accent);
}
.tk-acc .b1.suave:hover{background:var(--accent-soft)}

/* Los borradores que quedaron a medio hacer. */
.borradores{display:flex; flex-wrap:wrap; gap:7px}
.borradores:empty{display:none}
.borradores .et{
  width:100%; font-family:var(--font-d); font-size:10.5px; font-weight:800;
  text-transform:uppercase; letter-spacing:.09em; color:var(--ink-2); margin-top:4px;
}
.borradores .bo{
  display:inline-flex; align-items:center; gap:7px; border:1px solid var(--line-2);
  background:var(--surface-2); border-radius:999px; padding:5px 6px 5px 13px; font-size:12.5px;
}
.borradores .bo b{font-weight:600}
.borradores .bo button{border:0; background:none; color:var(--ink-3); font-size:16px; line-height:1; padding:0 4px}
.borradores .bo button:hover{color:var(--accent)}
.borradores .bo .ret{
  border:1px solid var(--accent); color:var(--accent); background:var(--surface);
  border-radius:999px; padding:2px 10px; font-size:11.5px; font-weight:700;
}
.borradores .bo .ret:hover{background:var(--accent); color:var(--accent-ink)}

.filtro-vend{display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin:-4px 0 14px}
.filtro-vend label{font-family:var(--font-d); font-size:10.5px; font-weight:800;
  text-transform:uppercase; letter-spacing:.09em; color:var(--ink-2)}
.filtro-vend select{border:1px solid var(--line-2); background:var(--surface);
  border-radius:999px; padding:6px 13px; font-family:var(--font-b);
  font-size:13.5px; font-weight:600; color:var(--ink)}
.filtro-vend select:focus{border-color:var(--accent); outline:none}
.filtro-vend .n{font-size:13px; font-weight:500; color:var(--ink-2)}

/* El formador de precios: tres pasos, numerados, uno abajo del otro. */
.paso{display:flex; gap:12px; padding:14px 0; border-top:1px solid var(--line)}
.paso:first-child{border-top:0; padding-top:4px}
.paso-n{
  flex:0 0 26px; height:26px; border-radius:50%; background:var(--accent);
  color:var(--accent-ink); font-family:var(--font-d); font-size:13px; font-weight:800;
  display:flex; align-items:center; justify-content:center;
}
.paso-cuerpo{flex:1; min-width:0}
.paso-cuerpo>label{
  display:block; font-family:var(--font-d); font-size:11px; font-weight:800;
  text-transform:uppercase; letter-spacing:.09em; color:var(--ink-2); margin-bottom:8px;
}
.sub-campo{margin-top:12px}
.sub-campo label{
  display:block; font-size:12.5px; font-weight:600; color:var(--ink-2); margin-bottom:5px;
}
.sub-campo input[type=number], .sub-campo input[type=text], .sub-campo textarea, .sub-campo select{
  width:100%; max-width:420px; border:1px solid var(--line-2); border-radius:10px;
  padding:9px 11px; font-family:var(--font-b); font-size:14.5px; font-weight:600;
  color:var(--ink); background:var(--surface);
}
.sub-campo textarea{font-family:var(--font-raw); font-size:13px; font-weight:400; resize:vertical}
.sub-campo input:focus, .sub-campo textarea:focus, .sub-campo select:focus{border-color:var(--accent); outline:none}
.sub-campo .por{display:block; margin-top:5px; font-size:12.5px; font-weight:500; color:var(--ink-2)}
.modo.chico button{font-size:11.5px; padding:5px 12px}

/* Los seis casilleros de descuento, uno al lado del otro. */
.seis{display:grid; grid-template-columns:repeat(auto-fit,minmax(104px,1fr));
  gap:8px; margin-bottom:10px}
.seis .d{position:relative; display:block}
.seis .d input{
  width:100%; border:1px solid var(--line-2); border-radius:10px;
  padding:9px 26px 9px 11px; font-size:15px; font-weight:700;
  font-variant-numeric:tabular-nums; color:var(--ink); background:var(--surface);
}
.seis .d input:focus{border-color:var(--accent); outline:none}
.seis .d.puesto input{border-color:var(--accent); background:var(--accent-soft)}
/* Pegado al campo, no al medio del conjunto: arriba está la etiqueta. */
.seis .d .pc{position:absolute; right:11px; bottom:11px;
  font-size:13px; font-weight:600; color:var(--ink-3); pointer-events:none}
.seis .d > .et{display:block; font-size:10.5px; font-weight:600; color:var(--ink-3);
  margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis}

/* Los dos resultados, lado a lado, para que se vea la diferencia. */
.comparar{display:grid; gap:8px; grid-template-columns:repeat(auto-fit,minmax(190px,1fr))}
.comparar .c{border:1px solid var(--line-2); border-radius:12px; padding:10px 13px; background:var(--surface-2)}
.comparar .c.elegido{border-color:var(--accent); background:var(--accent-soft)}
.comparar .c .k{font-family:var(--font-d); font-size:10.5px; font-weight:800;
  text-transform:uppercase; letter-spacing:.07em; color:var(--ink-2)}
.comparar .c.elegido .k{color:var(--accent)}
.comparar .c .v{font-size:19px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px}
.comparar .c .n{font-size:12px; font-weight:500; color:var(--ink-2); margin-top:2px}
.comparar .dif{grid-column:1/-1; font-size:13px; font-weight:500; color:var(--ink-2);
  background:var(--warn-soft); color:var(--warn); border-radius:10px; padding:9px 12px}

/* La cadena del costo, dicha en renglones. */
.cadena{padding:14px}
.cadena .r2{display:flex; align-items:baseline; gap:10px; padding:7px 0; border-bottom:1px dashed var(--line)}
.cadena .r2:last-child{border-bottom:0}
.cadena .r2 .k{flex:1; font-size:14px; font-weight:500; color:var(--ink-2)}
.cadena .r2 .v{font-size:15.5px; font-weight:700; font-variant-numeric:tabular-nums; white-space:nowrap}
/* Lo que suma ese renglón en pesos, antes del total de la línea. */
.cadena .r2 .x{font-size:13px; font-weight:600; color:var(--ink-3);
  font-variant-numeric:tabular-nums; white-space:nowrap; margin-right:4px}
.cadena .r2.total{border-top:2px solid var(--ink); border-bottom:0; margin-top:4px; padding-top:10px}
.cadena .r2.total .k{color:var(--ink); font-weight:700}
.cadena .r2.total .v{font-size:19px; color:var(--accent)}
.cadena .r2.sub .k, .cadena .r2.sub .v{color:var(--ink-3); font-size:13px; font-weight:500}

/* El alta de artículo: dos columnas, los datos a la izquierda y la
   cuenta del precio a la derecha, armándose sola. */
.alta{display:grid; gap:20px; padding:16px; grid-template-columns:1fr}
@media(min-width:900px){.alta{grid-template-columns:1fr 1fr}}
.alta .col>.sub-campo:first-child{margin-top:0}
.alta .sub-campo input, .alta .sub-campo select, .alta .sub-campo textarea{max-width:none}
.sku-fila{display:flex; gap:8px; align-items:center}
.sku-fila input{flex:1}
.sku-fila .b2{white-space:nowrap; padding:9px 16px}
.pc-grande{font-size:16px; font-weight:700; color:var(--ink-2)}
.dos-chicos{display:grid; gap:10px; grid-template-columns:1fr 1fr}
.dos-chicos label{display:block; font-size:12.5px; font-weight:600; color:var(--ink-2); margin-bottom:5px}
.dos-chicos input{width:100%; border:1px solid var(--line-2); border-radius:10px;
  padding:9px 11px; font-size:14.5px; font-weight:600; background:var(--surface); color:var(--ink)}
.cuenta{margin-top:16px; border:1px solid var(--line-2); border-radius:12px;
  background:var(--surface-2); padding:12px 14px}

/* La franja de atajos, pegada abajo. */
.teclas{
  position:fixed; left:0; right:0; bottom:0; z-index:80;
  display:flex; align-items:center; gap:16px; flex-wrap:wrap;
  background:var(--surface); border-top:1px solid var(--line-2);
  padding:7px 16px; font-size:12px; font-weight:500; color:var(--ink-2);
  box-shadow:0 -2px 10px rgba(0,0,0,.05);
}
.teclas[hidden]{display:none}
.teclas .t{display:inline-flex; align-items:center; gap:5px; white-space:nowrap}
.teclas .extra{display:none}
.teclas.abierta .extra{display:inline-flex}
.teclas kbd{
  font-family:var(--font-raw); font-size:11px; font-weight:700; color:var(--ink);
  background:var(--surface-2); border:1px solid var(--line-2);
  border-bottom-width:2px; border-radius:5px; padding:1px 6px; min-width:18px; text-align:center;
}
.teclas .x{margin-left:auto; border:0; background:none; font-size:19px; line-height:1; color:var(--ink-3)}
.teclas .x:hover{color:var(--accent)}
main{padding-bottom:96px}

/* El renglón donde está parado el teclado. */
tr.marcado{background:var(--accent-soft) !important; box-shadow:inset 3px 0 0 var(--accent)}
tr.marcado .nom{color:var(--accent); font-weight:700}

/* El lápiz de cada renglón de productos. */
.filtros .busca-chica input{min-width:230px}
/* Un tilde que se lee: el cuadradito y el texto en la misma línea. */
/* Las partes del título, en cuatro campitos. */
.arma{display:grid; grid-template-columns:repeat(auto-fit,minmax(132px,1fr));
  gap:8px; margin:9px 0 6px; padding:10px; border:1px dashed var(--line-2);
  border-radius:12px; background:var(--surface-2)}
.arma[hidden]{display:none}
.arma label{display:block; font-size:10.5px; font-weight:600; color:var(--ink-3); margin-bottom:3px}
.arma input{width:100%; border:1px solid var(--line-2); border-radius:9px;
  padding:8px 10px; font-size:14px; font-weight:600; background:var(--surface); color:var(--ink)}
.arma input:focus{border-color:var(--accent); outline:none}

label.tilde{display:inline-flex; align-items:center; gap:9px; cursor:pointer;
  font-size:14.5px; font-weight:600; color:var(--ink); margin-bottom:4px}
label.tilde input{width:17px; height:17px; accent-color:var(--accent); cursor:pointer}
/* Las columnas se ordenan tocando el título. */
th[data-ord]{cursor:pointer; user-select:none}
th[data-ord]:hover{color:var(--accent)}
th[data-ord].ord{color:var(--accent)}
th[data-ord].ord::after{content:" 93"; font-size:11px}
th[data-ord].ord.asc::after{content:" 91"}
/* El comprobante entero en un renglón, para no mirar seis campos. */
.resumen-vta{display:flex; flex-wrap:wrap; align-items:baseline; gap:4px 10px; font-size:15px; color:var(--ink-2)}
.resumen-vta b{font-weight:800; color:var(--ink)}
.resumen-vta .sep{color:var(--line-2); font-weight:700}
.resumen-vta .av{width:100%; font-size:13px; font-weight:500; color:var(--ink-3); margin-top:2px}
.resumen-vta .av.ojo{color:var(--bad); font-weight:600}

/* Lo que no se usa todos los días, atrás de un botón. */
#masAcc{display:flex; flex-direction:column; gap:8px; margin-top:2px}

.lapiz{
  border:1px solid var(--line-2); background:var(--surface); color:var(--ink-3);
  border-radius:8px; padding:4px 7px 2px; cursor:pointer; line-height:1;
}
.lapiz:hover{color:var(--accent); border-color:var(--accent); background:var(--accent-soft)}

.bajadas{display:grid; gap:10px; padding:14px; grid-template-columns:repeat(auto-fit,minmax(230px,1fr))}
.bajadas button{
  text-align:left; border:1px solid var(--line-2); background:var(--surface);
  border-radius:12px; padding:12px 14px; color:var(--ink);
}
.bajadas button:hover{border-color:var(--accent); background:var(--accent-soft)}
.bajadas .t{display:block; font-family:var(--font-d); font-size:12.5px; font-weight:800;
  text-transform:uppercase; letter-spacing:.05em; color:var(--accent)}
.bajadas .d{display:block; font-size:12.5px; font-weight:500; color:var(--ink-2); margin-top:4px; line-height:1.45}

.solapas{
  display:flex; flex-wrap:wrap; gap:8px; margin-bottom:14px;
}
.solapas button{
  border:1px solid var(--line-2); background:var(--surface); color:var(--ink-2);
  border-radius:999px; padding:7px 16px; font-family:var(--font-d);
  font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
}
.solapas button:hover{border-color:var(--accent); color:var(--accent)}
.solapas button[aria-pressed="true"]{
  background:var(--accent); border-color:var(--accent); color:var(--accent-ink);
}

.hoy-suc{ display:grid; gap:1px; background:var(--line);
  border-top:1px solid var(--line); margin-top:2px;
}
.hoy-suc>div{background:var(--surface); padding:10px 14px}
.hoy-suc .k{font-family:var(--font-d); font-size:10.5px; font-weight:800;
  text-transform:uppercase; letter-spacing:.08em; color:var(--accent)}
.hoy-suc .v{font-size:18px; font-weight:700; font-variant-numeric:tabular-nums; margin-top:2px}
.hoy-suc .n{font-size:11.5px; color:var(--ink-2); margin-top:1px}
@media(min-width:760px){.hoy-suc{grid-template-columns:repeat(3,1fr)}}

.hoy{
  display:flex; gap:0; flex-wrap:wrap; margin-bottom:16px;
  background:var(--surface); border:1px solid var(--line); border-radius:var(--r); overflow:hidden;
}
.hoy > div{flex:1 1 170px; padding:11px 15px; border-right:1px solid var(--line)}
.hoy > div:last-child{border-right:0}
.hoy .k{font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-3); font-weight:600}
.hoy .v{font-family:var(--font-d); font-size:22px; font-weight:800; line-height:1.15; margin-top:3px; font-variant-numeric:tabular-nums}
.hoy .n{font-size:11.5px; color:var(--ink-2); margin-top:1px}
.hoy .bl .v{color:var(--ok)}
.hoy .ng .v{color:var(--warn)}
.dtos{margin-top:0}

.campos{display:grid; grid-template-columns:repeat(auto-fit,minmax(196px,1fr)); gap:13px 14px; padding:13px 14px}
.campos[hidden]{display:none}   /* el grid le gana al hidden si no se dice */
.campo{display:flex; flex-direction:column; gap:5px; min-width:0}
.campo > label{font-size:10.5px; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-3); font-weight:600}
.campo select,.campo input,.campo textarea{
  background:var(--surface); border:1px solid var(--line-2); border-radius:10px;
  padding:8px 10px; font-size:13.5px; font-weight:500; color:var(--ink); width:100%;
  font-family:var(--font-b);
}
.campo select:focus,.campo input:focus,.campo textarea:focus{border-color:var(--accent); outline:none}
.campo textarea{resize:vertical; min-height:58px; line-height:1.45}
/* El campo que el sistema eligio solo. Es la diferencia con GBP, donde cada
   uno de estos lo tenes que bajar a mano en cada pedido. */
.campo.auto select{border-color:var(--accent); background:var(--accent-soft)}
.campo .por{font-size:11.5px; color:var(--ink-2); line-height:1.4}
.campo .por b{color:var(--accent); font-weight:600}
.campo.ancho{grid-column:1/-1}

.esc{display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:16px; align-items:start}
.esc-g{background:var(--surface); border:1px solid var(--line); border-radius:var(--r); overflow:hidden}
.esc-g > h3{
  font-family:var(--font-d); font-size:13px; font-weight:700; text-transform:uppercase;
  letter-spacing:.1em; padding:11px 14px; border-bottom:1px solid var(--line); color:var(--ink);
}
.esc-i{
  display:flex; gap:11px; align-items:flex-start; width:100%; text-align:left;
  padding:10px 14px; background:none; border:0; border-bottom:1px solid var(--line);
}
.esc-g .esc-i:last-child{border-bottom:0}
.esc-i:not([disabled]):hover{background:var(--surface-2)}
.esc-i[disabled]{cursor:default}
.esc-i > span{flex:1; min-width:0}
.esc-i .t{display:block; font-weight:600; font-size:13.5px; color:var(--ink)}
.esc-i .d{display:block; font-size:12px; color:var(--ink-2); margin-top:3px; line-height:1.45}
.esc-i .ch{margin-left:auto; flex:0 0 auto; align-self:center}

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
  text-align:center; box-shadow:0 8px 24px rgba(0,0,0,.22);
  /* Escondido de verdad: con solo correrlo para abajo asomaba una pestania
     negra en el borde de la pantalla. */
  opacity:0; visibility:hidden;
  transition:transform .22s ease, opacity .22s ease, visibility .22s;
}
#toast.on{transform:translate(-50%,0); opacity:1; visibility:visible}
@media (prefers-reduced-motion:reduce){#toast{transition:none}}

footer{
  max-width:none; margin:0; padding:0 24px 40px;
  color:var(--ink-3); font-size:12px; line-height:1.6;
}
</style>
</head>
<body>

<header>
  <div class="bar">
    <img class="marca" alt="Sanitarios Conesa" width="232" height="77" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAABNCAYAAACseCglAAAAAklEQVR4AewaftIAAA4vSURBVO3B/5OkCX0Q4OfTvRDk20wACUhIN5KOAuJ0ohRojp1eMEEqgR1UorGsmrm/YCd/wcyVVf5kFZPyB3/QyvZqKWpFnSs04F3kuiEcCZjQI4GAXYZeMKVEzPVU5I47ru/jWUOqd3Znut/5tv3O3fs8kZkqlUo51VQqldKqqVQqpVVTqVRKq6ZSqZRWTaVSKa2aSqVSWjWVSqW0aiqVSmnVVCqV0qqpVCqldUVJRMQObpi6jbXMHJghInpYNXUtM3tmiIg09RB6eMzUD2fm2F0iooPHTF3LzJ67RMQ2thztoczcdoyI6OAxU/3M7JghInZww2G30cNmZo4dIyJ6WHVgLzPbZoiIbWxiyYHb2MzMXTNERBNdrJray8y2yrFqSiAitnHDYQ0sm2/ZYW0ns+YumTm2OE2HNc03dq8G1tFT3NgMEbGDLSyZauDfR0THbLtYddiKykxXlMOGw/pYNUdELGPFYW0ns4Km8ug4rBERy5k5VtxtNBxYiYhOZvacQUQ0ccPxttFxhIhoY8XUPsZoOEqr/hL8A/wovo9EmC/xEnwXjxpO/o1LrqYcGqb2MrODt2BktrZ7dZzchnOUmduZGeib6mdmZOa22dru1XEyGw5rO7s1h30Et0ytRsSyoy07bCczm7jmaG/H+/AArmIVV3EVV3EVV3EVV3EVV7GKB/B+fNALQE05PGxqJSK6GGfmyGwd92pExLKTWVUeK+7VdjIbDhs4u2V3yMxd9BzWdrSBw7YiYiMze+7Wqv8p/F28Ez+KBhpooIEGGmiggQYaaKCBN+Mt+IBW/W0uuZpy2Ma+qXX0ImLZbG1Te6Y6LqGI6Jjqm+o4mXVT+xg4u7Z7jRSQmWM85LCbEbHhXq/CRxBIJBKJRCKRSCQSiUQi8Wp81CVXUwKZOUAH+6ZWsGm2jqmuqbbLqWOqZ2rV6XUyc+zsxs4gM7fxSw67GREdh/0FvBV1BAKBQCAQCAQCgUAgEHgp/qZW/bUusZqSyMwBOtg31XGMiGhiyVTbVEdx+8qjbaqNfT8QEW2ns+x8jNyr7QQycwcPOqzjT7Tqy/jbqDm7K3gH3uYSu6IEImKAzczsRcQIKw40Ha/tsHVTq4rbxbpy6Ji67rAOBorpY9WBTfSc3cgdImIbbXfIzJ4jREQHG9hGz/Fejw85EM6ujl/Qqv+u4WTsEqophxU8FhGJFVMDx+uYISLaitlVAhHRxJLjtRXXNXU9IprObhf7prZw3dQts63jG/iGw0amVvAGsyWew3NIxwsk/hZe65KqKbdtx2ubeigzA3umOooZ45bFa5vaz8zAg6Y6CsrMLvZNbTqjzBxj09H2se3k9rDr/2vVX4+fR5jt/+Jx/DaeMVvgjfhJl1RNOfwy+g7s42H8ZGYOzNZHHwMHeuijj2XH66OPvgNd9NFHPyKWHW2MPvroY2y2AfroY2C2Jvroo+vAAH30MYqIZUcbo48++g7soI8+mo43QB99jMyQmV18BH0HbuMW2pk5crwRbmHPgdu4hU5mjh1o4oNIsz2Bf4h/iqcV8yGt+utcQpGZKpWFa9XX0TXfF/EAXo09/BmzJf4Q1w0nv+WSqalUFq1VX8JfR5rte/iC4eQZw8l38F/wjNkCP4J3uoSuqFQuWqv+RlxzIJEIB/4Y78L7EI6X+AP8K1P/BO/B6833c1r1TxhOvu0SuaLkImIZHbTRca8RehhhlJkjM0REE2too+leA/TQy8yxOSKijWXzjTNz4A4R0cay+UaZOYqIjvMxyMyxI0REE2voYNm9Rhigl5kDxfxF/CNHm+DleIXZAl/D5019Ct/E6833fqzgEZfIFSUVEU1sYw1LjreKdQeuYeQIEdHGDlbNtoob2I+IHexk5tjxOviY+W5hw2EbuGG+axhhG6vO7hp67hARbWzjutlWse55EbGPUWa2zfZSvMbZPIlPG04m/sRw8qxW/VG8HS8326vwbjziEqkpoYjYxADrWHJGEbGNL2FVcUvYwigiOo43UEzHvcZOpucCRMQGvoTrTmYJK+b7vrP7Cv6de/0zfFMxV7XqP+YSqSmZiOjiY1hyDiKiiy2nt4THImLD2TQiYk3JRMQGbrpY6ex+03Aycrfh5GsYKOZdeMAlUlMiEdHFunMSEV2sOx83I6LjbNaUSER0cNPFqzmbP8JjjvcpPGG+JbzHJVJTEhGxjXXnJCLWsO587UbEstNbi4hl5dF1OTyOxx3vEfxX8yXerVX/sy6JmhKIiDa2nK8d528J205vCWtKICI6aLgcPmM4+bbjDCf/E583X+Dt+KBLoqYcdpyjiNhAw8W4ERFNp7emHNZcDt/C4+b7dXzLfK/EqkuiZsEiooNV52vbxdpwetcjomnx2k5mD330se/++TX8jvk+h88o5h1a9Xe4BK5YvA0ns4/NzOx6XkQ00cG250VEGw3F7GMtM3sR0cW6Yjaw7fTWsOPi3ELX0ZYxUtw+1jKz5w4RsYZNrLo4iUcMJ0+ZZzj5nlb9MfwiamZr4hewpeSuWLw1xe2jk5kDP5CZI3QjYteBDcXtZGbP8zJzIyLaWDFfIyKamTlyOhvYcXFGmdkzQ0QoaJCZPXfJzF3sRsSGi7OHgeJ+A1/Gitlejvdp1f++4eRZJVazQBHRwZLiNjJz4AiZOc7MMdYUt+OwHcV1nN5KRDRdDk0zZGbXxfnnhpPfV9Rw8nX8qmLegvcouZrF6iiun5m75msrpp+ZY4f1FNd2NpsWa6SYRkR03X9P4T87uR6eNN9rsK7kaharo7iuYpYUM3CXzBxhXzFtZ7NmsQaKW4+IbkQsu3jpwKfwTSf33/Ap870M79eqv0qJXbFYTcXtmiMiOoobO9oAq+ZrOpsGOi5GJyK23WsZg8zsYhcfU9w62hGxlpkjF+9XDCdPOKnh5A+16h/H3zDfn8bP4t8qqZrFaihmLzPHzlfP2TSc3aqLsYotbGELW9jCDTQ9LzNHuOVkVjCIiLaLM8EIv+n0fge3kY4XeAk2tOovU1I1l8PA/TPy4rGJfSezhC9FxIaL8Sz+heHkO07vf+FfIsz2UlzDm5RUzeUwUkzH2Y28SGTmGBtO52ZEbDh/f4xbzmI4eRIfx9NIxwu8Ah/Qqv+QEqqpvKhl5i4edDo3I6JjvlTMs/htw8nQ2X0dn8XEfA/idUqopvKil5ldPIh9J7cbEctmS8U8ga7zMJw8g3+M75nvp/BWJVRzOSwrpqdyKpnZRQf7TmYJO2Z7RjHfxH9wfj6JbyHNVsPPaNVfrmRqLoe2+6fjRSozB2hiz8msR0TT8cJ8T+OzhpPvOi/DyVP4BL5rvo+iqWSuWKx9LJlv1flro+f09p3MHlbcHw9l5ra7RETHHJk5RjsiulhX3Aa2Ha1ltsS38K+dv5v4KF5ptp/AO/FVJVKzWAMFRUTbfAPFLTtaUzEDJ9O1YJnZy8yeAjJzA7cU13GUVv0N+DmzBb6MLzhvw8nX8BWk2QLv1aq/UonULNZAcZvmyMyx4tqO1lDMyMkMcNvlsonbimk62rvwXrM9ic8YTp5zMXbxR+b7AN6hRGoWq6e4tYhYNl9fMR13iYg1xQ2c3I4SiIhmRLTNkZlj7Cqm4Wh/Cctm+zI+6eI8jN8z31vxl5VIzWL1FLeEXfP1FLMUEWsOW1Ncz8ntKocmvhQR2+YbO61W/c34abMlfstw8nUXZTj5Dr6IidkCP61Vf4WSqFmgzBzjYcWtRkQ3IpbdISKWI2I7ItroKW7TD0REG+uKuZ2ZAyeUmSPsWaCIaOINDmxFxCgiNhwhIpaxoZg993oA7zbbE/isi/dJjMz3AP6qkrhi8XZxXXHrWIuIXYzQRgdL6GVmLyJuo2G+1YgYYRcbitt1eju46WJtRcSW4/2SqQZuRsQOehg4sIw1NBQzcq8H8CqzfR59F+9z+CLearY3o4NHlUDNgmVmF7edzBLWsYXrWHJYV3EN3MCS4rpOb1c5LeE6trCFG2gorudOrfqPoW2+Rw0n/9tFG06exOfwPfP9lFb9tUqgphw2na8dF6efmQOnlJljPOyFZ9dhP48/73iJP8AX3D+fxu+abwXXlEBNCWTmLh52TjJzjIdcjE1n1/XCciszRw57L17jeIFdfNX9Mpx8FY+Y7w34GSVQUx4b2HNOMnMbe87XQ5k5cEaZuYt9Lwz72HanVr2Ft5ntWXzacLLv/nocT5kt0Naqv8aC1ZREZo7RwW3nZw37zsetzNx2fna9MKxl5shhH0bDbF/G77n/9vCo+Zr4sAWrKZHMHKONvnOQmSN0sOdsbmXmhvO143Lbx7XM7LnXz+LVZvtV/L77bTj5H/iE+V6LD1uwmpLJzHFmdvAgbjujzBygg192crfxkczccLxlxSy7Q2YOcNvJNJ2fPaf3MNqZ2XO3Vv3H8RbUHC3xFH7dcPK0xRjgNtLx6vgJrfqbLNAVJZWZXXQjYgNr6GDJ0fYwwtgRMnOMzYjYwSbW0HC8PrqZ2TVfE33zNd1rF23zLZvqO7teZu5ExDI6WEMbK453G7vYycyR430YP4x0tMBnMLI4Q+ziBtLRAq/DB/ArFiQy02UREU00HTbIzLFTiIiOw8aZOfAiFhEdd8nMniJa9Tfi41g129/BruHkaYvSqv81/Bpe4niJ/4S/Zzj5PxbgikskM0cYOSeZ2VM5JDN7Tu8X8SP4Np5zWA3P4Rt4zHDytMX6Cv4j/goS6bBADW/Ch9C1AFdUKufnx/HfHXgO4UDiCr6PL2Js8cb4BF6GZ5EIU4k6JvhzFiQyU6VSKaeaSqVSWjWVSqW0aiqVSmnVVCqV0qqpVCqlVVOpVEqrplKplFZNpVIprZpKpVJaNZVKpbT+H/ThmLvjr5fGAAAAAElFTkSuQmCC">
    <span class="bar-sep"></span>
    <span class="app">Punto</span>
    <span class="ver" id="ver" title="versión de la demo">V.0.59.4</span>
    <span class="org">· Sanitarios Conesa</span>
    <span class="relo" id="relo"></span>
    <span class="bar-sep ocultable"></span>
    <span class="user">Usuario: <select id="selUsuario" aria-label="Usuario"></select></span>
    <span class="bar-sep ocultable"></span>
    <span class="user">Vendés como: <select id="selSuc" aria-label="Sucursal"></select>
      <b id="barPuesto">Mostrador 1</b></span>
    <button class="salir" type="button">Salir</button>
  </div>
  <nav id="nav">
    <button data-v="mostrador" aria-current="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L21.7 7H5.1"/></svg>Venta</button>
    <button data-v="pedidos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></svg>Pedidos</button>
    <button data-v="web"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>Web</button>
    <button data-v="productos"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>Productos</button>
    <button data-v="listas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>Listas</button>
    <button data-v="red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>La Red</button>
    <button data-v="caja"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>Caja</button>
    <button data-v="renta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/></svg>Rentabilidad</button>
    <button data-v="contable"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="m9 15 3 3 3-3"/></svg>Contable</button>
    <button data-v="gerencia"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>Gerencia</button>
    <button data-v="asistente"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>Asistente</button>
    <button data-v="inicio"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>Todo el sistema</button>
  </nav>
  <div class="banda">
    <span class="banda-et">Estás viendo</span>
    <strong>Una demo</strong>
    <span class="banda-n">los artículos, los códigos y los precios son los reales; los costos, el stock y la caja están simulados</span>
  </div>
</header>

<main>

<!-- ======================================================== MOSTRADOR -->
<section id="v-inicio" hidden>
  <div class="head">
    <h2>Escritorio</h2>
    <p>Todo lo que hoy se hace en GlobalBluePoint, con el nombre que le dan ustedes. Lo que está en gris todavía no se puede tocar en esta demo.</p>
  </div>
  <div class="esc" id="escritorio"></div>
</section>

<section id="v-mostrador">
  <div class="dos">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Comprobante</h3>
          <button class="b3" id="btnCambiarVta" style="margin-left:auto;padding:5px 15px">Cambiar</button>
        </div>
        <!-- Todo junto en un renglón. Los campos se abren con Cambiar. -->
        <div class="resumen-vta" id="resumenVta"></div>
        <div class="campos" id="camposVta" hidden></div>
      </div>

      <div class="card armando">
        <div class="card-h"><h3>Artículos de la venta</h3><span class="sub" id="vtaCuenta"></span>
          <span class="sub" id="vtaDep" style="margin-left:auto"></span></div>
        <div class="tk-lineas" id="tkLineas"></div>
        <div class="busca-pie">
          <div class="buscar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/></svg>
            <input id="q" type="text" placeholder="Agregar artículo: marca, rubro, nombre o código · ferrum · inodoro · 11114 · termo 80" autocomplete="off" spellcheck="false">
          </div>
          <p class="ayuda-busca">Escribí pedazos, en cualquier orden. El stock va en <b style="color:var(--ok)">verde</b> si hay más de 10,
            en <b style="color:var(--warn)">amarillo</b> si quedan 10 o menos y en <b style="color:var(--bad)">rojo</b> si no hay; igual se puede elegir para ver el precio.</p>
        </div>
        <div class="res" id="res"></div>
      </div>
    </div>

    <div class="card ticket">
      <div class="card-h">
        <h3>Total</h3>
        <div class="puesto">
          <label for="selPuesto">Puesto</label>
          <select id="selPuesto">
            <option>Mostrador 1</option><option>Mostrador 2</option><option>Mostrador 3</option>
            <option>Mostrador 4</option><option>Mostrador 5</option>
          </select>
        </div>
      </div>
      <div class="tk-pago">
        <label for="selDto">Descuento</label>
        <select id="selDto"></select>
      </div>
      <div class="tk-tot" id="tkTot"></div>
      <div class="tk-acc">
        <button class="b1" id="btnFactura">Emitir factura</button>
        <button class="b1 suave" id="btnPresu">Emitir presupuesto</button>
        <button class="b2" id="btnBorrador">Guardar como borrador</button>
        <button class="b3" id="btnMasAcc" aria-expanded="false">Otras opciones</button>
        <div id="masAcc" hidden>
          <button class="b2" id="btnSinFactura">Entregar sin comprobante</button>
          <button class="b2" id="btnWhatsVta">Mandárselo por WhatsApp</button>
          <button class="b3" id="btnVaciar">Vaciar</button>
          <p class="nota" style="padding:4px 0 0">La venta sin comprobante queda anotada igual, marcada como tal: no hay un segundo libro.</p>
        </div>
        <div class="borradores" id="borradores"></div>
      </div>
    </div>
  </div>
</section>

<!-- ==================================================== RENTABILIDAD -->
<section id="v-renta" hidden>
  <div class="head">
    <h2>Rentabilidad</h2>
    <p>Qué deja de verdad lo que se vendió hoy. El recargo de la tarjeta no cuenta como ganancia: lo paga la tarjeta, no el cliente. Esta pantalla no la ve el mostrador.</p>
  </div>
  <div class="solapas" id="rentaSucs"></div>
  <div class="tiles" id="rentaTiles"></div>

  <div class="aviso" id="rentaAviso"></div>

  <div class="dos">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por rubro</h3><span class="sub">ordenado por lo que deja</span></div>
        <div class="tabla-wrap"><table class="densa">
          <thead><tr><th>Rubro</th><th class="r">Vendido</th><th class="r">Costó</th><th class="r">Deja</th><th class="r">Margen</th><th>&nbsp;</th></tr></thead>
          <tbody id="tbRubro"></tbody>
        </table></div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por marca</h3><span class="sub">las diez primeras</span></div>
        <div class="tabla-wrap"><table class="densa">
          <thead><tr><th>Marca</th><th class="r">Vendido</th><th class="r">Costó</th><th class="r">Deja</th><th class="r">Margen</th><th>&nbsp;</th></tr></thead>
          <tbody id="tbMarca"></tbody>
        </table></div>
      </div>

      <div class="card">
        <div class="card-h"><h3>Los que dejan y los que no</h3><span class="sub">artículo por artículo</span></div>
        <div class="tabla-wrap" style="max-height:52vh; overflow-y:auto"><table class="densa">
          <thead><tr><th>Código</th><th>Artículo</th><th class="r">Un.</th><th class="r">Vendido</th><th class="r">Deja</th><th class="r">Margen</th></tr></thead>
          <tbody id="tbArt"></tbody>
        </table></div>
      </div>
    </div>

    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por sucursal</h3></div>
        <div class="tabla-wrap"><table class="densa">
          <thead><tr><th>Sucursal</th><th class="r">Vendido</th><th class="r">Deja</th><th class="r">Margen</th></tr></thead>
          <tbody id="tbRentaSuc"></tbody>
        </table></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por vendedor</h3></div>
        <div class="barras" id="porVend"></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Lo que se lleva la tarjeta</h3></div>
        <div class="tabla-wrap"><table class="densa">
          <thead><tr><th>Cómo pagó</th><th class="r">Cobrado</th><th class="r">Recargo</th><th class="r">Ventas</th></tr></thead>
          <tbody id="tbTarjeta"></tbody>
        </table></div>
        <p class="nota">El recargo entra por caja y vuelve a salir: es el costo de cobrar con tarjeta. Por eso el margen se mide contra el precio de contado.</p>
      </div>
      <div class="card">
        <div class="card-h"><h3>A qué hora se vende</h3></div>
        <div class="barras" id="porHora"></div>
      </div>
    </div>
  </div>
</section>

<!-- ======================================================== CONTABLE -->
<section id="v-contable" hidden>
  <div class="head">
    <h2>Contable</h2>
    <p>El libro IVA ventas de cada razón social, las notas de crédito, y los archivos para mandarle al contador. Esta pantalla no la ve el mostrador.</p>
  </div>
  <div class="solapas" id="contaSucs"></div>
  <div class="tiles" id="contaTiles"></div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Para el contador</h3><span class="sub">se bajan como archivo y se adjuntan al mail</span></div>
    <div class="bajadas" id="bajadas"></div>
    <p class="nota" id="contaNota"></p>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Libro IVA Ventas</h3><span class="sub" id="ivaCount"></span></div>
    <div class="tabla-wrap" style="max-height:58vh; overflow-y:auto"><table class="densa">
      <thead><tr>
        <th>Fecha</th><th>Tipo</th><th>Comprobante</th><th>Razón social</th><th>Cliente</th><th>CUIT / DNI</th>
        <th class="r">Neto</th><th class="r">IVA 21%</th><th class="r">Total</th>
      </tr></thead>
      <tbody id="tbIva"></tbody>
    </table></div>
  </div>

  <div class="dos">
    <div>
      <div class="card">
        <div class="card-h"><h3>Notas de crédito</h3><span class="sub" id="ncCount"></span></div>
        <div class="tabla-wrap"><table class="densa">
          <thead><tr><th>Fecha</th><th>Comprobante</th><th>Anula</th><th>Motivo</th><th class="r">Neto</th><th class="r">IVA</th><th class="r">Total</th></tr></thead>
          <tbody id="tbNC"></tbody>
        </table></div>
        <p class="nota">La nota de crédito no borra la factura: la descuenta. Las dos van al libro, y las dos se las mandás al contador.</p>
      </div>
    </div>
    <div>
      <div class="card">
        <div class="card-h"><h3>Lo que queda afuera</h3></div>
        <div class="tk-tot" id="afueraTot"></div>
        <p class="nota" id="afueraNota"></p>
      </div>
    </div>
  </div>
</section>

<!-- ========================================================= PEDIDOS -->
<section id="v-pedidos" hidden>
  <div class="head">
    <h2>Pedidos</h2>
    <p>El cliente pide, vos tomás. Lo que no hay se ve en el renglón, no cuando el camión llega sin la mercadería.</p>
  </div>

  <div class="dos">
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Para quién</h3><span class="sub" id="pedNro"></span></div>
        <div class="cli">
          <select id="selCliente" aria-label="Cliente"></select>
          <div class="cli-datos" id="cliDatos"></div>
        </div>
        <div class="siempre" id="siempre"></div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-h">
          <h3>Datos del pedido</h3>
        </div>
        <div class="campos" id="camposPed"></div>
      </div>

      <div class="card armando">
        <div class="card-h">
          <h3>Renglones</h3>
          <span class="sub" id="pedCuenta"></span>
        </div>
        <div style="padding:12px 14px 0">
          <div class="buscar">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4.3-4.3"/></svg>
            <input id="qPed" type="text" placeholder="Agregar al pedido: marca, rubro, nombre o código · ferrum · inodoro · 11114 · termo 80" autocomplete="off" spellcheck="false">
          </div>
          <p class="ayuda-busca">Escribí pedazos, en cualquier orden. Tocá el renglón y entra al pedido.</p>
          <div class="res" id="resPed" style="margin-top:8px"></div>
        </div>
        <div class="tabla-wrap">
          <table class="densa">
            <thead><tr>
              <th>Código</th><th>Artículo</th><th class="r">Cant.</th>
              <th class="r">Precio</th><th class="r">Subtotal</th><th>Entrega</th><th></th>
            </tr></thead>
            <tbody id="tbPed"></tbody>
          </table>
        </div>
        <div id="pedFaltan"></div>
      </div>
    </div>

    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Cómo lo recibe</h3></div>
        <div class="tk-pago">
          <div class="formas" id="formaEntrega">
            <button data-e="retira" aria-pressed="true">Retira en el local<span>sin costo</span></button>
            <button data-e="envio" aria-pressed="false">Se lo llevamos<span>según zona</span></button>
          </div>
        </div>
        <div class="entrega-datos">
          <label for="fecha">Para cuándo</label>
          <input id="fecha" type="date">
          <div id="dirEnvio" hidden>
            <label for="dir">Dónde</label>
            <input id="dir" type="text" placeholder="Calle, localidad">
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><h3>Total</h3></div>
        <div class="tk-tot" id="pedTot"></div>
        <div class="entrega-datos" style="border-top:1px solid var(--line)">
          <label for="senia">Seña que deja ahora</label>
          <input id="senia" type="number" value="0" min="0" step="1000">
        </div>
        <div class="tk-acc">
          <button class="b1" id="btnGuardarPed">Guardar el pedido</button>
          <button class="b2" id="btnWhatsPed">Mandárselo por WhatsApp</button>
          <button class="b3" id="btnVaciarPed">Vaciar</button>
        </div>
        <p class="nota">Guardar el pedido reserva el stock que hay y deja anotado lo que falta. No cobra nada todavía: eso pasa cuando el cliente lo retira.</p>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-h"><h3>Notas</h3></div>
        <div class="campos">
          <div class="campo ancho">
            <label for="obsPed">Observaciones <span style="text-transform:none;letter-spacing:0;color:var(--ink-3);font-weight:400">— las ve el cliente en el comprobante</span></label>
            <textarea id="obsPed" placeholder="Entregar por la puerta del fondo. Avisar antes de salir."></textarea>
          </div>
          <div class="campo ancho">
            <label for="intPed">Anotación interna <span style="text-transform:none;letter-spacing:0;color:var(--ink-3);font-weight:400">— no sale impresa en ningún lado</span></label>
            <textarea id="intPed" placeholder="Pidió que le repitan el descuento de la vez pasada. Confirmar con Daniel."></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-h"><h3>Pedidos abiertos</h3><span class="sub" id="pedAbiertos"></span></div>
    <div class="tabla-wrap">
      <table>
        <thead><tr>
          <th>Nº</th><th>Cliente</th><th>Artículos</th><th>Entrega</th>
          <th class="r">Total</th><th class="r">Seña</th><th>Estado</th>
        </tr></thead>
        <tbody id="tbPedidos"></tbody>
      </table>
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
  <div class="aviso"><span>i</span><div>Los costos de esta demo están simulados, salvo los que dicen <b>costo real</b>. En el sistema de verdad salen de la lista del proveedor.</div></div>

  <div class="card armando" style="margin-bottom:16px">
    <div class="card-h">
      <h3 id="altaTit">Artículo nuevo</h3>
      <span class="sub" id="altaSub">el precio se arma solo mientras escribís</span>
      <button class="b2" id="btnAbrirAlta" style="margin-left:12px;padding:6px 16px">Cargar uno</button>
    </div>
    <div id="altaCuerpo" hidden>
      <div class="alta">
        <div class="col">
          <div class="sub-campo">
            <label for="aMarca">Marca o proveedor</label>
            <input id="aMarca" type="text" list="aMarcas" placeholder="FERRUM, HEINEKEN, …" autocomplete="off">
            <datalist id="aMarcas"></datalist>
          </div>
          <div class="sub-campo">
            <label for="aRubro">Rubro</label>
            <select id="aRubro"></select>
          </div>
          <div class="sub-campo">
            <label class="tilde" for="aPromo">
              <input type="checkbox" id="aPromo">
              <span>Es una promoción del proveedor</span>
            </label>
            <span class="por">Se marca en el listado y en el mostrador, para que el que vende lo sepa.</span>
          </div>
          <div class="sub-campo">
            <label for="aTit">Título</label>
            <div class="sku-fila">
              <input id="aTit" type="text" placeholder="TERMOTANQUE HEINEKEN 80 LTS ELÉCTRICO" autocomplete="off">
              <button class="b2" id="btnArmarTit" type="button">Armarlo</button>
            </div>
            <!-- Las partes por separado: el título se escribe solo. -->
            <div class="arma" id="armaTit" hidden>
              <div><label for="gTipo">Qué es</label>
                <input id="gTipo" type="text" list="gTipos" placeholder="INODORO" autocomplete="off"></div>
              <div><label for="gModelo">Modelo o línea</label>
                <input id="gModelo" type="text" placeholder="ONIX" autocomplete="off"></div>
              <div><label for="gMedida">Medida o capacidad</label>
                <input id="gMedida" type="text" placeholder="120 LTS" autocomplete="off"></div>
              <div><label for="gDetalle">Detalle</label>
                <input id="gDetalle" type="text" placeholder="LARGO" autocomplete="off"></div>
              <datalist id="gTipos"></datalist>
            </div>
            <span class="por" id="aTitAviso">Como va a verlo el mostrador y la web. En mayúsculas, con la capacidad y el tipo.</span>
          </div>
          <div class="sub-campo">
            <label for="aDesc">Descripción</label>
            <textarea id="aDesc" rows="4" placeholder="Lo que le decís al cliente cuando pregunta: para qué sirve, qué trae, qué medidas."></textarea>
            <span class="por" id="aDescAviso"></span>
          </div>
          <div class="sub-campo">
            <label for="aSku">Código (SKU)</label>
            <div class="sku-fila">
              <input id="aSku" type="text" autocomplete="off">
              <button class="b2" id="aOtroSku" type="button">Sugerime otro</button>
            </div>
            <span class="por" id="aSkuAviso"></span>
          </div>
          <div class="sub-campo">
            <label for="aCodProv">Código del proveedor</label>
            <input id="aCodProv" type="text" placeholder="el que figura en su lista y en su factura" autocomplete="off">
            <span class="por">Sirve para cruzar su lista con tu catálogo, y se puede buscar por él.</span>
          </div>
          <div class="sub-campo dos-chicos">
            <div><label for="aStockBA">Stock en Buenos Aires</label>
              <input id="aStockBA" type="number" min="0" step="1" value="0"></div>
            <div><label for="aStockTS">Stock en Traslasierra</label>
              <input id="aStockTS" type="number" min="0" step="1" value="0"></div>
          </div>
        </div>

        <div class="col">
          <div class="sub-campo dos-chicos">
            <div><label for="aLista">Lista del proveedor, sin IVA</label>
              <input id="aLista" type="text" inputmode="decimal" value="0,00" autocomplete="off"></div>
            <div><label for="aIva">IVA del artículo</label>
              <select id="aIva"><option value="21">21%</option><option value="10.5">10,5%</option></select></div>
          </div>
          <span class="por" style="display:block;margin:-6px 0 14px">El número que figura en la lista, antes de descuentos. Casi todo va al 21%.</span>
          <div class="sub-campo">
            <label>Descuentos que te hace, hasta seis</label>
            <div class="seis" id="aSeis"></div>
            <div class="modo chico" id="aModoDesc" style="margin-bottom:8px">
              <button type="button" data-d="suma" aria-pressed="true">Se suman</button>
              <button type="button" data-d="cascada" aria-pressed="false">Uno sobre otro</button>
            </div>
            <span class="por" id="aSeisAviso"></span>
          </div>
          <div class="sub-campo">
            <label for="aCont">Descuento por pago contado</label>
            <div class="sku-fila">
              <input id="aCont" type="number" min="0" max="95" step="0.5" value="0">
              <span class="pc-grande">%</span>
            </div>
            <span class="por">Va aparte de los seis: el proveedor lo hace sólo si le pagás al contado.</span>
          </div>
          <div class="sub-campo dos-chicos">
            <div><label for="aL1">Lista 1, sobre el costo</label>
              <div class="sku-fila"><input id="aL1" type="number" min="0" max="400" step="0.5" value="25"><span class="pc-grande">%</span></div></div>
            <div><label for="aL2">Lista 2, sobre la Lista 1</label>
              <div class="sku-fila"><input id="aL2" type="number" min="0" max="400" step="0.5" value="25"><span class="pc-grande">%</span></div></div>
          </div>
          <span class="por" style="display:block;margin:-6px 0 14px">Como las arma el sistema de hoy: la 1 sobre el costo, la 2 sobre la 1.</span>
          <div class="cuenta" id="aCuenta"></div>
          <div class="envio-acc" style="padding:14px 0 0">
            <button class="b1" id="aGuardar">Guardar el artículo</button>
            <button class="b3" id="aCancelar">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h">
      <h3>Filtros</h3>
      <div class="filtros" style="margin-left:auto">
        <label class="busca-chica">Buscar <input id="fBusca" type="search" placeholder="código, nombre o marca" autocomplete="off"></label>
        <label>Proveedor <select id="fProv"></select></label>
        <label>Rubro <select id="fRub"></select></label>
        <label>Margen objetivo <input id="fObj" type="number" value="35" min="0" max="90" step="1">%</label>
        <label><input type="checkbox" id="fFlojos"> Solo los que no llegan</label>
      </div>
    </div>
    <div class="tabla-wrap">
      <table>
        <thead><tr>
          <th data-ord="cod">Código</th><th data-ord="tit">Artículo</th><th data-ord="prov">Proveedor</th>
          <th class="r" data-ord="neto">Costo sin IVA</th><th class="r" data-ord="costo">IVA y costo final</th>
          <th class="r" data-ord="contado">Contado</th><th class="r" data-ord="unPago">1 pago</th>
          <th class="r" data-ord="margen">Margen</th><th>Estado</th><th class="r" data-ord="stock">Stock</th><th></th>
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
    <p class="nota">Se lee, se cruza con tu catálogo y te muestra qué te rompe.</p>
  </div>

  <div class="card" id="lectura" hidden style="margin-bottom:16px">
    <div class="card-h"><h3>Lo que leí</h3><span class="sub" id="lecturaDe"></span></div>
    <div class="lect" id="lecturaCuerpo"></div>
  </div>

  <div class="card" style="margin-bottom:16px">
    <div class="card-h"><h3>Cómo se arma el precio</h3><span class="sub" id="cadenaDe"></span></div>
    <div class="cadena" id="cadenaCuerpo"></div>
  </div>

  <div class="card armando" style="margin-bottom:16px">
    <div class="card-h"><h3>Cambiar precios</h3><span class="sub">nada se aplica hasta que lo firmes</span></div>
    <div class="sim">

      <div class="paso">
        <span class="paso-n">1</span>
        <div class="paso-cuerpo">
          <label>A quiénes se los cambio</label>
          <div class="modo" id="sQuien">
            <button data-q="prov" aria-pressed="true">Todo un proveedor</button>
            <button data-q="sku" aria-pressed="false">Una lista de códigos</button>
            <button data-q="uno" aria-pressed="false">Un artículo solo</button>
          </div>
          <div class="sub-campo" id="qProv">
            <label for="sProv">Proveedor</label>
            <select id="sProv"></select>
          </div>
          <div class="sub-campo" id="qSku" hidden>
            <label for="sSku">Códigos</label>
            <textarea id="sSku" rows="3" placeholder="11114, 3719, 00677&#10;Uno por renglón o separados por coma. Pegalos del Excel si querés."></textarea>
            <span class="por" id="skuAviso"></span>
          </div>
          <div class="sub-campo" id="qUno" hidden>
            <label for="sUno">Buscá el artículo</label>
            <input id="sUno" type="text" placeholder="Código, nombre o marca" autocomplete="off">
            <div class="res" id="sUnoRes"></div>
            <span class="por" id="unoElegido">Ninguno elegido todavía.</span>
          </div>
        </div>
      </div>

      <div class="paso">
        <span class="paso-n">2</span>
        <div class="paso-cuerpo">
          <label>Qué les cambio</label>
          <div class="modo" id="sModo">
            <button data-m="sube" aria-pressed="true">La lista del proveedor</button>
            <button data-m="desc" aria-pressed="false">Los descuentos</button>
            <button data-m="mk" aria-pressed="false">El markup</button>
          </div>

          <div class="sub-campo" id="cSube">
            <label for="sPct">La lista sube un</label>
            <input id="sPct" type="number" value="18" min="-90" max="300" step="0.5">
            <span class="por">en menos, poné el número con el signo menos</span>
          </div>

          <div class="sub-campo" id="cDesc" hidden>
            <label>Los seis descuentos sobre la lista</label>
            <div class="seis" id="seisD"></div>
            <div class="modo chico" id="sModoDesc">
              <button data-d="suma" aria-pressed="true">Se suman</button>
              <button data-d="cascada" aria-pressed="false">Uno sobre otro</button>
            </div>
            <div class="comparar" id="compararDesc"></div>
          </div>

          <div class="sub-campo" id="cMk" hidden>
            <label for="sMk">Markup sobre el costo</label>
            <input id="sMk" type="number" value="42" min="0" max="400" step="0.5">
            <span class="por" id="mkAviso">Lo que se le pone encima al costo para llegar al precio de contado.</span>
          </div>
        </div>
      </div>

      <div class="paso">
        <span class="paso-n">3</span>
        <div class="paso-cuerpo">
          <button class="b1" id="btnSim" style="padding:11px 22px">Ver qué pasa</button>
        </div>
      </div>
    </div>
    <div class="resumen-sim" id="simResumen" hidden></div>
    <div class="tabla-wrap">
      <table>
        <thead><tr>
          <th>Código</th><th>Artículo</th>
          <th class="r">Lista sin IVA</th>
          <th class="r">Costo hoy con IVA</th><th class="r">Costo nuevo con IVA</th>
          <th class="r">Precio hoy</th><th class="r">Precio sugerido</th>
          <th class="r">Margen que queda</th><th class="r">Sube al cliente</th>
        </tr></thead>
        <tbody id="tbSim"></tbody>
      </table>
    </div>
    <div class="acc-sim" id="simAcc" hidden>
      <button class="b2" id="btnAplicarCosto">Aceptar los costos y dejar los precios</button>
      <button class="b1" id="btnAplicarTodo">Aceptar los costos y subir al sugerido</button>
    </div>
    <p class="nota">El precio sugerido es el que vuelve a dejar el margen objetivo, redondeado a los $100 de arriba.</p>
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
        <div class="buscar con-mic" style="margin-bottom:9px">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg>
          <input id="preg" type="text" placeholder="Preguntá lo que quieras, o tocá el micrófono y hablá" autocomplete="off" style="font-size:15px;padding:12px 12px 12px 42px">
          <button class="mic" id="mic" type="button" aria-label="Preguntar hablando" title="Preguntar hablando">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4M8 22h8"/></svg>
          </button>
        </div>
        <div class="pistas" id="sugeridas"></div>
      </div>
      <p class="nota"><b>También se le puede hablar.</b> Tocá el micrófono, preguntá en voz alta y la respuesta aparece sola: sirve cuando tenés las manos ocupadas o el cliente enfrente. Las respuestas se calculan sobre los números que estás viendo en las otras solapas: si cambiás un costo, cambia la respuesta. No están escritas de antemano. En el sistema de verdad, esta parte la hago yo leyendo tus datos.</p>
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
    <p>Cada razón social tiene su caja. Elegí cuál mirás; «Todas» suma las tres. Esta pantalla no la ve el mostrador.</p>
  </div>
  <div class="solapas" id="cajaSucs"></div>
  <div class="filtro-vend">
    <label for="cajaVend">Vendedor</label>
    <select id="cajaVend"></select>
    <span class="n" id="cajaVendN"></span>
  </div>
  <div class="hoy" id="hoyTira"></div>
  <div class="tiles" id="cajaTiles"></div>
  <div class="dos">
    <div class="card">
      <div class="card-h"><h3>Movimientos</h3><span class="sub" id="cajaCount"></span></div>
      <div class="tabla-wrap" style="max-height:62vh; overflow-y:auto">
        <table>
          <thead><tr><th>Hora</th><th>Sucursal</th><th>Vendedor</th><th>Puesto</th><th>Artículos</th><th>Pago</th><th>Comprobante</th><th class="r">Total</th></tr></thead>
          <tbody id="tbCaja"></tbody>
        </table>
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por sucursal</h3><span class="sub">siempre las tres</span></div>
        <div class="barras" id="porSuc"></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por forma de pago</h3></div>
        <div class="barras" id="porPago"></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-h"><h3>Por vendedor</h3><span class="sub">lo que cobró cada uno</span></div>
        <div class="barras" id="cajaPorVend"></div>
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
            <thead><tr><th>Código</th><th>Artículo</th><th>Proveedor</th><th class="r">Costo con IVA</th><th class="r">Contado</th><th class="r">Margen</th><th class="r">Stock</th></tr></thead>
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

<!-- Alta de cliente en el momento, sin salir de la venta. -->
<div class="envio" id="cliNuevo" hidden>
  <div class="envio-caja">
    <div class="envio-h">
      <h3>Cliente nuevo</h3>
      <button class="x" id="cliX" aria-label="cerrar">×</button>
    </div>
    <p class="envio-n">Poné el CUIT y tocá <b>Traer los datos</b>: la razón social, la condición de IVA y el domicilio vienen solos. Si no aparece, se carga a mano.</p>
    <div class="campos" id="cliCampos">
      <div class="campo ancho">
        <label for="cnDoc">CUIT o DNI</label>
        <div class="con-mic">
          <input id="cnDoc" type="text" inputmode="numeric" placeholder="30-71044821-9 o 20144523018" autocomplete="off">
        </div>
        <span class="por" id="cnAviso">Sin guiones también vale. El sistema controla que el número cierre.</span>
      </div>
      <div class="campo ancho"><label for="cnNom">Razón social o nombre</label>
        <input id="cnNom" type="text" placeholder="Como figura en la factura" autocomplete="off"></div>
      <div class="campo"><label for="cnIva">Condición frente al IVA</label>
        <select id="cnIva">
          <option>Responsable Inscripto</option>
          <option>Monotributo</option>
          <option>IVA Exento</option>
          <option selected>Consumidor Final</option>
        </select></div>
      <div class="campo"><label for="cnLim">Límite de cuenta corriente</label>
        <input id="cnLim" type="number" min="0" step="100000" value="0">
        <span class="por">en cero no se le fía</span></div>
      <div class="campo ancho"><label for="cnDir">Domicilio</label>
        <input id="cnDir" type="text" placeholder="Calle, localidad" autocomplete="off"></div>
      <div class="campo ancho"><label for="cnTel">Teléfono</label>
        <input id="cnTel" type="text" placeholder="3544 ..." autocomplete="off"></div>
    </div>
    <div class="envio-acc">
      <button class="b2" id="cnBuscar">Traer los datos</button>
      <button class="b1" id="cnGuardar">Guardar y usarlo en esta venta</button>
    </div>
    <p class="nota" style="padding:0 16px 16px">Acá los datos salen de un padrón de prueba. En el sistema de verdad esto se lo pregunta al <b>padrón de ARCA</b> con el mismo certificado con el que ya se factura: ponés el CUIT y el resto viene solo, sin tipear ni equivocarse.</p>
  </div>
</div>

<!-- El texto listo para pegar en WhatsApp, con el link al comprobante. -->
<div class="envio" id="envio" hidden>
  <div class="envio-caja">
    <div class="envio-h">
      <h3 id="envioTit">Mandárselo por WhatsApp</h3>
      <button class="x" id="envioX" aria-label="cerrar">×</button>
    </div>
    <p class="envio-n">Esto es lo que se le manda. Tocá <b>Copiar</b> y pegalo en WhatsApp Web, o tocá <b>Abrir WhatsApp</b> y se abre con el texto ya puesto.</p>
    <textarea id="envioTxt" rows="9" readonly spellcheck="false"></textarea>
    <div class="envio-link">
      <label>El link solo</label>
      <input id="envioUrl" type="text" readonly>
    </div>
    <div class="envio-acc">
      <button class="b1" id="envioCopiar">Copiar el texto</button>
      <button class="b2" id="envioCopiarLink">Copiar solo el link</button>
      <a class="b2" id="envioWa" href="#" target="_blank" rel="noopener">Abrir WhatsApp</a>
    </div>
  </div>
</div>

<!-- Los atajos, siempre abajo, para no tener que acordarse. -->
<div class="teclas" id="teclas">
  <span class="t"><kbd>↑</kbd><kbd>↓</kbd> moverse</span>
  <span class="t"><kbd>Enter</kbd> sumar</span>
  <span class="t"><kbd>/</kbd> buscar</span>
  <span class="t"><kbd>?</kbd> más atajos</span>
  <span class="t extra"><kbd>Esc</kbd> salir del listado</span>
  <span class="t extra"><kbd>Alt</kbd>+<kbd>F</kbd> facturar</span>
  <span class="t extra"><kbd>Alt</kbd>+<kbd>P</kbd> presupuesto</span>
  <span class="t extra"><kbd>Alt</kbd>+<kbd>B</kbd> borrador</span>
  <span class="t extra"><kbd>Alt</kbd>+<kbd>N</kbd> cliente nuevo</span>
  <button class="x" id="teclasX" aria-label="esconder">×</button>
</div>

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

/* ------------------------------------------------- buscar un articulo
   Primero con lo que el articulo dice de verdad: codigo, nombre, marca
   y rubro. Recien si eso no da nada se usan los sinonimos del rubro, y
   la pantalla avisa que esta mostrando el rubro entero. Asi "deposito"
   no trae las ocho bachas solo porque comparten el rubro SANITARIOS. */
function encontrar(toks){
  if(!toks.length) return {hits:[], porRubro:false};
  const puntuar = (lista, campo) => lista
    .filter(p=>toks.every(t=>p[campo].includes(t)))
    .map(p=>{
      const q = toks.join(" ");
      const tit = plano(p.tit);
      let s = 0;
      if(plano(p.cod) === q) s += 1000;              // el código, cantado
      if(plano(p.cod).startsWith(toks[0])) s += 300;
      if(plano(p.prov) === q) s += 200;              // la marca sola
      if(tit.startsWith(toks[0])) s += 120;
      for(const t of toks){
        if(tit.includes(t)) s += 40;                 // la palabra en el nombre
        if(new RegExp("(^|[ ·(])"+t.replace(/[.*+?^\${}()|[\\]\\\\]/g,"\\\\$&")).test(tit)) s += 25;
        if(plano(p.prov).includes(t)) s += 15;
      }
      return {p, s};
    })
    .sort((a,b)=>b.s-a.s || a.p.contado-b.p.contado);

  const propios = puntuar(PRODUCTOS, "propio");
  if(propios.length) return {hits:propios, porRubro:false};
  return {hits:puntuar(PRODUCTOS, "blob"), porRubro:true};
}

/* Azar repetible, para que los costos y las ventas simuladas sean siempre
   los mismos y la demo no cambie entre una visita y otra. */
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0)/4294967296;}
let _sem=987654321;
function az(){_sem=(Math.imul(_sem,1103515245)+12345)&0x7fffffff;return _sem/0x7fffffff;}

const RECARGO_1PAGO = 1.1363636363636365;   // lo que agrega la tarjeta en 1 pago
/* Como paga el cliente. El recargo es sobre el precio de contado: lo que
   agrega la tarjeta no es ganancia, es lo que se lleva la tarjeta. */
const MULT = {
  "01-Efectivo":1,
  "02-Transferencia":1,
  "03-QR o billetera":1,
  "04-Tarjeta de débito":RECARGO_1PAGO,
  "05-Tarjeta de crédito 1 pago":RECARGO_1PAGO,
  "06-Tarjeta de crédito 3 cuotas":1.2273,
  "07-Tarjeta de crédito 6 cuotas":1.3636,
  "08-Cuenta corriente 30 días":1
};
/** El nombre sin el numero de adelante, para mostrarlo en los informes. */
const formaCorta = f => f.replace(/^\\d+-/,"");

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
    // Lo que de verdad dice el articulo. Es con esto con lo que se busca.
    propio: plano(cod+" "+tit+" "+rub+" "+prov),
    // Los sinonimos del rubro van aparte: solo se usan si lo de arriba
    // no encontro nada, porque si no "deposito" trae todo SANITARIOS.
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
  propio:plano("5135 FERRUM MUEBLE COLGAR 1 PUERTA LAVATORIO 1 AGUJERO TRAFUL 50 X 35 X 45 CM ACCESORIOS FERRUM"),
  blob:plano("5135 mueble colgar puerta lavatorio traful ferrum jt103-bd pta lavat vanitory accesorios bano espejo mueble")
});

/* ---------------------------------------- sucursales y depositos ------
   Tres razones sociales, cada una con su punto de venta y su numeracion.
   El stock NO es uno solo: hay dos depositos. CONESA SRL y SANITARIOS CNC
   descuentan del de Buenos Aires; TRASLASIERRA del suyo. */
const DEPOSITOS = { BA:"Buenos Aires", TS:"Traslasierra" };
const SUCURSALES = [
  {id:"srl", n:"CONESA SRL",     dep:"BA", pv:"0003"},
  {id:"cnc", n:"SANITARIOS CNC", dep:"BA", pv:"0004"},
  {id:"tsl", n:"TRASLASIERRA",   dep:"TS", pv:"0005"}
];
const sucAct  = () => SUCURSALES.find(x=>x.id===S.suc) || SUCURSALES[0];
const sucDe   = id => SUCURSALES.find(x=>x.id===id) || SUCURSALES[0];
const depAct  = () => sucAct().dep;
const otroDep = () => depAct()==="BA" ? "TS" : "BA";

/* Cada articulo pasa a tener las dos cantidades. "p.stock" sigue
   existiendo y sigue funcionando igual que antes, pero ahora contesta
   por el deposito de la sucursal en la que estas parado. */
for(const p of PRODUCTOS){
  const n = p.stock;
  p.dep = { BA:n, TS: Math.floor(hash("tsl"+p.cod) * (n*0.6 + 3)) };
  delete p.stock;
  Object.defineProperty(p,"stock",{
    get(){ return this.dep[depAct()]; },
    set(v){ this.dep[depAct()] = Math.max(0, Math.round(v)); },
    enumerable:true, configurable:true
  });
}

/* ------------------------------------------- el costo, paso por paso ---
   Cada proveedor da su cadena de descuentos sobre la lista. Hasta seis:
   el de siempre, el de volumen, el de pago contado, el de temporada, y
   los dos que aparecen cuando uno pelea. */
const IVA = 1.21;
// No todo va al 21%. Lo que va al 10,5% hay que poder marcarlo, porque si
// no el costo queda inflado y el margen que se ve es mentira.
const ALICUOTAS = [21, 10.5];
const ivaDe  = p => (p && p.iva != null) ? +p.iva : 21;
const facIva = i => 1 + ((i == null ? 21 : +i) / 100);
const ivaTxt = i => String(i == null ? 21 : i).replace(".", ",") + "%";
/** Un porcentaje suelto, escrito como se escribe aca: 3,7 y no 3.7. */
const pTxt = n => String(n).replace(".", ",");
/** Lo que cuesta sin IVA: es como viene la lista del proveedor. */
const netoDe = p => Math.round(p.costo / facIva(ivaDe(p)));
const RECARGO_CONTADO = 1.1363636363636365;   // el 12% de descuento al revés

const DESC_PROV = {
  "FERRUM":   [32, 10,  5, 0, 0, 0],
  "HEINEKEN": [38,  8,  4, 2, 0, 0],
  "GULLIART": [30, 12,  6, 0, 0, 0],
  "LYG":      [35,  7,  5, 3, 0, 0],
  "TST":      [28, 10,  0, 0, 0, 0],
  "ROT-AR":   [34,  9,  4, 0, 0, 0],
  "PIAZZA":   [31, 11,  5, 0, 0, 0],
  "PRINGLES": [33,  8,  5, 2, 0, 0],
  "BOSCA":    [27, 12,  6, 3, 0, 0]
};
const CADENA_BASE = [33, 9, 5, 0, 0, 0];      // para el que no está en la lista
const MARKUP_BASE = 42;                       // lo que se le pone encima por defecto

/** La cadena que rige hoy para ese proveedor (la tocada, o la de fábrica). */
function cadenaDe(prov){
  return (S.cadenas[prov] || DESC_PROV[prov] || CADENA_BASE).slice(0,6);
}
const limD = d => Math.min(95, Math.max(0, +d || 0));

/** Lo que queda de la lista después de los descuentos.
    En cascada: cada uno se aplica sobre lo que quedó del anterior.
    Sumados: se suman los porcentajes y se descuenta una sola vez.
    No dan lo mismo, y la diferencia crece con cada descuento. */
function factorDe(ds, modo){
  modo = modo || S.modoDesc;
  if(modo === "suma"){
    const t = ds.reduce((a,d)=>a+limD(d), 0);
    return Math.max(0.02, 1 - t/100);
  }
  return ds.reduce((a,d)=>a*(1-limD(d)/100), 1);
}
/** El descuento único equivalente a toda la cadena, para decirlo corto. */
const descEquiv = (ds, modo) => (1 - factorDe(ds, modo)) * 100;
const cadenaTxt = ds => ds.filter(d=>limD(d)>0).map(d=>limD(d)+"%").join(" + ") || "sin descuento";

/** El costo que sale de una lista y una cadena. Con IVA, como se paga. */
const costoDe = (lista, ds, modo, iva) => cent(lista * factorDe(ds, modo) * facIva(iva));
/** Y el precio que sale de un costo y un markup. */
const precioDe = (costo, mk) => redondear(costo * (1 + (+mk||0)/100));

/** El markup que tiene puesto el artículo. */
const markupDe = p => p.markup != null ? p.markup : MARKUP_BASE;

const margen = p => (p.contado - p.costo) / p.costo * 100;
/** Los precios de venta se redondean para arriba a los $100. */
function redondear(n){ return Math.ceil(n/100)*100; }
const fmt = n => "$" + Math.round(n).toLocaleString("es-AR");
/* Para costear hace falta el centavo: la lista del proveedor lo trae y
   redondear cada renglón termina en un costo que no cierra con la factura. */
const dosDec = { minimumFractionDigits:2, maximumFractionDigits:2 };
const fmt2  = n => "$" + (+n || 0).toLocaleString("es-AR", dosDec);
const plata2 = n => (+n || 0).toLocaleString("es-AR", dosDec);
/** Lee un precio escrito como se escribe acá: 60.000,50 */
const aNum  = v => {
  const t = String(v).replace(/[^0-9.,-]/g, "").replace(/\\./g, "").replace(",", ".");
  const n = parseFloat(t);
  return isNaN(n) ? 0 : n;
};
const cent = n => Math.round((+n || 0) * 100) / 100;
const fmt0 = n => Math.round(n).toLocaleString("es-AR");
const pct = n => (n>=0?"":"−") + Math.abs(n).toFixed(1).replace(".",",") + "%";

/* ====================================================== estado */
const S = {
  suc:"srl",           // en que razon social se esta vendiendo
  ordProd:{col:"margen", asc:true},   // por que columna se ordena la tabla
  modoDesc:"suma",  // los 6 descuentos del proveedor se suman, salvo que se diga
  cadenas:{},          // las cadenas que se cambiaron a mano, por proveedor
  verComp:false,       // los campos del comprobante, abiertos o cerrados
  cajaSuc:"",          // que caja se esta mirando ("" = todas)
  cajaVend:"",         // y de que vendedor ("" = todos)
  puesto:"Mostrador 1",
  cliente:"",          // vacio = consumidor final, que es lo normal en mostrador
  usuario:"Mauro",    // con quien se entro: de ahi sale el vendedor
  comp:null, cond:null, desc:0,
  // El numero que sigue, por sucursal y por tipo de comprobante. Cada
  // razon social lleva su propia numeracion, como en ARCA.
  nro:{
    srl:{A:12847, B:48214, X:3301, R:9120, P:412},
    cnc:{A:2184,  B:7760,  X:1145, R:3302, P:208},
    tsl:{A:731,   B:5312,  X:908,  R:1477, P:96}
  },
  forma:"02-Transferencia",
  // La demo abre con una venta ya empezada: si abre vacia, el que la mira
  // no ve nada y hay que explicarle que toque algo primero.
  linea:[{cod:"11114",cant:1},{cod:"3719",cant:2},{cod:"00677",cant:4}],
  borradores:[],       // lo que quedo a medio armar, sin emitir
  presuDe:{},          // cuantos presupuestos hizo cada uno
  ventas:[],           // lo del día
  presupuestos:0,
  objetivo:35,
  sim:null
};

/* ------------------------------------------- las ventas del día */
(function sembrar(){
  const pesos = ["01-Efectivo","02-Transferencia","03-QR o billetera","04-Tarjeta de débito","05-Tarjeta de crédito 1 pago","06-Tarjeta de crédito 3 cuotas","07-Tarjeta de crédito 6 cuotas"];
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
      suc: ["srl","srl","cnc","cnc","tsl"][Math.floor(az()*5)],
      puesto: "Mostrador " + (1 + Math.floor(az()*5)),
      forma: pesos[Math.floor(az()*pesos.length)],
      facturada: az() < 0.63,
      web: az() < 0.12,
      linea: lin
    });
  }
})();

/* La demo ya traía un costo para cada artículo. Ahora ese costo tiene que
   poder explicarse: de qué lista sale y con qué descuentos. Así que se
   calcula la lista hacia atrás, para que ningún número se mueva de lugar
   y a la vez quede todo a la vista. */
(function armarListas(){
  for(const p of PRODUCTOS){
    const fac = factorDe(cadenaDe(p.prov), "cascada");
    p.lista  = Math.round(p.costo / (fac * facIva(ivaDe(p))));   // lista sin IVA
    p.markup = Math.round((p.contado / p.costo - 1) * 1000) / 10;
  }
})();

/* ================================================= LO QUE CARGA EL QUE USA
   Una demo que se recarga y se come el artículo que acabás de dar de alta
   no sirve para mostrarla. Lo que se carga o se edita queda guardado en el
   navegador de esta computadora: no viaja a ningún lado ni lo ve nadie más.
   Se guarda sólo lo tocado, no el catálogo entero, así una versión nueva de
   la demo no se lleva puesto lo que cargaste. */
const GUARDA = "punto.catalogo.v1";
const CAMPOS_ED = ["tit","desc","rub","prov","codProv","lista","seis","l1","l2","iva",
                   "dctoCont","promo","costo","contado","unPago","markup"];

/** El stock contesta por el depósito de la sucursal en la que se está. */
function ponerStock(p){
  Object.defineProperty(p,"stock",{
    get(){ return this.dep[depAct()]; },
    set(v){ this.dep[depAct()] = Math.max(0, Math.round(v)); },
    enumerable:true, configurable:true
  });
  return p;
}
function serialDe(p){
  const o = { cod: p.cod, dep: { BA: p.dep.BA, TS: p.dep.TS } };
  for(const k of CAMPOS_ED) if(p[k] !== undefined) o[k] = p[k];
  return o;
}
function guardarCatalogo(){
  try{
    localStorage.setItem(GUARDA, JSON.stringify({
      nuevos:  PRODUCTOS.filter(p=>p.cargado).map(serialDe),
      cambios: PRODUCTOS.filter(p=>p.tocado && !p.cargado).map(serialDe)
    }));
  }catch(e){ /* sin espacio o en ventana privada: la demo anda igual */ }
}
function restaurarCatalogo(){
  let d = null;
  try{ d = JSON.parse(localStorage.getItem(GUARDA) || "null"); }catch(e){ return 0; }
  if(!d) return 0;
  let n = 0;
  for(const o of (d.cambios || [])){
    const p = PRODUCTOS.find(x=>x.cod === o.cod);
    if(!p) continue;
    const dep = o.dep; delete o.dep;
    Object.assign(p, o);
    if(dep){ p.dep.BA = dep.BA; p.dep.TS = dep.TS; }
    p.tocado = true; n++;
  }
  for(const o of (d.nuevos || [])){
    if(PRODUCTOS.some(x=>x.cod === o.cod)) continue;
    const p = Object.assign({ costoBase:o.costo, cargado:true }, o);
    p.propio = plano(p.cod+" "+p.tit+" "+p.rub+" "+p.prov);
    p.blob   = plano(p.cod+" "+p.tit+" "+p.rub+" "+p.prov+" "+(ALIAS[p.rub]||""));
    PRODUCTOS.push(ponerStock(p));
    n++;
  }
  return n;
}
restaurarCatalogo();

const prod = c => PRODUCTOS.find(p=>p.cod===c);
/* Lo que la venta deja: el recargo de tarjeta no es ganancia, lo paga la
   tarjeta. Así que el margen se mide siempre contra el precio de contado. */
function ventaBase(v){ return v.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0); }
function ventaCobrado(v){ return ventaBase(v) * MULT[v.forma]; }
function ventaMargen(v){ return v.linea.reduce((a,l)=>{const p=prod(l.cod); return a+(p.contado-p.costo)*l.cant;},0); }

/* ================================================== navegación */
const vistas = ["mostrador","inicio","pedidos","web","productos","listas","red","caja","renta","contable","gerencia","asistente"];
document.getElementById("nav").addEventListener("click",e=>{
  const b = e.target.closest("button[data-v]"); if(!b) return;
  for(const v of vistas) document.getElementById("v-"+v).hidden = (v !== b.dataset.v);
  for(const x of document.querySelectorAll("#nav button")) x.setAttribute("aria-current", String(x===b));
  window.scrollTo({top:0,behavior:"instant"});
  if(b.dataset.v==="productos") pintarProd();
  if(b.dataset.v==="caja") pintarCaja();
  if(b.dataset.v==="gerencia") pintarGerencia();
  if(b.dataset.v==="renta") pintarRenta();
  if(b.dataset.v==="contable") pintarContable();
  if(b.dataset.v==="web") pintarWeb();
  if(b.dataset.v==="red") pintarRed();
  if(b.dataset.v==="asistente") pintarAsistente();
  if(b.dataset.v==="pedidos") pintarPedido();
  if(b.dataset.v==="mostrador"){ pintarCamposVenta(); pintarDtos(); }
});

/** Lleva a una solapa como si la hubieran tocado. */
function irA(v){
  const b = document.querySelector('#nav button[data-v="'+v+'"]');
  if(b) b.click();
}

let tt;
function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.classList.add("on");
  clearTimeout(tt); tt = setTimeout(()=>t.classList.remove("on"), 3400);
}

document.getElementById("selPuesto").addEventListener("change",e=>{
  S.puesto = e.target.value;
  document.getElementById("barPuesto").textContent = S.puesto;
});

/* En que razon social se esta vendiendo. De aca salen tres cosas: el
   punto de venta del comprobante, la numeracion, y de que deposito sale
   la mercaderia. */
function pintarSucs(){
  document.getElementById("selSuc").innerHTML =
    SUCURSALES.map(x=>'<option value="'+x.id+'"'+(x.id===S.suc?" selected":"")+'>'+x.n+'</option>').join("");
}
document.getElementById("selSuc").addEventListener("change",e=>{
  S.suc = e.target.value;
  S.comp = null;                 // la numeracion es otra
  pintarCamposVenta(); pintarTicket(); buscar();
  toast("Estás vendiendo como "+sucAct().n+". La mercadería sale del depósito de "+DEPOSITOS[depAct()]+".");
});

/* Quien entro. En el sistema de verdad esto lo fija el login y no se
   toca; aca se puede cambiar para poder mostrar como cambia la venta. */
function pintarUsuarios(){
  const sel = document.getElementById("selUsuario");
  sel.innerHTML = VENDEDORES.map(v=>'<option'+(v===S.usuario?" selected":"")+'>'+v+'</option>').join("");
}
document.getElementById("selUsuario").addEventListener("change",e=>{
  S.usuario = e.target.value;
  pintarCamposVenta();
  if(!document.getElementById("v-pedidos").hidden) pintarPedido();
});

/* El reloj de la barra, igual que el del panel. */
(function reloj(){
  const el = document.getElementById("relo");
  const tic = () => {
    const h = new Date();
    el.textContent = h.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric"})
      + " " + h.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  };
  tic(); setInterval(tic, 1000);
})();

/* ------------------- el encabezado de la venta, como el de GBP -------------
   Comprobante, numero, condicion de venta y cliente. Todo viene puesto: el
   comprobante sale de la condicion fiscal del cliente y el numero es el que
   sigue. Por defecto es consumidor final y contado, que es lo que pasa en
   el mostrador nueve de cada diez veces. */
const DESCUENTOS = [0,5,10,12,20,25];

function clienteVta(){ return CLIENTES.find(c=>c.id===S.cliente) || null; }

/** Que comprobante corresponde segun a quien se le vende. */
function compDe(c){
  // Siempre arranca en presupuesto: mientras el cliente está mirando, no
  // se emite nada. Cuando dice que se lo lleva, se cambia acá y recién
  // ahí sale el comprobante. La ayuda ya dice cuál le corresponde.
  const cual = (c && c.t==="Responsable Inscripto") ? "Factura A" : "Factura B";
  return ["03.Presupuesto X cnc","si se lo lleva, cambialo a "+cual];
}
/** Que letra y que numeracion le toca a cada documento. */
const LETRA = {"01.Factura A":"A","02.Factura B":"B","03.Presupuesto X cnc":"X",
               "04.Remito":"R","05.Pedido interno":"P"};
const letraDe = comp => LETRA[comp] || "X";
const esPresu = comp => comp.indexOf("Presupuesto") >= 0;
/** El documento que está puesto ahora mismo. */
function compAct(){ return S.comp || compDe(clienteVta())[0]; }
function condVtaDe(c){
  if(c && c.lim>0 && c.saldo<=c.lim)
    return ["08-Cuenta corriente 30 días","tiene cuenta y le queda "+fmt(c.lim-c.saldo)];
  if(c && c.lim>0) return ["02-Transferencia","se pasó del límite de su cuenta"];
  return ["02-Transferencia","es lo más común en mostrador"];
}
/** El recargo de la forma elegida, dicho en criollo. */
function recargoDe(fo){
  const m = MULT[fo];
  return m===1 ? "sin recargo" : "recarga un "+((m-1)*100).toFixed(1).replace(".",",")+"% sobre el contado";
}
/** El numero que sigue, por letra. Sale solo, nadie lo escribe. */
function nroDe(comp){
  const su = sucAct(), l = letraDe(comp);
  return l+" "+su.pv+"-"+String(S.nro[su.id][l]).padStart(8,"0");
}

function pintarCamposVenta(){
  const c = clienteVta();
  const sComp = compDe(c), sCond = condVtaDe(c);
  const comp = S.comp || sComp[0];
  const cond = S.cond || sCond[0];
  if(!S.cond) S.forma = cond;
  const opcCli = '<option value=""'+(S.cliente?"":" selected")+'>Consumidor final</option>' +
    CLIENTES.map(x=>'<option value="'+x.id+'"'+(x.id===S.cliente?" selected":"")+'>'+x.n+'</option>').join("") +
    '<option value="__nuevo">+ Agregar un cliente nuevo…</option>';

  let info;
  if(!c){
    info = 'Venta al público. Si pide factura A, elegilo de la lista.';
  } else {
    const libre = c.lim - c.saldo;
    info = c.t+' · CUIT '+c.doc+
      (c.lim>0 ? ' · debe <b>'+fmt(c.saldo)+'</b> de <b>'+fmt(c.lim)+'</b>'+
        (libre<=0 ? ' <span class="pill p-bad">pasado del límite</span>'
                  : ' <span class="pill p-ok">le queda '+fmt(libre)+'</span>')
      : ' · sin cuenta corriente');
  }

  const su = sucAct();
  document.getElementById("camposVta").innerHTML =
    '<div class="campo"><label for="vtaSuc">Sucursal</label>'+
      '<select id="vtaSuc" style="font-weight:600">'+
        SUCURSALES.map(x=>'<option value="'+x.id+'"'+(x.id===S.suc?" selected":"")+'>'+x.n+'</option>').join("")+
      '</select>'+
      '<span class="por">punto de venta '+su.pv+' · depósito <b>'+DEPOSITOS[su.dep]+'</b></span></div>'+
    '<div class="campo ancho"><label for="vtaCliente">Cliente</label>'+
      '<select id="vtaCliente" data-k="cli">'+opcCli+'</select>'+
      '<span class="por">'+info+'</span></div>'+
    campo("vtaComp","Documento a emitir",DOCUMENTOS,comp,sComp[1],!S.comp)+
    '<div class="campo"><label for="vtaNro">Número</label>'+
      '<input id="vtaNro" type="text" readonly value="'+nroDe(comp)+'" style="background:var(--surface-2);color:var(--ink-2);font-variant-numeric:tabular-nums">'+
      '<span class="por">el que sigue, sale solo</span></div>'+
    campo("vtaCond","Condición de venta",Object.keys(MULT),cond,
          recargoDe(cond)==="sin recargo" ? sCond[1] : recargoDe(cond),!S.cond)+
    '<div class="campo"><label for="vtaVend">Vendedor</label>'+
      '<input id="vtaVend" type="text" readonly value="'+S.usuario+'" style="background:var(--surface-2);color:var(--ink-2)">'+
      '<span class="por">de tu usuario, no se elige a mano</span></div>';

  // El mismo comprobante, en un renglón: lo que se mira de reojo antes de
  // emitir. Sin los números de orden adelante, que no los lee nadie.
  const limpio = t => String(t).replace(/^\\d+[.\\-]\\s*/, "");
  const sp = '<span class="sep">·</span>';
  const libre = c && c.lim > 0 ? c.lim - c.saldo : null;
  document.getElementById("resumenVta").innerHTML =
    '<b>'+su.n+'</b>'+sp+
    '<b>'+(c ? c.n : "Consumidor final")+'</b>'+sp+
    limpio(comp)+' '+nroDe(comp).slice(2)+sp+
    limpio(cond)+
    (libre !== null && libre <= 0
      ? '<span class="av ojo">'+c.n+' está pasado del límite de su cuenta.</span>'
      : "");
  document.getElementById("camposVta").hidden = !S.verComp;
  document.getElementById("btnCambiarVta").textContent = S.verComp ? "Listo" : "Cambiar";
  pintarAcciones();
}
document.getElementById("btnCambiarVta").addEventListener("click",()=>{
  S.verComp = !S.verComp;
  pintarCamposVenta();
});

document.getElementById("camposVta").addEventListener("change",e=>{
  const id = e.target.id;
  if(id==="vtaSuc"){
    S.suc = e.target.value; S.comp = null;
    document.getElementById("selSuc").value = S.suc;
    buscar();   // el stock que se ve es el del otro depósito
    toast("Estás vendiendo como "+sucAct().n+". La mercadería sale del depósito de "+DEPOSITOS[depAct()]+".");
  }
  if(id==="vtaCliente"){
    if(e.target.value==="__nuevo"){ e.target.value = S.cliente; abrirCliente(); return; }
    S.cliente = e.target.value; S.comp = null; S.cond = null;
  }
  if(id==="vtaComp") S.comp = e.target.value;
  if(id==="vtaCond"){ S.cond = e.target.value; S.forma = e.target.value; }
  pintarCamposVenta(); pintarTicket();
});

/** El botón grande dice lo que va a pasar al tocarlo, no "emitir" a secas. */
/** La factura que le toca a este cliente: A si es responsable inscripto,
    B en los demás casos. Es a lo que apunta el botón principal, aunque
    arriba todavía diga presupuesto. */
function facturaDe(){
  const c = clienteVta(), comp = compAct();
  if(!esPresu(comp) && comp.indexOf("Factura")>=0) return comp;   // ya eligió una
  return (c && c.t==="Responsable Inscripto") ? "01.Factura A" : "02.Factura B";
}
function pintarAcciones(){
  const comp = compAct();
  const fc = facturaDe();
  // Si arriba eligió remito o pedido interno, el botón respeta eso.
  const principal = (!esPresu(comp) && comp.indexOf("Factura")<0) ? comp : fc;
  document.getElementById("btnFactura").textContent =
    "Emitir " + principal.replace(/^\\d+\\./,"") + " · " + nroDe(principal).slice(2);
  document.getElementById("btnPresu").textContent =
    "Emitir presupuesto · " + nroDe("03.Presupuesto X cnc").slice(2);
}

/* Los descuentos de un toque, mas uno a medida. */
function pintarDtos(){
  const hechos = DESCUENTOS.slice();
  if(hechos.indexOf(S.desc)<0) hechos.push(S.desc);
  hechos.sort((a,b)=>a-b);
  document.getElementById("selDto").innerHTML =
    hechos.map(d=>'<option value="'+d+'"'+(d===S.desc?" selected":"")+'>'+
      (d===0?"Sin descuento":d+"%")+'</option>').join("")+
    '<option value="otro">Otro…</option>';
}
document.getElementById("selDto").addEventListener("change",e=>{
  if(e.target.value==="otro"){
    const v = prompt("¿Qué descuento le hacés? (en por ciento)", String(S.desc));
    S.desc = v===null ? S.desc : Math.max(0, Math.min(60, Math.round(+v||0)));
  } else {
    S.desc = +e.target.value;
  }
  pintarDtos(); pintarTicket();
});

/* ------------------------------ clientes nuevos ------------------------
   Un padron de prueba, para mostrar como seria con el de ARCA. */
const PADRON = {
  "30710448219":{n:"Corralón San Javier S.R.L.", t:"Responsable Inscripto", dir:"Ruta 14 km 42, San Javier"},
  "30709981232":{n:"Constructora Las Rabonas S.A.", t:"Responsable Inscripto", dir:"Av. San Martín 1240, Las Rabonas"},
  "30712996451":{n:"Obras del Oeste S.R.L.", t:"Responsable Inscripto", dir:"Belgrano 88, Villa Dolores"},
  "20287654321":{n:"Juan Pablo Arrieta", t:"Monotributo", dir:"Sarmiento 310, Mina Clavero"},
  "27351209886":{n:"Lucía Benítez", t:"Monotributo", dir:"Los Molles s/n, Nono"},
  "30999034127":{n:"Municipalidad de Nono", t:"IVA Exento", dir:"Sarmiento 50, Nono"}
};
const soloNum = v => String(v||"").replace(/\\D/g,"");
/** El digito verificador del CUIT, el mismo control que hace ARCA. */
function cuitValido(d){
  if(d.length !== 11) return false;
  const p = [5,4,3,2,7,6,5,4,3,2];
  let suma = 0;
  for(let i=0;i<10;i++) suma += +d[i] * p[i];
  let ver = 11 - (suma % 11);
  if(ver === 11) ver = 0;
  if(ver === 10) ver = 9;
  return ver === +d[10];
}
const conGuiones = d => d.length===11 ? d.slice(0,2)+"-"+d.slice(2,10)+"-"+d.slice(10) : d;

function abrirCliente(){
  for(const id of ["cnDoc","cnNom","cnDir","cnTel"]) document.getElementById(id).value = "";
  document.getElementById("cnIva").value = "Consumidor Final";
  document.getElementById("cnLim").value = 0;
  document.getElementById("cnAviso").innerHTML = "Sin guiones también vale. El sistema controla que el número cierre.";
  document.getElementById("cliNuevo").hidden = false;
  document.getElementById("cnDoc").focus();
}
function cerrarCliente(){ document.getElementById("cliNuevo").hidden = true; }
document.getElementById("cliX").addEventListener("click", cerrarCliente);
document.getElementById("cliNuevo").addEventListener("click",e=>{ if(e.target.id==="cliNuevo") cerrarCliente(); });

function traerPadron(){
  const d = soloNum(document.getElementById("cnDoc").value);
  const av = document.getElementById("cnAviso");
  if(d.length === 8){
    av.innerHTML = '<b>Es un DNI.</b> Con DNI va Factura B y no hay padrón que consultar: poné el nombre a mano.';
    document.getElementById("cnIva").value = "Consumidor Final";
    return;
  }
  if(d.length !== 11){ av.innerHTML = '<b style="color:var(--bad)">El CUIT tiene 11 números.</b> Van '+d.length+'.'; return; }
  if(!cuitValido(d)){ av.innerHTML = '<b style="color:var(--bad)">Ese CUIT no cierra.</b> Está mal copiado: fijate algún número.'; return; }
  const p = PADRON[d];
  if(!p){
    av.innerHTML = '<b>No está en el padrón de prueba</b>, pero el número es válido. Cargalo a mano. '+
      'En el sistema de verdad ARCA contesta con la razón social, la condición de IVA y el domicilio.';
    return;
  }
  document.getElementById("cnNom").value = p.n;
  document.getElementById("cnIva").value = p.t;
  document.getElementById("cnDir").value = p.dir;
  document.getElementById("cnDoc").value = conGuiones(d);
  av.innerHTML = '<b style="color:var(--ok)">Listo.</b> Vino del padrón: '+p.n+' · '+p.t+'.';
}
document.getElementById("cnBuscar").addEventListener("click", traerPadron);
document.getElementById("cnDoc").addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); traerPadron(); } });
// Con los 11 numeros puestos, lo busca solo: nadie quiere tocar otro botón.
document.getElementById("cnDoc").addEventListener("input",e=>{
  if(soloNum(e.target.value).length === 11) traerPadron();
});

document.getElementById("cnGuardar").addEventListener("click",()=>{
  const d = soloNum(document.getElementById("cnDoc").value);
  const nom = document.getElementById("cnNom").value.trim();
  if(!nom){ toast("Falta el nombre o la razón social."); document.getElementById("cnNom").focus(); return; }
  const t = document.getElementById("cnIva").value;
  if(t==="Responsable Inscripto" && !cuitValido(d)){
    toast("Para Factura A hace falta un CUIT válido.");
    document.getElementById("cnDoc").focus(); return;
  }
  const id = "n"+(CLIENTES.length+1)+"-"+Date.now().toString(36);
  CLIENTES.push({
    id, n:nom, t, doc: d ? conGuiones(d) : "—",
    saldo:0, lim: Math.max(0, +document.getElementById("cnLim").value||0),
    dir: document.getElementById("cnDir").value.trim(),
    tel: document.getElementById("cnTel").value.trim(),
    siempre: []
  });
  S.cliente = id; S.comp = null; S.cond = null;
  cerrarCliente();
  pintarCamposVenta(); pintarTicket();
  // el pedido usa la misma lista de clientes
  const sc = document.getElementById("selCliente");
  if(sc) sc.innerHTML = CLIENTES.map(c=>'<option value="'+c.id+'"'+(c.id===PED.cliente?" selected":"")+'>'+c.n+'</option>').join("");
  toast(nom+" quedó cargado y puesto en esta venta.");
});

/* ------------------------- mandarselo al cliente -----------------------
   El comprobante vive en una direccion propia. Lo que se manda por
   WhatsApp es el texto con ese link: el cliente lo abre y ve el
   presupuesto o la factura, sin adjuntos ni PDF dando vueltas. */
const BASE_LINK = "https://conesa.com.ar/c/";
function linkDe(nro){ return BASE_LINK + nro.replace(/[^A-Za-z0-9]/g,"").toLowerCase(); }

function abrirEnvio(d){
  if(!d.lineas.length){ toast("No hay nada para mandar."); return; }
  const url = linkDe(d.nro);
  const txt =
    "Hola "+d.quien+"! Te paso de "+sucAct().n+" el detalle de tu "+
      (esPresu(d.tit) ? "presupuesto" : "compra")+":\\n\\n"+
    d.tit+" N° "+d.nro.slice(2)+"\\n\\n"+
    d.lineas.map(x=>"• "+x.cant+" × "+x.p.tit+" — "+fmt(x.p.contado*x.cant)).join("\\n")+
    (d.senia>0 ? "\\n\\nSeña entregada: "+fmt(d.senia) : "")+
    "\\n\\nTotal: "+fmt(d.total)+"\\n"+
    "Lo podés ver acá: "+url+"\\n\\n"+
    "Cualquier cosa me escribís. Gracias!";
  document.getElementById("envioTit").textContent = d.tit+" "+d.nro;
  document.getElementById("envioTxt").value = txt;
  document.getElementById("envioUrl").value = url;
  document.getElementById("envioWa").href = "https://wa.me/?text=" + encodeURIComponent(txt);
  document.getElementById("envio").hidden = false;
}
function copiar(valor, queCosa){
  const ok = () => toast(queCosa+" copiado. Pegalo en WhatsApp con Ctrl+V.");
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(valor).then(ok, ()=>copiarAMano(valor, ok));
  } else copiarAMano(valor, ok);
}
/** Si el navegador no deja usar el portapapeles, lo seleccionamos igual. */
function copiarAMano(valor, ok){
  const t = document.createElement("textarea");
  t.value = valor; t.style.position="fixed"; t.style.opacity="0";
  document.body.appendChild(t); t.select();
  try{ document.execCommand("copy"); ok(); }
  catch(_){ toast("Seleccioná el texto y copialo con Ctrl+C."); }
  document.body.removeChild(t);
}
document.getElementById("envioX").addEventListener("click",()=>{ document.getElementById("envio").hidden = true; });
document.getElementById("envio").addEventListener("click",e=>{
  if(e.target.id==="envio") document.getElementById("envio").hidden = true;
});
document.getElementById("envioCopiar").addEventListener("click",()=>
  copiar(document.getElementById("envioTxt").value, "El texto"));
document.getElementById("envioCopiarLink").addEventListener("click",()=>
  copiar(document.getElementById("envioUrl").value, "El link"));

/* La franja del dia: el total de verdad y, adentro, cuanto salio con
   comprobante y cuanto no. Es un solo registro con la venta marcada. */
/** Las ventas de la caja que se esta mirando: la sucursal elegida y,
    si se eligio uno, el vendedor. "" en los dos = todo. */
function ventasCaja(){
  let vs = S.cajaSuc ? S.ventas.filter(v=>v.suc===S.cajaSuc) : S.ventas;
  if(S.cajaVend) vs = vs.filter(v=>v.vend===S.cajaVend);
  return vs;
}
function pintarFiltroVend(){
  const sel = document.getElementById("cajaVend");
  sel.innerHTML = '<option value=""'+(S.cajaVend?"":" selected")+'>Todos</option>'+
    VENDEDORES.map(v=>'<option'+(v===S.cajaVend?" selected":"")+'>'+v+'</option>').join("");
  const vs = ventasCaja();
  document.getElementById("cajaVendN").textContent = S.cajaVend
    ? vs.length+" ventas de "+S.cajaVend+" · "+fmt(vs.reduce((a,v)=>a+ventaCobrado(v),0))
    : "sin filtrar: se ven las de todos";
}
document.getElementById("cajaVend").addEventListener("change",e=>{
  S.cajaVend = e.target.value; pintarCaja();
});
function pintarHoy(){
  const vs0 = ventasCaja();
  const conF = vs0.filter(v=>v.facturada);
  const sinF = vs0.filter(v=>!v.facturada);
  const suma = l => l.reduce((a,v)=>a+ventaCobrado(v),0);
  const tot = suma(vs0), blanco = suma(conF), negro = suma(sinF);
  const pct0 = tot>0 ? Math.round(blanco/tot*100) : 0;
  const quien = S.cajaSuc ? sucDe(S.cajaSuc).n : "las tres razones sociales";
  document.getElementById("hoyTira").innerHTML =
    '<div><div class="k">Entró hoy</div><div class="v">'+fmt(tot)+'</div>'+
      '<div class="n">'+vs0.length+' ventas · '+quien+'</div></div>'+
    '<div class="bl"><div class="k">Con comprobante</div><div class="v">'+fmt(blanco)+'</div>'+
      '<div class="n">'+conF.length+' ventas · '+pct0+'% del total</div></div>'+
    '<div class="ng"><div class="k">Sin comprobante</div><div class="v">'+fmt(negro)+'</div>'+
      '<div class="n">'+sinF.length+' ventas · '+(100-pct0)+'% del total</div></div>'+
    // Las tres razones sociales, cada una con su parte facturada y su
    // parte sin facturar. Es el mismo registro, abierto por sucursal.
    (S.cajaSuc ? '' : '<div class="hoy-suc">'+SUCURSALES.map(su=>{
      const mias = S.ventas.filter(v=>v.suc===su.id);
      const b = suma(mias.filter(v=>v.facturada)), n = suma(mias.filter(v=>!v.facturada));
      const t = b+n, p = t>0 ? Math.round(b/t*100) : 0;
      return '<div><div class="k">'+su.n+'</div>'+
        '<div class="v">'+fmt(t)+'</div>'+
        '<div class="n"><b>'+fmt(b)+'</b> con comprobante ('+p+'%) · '+fmt(n)+' sin · '+
        'depósito '+DEPOSITOS[su.dep]+'</div></div>';
    }).join("")+'</div>');
}

/* =================================================== MOSTRADOR */
function buscar(){
  const q = plano(document.getElementById("q").value.trim());
  const caja = document.getElementById("res");
  if(!q){
    caja.innerHTML = '<div class="vacio" style="padding:22px 14px">Escribí lo que te están pidiendo. Entra en cualquier orden: <b>“electrico termo 80”</b> encuentra lo mismo que <b>“termo 80 electrico”</b>.</div>';
    return;
  }
  const toks = q.split(/\\s+/).filter(Boolean);
  const r = encontrar(toks);
  const hits = r.hits.slice(0,10);

  if(!hits.length){
    caja.innerHTML = '<div class="vacio" style="padding:22px 14px">Nada con <b>“'+document.getElementById("q").value+'”</b>. '+
      'Probá con menos palabras, o con el código.</div>';
    return;
  }
  // Un listado con columnas, no tarjetas: se compara de un vistazo y cada
  // renglon lleva su cantidad, como en cualquier mostrador.
  caja.innerHTML =
    (r.porRubro ? '<p class="por-rubro">Ninguno se llama <b>“'+document.getElementById("q").value+'”</b>. '+
      'Te muestro lo que hay en ese rubro.</p>' : '')+
    '<div class="tabla-wrap"><table class="densa res-t"><thead><tr>'+
      '<th>Código</th><th>Artículo</th><th class="r">Stock</th>'+
      '<th class="r">Contado</th><th class="r">1 pago</th><th class="r">Cant.</th><th></th>'+
    '</tr></thead><tbody>'+
    hits.map(({p})=>{
      // El semaforo: el del mostrador ve si deja plata, sin ver el costo.
      const m = margen(p);
      const cls = m>=S.objetivo ? "sem-ok" : (m>=10 ? "sem-med" : "sem-mal");
      const tit = m>=S.objetivo ? "deja bien" : (m>=10 ? "deja poco" : "no deja: avisá al encargado");
      // Verde, amarillo o rojo. Igual se puede tocar: el precio se
      // consulta aunque no haya, que es para lo que más se usa.
      const st = stockPill(p);
      return '<tr data-cod="'+p.cod+'">'+
        '<td class="num" style="font-size:12px">'+p.cod.split("+")[0]+'</td>'+
        '<td class="nom" style="min-width:230px"><span class="sem '+cls+'" title="'+tit+'"></span>'+p.tit+
          (p.promo?' <span class="pill p-ok">promo</span>':'')+
          '<small>'+p.rub.toLowerCase()+'</small></td>'+
        '<td class="r">'+st+'</td>'+
        '<td class="r" style="font-weight:600">'+fmt(p.contado)+'</td>'+
        '<td class="r" style="color:var(--ink-3)">'+fmt(p.unPago)+'</td>'+
        '<td class="r"><input class="cant" type="number" min="1" step="1" value="1" data-q="'+p.cod+'" aria-label="cantidad"></td>'+
        '<td><button class="sumar" data-add="'+p.cod+'">Sumar</button></td>'+
      '</tr>';
    }).join("")+
    '</tbody></table></div>';
  // Deja el primero marcado: así Enter suma sin tener que bajar.
  const pri = caja.querySelector("tr[data-cod]");
  if(pri) pri.classList.add("marcado");
}
document.getElementById("q").addEventListener("input", buscar);
document.getElementById("q").addEventListener("keydown",e=>{
  if(e.key !== "Enter") return;
  // El que esté marcado con las flechas; si no se movió, el primero.
  const t = document.querySelector("#res tr.marcado") || document.querySelector("#res tbody tr[data-cod]");
  if(!t) return;
  const campo = document.querySelector('#res input[data-q="'+t.dataset.cod+'"]');
  sumar(t.dataset.cod, campo ? +campo.value : 1);
});
document.getElementById("res").addEventListener("click",e=>{
  // El botón Sumar, y también el renglón entero: es lo que uno espera
  // tocar. Lo único que no suma es el casillero de la cantidad.
  if(e.target.closest("input")) return;
  const b = e.target.closest("[data-add]") || e.target.closest("tr[data-cod]");
  if(!b) return;
  const cod = b.dataset.add || b.dataset.cod;
  const campo = document.querySelector('#res input[data-q="'+cod+'"]');
  sumar(cod, campo ? +campo.value : 1);
});
// Enter adentro de la cantidad de un renglon lo suma sin tocar el botón.
document.getElementById("res").addEventListener("keydown",e=>{
  if(e.key!=="Enter") return;
  const i = e.target.closest("input[data-q]"); if(!i) return;
  e.preventDefault();
  sumar(i.dataset.q, +i.value);
});

function sumar(cod, cuantos){
  const cant = Math.max(1, Math.floor(+cuantos || 1));
  const l = S.linea.find(x=>x.cod===cod);
  if(l) l.cant += cant; else S.linea.push({cod, cant});
  pintarTicket();
  marcarNuevo(cod);
  toast(cant+" × "+prod(cod).tit.slice(0,46)+" a la venta.");
}

/** Pinta un segundo el renglon que acaba de entrar, para que se vea. */
function marcarNuevo(cod){
  requestAnimationFrame(()=>{
    for(const tb of [document.getElementById("tkLineas"), document.getElementById("tbPed")]){
      if(!tb) continue;
      const tr = tb.querySelector('tr[data-cod="'+cod+'"]');
      if(tr){ tr.classList.remove("nuevo"); void tr.offsetWidth; tr.classList.add("nuevo"); }
    }
  });
}

function pintarTicket(){
  const cont = document.getElementById("tkLineas");
  if(!S.linea.length){
    cont.innerHTML = '<div class="vacio" style="padding:26px 14px">Todavía no hay nada en la venta. Buscá arriba y tocá <b>Sumar</b>.</div>';
  } else {
    // Las mismas columnas que el listado de arriba, para no tener que
    // leer dos formatos distintos en la misma pantalla.
    cont.innerHTML =
      '<div class="tabla-wrap"><table class="densa lin-t"><thead><tr>'+
        '<th>Código</th><th>Artículo</th><th class="r">Cantidad</th>'+
        '<th class="r">Precio</th><th class="r">Subtotal</th><th></th>'+
      '</tr></thead><tbody>'+
      S.linea.map(l=>{
        const p = prod(l.cod);
        const u = p.contado * MULT[S.forma];
        return '<tr data-cod="'+l.cod+'">'+
          '<td class="num" style="font-size:12px">'+p.cod.split("+")[0]+'</td>'+
          '<td class="nom" style="min-width:230px">'+p.tit+'<small>'+p.prov.toLowerCase()+'</small></td>'+
          '<td class="r"><span class="c">'+
            '<button data-m="-" data-cod="'+l.cod+'" aria-label="uno menos">−</button>'+
            '<b>'+l.cant+'</b>'+
            '<button data-m="+" data-cod="'+l.cod+'" aria-label="uno más">+</button></span></td>'+
          '<td class="r" style="color:var(--ink-2)">'+fmt(u)+'</td>'+
          '<td class="r" style="font-weight:600">'+fmt(u*l.cant)+'</td>'+
          '<td><button class="quitar-fila" data-m="x" data-cod="'+l.cod+'" title="sacar de la venta" aria-label="sacar de la venta">×</button></td>'+
        '</tr>';
      }).join("")+
      '</tbody></table></div>';
  }

  const unid = S.linea.reduce((a,l)=>a+l.cant,0);
  document.getElementById("vtaDep").textContent = "Stock del depósito de " + DEPOSITOS[depAct()];
  document.getElementById("vtaCuenta").textContent =
    S.linea.length ? unid+" unidades en "+S.linea.length+" renglones" : "";

  const bruto = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
  const dto = Math.round(bruto * S.desc / 100);
  const base = bruto - dto;
  const total = base * MULT[S.forma];
  // El margen se mide contra el contado, nunca contra lo que entra por
  // tarjeta: el recargo no es ganancia, es lo que se lleva la tarjeta.
  const costo = S.linea.reduce((a,l)=>a+prod(l.cod).costo*l.cant,0);
  const marg = base - costo;
  const mp = costo>0 ? marg/costo*100 : 0;
  const cls = mp>=S.objetivo ? "p-ok" : (mp>=10 ? "p-warn" : "p-bad");
  // El IVA incluido se arma renglón por renglón: si hay algo al 10,5%,
  // el total no lleva 21% y el libro tiene que decir la verdad.
  const ivaLin = S.linea.reduce((a,l)=>{
    const p = prod(l.cod), t = p.contado * l.cant;
    return a + (t - t/facIva(ivaDe(p)));
  }, 0);
  const iva = Math.round(ivaLin * (bruto>0 ? total/bruto : 1));
  const alics = [...new Set(S.linea.map(l=>ivaDe(prod(l.cod))))];
  const etIva = alics.length > 1
    ? "IVA ya incluido ("+alics.sort((a,b)=>b-a).map(ivaTxt).join(" y ")+")"
    : "IVA "+ivaTxt(alics[0])+", ya incluido";

  document.getElementById("tkTot").innerHTML =
    (S.linea.length ? '<div class="tr"><span>'+unid+' artículos, de contado</span><b>'+fmt(bruto)+'</b></div>'+
      (dto>0 ? '<div class="tr"><span>Descuento '+S.desc+'%</span><b>−'+fmt(dto)+'</b></div>' : '')+
      (MULT[S.forma]!==1 ? '<div class="tr"><span>Recargo '+S.forma.toLowerCase()+'</span><b>'+fmt(total-base)+'</b></div>' : '')+
      '<div class="tr"><span style="color:var(--ink-3)">'+etIva+'</span><b style="color:var(--ink-3)">'+fmt(iva)+'</b></div>'+
      // Al mostrador no se le muestra el costo ni el margen en pesos: solo
      // si la venta deja o no deja. El numero es de gerencia.
      '<div class="tr"><span>Lo que deja</span><b><span class="pill '+cls+'">'+
        (mp>=S.objetivo?"deja bien":(mp>=10?"deja poco":"no deja: avisá al encargado"))+'</span></b></div>'
      : '')+
    '<div class="tr big"><span>Total</span><b>'+fmt(total)+'</b></div>';

  const vacio = S.linea.length===0;
  for(const b of ["btnFactura","btnPresu","btnBorrador","btnSinFactura","btnWhatsVta"])
    document.getElementById(b).disabled = vacio;
  pintarBorradores();
}

/* --------------------------------------------------- los borradores --
   Lo que quedó a medio armar y no se emitió. No mueve stock, no mueve
   caja y no gasta número: queda esperando a que el cliente vuelva. */
function pintarBorradores(){
  const c = document.getElementById("borradores");
  if(!c) return;
  if(!S.borradores.length){ c.innerHTML = ""; return; }
  c.innerHTML = '<span class="et">Borradores guardados</span>' + S.borradores.map(b=>{
    const cli = b.cliente ? (CLIENTES.find(x=>x.id===b.cliente)||{}).n : "Consumidor final";
    const tot = b.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
    return '<span class="bo"><b>'+(cli||"Consumidor final").slice(0,22)+'</b> '+
      b.linea.length+' art. · '+fmt(tot)+' · '+b.hora+
      ' <button class="ret" data-ret="'+b.id+'">retomar</button>'+
      '<button data-bx="'+b.id+'" aria-label="borrar" title="borrar">×</button></span>';
  }).join("");
}
document.getElementById("borradores").addEventListener("click",e=>{
  const r = e.target.closest("[data-ret]"), x = e.target.closest("[data-bx]");
  if(x){
    S.borradores = S.borradores.filter(b=>b.id !== x.dataset.bx);
    pintarBorradores(); toast("Borrador tirado."); return;
  }
  if(!r) return;
  const b = S.borradores.find(y=>y.id === r.dataset.ret); if(!b) return;
  if(S.linea.length && !confirm("Hay una venta empezada. ¿La reemplazo por el borrador?")) return;
  S.linea = b.linea.map(l=>({...l}));
  S.cliente = b.cliente; S.desc = b.desc; S.forma = b.forma; S.cond = b.forma; S.comp = null; S.suc = b.suc;
  S.borradores = S.borradores.filter(y=>y.id !== b.id);
  document.getElementById("selSuc").value = S.suc;
  pintarCamposVenta(); pintarDtos(); pintarTicket(); buscar();
  toast("Borrador retomado. Seguí donde habías quedado.");
});

document.getElementById("tkLineas").addEventListener("click",e=>{
  const b = e.target.closest("button[data-m]"); if(!b) return;
  const l = S.linea.find(x=>x.cod===b.dataset.cod); if(!l) return;
  if(b.dataset.m==="+") l.cant++;
  if(b.dataset.m==="-") l.cant = Math.max(1, l.cant-1);
  if(b.dataset.m==="x") S.linea = S.linea.filter(x=>x.cod!==b.dataset.cod);
  pintarTicket();
});

function cerrar(facturada){
  const bruto = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
  const total = (bruto - Math.round(bruto*S.desc/100)) * MULT[S.forma];
  const comp = S.comp || compDe(clienteVta())[0];
  const nro = nroDe(comp);
  const h = new Date();
  const su = sucAct();
  S.ventas.push({
    hora: String(h.getHours()).padStart(2,"0")+":"+String(h.getMinutes()).padStart(2,"0"),
    suc: S.suc, puesto: S.puesto, vend: S.usuario, forma: S.forma, facturada, web:false,
    linea: S.linea.map(l=>({...l}))
  });
  // Descuenta del deposito de ESTA sucursal, no de un stock unico.
  for(const l of S.linea){ const p = prod(l.cod); p.stock = p.stock - l.cant; }
  // El numero solo avanza cuando de verdad se emitio un comprobante.
  if(facturada) S.nro[su.id][letraDe(comp)]++;
  S.linea = []; S.desc = 0; S.comp = null;
  pintarCamposVenta(); pintarDtos(); pintarTicket(); buscar();
  toast(facturada
    ? "Emitida "+comp.replace(/^\\d+\\./,"")+" N° "+nro.slice(2)+" de "+su.n+" por "+fmt(total)+
      ". CAE pedido a ARCA. Descontada del depósito de "+DEPOSITOS[su.dep]+"."
    : "Entregado sin comprobante por "+fmt(total)+" en "+su.n+" ("+S.puesto+"). Queda registrado y marcado como tal, "+
      "y descontado del depósito de "+DEPOSITOS[su.dep]+".");
}

/** Guardar el presupuesto: numera, pero no mueve stock ni caja. */
function guardarPresu(){
  if(!S.linea.length){ toast("No hay nada para presupuestar."); return; }
  const su = sucAct(), comp = compAct(), nro = nroDe(comp);
  const bruto = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
  const total = (bruto - Math.round(bruto*S.desc/100)) * MULT[S.forma];
  S.nro[su.id].X++;
  S.presupuestos++;
  S.presuDe[S.usuario] = (S.presuDe[S.usuario]||0) + 1;
  S.linea = []; S.desc = 0; S.comp = null;
  pintarCamposVenta(); pintarDtos(); pintarTicket();
  toast("Presupuesto "+nro+" de "+su.n+" por "+fmt(total)+". No mueve stock ni caja: queda esperando al cliente.");
}

document.getElementById("btnFactura").addEventListener("click",()=>{
  // El botón principal emite siempre un comprobante de verdad: si arriba
  // decía presupuesto, lo pasa a la factura que corresponde y la emite.
  const comp = compAct();
  if(esPresu(comp)) S.comp = facturaDe();
  cerrar(true);
});
document.getElementById("btnPresu").addEventListener("click",()=>{
  S.comp = "03.Presupuesto X cnc";
  guardarPresu();
});
document.getElementById("btnBorrador").addEventListener("click",()=>{
  if(!S.linea.length){ toast("No hay nada para guardar."); return; }
  const h = new Date();
  S.borradores.unshift({
    id: "b"+Date.now().toString(36),
    hora: String(h.getHours()).padStart(2,"0")+":"+String(h.getMinutes()).padStart(2,"0"),
    suc: S.suc, cliente: S.cliente, desc: S.desc, forma: S.forma,
    linea: S.linea.map(l=>({...l}))
  });
  if(S.borradores.length > 6) S.borradores.pop();
  S.linea = []; S.desc = 0; S.comp = null;
  pintarCamposVenta(); pintarDtos(); pintarTicket();
  toast("Guardado como borrador. No gastó número ni movió stock: lo retomás cuando el cliente vuelva.");
});
document.getElementById("btnSinFactura").addEventListener("click",()=>cerrar(false));
document.getElementById("btnWhatsVta").addEventListener("click",()=>{
  const c = clienteVta(), comp = compAct();
  const bruto = S.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
  const total = (bruto - Math.round(bruto*S.desc/100)) * MULT[S.forma];
  abrirEnvio({
    quien: c ? c.n : "el cliente",
    tit: comp.replace(/^\\d+\\./,""), nro: nroDe(comp),
    lineas: S.linea.map(l=>({p:prod(l.cod), cant:l.cant})),
    total, senia:0
  });
});
document.getElementById("btnMasAcc").addEventListener("click",e=>{
  const caja = document.getElementById("masAcc");
  caja.hidden = !caja.hidden;
  e.target.setAttribute("aria-expanded", String(!caja.hidden));
  e.target.textContent = caja.hidden ? "Otras opciones" : "Menos opciones";
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

/* ======================================================= TECLADO
   Dos listados se manejan igual: el de la venta y el del pedido. En los
   dos, las flechas mueven un renglón marcado y Enter lo suma con la
   cantidad que diga al lado. */
const LISTADOS = [
  {caja:"res",    campo:"q",    sumar:(cod,n)=>sumar(cod,n)},
  {caja:"resPed", campo:"qPed", sumar:(cod,n)=>agregarPed(cod,n)}
];
function listadoActivo(){
  for(const L of LISTADOS){
    const c = document.getElementById(L.caja);
    if(c && c.offsetParent !== null && c.querySelector("tr[data-cod]")) return L;
  }
  return null;
}
function filas(L){ return [...document.getElementById(L.caja).querySelectorAll("tr[data-cod]")]; }
function marcado(L){ return document.getElementById(L.caja).querySelector("tr.marcado"); }

function mover(L, paso){
  const fs = filas(L); if(!fs.length) return;
  const act = marcado(L);
  let i = act ? fs.indexOf(act) + paso : (paso > 0 ? 0 : fs.length - 1);
  if(i < 0) i = fs.length - 1;
  if(i >= fs.length) i = 0;
  for(const t of fs) t.classList.remove("marcado");
  fs[i].classList.add("marcado");
  fs[i].scrollIntoView({block:"nearest"});
}
function sumarMarcado(L){
  const t = marcado(L) || filas(L)[0];
  if(!t) return;
  const cod = t.dataset.cod;
  const campo = document.querySelector("#"+L.caja+' input[data-q="'+cod+'"]');
  L.sumar(cod, campo ? +campo.value : 1);
}

/** La pantalla que se está viendo. */
function vistaActual(){
  for(const v of vistas) if(!document.getElementById("v-"+v).hidden) return v;
  return "mostrador";
}
/** El buscador de la pantalla que se está viendo. */
function buscadorActual(){
  const v = vistaActual();
  if(v === "mostrador") return document.getElementById("q");
  if(v === "pedidos")   return document.getElementById("qPed");
  if(v === "asistente") return document.getElementById("preg");
  if(v === "listas")    return document.getElementById("sUno");
  return null;
}
const escribiendo = e => {
  const t = e.target;
  return t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
};

document.addEventListener("keydown",e=>{
  // Escape cierra lo que esté abierto, en orden de encima hacia abajo.
  if(e.key === "Escape"){
    for(const id of ["cliNuevo","envio"]){
      const m = document.getElementById(id);
      if(m && !m.hidden){ m.hidden = true; e.preventDefault(); return; }
    }
    const L = listadoActivo();
    const t = L && marcado(L);
    if(t){ t.classList.remove("marcado"); e.preventDefault(); return; }
    const b = buscadorActual();
    if(b && b.value){ b.value = ""; b.dispatchEvent(new Event("input",{bubbles:true})); e.preventDefault(); }
    return;
  }

  // Los atajos con Alt andan aunque se esté escribiendo.
  if(e.altKey && !e.ctrlKey && !e.metaKey){
    const k = e.key.toLowerCase();
    const enVenta = vistaActual() === "mostrador";
    if(k === "f" && enVenta){ e.preventDefault(); document.getElementById("btnFactura").click(); return; }
    if(k === "p" && enVenta){ e.preventDefault(); document.getElementById("btnPresu").click(); return; }
    if(k === "b" && enVenta){ e.preventDefault(); document.getElementById("btnBorrador").click(); return; }
    if(k === "n" && enVenta){ e.preventDefault(); abrirCliente(); return; }
    if(k === "w" && enVenta){ e.preventDefault(); document.getElementById("btnWhatsVta").click(); return; }
  }

  const L = listadoActivo();

  // Las flechas mueven el listado aunque el foco esté en el buscador:
  // es justo lo que uno hace, escribir y bajar sin soltar el teclado.
  if(L && (e.key === "ArrowDown" || e.key === "ArrowUp")){
    const t = e.target;
    const enNumero = t && t.tagName === "INPUT" && t.type === "number";
    if(!enNumero){ e.preventDefault(); mover(L, e.key === "ArrowDown" ? 1 : -1); return; }
  }
  // Enter suma el marcado. Si no hay ninguno marcado, el primero.
  if(L && e.key === "Enter" && !e.altKey){
    const t = e.target;
    const el = (t && t.nodeType === 1) ? t : null;
    if(el && el.id === L.campo) return;             // eso ya lo maneja el buscador
    if(el && el.closest("#"+L.caja)) return;        // la cantidad del renglón también
    if(escribiendo(e)) return;
    e.preventDefault(); sumarMarcado(L); return;
  }

  if(escribiendo(e)) return;

  // Barra: ir a buscar. Signo de pregunta: la ayuda.
  if(e.key === "/"){
    const b = buscadorActual();
    if(b){ e.preventDefault(); b.focus(); b.select(); }
    return;
  }
  if(e.key === "?"){
    const t = document.getElementById("teclas");
    if(t.hidden){ t.hidden = false; t.classList.add("abierta"); }
    else t.classList.toggle("abierta");
    return;
  }
});

document.getElementById("teclasX").addEventListener("click",()=>{
  document.getElementById("teclas").hidden = true;
  toast("Los atajos vuelven con la tecla ?");
});

/* ============================================== ALTA DE ARTÍCULO
   Todo junto: lo que se escribe, lo que cuesta y a cuánto se vende. El
   código lo propone el sistema y controla que no esté usado, que es el
   error que después cuesta una semana de desorden. */
const ALTA = { seis:[0,0,0,0,0,0], editando:null };

/** El código que sigue, en la numeración que ya usa el catálogo. */
function skuSugerido(){
  const nums = PRODUCTOS.map(p=>+p.cod.split("+")[0]).filter(n=>!isNaN(n) && n < 90000);
  let n = Math.max(0, ...nums) + 1;
  while(PRODUCTOS.some(p=>p.cod.split("+")[0] === String(n))) n++;
  return String(n);
}
/** Uno alternativo, legible, por si prefieren hablar en letras. */
function skuLegible(){
  const m = (document.getElementById("aMarca").value || "GEN").toUpperCase().replace(/[^A-Z]/g,"").slice(0,3) || "GEN";
  const r = (document.getElementById("aRubro").value || "GEN").toUpperCase().replace(/[^A-Z]/g,"").slice(0,3) || "GEN";
  let i = 1, c;
  do { c = m+"-"+r+"-"+String(i).padStart(3,"0"); i++; } while(PRODUCTOS.some(p=>p.cod===c));
  return c;
}
function revisarSku(){
  const v = document.getElementById("aSku").value.trim();
  const av = document.getElementById("aSkuAviso");
  if(!v){ av.innerHTML = "Hace falta un código."; return false; }
  const usado = PRODUCTOS.find(p=>(p.cod === v || p.cod.split("+")[0] === v) && p.cod !== ALTA.editando);
  if(usado){
    av.innerHTML = '<b style="color:var(--bad)">Ese código ya es de otro artículo:</b> '+usado.tit.slice(0,54)+
      '. Cambialo, o vas a tener dos cosas distintas con el mismo número.';
    return false;
  }
  av.innerHTML = '<b style="color:var(--ok)">Libre.</b> No lo tiene ningún otro artículo.';
  return true;
}

/** Los dos escalones del sistema: costo -> Lista 1 -> Lista 2.
    El precio de contado es la Lista 2 menos el recargo de 1 pago. */
function preciosDeLista(costo, l1, l2){
  // Al peso, no a los $100: estas dos listas son la cuenta del sistema y
  // tienen que dar el mismo numero que da el sistema. 72.600 + 25% es
  // 90.750, no 90.800.
  const lista1 = cent(costo * (1 + (+l1||0)/100));
  const lista2 = cent(lista1 * (1 + (+l2||0)/100));
  return { lista1, lista2, contado: cent(lista2 / RECARGO_1PAGO) };
}
function altaCuenta(){
  const lista = aNum(document.getElementById("aLista").value);
  const l1 = +document.getElementById("aL1").value || 0;
  const l2 = +document.getElementById("aL2").value || 0;
  const iva = +document.getElementById("aIva").value || 21;
  const cont = limD(document.getElementById("aCont").value);
  const ds = ALTA.seis;
  const fac = factorDe(ds);
  const neto = cent(lista * fac);
  const costo = cent(neto * facIva(iva));
  const pr = preciosDeLista(costo, l1, l2);
  const contado = pr.contado;
  const mk = costo > 0 ? Math.round((contado/costo - 1) * 1000)/10 : 0;
  const sum = ds.reduce((a,d)=>a+limD(d), 0);
  document.getElementById("aSeisAviso").innerHTML = lista > 0
    ? "<b>"+cadenaTxt(ds)+" = "+pTxt(Math.round(descEquiv(ds)*10)/10)+"%</b>"+
      (S.modoDesc === "suma"
        ? ", sumados"
        : ", uno sobre otro; sumados darían "+pTxt(Math.round(sum*10)/10)+"%")+
      " · te saca "+fmt2(lista-neto)+" de la lista"
    : "Poné la lista arriba y los descuentos acá: el costo sale solo.";

  const r = (k,v,cls,x) => '<div class="r2'+(cls?" "+cls:"")+'"><span class="k">'+k+'</span>'+
    (x ? '<span class="x">'+x+'</span>' : '')+'<span class="v">'+v+'</span></div>';
  document.getElementById("aCuenta").innerHTML = '<div class="cadena" style="padding:0">'+
    r("Lista sin IVA", fmt2(lista))+
    r("Menos los descuentos", "−"+fmt2(lista-neto))+
    r("Más IVA "+ivaTxt(iva), "+"+fmt2(costo-neto))+
    r("<b>Te cuesta</b>", fmt2(costo), "total", "el costo más el IVA")+
    (cont > 0 ? r("Si le pagás al contado, "+pTxt(cont)+"% menos",
                  fmt2(cent(neto*(1-cont/100)*facIva(iva))), "sub") : "")+
    r("Lista 1, "+pTxt(l1)+"% sobre el costo", fmt2(pr.lista1), null, "+"+fmt2(pr.lista1-costo))+
    r("<b>Lista 2</b>, "+pTxt(l2)+"% sobre la Lista 1", fmt2(pr.lista2), "total", "+"+fmt2(pr.lista2-pr.lista1))+
    (costo>0 && l1 < 10
      ? '<p class="nota" style="padding:8px 0 0;color:var(--bad)"><b>Así no alcanza.</b> Con '+pTxt(l1)+'% sobre el costo no cubrís los cargos de venta ni el costo de tener la plata parada.</p>'
      : '<p class="nota" style="padding:8px 0 0">Lo que termina pagando el cliente depende de cómo pague. Eso se decide en la venta, no acá.</p>')+
  '</div>';
}

const V = (id,v) => { document.getElementById(id).value = v; };
function abrirAlta(p){
  document.getElementById("altaCuerpo").hidden = false;
  document.getElementById("btnAbrirAlta").textContent = "Cerrar";
  document.getElementById("aMarcas").innerHTML =
    [...new Set(PRODUCTOS.map(x=>x.prov))].sort().map(x=>'<option value="'+x+'">').join("");
  document.getElementById("aRubro").innerHTML =
    [...new Set(PRODUCTOS.map(x=>x.rub))].sort().map(r=>'<option>'+r+'</option>').join("");

  for(const id of G_T) document.getElementById(id).value = "";
  document.getElementById("armaTit").hidden = true;
  document.getElementById("btnArmarTit").textContent = "Armarlo";
  ALTA.editando = p ? p.cod : null;
  document.getElementById("altaTit").textContent = p ? "Editar el artículo" : "Artículo nuevo";
  document.getElementById("altaSub").textContent = p
    ? p.cod.split("+")[0]+" · "+p.tit.slice(0,40)
    : "el precio se arma solo mientras escribís";
  document.getElementById("aGuardar").textContent = p ? "Guardar los cambios" : "Guardar el artículo";

  if(p){
    // Los descuentos guardados del artículo; si no tiene, los del proveedor.
    ALTA.seis = (p.seis || cadenaDe(p.prov)).slice(0,6);
    V("aMarca", p.prov); V("aRubro", p.rub); V("aTit", p.tit); V("aDesc", p.desc || "");
    V("aSku", p.cod); V("aLista", plata2(p.lista || 0)); V("aIva", ivaDe(p));
    V("aCont", p.dctoCont || 0);
    document.getElementById("aPromo").checked = !!p.promo;
    V("aCodProv", p.codProv || "");
    V("aStockBA", p.dep.BA); V("aStockTS", p.dep.TS);
    // Si nunca se le pusieron las dos listas, se deducen del precio que tiene
    // hoy: así abre mostrando lo que de verdad vale, no un precio inventado.
    const l1 = p.l1 != null ? p.l1 : 25;
    const base = redondear(p.costo * (1 + l1/100));
    V("aL1", l1);
    V("aL2", p.l2 != null ? p.l2 : Math.round((p.unPago/base - 1) * 1000)/10);
  } else {
    ALTA.seis = CADENA_BASE.slice(0,6);
    V("aMarca",""); V("aTit",""); V("aDesc","");
    V("aStockBA",0); V("aStockTS",0); V("aL1",25); V("aL2",25); V("aIva",21); V("aCont",0);
    V("aLista","0,00");
    document.getElementById("aPromo").checked = false;
    V("aCodProv","");
    V("aSku", skuSugerido());
  }
  while(ALTA.seis.length < 6) ALTA.seis.push(0);
  pintarAltaSeis();
  revisarSku(); altaCuenta();
  document.getElementById("altaCuerpo").scrollIntoView({block:"nearest", behavior:"smooth"});
  document.getElementById(p ? "aTit" : "aMarca").focus();
}
function cerrarAlta(){
  document.getElementById("altaCuerpo").hidden = true;
  document.getElementById("btnAbrirAlta").textContent = "Cargar uno";
  ALTA.editando = null;
}
document.getElementById("btnAbrirAlta").addEventListener("click",()=>{
  if(document.getElementById("altaCuerpo").hidden || ALTA.editando) abrirAlta(null); else cerrarAlta();
});
document.getElementById("aCancelar").addEventListener("click", cerrarAlta);

function pintarAltaSeis(){
  document.getElementById("aSeis").innerHTML = ALTA.seis.map((d,i)=>
    '<div class="d'+(limD(d)>0?" puesto":"")+'">'+
      '<span class="et">'+ET_D[i]+'</span>'+
      '<input type="number" min="0" max="95" step="0.5" value="'+limD(d)+'" data-a="'+i+'" aria-label="descuento '+(i+1)+'">'+
      '<span class="pc">%</span></div>').join("");
}
document.getElementById("aSeis").addEventListener("input",e=>{
  const i = e.target.closest("input[data-a]"); if(!i) return;
  ALTA.seis[+i.dataset.a] = limD(i.value);
  i.parentElement.classList.toggle("puesto", limD(i.value) > 0);
  altaCuenta();
});
for(const id of ["aLista","aL1","aL2","aCont"]) document.getElementById(id).addEventListener("input", altaCuenta);
document.getElementById("aIva").addEventListener("change", altaCuenta);
document.getElementById("aLista").addEventListener("blur",e=>{
  e.target.value = plata2(aNum(e.target.value));
  altaCuenta();
});
/* ---- el armador de título ---- */
const G_T = ["gTipo","gModelo","gMedida","gDetalle"];
function armarTitulo(){
  const g = id => document.getElementById(id).value.trim().toUpperCase();
  const t = [g("gTipo"), document.getElementById("aMarca").value.trim().toUpperCase(),
             g("gModelo"), g("gMedida")].filter(Boolean).join(" ");
  const det = g("gDetalle");
  return det ? (t ? t+" · "+det : det) : t;
}
function escribirTitulo(){
  const t = armarTitulo();
  if(!t) return;
  const campo = document.getElementById("aTit");
  campo.value = t;
  campo.dispatchEvent(new Event("input", {bubbles:true}));
}
for(const id of G_T) document.getElementById(id).addEventListener("input", escribirTitulo);
document.getElementById("btnArmarTit").addEventListener("click",()=>{
  const caja = document.getElementById("armaTit");
  caja.hidden = !caja.hidden;
  document.getElementById("btnArmarTit").textContent = caja.hidden ? "Armarlo" : "Listo";
  if(!caja.hidden){
    // Los tipos que ya usa el catálogo, para no inventar uno nuevo cada vez.
    document.getElementById("gTipos").innerHTML =
      [...new Set(PRODUCTOS.map(p=>p.tit.split(" ")[0]))].sort()
        .map(t=>'<option value="'+t+'">').join("");
    document.getElementById("gTipo").focus();
  }
});

document.getElementById("aSku").addEventListener("input", revisarSku);
document.getElementById("aOtroSku").addEventListener("click",()=>{
  const v = document.getElementById("aSku").value.trim();
  document.getElementById("aSku").value = /^\\d+$/.test(v) ? skuLegible() : skuSugerido();
  revisarSku();
});
// La marca y el rubro, en mayúsculas, como está todo el catálogo.
document.getElementById("aMarca").addEventListener("blur",e=>{ e.target.value = e.target.value.toUpperCase().trim(); });
document.getElementById("aTit").addEventListener("input",e=>{
  const v = e.target.value;
  const av = document.getElementById("aTitAviso");
  const marca = document.getElementById("aMarca").value.trim().toUpperCase();
  if(v.length && marca && !plano(v).includes(plano(marca)))
    av.innerHTML = '<b style="color:var(--warn)">Le falta la marca.</b> Si el título no dice '+marca+
      ', el mostrador no lo encuentra buscando por marca.';
  else if(v.length && v.length < 18)
    av.innerHTML = '<b style="color:var(--warn)">Muy corto.</b> Agregale la medida o el tipo: así se distingue de los parecidos.';
  else
    av.innerHTML = "Como va a verlo el mostrador y la web. En mayúsculas, con la capacidad y el tipo.";
});
document.getElementById("aDesc").addEventListener("input",e=>{
  const n = e.target.value.trim().length;
  document.getElementById("aDescAviso").innerHTML = n === 0
    ? "Sin descripción se puede vender, pero en la web rinde la mitad."
    : (n < 60 ? n+" caracteres. Con 150 o más la web lo muestra mejor." : '<b style="color:var(--ok)">'+n+' caracteres.</b> Alcanza.');
});

document.getElementById("aGuardar").addEventListener("click",()=>{
  const cod = document.getElementById("aSku").value.trim();
  const tit = document.getElementById("aTit").value.trim().toUpperCase();
  const prov = document.getElementById("aMarca").value.trim().toUpperCase();
  const rub = document.getElementById("aRubro").value;
  const lista = aNum(document.getElementById("aLista").value);
  const l1 = +document.getElementById("aL1").value || 0;
  const l2 = +document.getElementById("aL2").value || 0;
  const iva = +document.getElementById("aIva").value || 21;

  if(!revisarSku()){ document.getElementById("aSku").focus(); return; }
  if(tit.length < 6){ toast("Falta el título del artículo."); document.getElementById("aTit").focus(); return; }
  if(!prov){ toast("Falta la marca o el proveedor."); document.getElementById("aMarca").focus(); return; }
  if(lista <= 0){ toast("Falta la lista del proveedor: sin eso no hay costo."); document.getElementById("aLista").focus(); return; }

  const costo = costoDe(lista, ALTA.seis, null, iva);
  const pr = preciosDeLista(costo, l1, l2);
  const contado = pr.contado;
  const datos = {
    cod, tit, rub, prov,
    desc: document.getElementById("aDesc").value.trim(),
    lista, seis: ALTA.seis.slice(), l1, l2, iva,
    dctoCont: limD(document.getElementById("aCont").value),
    promo: document.getElementById("aPromo").checked,
    codProv: document.getElementById("aCodProv").value.trim().toUpperCase(),
    markup: Math.round((contado/costo - 1) * 1000)/10,
    costo, contado, unPago: pr.lista2,
    dep: { BA: Math.max(0, +document.getElementById("aStockBA").value||0),
           TS: Math.max(0, +document.getElementById("aStockTS").value||0) },
    propio: plano(cod+" "+document.getElementById("aCodProv").value+" "+tit+" "+rub+" "+prov+(document.getElementById("aPromo").checked?" promo promocion":"")),
    blob: plano(cod+" "+document.getElementById("aCodProv").value+" "+tit+" "+rub+" "+prov+" "+(ALIAS[rub]||"")+(document.getElementById("aPromo").checked?" promo promocion":""))
  };

  if(ALTA.editando){
    const p = PRODUCTOS.find(x=>x.cod === ALTA.editando);
    if(!p){ toast("Ese artículo ya no está."); cerrarAlta(); return; }
    const antes = p.contado;
    Object.assign(p, datos);
    p.tocado = true; guardarCatalogo();
    llenarSelects(); pintarProd(); buscar(); pintarTicket();
    cerrarAlta();
    toast(cod+" guardado. "+(antes===contado
      ? "La Lista 2 quedó igual."
      : "La Lista 2 pasa a "+fmt(pr.lista2)+"."));
    return;
  }

  const p = ponerStock(Object.assign({ costoBase: costo, cargado: true }, datos));
  S.cadenas[prov] = S.cadenas[prov] || ALTA.seis.slice();
  PRODUCTOS.push(p);
  guardarCatalogo();
  llenarSelects(); pintarProd(); buscar();
  cerrarAlta();
  toast(cod+" · "+tit.slice(0,40)+" cargado. Cuesta "+fmt(costo)+" con IVA y la Lista 2 queda en "+fmt(pr.lista2)+".");
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
  const toks = plano(document.getElementById("fBusca").value).split(/\\s+/).filter(Boolean);
  const saca = ORD_PROD[S.ordProd.col] || ORD_PROD.margen;
  const lista = PRODUCTOS
    .filter(p=>(!fp||p.prov===fp) && (!fr||p.rub===fr) && (!solo || margen(p) < S.objetivo)
             && toks.every(t=>p.propio.includes(t)))
    .sort((a,b)=>{
      const x = saca(a), y = saca(b);
      const c = (typeof x === "string") ? x.localeCompare(y, "es") : x - y;
      return S.ordProd.asc ? c : -c;
    });
  for(const th of document.querySelectorAll("#v-productos th[data-ord]")){
    th.classList.toggle("ord", th.dataset.ord === S.ordProd.col);
    th.classList.toggle("asc", th.dataset.ord === S.ordProd.col && S.ordProd.asc);
  }

  document.getElementById("tbProd").innerHTML = lista.map(p=>{
    const m = margen(p);
    return '<tr><td class="num" style="font-size:12.5px">'+p.cod.split("+")[0]+
      (p.codProv?'<small style="display:block;color:var(--ink-3);font-weight:500">'+p.codProv+'</small>':'')+'</td>'+
      '<td class="nom">'+p.tit+
        (p.promo?' <span class="pill p-ok">promo</span>':'')+
        (p.real?' <span class="pill p-n">costo real</span>':'')+'<small>'+p.rub+'</small></td>'+
      '<td>'+p.prov+'</td>'+
      '<td class="r"><input class="ed" type="number" data-cod="'+p.cod+'" value="'+netoDe(p)+'" step="100" min="0" aria-label="costo sin IVA"></td>'+
      '<td class="r"><select class="ed" data-iva="'+p.cod+'" aria-label="IVA del artículo">'+
        ALICUOTAS.map(a=>'<option value="'+a+'"'+(a===ivaDe(p)?" selected":"")+'>'+ivaTxt(a)+'</option>').join("")+
      '</select><small style="display:block;color:var(--ink-3)">+'+fmt(p.costo-netoDe(p))+'</small>'+
      '<small style="display:block;color:var(--ink-2);font-weight:600">= '+fmt(p.costo)+'</small></td>'+
      '<td class="r">'+fmt(p.contado)+'</td><td class="r" style="color:var(--ink-3)">'+fmt(p.unPago)+'</td>'+
      '<td class="r" style="font-weight:600;color:'+(m<0?"var(--bad)":(m<S.objetivo?"var(--warn)":"var(--ok)"))+'">'+pct(m)+'</td>'+
      '<td>'+estadoPill(m)+'</td><td class="r">'+p.stock+'</td>'+
      '<td class="r"><button class="lapiz" data-ed="'+p.cod+'" title="Editar este artículo" aria-label="editar '+p.cod+'">'+
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" aria-hidden="true">'+
        '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg></button></td></tr>';
  }).join("") || '<tr><td colspan="11" class="vacio">Nada con esos filtros.</td></tr>';

  const bajo = PRODUCTOS.filter(p=>margen(p)<0);
  const flojos = PRODUCTOS.filter(p=>{const m=margen(p); return m>=0 && m<S.objetivo;});
  const mios = PRODUCTOS.filter(p=>p.cargado || p.tocado).length;
  document.getElementById("prodPie").innerHTML =
    "Se ven <b>"+lista.length+"</b> de "+PRODUCTOS.length+" artículos. En todo el catálogo: <b>"+bajo.length+
    "</b> se venden por debajo del costo y <b>"+flojos.length+"</b> no llegan al "+S.objetivo+
    "%. El costo se puede corregir acá mismo y el margen se recalcula solo."+
    (mios ? ' <b>'+mios+'</b> '+(mios===1 ? "artículo lo cargaste o lo editaste vos y queda guardado"
                                          : "artículos los cargaste o los editaste vos y quedan guardados")+
            ' en esta computadora. <button class="b3" id="btnOlvidar" style="padding:3px 11px;font-size:12px;margin-left:4px">Volver al catálogo original</button>'
          : "");
}
for(const id of ["fProv","fRub","fObj","fFlojos"]) document.getElementById(id).addEventListener("input",pintarProd);
/** De dónde sale el número (o el texto) de cada columna. */
const ORD_PROD = {
  cod:  p=>p.cod,      tit:  p=>p.tit,     prov: p=>p.prov,
  neto: p=>netoDe(p),  costo:p=>p.costo,   contado:p=>p.contado,
  unPago:p=>p.unPago,  margen:p=>margen(p), stock:p=>p.stock
};
document.querySelector("#v-productos thead").addEventListener("click",e=>{
  const th = e.target.closest("th[data-ord]"); if(!th) return;
  const col = th.dataset.ord;
  // La misma otra vez da vuelta el orden; una nueva arranca de menor a mayor.
  S.ordProd = (S.ordProd.col === col) ? {col, asc: !S.ordProd.asc} : {col, asc: true};
  pintarProd();
});
document.getElementById("fBusca").addEventListener("input", pintarProd);
document.getElementById("prodPie").addEventListener("click",e=>{
  if(!e.target.closest("#btnOlvidar")) return;
  if(!confirm("¿Borro los artículos que cargaste y los cambios que hiciste, y vuelvo al catálogo original?")) return;
  try{ localStorage.removeItem(GUARDA); }catch(e2){}
  location.reload();
});
document.getElementById("tbProd").addEventListener("click",e=>{
  const b = e.target.closest("button[data-ed]"); if(!b) return;
  const p = PRODUCTOS.find(x=>x.cod === b.dataset.ed);
  if(p) abrirAlta(p);
});
document.getElementById("tbProd").addEventListener("change",e=>{
  const sv = e.target.closest("select[data-iva]");
  if(sv){
    const p = prod(sv.dataset.iva); if(!p) return;
    const neto = netoDe(p);                 // el neto no cambia: cambia el IVA
    p.iva = +sv.value;
    p.costo = Math.round(neto * facIva(p.iva));
    p.tocado = true; guardarCatalogo();
    pintarProd(); pintarTicket();
    toast(p.cod.split("+")[0]+" pasa a IVA "+ivaTxt(p.iva)+". Cuesta "+fmt(p.costo)+" con IVA.");
    return;
  }
  const i = e.target.closest("input[data-cod]"); if(!i) return;
  const p = prod(i.dataset.cod); if(!p) return;
  const neto = Math.max(0, +i.value||0);
  p.costo = Math.round(neto * facIva(ivaDe(p)));
  p.tocado = true; guardarCatalogo();
  pintarProd();
  toast("Costo de "+p.cod.split("+")[0]+": "+fmt(neto)+" sin IVA, "+fmt(p.costo)+" con IVA. El margen ya está recalculado.");
});

/* ===================================================== LISTAS */
/* El formador de precios. Tres preguntas: a quiénes, qué les cambio, y
   qué pasa si lo hago. Nada se toca hasta el último botón. */
const PF = { quien:"prov", modo:"sube", uno:null, seis:[0,0,0,0,0,0] };

/* --------------------------------------------------- paso 1: a quiénes */
document.getElementById("sQuien").addEventListener("click",e=>{
  const b = e.target.closest("button[data-q]"); if(!b) return;
  for(const x of document.querySelectorAll("#sQuien button")) x.setAttribute("aria-pressed", String(x===b));
  PF.quien = b.dataset.q;
  document.getElementById("qProv").hidden = PF.quien !== "prov";
  document.getElementById("qSku").hidden  = PF.quien !== "sku";
  document.getElementById("qUno").hidden  = PF.quien !== "uno";
  cargarSeis(); pintarCadena();
});

/** Los artículos a los que se les va a cambiar algo. */
function alcance(){
  if(PF.quien === "prov")
    return PRODUCTOS.filter(p => p.prov === document.getElementById("sProv").value);
  if(PF.quien === "uno")
    return PF.uno ? [PF.uno] : [];
  const cods = document.getElementById("sSku").value
    .split(/[\\s,;]+/).map(x=>x.trim()).filter(Boolean);
  const out = [], faltan = [];
  for(const c of cods){
    const p = PRODUCTOS.find(x => x.cod === c || x.cod.split("+")[0] === c);
    if(p){ if(!out.includes(p)) out.push(p); } else faltan.push(c);
  }
  document.getElementById("skuAviso").innerHTML = !cods.length
    ? "Pegá los códigos y te digo cuáles reconozco."
    : '<b style="color:'+(faltan.length?"var(--warn)":"var(--ok)")+'">'+out.length+' de '+cods.length+' reconocidos.</b>'+
      (faltan.length ? " No encontré: "+faltan.slice(0,8).join(", ")+(faltan.length>8?"…":"") : "");
  return out;
}
document.getElementById("sSku").addEventListener("input", ()=>{ alcance(); pintarCadena(); });
document.getElementById("sProv").addEventListener("change", ()=>{ cargarSeis(); pintarCadena(); });

/* buscar un artículo solo */
document.getElementById("sUno").addEventListener("input",e=>{
  const q = plano(e.target.value.trim());
  const caja = document.getElementById("sUnoRes");
  if(!q){ caja.innerHTML = ""; return; }
  const hits = encontrar(q.split(/\\s+/).filter(Boolean)).hits.slice(0,6);
  caja.innerHTML = hits.map(({p})=>
    '<button class="item" data-u="'+p.cod+'">'+
      '<span class="cod">'+p.cod.split("+")[0]+'</span>'+
      '<span><span class="tit"><span>'+p.tit+'</span></span>'+
      '<span class="meta"><span>'+p.prov+'</span><span>lista '+fmt(p.lista)+'</span></span></span>'+
      '<span class="pre"><b>'+fmt(p.contado)+'</b></span></button>').join("")
    || '<div class="vacio" style="padding:14px">Nada con eso.</div>';
});
document.getElementById("sUnoRes").addEventListener("click",e=>{
  const b = e.target.closest("button[data-u]"); if(!b) return;
  PF.uno = prod(b.dataset.u);
  document.getElementById("sUnoRes").innerHTML = "";
  document.getElementById("sUno").value = PF.uno.tit;
  document.getElementById("unoElegido").innerHTML =
    '<b>'+PF.uno.cod.split("+")[0]+' · '+PF.uno.tit+'</b>';
  cargarSeis(); pintarCadena();
});

/* ---------------------------------------------- paso 2: qué les cambio */
document.getElementById("sModo").addEventListener("click",e=>{
  const b = e.target.closest("button[data-m]"); if(!b) return;
  for(const x of document.querySelectorAll("#sModo button")) x.setAttribute("aria-pressed", String(x===b));
  PF.modo = b.dataset.m;
  document.getElementById("cSube").hidden = PF.modo !== "sube";
  document.getElementById("cDesc").hidden = PF.modo !== "desc";
  document.getElementById("cMk").hidden   = PF.modo !== "mk";
  if(PF.modo === "desc") cargarSeis();
  if(PF.modo === "mk"){
    const a = alcance();
    if(a.length) document.getElementById("sMk").value = Math.round(markupDe(a[0])*10)/10;
    avisoMarkup();
  }
});

/** Trae a los seis casilleros la cadena que rige para lo que está elegido. */
function cargarSeis(){
  const a = alcance();
  const prov = PF.quien === "prov" ? document.getElementById("sProv").value
             : (a.length ? a[0].prov : null);
  PF.seis = (prov ? cadenaDe(prov) : CADENA_BASE).slice(0,6);
  while(PF.seis.length < 6) PF.seis.push(0);
  pintarSeis();
}
const ET_D = ["Descuento 1","Descuento 2","Descuento 3","Descuento 4","Descuento 5","Descuento 6"];
function pintarSeis(){
  document.getElementById("seisD").innerHTML = PF.seis.map((d,i)=>
    '<div class="d'+(limD(d)>0?" puesto":"")+'">'+
      '<span class="et">'+ET_D[i]+'</span>'+
      '<input type="number" min="0" max="95" step="0.5" value="'+limD(d)+'" data-i="'+i+'" aria-label="descuento '+(i+1)+'">'+
      '<span class="pc">%</span></div>').join("");
  pintarComparar();
}
document.getElementById("seisD").addEventListener("input",e=>{
  const i = e.target.closest("input[data-i]"); if(!i) return;
  PF.seis[+i.dataset.i] = limD(i.value);
  i.parentElement.classList.toggle("puesto", limD(i.value) > 0);
  pintarComparar();
});
/** Los dos juegos de botones dicen lo mismo, así que se mueven juntos. */
function modoDescA(modo){
  S.modoDesc = modo;
  for(const caja of ["sModoDesc","aModoDesc"]){
    const c = document.getElementById(caja); if(!c) continue;
    for(const x of c.querySelectorAll("button[data-d]"))
      x.setAttribute("aria-pressed", String(x.dataset.d === modo));
  }
  pintarComparar(); pintarCadena(); altaCuenta();
}
document.getElementById("sModoDesc").addEventListener("click",e=>{
  const b = e.target.closest("button[data-d]"); if(!b) return;
  modoDescA(b.dataset.d);
});
document.getElementById("aModoDesc").addEventListener("click",e=>{
  const b = e.target.closest("button[data-d]"); if(!b) return;
  modoDescA(b.dataset.d);
});

/** Los dos resultados al lado, porque la diferencia es plata. */
function pintarComparar(){
  const ds = PF.seis;
  const fc = factorDe(ds, "cascada"), fs = factorDe(ds, "suma");
  const a = alcance();
  const ej = a.length ? a[0] : null;
  const puestos = ds.filter(d=>limD(d)>0).length;
  const cc = ej ? costoDe(ej.lista, ds, "cascada", ivaDe(ej)) : null;
  const cs = ej ? costoDe(ej.lista, ds, "suma", ivaDe(ej)) : null;
  const dif = (cc!=null && cs!=null) ? cc - cs : null;

  document.getElementById("compararDesc").innerHTML =
    '<div class="c'+(S.modoDesc==="cascada"?" elegido":"")+'">'+
      '<div class="k">En cascada</div>'+
      '<div class="v">'+pct(-(1-fc)*100).replace("−","")+' de descuento</div>'+
      '<div class="n">cada uno sobre lo que quedó'+(cc!=null?' · costo '+fmt(cc):'')+'</div></div>'+
    '<div class="c'+(S.modoDesc==="suma"?" elegido":"")+'">'+
      '<div class="k">Sumados</div>'+
      '<div class="v">'+pct(-(1-fs)*100).replace("−","")+' de descuento</div>'+
      '<div class="n">se suman y se descuenta una vez'+(cs!=null?' · costo '+fmt(cs):'')+'</div></div>'+
    (puestos < 2
      ? '<div class="dif">Con un solo descuento las dos cuentas dan igual. La diferencia aparece del segundo en adelante.</div>'
      : '<div class="dif">'+
        (dif!=null ? 'Son <b>'+fmt(Math.abs(dif))+'</b> de diferencia por unidad. ' : '')+
        'Fijate en la factura del proveedor cuál de las dos usa y elegí esa.</div>');
}

function avisoMarkup(){
  const a = alcance();
  if(!a.length){ document.getElementById("mkAviso").textContent =
    "Lo que se le pone encima al costo para llegar al precio de contado."; return; }
  const mk = +document.getElementById("sMk").value || 0;
  const p = a[0];
  document.getElementById("mkAviso").innerHTML =
    'Con '+mk+'% sobre el costo, <b>'+p.tit.slice(0,38)+'</b> pasaría de '+fmt(p.contado)+
    ' a <b>'+fmt(precioDe(p.costo, mk))+'</b> de contado, y a '+
    fmt(redondear(precioDe(p.costo, mk)*RECARGO_1PAGO))+' en 1 pago. '+
    'El margen sobre el costo es justamente ese '+mk+'%.';
}
document.getElementById("sMk").addEventListener("input", avisoMarkup);

/* ------------------------------------ la cadena, escrita como una cuenta */
function pintarCadena(){
  const a = alcance();
  const p = a.length ? a[0] : null;
  const de = document.getElementById("cadenaDe");
  if(!p){
    de.textContent = "elegí algo arriba";
    document.getElementById("cadenaCuerpo").innerHTML =
      '<div class="vacio" style="padding:18px">Elegí un proveedor, pegá unos códigos o buscá un artículo y te muestro de dónde sale cada peso de su precio.</div>';
    return;
  }
  const ds = cadenaDe(p.prov);
  const fac = factorDe(ds);
  const neto = Math.round(p.lista * fac);
  const costo = Math.round(neto * facIva(ivaDe(p)));
  const mk = markupDe(p);
  const r = (k,v,cls) => '<div class="r2'+(cls?" "+cls:"")+'"><span class="k">'+k+'</span><span class="v">'+v+'</span></div>';

  de.innerHTML = a.length>1 ? "ejemplo: "+p.cod.split("+")[0] : p.cod.split("+")[0];
  document.getElementById("cadenaCuerpo").innerHTML =
    r("<b>"+p.tit+"</b>", p.prov, "sub")+
    r("Lista del proveedor, sin IVA", fmt2(p.lista))+
    r("Descuentos: "+cadenaTxt(ds)+" ("+(S.modoDesc==="cascada"?"en cascada":"sumados")+")",
      "−"+fmt(p.lista-neto))+
    r("Queda neto", fmt(neto), "sub")+
    r("IVA "+ivaTxt(ivaDe(p)), "+"+fmt(costo-neto))+
    r("<b>Lo que te cuesta, con IVA</b>", fmt(costo), "total")+
    r("Markup "+mk+"% sobre el costo", "+"+fmt(precioDe(costo,mk)-costo))+
    r("<b>Precio de contado</b>", fmt(precioDe(costo,mk)), "total")+
    r("Recargo 13,64% si paga en 1 pago", "+"+fmt(redondear(precioDe(costo,mk)*RECARGO_1PAGO)-precioDe(costo,mk)), "sub")+
    r("Precio de 1 pago", fmt(redondear(precioDe(costo,mk)*RECARGO_1PAGO)), "sub")+
    (Math.abs(costo - p.costo) > 2
      ? '<p class="nota" style="padding:10px 0 0">El costo cargado hoy es '+fmt(p.costo)+
        '. La cuenta de arriba da '+fmt(costo)+', porque el modo de descuento elegido no es el mismo con el que se cargó. Aplicá el cambio para emparejarlos.</p>'
      : '');
}

/* ------------------------------------------- paso 3: qué pasa si lo hago */
document.getElementById("btnSim").addEventListener("click",()=>{
  const a = alcance();
  if(!a.length){ toast("Primero elegí a quiénes les cambiás el precio."); return; }
  const obj = S.objetivo = +document.getElementById("fObj").value || 35;

  const filas = a.map(p=>{
    let lista = p.lista, ds = cadenaDe(p.prov).slice(), mk = markupDe(p);
    if(PF.modo === "sube") lista = Math.round(lista * (1 + (+document.getElementById("sPct").value||0)/100));
    if(PF.modo === "desc") ds = PF.seis.slice();
    if(PF.modo === "mk")   mk = +document.getElementById("sMk").value || 0;
    const nuevo = costoDe(lista, ds, null, ivaDe(p));
    const sugerido = precioDe(nuevo, mk);
    return {
      p, lista, ds, mk, nuevo, sugerido,
      mQueda: (p.contado - nuevo)/nuevo*100,
      sube: (sugerido - p.contado)/p.contado*100
    };
  }).sort((x,y)=>x.mQueda - y.mQueda);

  S.sim = {filas, quien: textoAlcance(a)};

  const bajoCosto = filas.filter(f=>f.mQueda<0).length;
  const flojos = filas.filter(f=>f.mQueda>=0 && f.mQueda<obj).length;
  const enStock = filas.filter(f=>f.mQueda<0).reduce((acc,f)=>acc+(f.p.contado-f.nuevo)*f.p.stock,0);

  document.getElementById("simResumen").hidden = false;
  document.getElementById("simResumen").innerHTML =
    '<div><b>'+filas.length+'</b>'+(filas.length===1?"artículo":"artículos")+' de '+S.sim.quien+'</div>'+
    '<div style="color:var(--bad)"><b>'+bajoCosto+'</b>'+(bajoCosto===1?"quedaría":"quedarían")+' abajo del costo</div>'+
    '<div style="color:var(--warn)"><b>'+flojos+'</b>no '+(flojos===1?"llegaría":"llegarían")+' al '+obj+'%</div>'+
    '<div><b>'+fmt(Math.abs(enStock))+'</b>'+(enStock<0?"se pierden":"quedan")+' con el stock que hay</div>';

  document.getElementById("tbSim").innerHTML = filas.map(f=>
    '<tr><td class="num" style="font-size:12.5px">'+f.p.cod.split("+")[0]+'</td>'+
    '<td class="nom">'+f.p.tit+'</td>'+
    '<td class="r">'+fmt(f.lista)+(f.lista!==f.p.lista?'<small style="display:block;color:var(--ink-3)">era '+fmt(f.p.lista)+'</small>':'')+'</td>'+
    '<td class="r" style="color:var(--ink-3)">'+fmt(f.p.costo)+'</td>'+
    '<td class="r" style="font-weight:700">'+fmt(f.nuevo)+'</td>'+
    '<td class="r">'+fmt(f.p.contado)+'</td>'+
    '<td class="r" style="color:var(--accent);font-weight:700">'+fmt(f.sugerido)+'</td>'+
    '<td class="r" style="font-weight:600;color:'+(f.mQueda<0?"var(--bad)":(f.mQueda<obj?"var(--warn)":"var(--ok)"))+'">'+pct(f.mQueda)+'</td>'+
    '<td class="r">'+pct(f.sube)+'</td></tr>').join("");

  document.getElementById("simAcc").hidden = false;
  pintarCadena();
  toast(filas.length+" "+(filas.length===1?"artículo revisado":"artículos revisados"));
});

function textoAlcance(a){
  if(PF.quien === "prov") return document.getElementById("sProv").value;
  if(PF.quien === "uno")  return "un artículo";
  return "la lista de códigos";
}

/* ------------------------------------------------------- aplicar ------- */
function aplicar(todo){
  if(!S.sim || !S.sim.filas.length) return;
  for(const f of S.sim.filas){
    f.p.lista  = f.lista;
    f.p.markup = f.mk;
    f.p.costo  = f.nuevo;
    if(todo){
      f.p.contado = f.sugerido;
      f.p.unPago  = redondear(f.sugerido * RECARGO_1PAGO);
    }
    f.p.tocado = true;
  }
  guardarCatalogo();
  // Si se tocó la cadena de un proveedor entero, queda guardada para él.
  if(PF.modo === "desc" && PF.quien === "prov")
    S.cadenas[document.getElementById("sProv").value] = PF.seis.slice();
  toast(todo
    ? "Costos y precios de "+S.sim.quien+" actualizados. El mostrador y la web ya venden con los nuevos."
    : "Costos nuevos de "+S.sim.quien+" aplicados. Los precios quedaron como estaban: mirá el margen en Gerencia.");
  document.getElementById("btnSim").click();
  pintarProd(); pintarTicket(); buscar();
}
document.getElementById("btnAplicarCosto").addEventListener("click",()=>aplicar(false));
document.getElementById("btnAplicarTodo").addEventListener("click",()=>aplicar(true));

/* ======================================================= CAJA */
function barra(et, v, max, f2){
  return '<div class="barra"><span class="et">'+et+'</span>'+
    '<span class="pista"><span class="fill'+(f2?" f2":"")+'" style="width:'+(max>0?Math.max(2,v/max*100):0).toFixed(1)+'%"></span></span>'+
    '<span class="vl">'+fmt(v)+'</span></div>';
}
function pintarCajaSucs(){
  document.getElementById("cajaSucs").innerHTML =
    [["","Todas"]].concat(SUCURSALES.map(x=>[x.id,x.n]))
      .map(([id,n])=>'<button data-cs="'+id+'" aria-pressed="'+(id===S.cajaSuc)+'">'+n+'</button>').join("");
}
document.getElementById("cajaSucs").addEventListener("click",e=>{
  const b = e.target.closest("button[data-cs]"); if(!b) return;
  S.cajaSuc = b.dataset.cs;
  pintarCaja();
});

function pintarCaja(){
  pintarCajaSucs();
  pintarFiltroVend();
  pintarHoy();
  const vs = ventasCaja();
  const cobrado = vs.reduce((a,v)=>a+ventaCobrado(v),0);
  const base = vs.reduce((a,v)=>a+ventaBase(v),0);
  const marg = vs.reduce((a,v)=>a+ventaMargen(v),0);

  document.getElementById("cajaTiles").innerHTML =
    tile("Entró hoy", fmt(cobrado), vs.length+" ventas en "+(S.cajaSuc?sucDe(S.cajaSuc).n:"las tres")) +
    tile("Valor de contado", fmt(base), "sin el recargo de tarjeta") +
    tile("Ticket promedio", fmt(cobrado/vs.length), "por venta") +
    tile("Presupuestos abiertos", fmt0(S.presupuestos), "sin cobrar todavía, de las tres") +
    tile("Margen bruto", fmt(marg), pct(marg/(base-marg)*100)+" sobre el costo");

  document.getElementById("cajaCount").textContent =
    vs.length + " ventas" + (S.cajaSuc ? " de "+sucDe(S.cajaSuc).n : "");
  document.getElementById("tbCaja").innerHTML = vs.slice().reverse().map(v=>{
    const n = v.linea.reduce((a,l)=>a+l.cant,0);
    const q = v.linea.map(l=>prod(l.cod).tit).join(" + ");
    return '<tr><td class="num" style="font-size:12.5px">'+v.hora+'</td>'+
      '<td style="font-size:12.5px;color:var(--ink-2);white-space:nowrap">'+sucDe(v.suc).n+'</td>'+
      '<td style="font-weight:600;white-space:nowrap">'+(v.vend||"—")+'</td>'+
      '<td>'+(v.web?'<span class="pill p-n">web</span> ':'')+v.puesto.replace("Mostrador ","M")+'</td>'+
      '<td class="nom" style="min-width:260px">'+n+' art. <small>'+q.slice(0,72)+(q.length>72?"…":"")+'</small></td>'+
      '<td style="font-size:12.5px;color:var(--ink-2)">'+formaCorta(v.forma)+'</td>'+
      '<td>'+(v.facturada?'<span class="pill p-ok">factura</span>':'<span class="pill p-n">sin factura</span>')+'</td>'+
      '<td class="r">'+fmt(ventaCobrado(v))+'</td></tr>';
  }).join("");

  const pagos = {};
  for(const v of vs) pagos[v.forma] = (pagos[v.forma]||0) + ventaCobrado(v);
  const mx1 = Math.max(...Object.values(pagos));
  document.getElementById("porPago").innerHTML = Object.entries(pagos)
    .sort((a,b)=>b[1]-a[1]).map(([k,v])=>barra(formaCorta(k), v, mx1)).join("");

  const pu = {};
  for(const v of vs) pu[v.puesto] = (pu[v.puesto]||0) + ventaCobrado(v);
  const mx2 = Math.max(...Object.values(pu));
  document.getElementById("porPuesto").innerHTML = Object.keys(pu).sort()
    .map(k=>barra(k, pu[k], mx2)).join("");

  // Quien vendio cuanto. Sin el filtro de vendedor puesto, para poder
  // comparar: si no, se veria una sola barra.
  const sinV = S.cajaSuc ? S.ventas.filter(v=>v.suc===S.cajaSuc) : S.ventas;
  const pvd = {};
  for(const v of sinV) pvd[v.vend||"—"] = (pvd[v.vend||"—"]||0) + ventaCobrado(v);
  const mxVd = Math.max(1, ...Object.values(pvd));
  document.getElementById("cajaPorVend").innerHTML = Object.entries(pvd)
    .sort((a,b)=>b[1]-a[1]).map(([k,n])=>barra(k, n, mxVd)).join("");

  // Las tres razones sociales, una al lado de la otra.
  const ps = {};
  for(const v of S.ventas) ps[v.suc] = (ps[v.suc]||0) + ventaCobrado(v);
  const mx3 = Math.max(...Object.values(ps));
  document.getElementById("porSuc").innerHTML = SUCURSALES
    .map(su=>barra(su.n, ps[su.id]||0, mx3)).join("");
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

/* ========================================================= PEDIDOS
   Tomado de como lo resuelven los sistemas de distribuidores: grilla
   densa con el teclado, el problema de entrega EN EL RENGLON (no al
   final), y plantillas de lo que el cliente pide siempre. */
const CLIENTES = [
  {id:"c1", n:"Corralón San Javier", t:"Responsable Inscripto", doc:"30-71044821-9",
   saldo:1842300, lim:4000000, siempre:["10955","10953","10951"]},
  {id:"c3", n:"Constructora Las Rabonas", t:"Responsable Inscripto", doc:"30-70998123-2",
   saldo:3610450, lim:3500000, siempre:["11114","3719","00677","3716"]},
  {id:"c5", n:"Municipalidad de Nono", t:"IVA Exento", doc:"30-99903412-7",
   saldo:0, lim:8000000, siempre:["10960","10949","10956"]},
  {id:"c6", n:"Sanitarios del Valle", t:"Responsable Inscripto", doc:"30-71233456-8",
   saldo:487200, lim:2000000, siempre:["11045","11046","11047","11118"]},
  {id:"c2", n:"Rubén Ceballos", t:"Consumidor Final", doc:"20-14882310-4",
   saldo:0, lim:0, siempre:["3674","3688"]},
  {id:"c4", n:"Mariela Ferreyra", t:"Consumidor Final", doc:"27-30119847-1",
   saldo:0, lim:0, siempre:["2120"]},
];

/** Lo que hay en el otro deposito. Inventado, pero fijo para cada articulo. */
function stockOtro(p){ return p.dep[otroDep()]; }

/** El stock pintado: verde si sobra, amarillo si se está por acabar,
    rojo si no hay. Abajo, lo que queda en el otro depósito. */
function stockPill(p){
  const aca = p.stock, alla = p.dep[otroDep()];
  const cls = aca > 10 ? "stk-ok" : (aca > 0 ? "stk-poco" : "stk-no");
  const porque = aca > 10 ? "hay de sobra" : (aca > 0 ? "quedan pocos" : "no hay en este depósito");
  return '<span class="stk '+cls+'" title="'+porque+'">'+aca+'</span>'+
    '<span class="stk-otro">'+alla+' en '+DEPOSITOS[otroDep()]+'</span>';
}

const PEDIDOS_ABIERTOS = [
  {nro:"P-2841", cli:"c1", est:"preparando", ent:"envio", cuando:"mañana",
   lin:[["10955",4],["10953",2]], senia:300000},
  {nro:"P-2840", cli:"c5", est:"esperando mercadería", ent:"envio", cuando:"viernes",
   lin:[["10960",1],["10949",2]], senia:0},
  {nro:"P-2839", cli:"c6", est:"listo para retirar", ent:"retira", cuando:"hoy",
   lin:[["11045",6],["11118",4]], senia:200000},
  {nro:"P-2838", cli:"c2", est:"preparando", ent:"retira", cuando:"hoy",
   lin:[["3674",1],["3688",1]], senia:500000},
];

// Igual que el mostrador, la pantalla abre con un pedido a medio tomar:
// lo que este cliente pide siempre, ya cargado.
const PED = { cliente:"c1", linea:[{cod:"10955",cant:2},{cod:"10953",cant:1},{cod:"10951",cant:4}],
              entrega:"retira", senia:0, nro:2842 };

function clienteDe(id){ return CLIENTES.find(c=>c.id===id); }

/** Si el renglon se puede entregar, y de donde. */
function entregaDe(p, cant){
  if(cant <= p.stock) return {cls:"p-ok", txt:"hay", falta:0};
  const falta = cant - p.stock;
  const otro = stockOtro(p);
  if(otro >= falta)
    return {cls:"p-warn", txt:"faltan "+falta+", vienen del otro depósito", falta:0};
  return {cls:"p-bad", txt:"faltan "+falta+", hay que pedirlos", falta:falta - otro};
}

document.getElementById("selCliente").innerHTML =
  CLIENTES.map(c=>'<option value="'+c.id+'">'+c.n+'</option>').join("");

function pintarCliente(){
  const c = clienteDe(PED.cliente);
  const pasado = c.lim > 0 && c.saldo > c.lim;
  document.getElementById("cliDatos").innerHTML =
    '<div><span>Condición</span><b style="font-size:12.5px;font-family:var(--font-b)">'+c.t+'</b></div>'+
    '<div><span>CUIT</span><b>'+c.doc+'</b></div>'+
    (c.lim > 0
      ? '<div><span>Cuenta corriente</span><b style="color:'+(pasado?"var(--bad)":"var(--ink)")+'">'+
        fmt(c.saldo)+' de '+fmt(c.lim)+'</b></div>'+
        (pasado?'<div><span>&nbsp;</span><span class="pill p-bad">pasó el límite</span></div>':'')
      : '<div><span>Cuenta corriente</span><b style="font-size:12.5px;font-family:var(--font-b)">no tiene</b></div>');

  const siempre = c.siempre.map(prod).filter(Boolean);
  document.getElementById("siempre").innerHTML =
    '<span class="et">Siempre pide</span>' +
    // Hasta 44: cortar antes dejaba dos tanques distintos con el mismo
    // nombre, porque lo que los diferencia (los litros) va al final.
    siempre.map(p=>'<button data-c="'+p.cod+'">'+p.tit.split("·")[0].slice(0,44).trim()+'</button>').join("") +
    '<button data-c="__todos" style="background:var(--surface-3);border-color:var(--line-2)">Cargar todo</button>';
}

function pintarPedido(){
  pintarCliente();
  pintarCamposPedido();
  document.getElementById("pedNro").textContent = "Pedido P-" + PED.nro;

  const filas = PED.linea.map(l=>{
    const p = prod(l.cod);
    const e = entregaDe(p, l.cant);
    return {l, p, e, sub: p.contado * l.cant};
  });

  document.getElementById("tbPed").innerHTML = filas.length
    ? filas.map(({l,p,e,sub})=>
        '<tr data-cod="'+p.cod+'"><td class="num" style="font-size:12px">'+p.cod.split("+")[0]+'</td>'+
        '<td class="nom" style="min-width:210px">'+p.tit.slice(0,58)+(p.tit.length>58?"…":"")+'</td>'+
        '<td class="r"><input class="cant" type="number" min="1" step="1" value="'+l.cant+'" data-c="'+l.cod+'" aria-label="cantidad"></td>'+
        '<td class="r">'+fmt(p.contado)+'</td>'+
        '<td class="r" style="font-weight:600">'+fmt(sub)+'</td>'+
        '<td><span class="pill '+e.cls+'">'+e.txt+'</span></td>'+
        '<td><button class="quitar-fila" data-x="'+l.cod+'" aria-label="quitar">×</button></td></tr>').join("")
    : '<tr><td colspan="7" class="vacio">Todavía no hay renglones. Buscá arriba y apretá Enter.</td></tr>';

  document.getElementById("pedCuenta").textContent =
    filas.length ? filas.reduce((a,f)=>a+f.l.cant,0)+" unidades en "+filas.length+" renglones" : "";

  // Lo que de verdad no se puede entregar: ni acá ni en el otro depósito.
  const faltan = filas.filter(f=>f.e.falta > 0);
  document.getElementById("pedFaltan").innerHTML = faltan.length
    ? '<div class="aviso" style="margin:12px 14px;border-left-color:var(--bad)"><span>⚠</span><div>'+
      '<b>'+faltan.length+(faltan.length===1?' renglón no se puede entregar':' renglones no se pueden entregar')+
      ' con lo que hay.</b> Faltan '+faltan.reduce((a,f)=>a+f.e.falta,0)+' unidades entre todos. '+
      'Decile al cliente ahora, no cuando venga a buscarlo.'+
      '<div style="margin-top:8px"><button class="b2" id="btnAlProveedor" style="padding:6px 12px;font-size:12.5px;border-radius:7px">Sumarlos al pedido del proveedor</button></div>'+
      '</div></div>'
    : "";

  // Los mismos renglones que GBP pone abajo de la grilla, pero diciendo lo
  // que son. El IVA va incluido en el precio, no se suma aparte: en el
  // mostrador el precio que se dice es el precio final.
  const bruto = filas.reduce((a,f)=>a+f.sub,0);
  const dto = Math.round(bruto * PEDCFG.desc / 100);
  const total = bruto - dto;
  const iva = Math.round(total - total / 1.21);
  const senia = Math.max(0, Math.min(PED.senia, total));
  document.getElementById("pedTot").innerHTML =
    '<div class="tr"><span>Mercadería</span><b>'+fmt(bruto)+'</b></div>'+
    (dto>0 ? '<div class="tr"><span>Descuento '+PEDCFG.desc+'%</span><b>−'+fmt(dto)+'</b></div>' : '')+
    '<div class="tr"><span>Interés</span><b>'+fmt(0)+'</b></div>'+
    '<div class="tr"><span style="color:var(--ink-3)">IVA 21%, ya incluido arriba</span>'+
      '<b style="color:var(--ink-3)">'+fmt(iva)+'</b></div>'+
    (senia>0 ? '<div class="tr"><span>Seña</span><b>−'+fmt(senia)+'</b></div>' : '')+
    '<div class="tr big"><span>'+(senia>0?"Queda a pagar":"Importe")+'</span><b>'+fmt(total-senia)+'</b></div>';

  const vacio = filas.length === 0;
  document.getElementById("btnGuardarPed").disabled = vacio;
  document.getElementById("btnWhatsPed").disabled = vacio;

  // Los pedidos ya tomados.
  document.getElementById("pedAbiertos").textContent = PEDIDOS_ABIERTOS.length + " pedidos";
  document.getElementById("tbPedidos").innerHTML = PEDIDOS_ABIERTOS.map(o=>{
    const c = clienteDe(o.cli);
    const tot = o.lin.reduce((a,[cod,n])=>a+prod(cod).contado*n,0);
    const cls = o.est==="listo para retirar" ? "p-ok"
      : o.est==="esperando mercadería" ? "p-bad" : "p-n";
    return '<tr><td class="num" style="font-size:12.5px">'+o.nro+'</td>'+
      '<td style="font-weight:500">'+(c?c.n:"—")+'</td>'+
      '<td class="nom" style="min-width:220px">'+o.lin.reduce((a,[,n])=>a+n,0)+' un. '+
        '<small>'+o.lin.map(([cod])=>prod(cod).tit.split("·")[0].slice(0,26)).join(" + ")+'</small></td>'+
      '<td style="font-size:12.5px">'+(o.ent==="retira"?"retira":"envío")+', '+o.cuando+'</td>'+
      '<td class="r">'+fmt(tot)+'</td>'+
      '<td class="r" style="color:var(--ink-3)">'+(o.senia?fmt(o.senia):"—")+'</td>'+
      '<td><span class="pill '+cls+'">'+o.est+'</span></td></tr>';
  }).join("");
}

document.getElementById("selCliente").addEventListener("change",e=>{
  PED.cliente = e.target.value; pintarPedido();
});
document.getElementById("siempre").addEventListener("click",e=>{
  const b = e.target.closest("button[data-c]"); if(!b) return;
  const c = clienteDe(PED.cliente);
  const cods = b.dataset.c === "__todos" ? c.siempre : [b.dataset.c];
  for(const cod of cods){
    const l = PED.linea.find(x=>x.cod===cod);
    if(l) l.cant++; else PED.linea.push({cod, cant:1});
  }
  pintarPedido();
});


/** El buscador de renglones. Entra marca, rubro, nombre o codigo, en
    cualquier orden y sin tener que escribir la palabra entera. Enter mete
    el primero que aparece, con la cantidad que diga al lado. */
function buscarPed(){
  const crudo = document.getElementById("qPed").value.trim();
  const q = plano(crudo);
  const caja = document.getElementById("resPed");
  if(!q){ caja.innerHTML = ""; return []; }
  const toks = q.split(/\\s+/).filter(Boolean);
  const rr = encontrar(toks);
  const hits = rr.hits
    .slice(0,8);

  if(!hits.length){
    caja.innerHTML = '<div class="vacio">Nada con <b>“'+crudo+'”</b>. Probá con menos palabras, o tocá una marca de arriba.</div>';
    return [];
  }
  // El mismo listado que el mostrador, para no leer dos formatos.
  caja.innerHTML =
    '<div class="tabla-wrap"><table class="densa res-t"><thead><tr>'+
      '<th>Código</th><th>Artículo</th><th>Marca</th><th class="r">Stock</th>'+
      '<th class="r">Contado</th><th class="r">Cant.</th><th></th>'+
    '</tr></thead><tbody>'+
    hits.map(({p})=>{
      const st = stockPill(p);
      return '<tr data-cod="'+p.cod+'" style="cursor:pointer">'+
        '<td class="num" style="font-size:12px">'+p.cod.split("+")[0]+'</td>'+
        '<td class="nom" style="min-width:230px">'+p.tit+'<small>'+p.rub.toLowerCase()+'</small></td>'+
        '<td style="font-size:12px;color:var(--ink-2)">'+p.prov+'</td>'+
        '<td class="r">'+st+'</td>'+
        '<td class="r" style="font-weight:600">'+fmt(p.contado)+'</td>'+
        '<td class="r"><input class="cant" type="number" min="1" step="1" value="1" data-q="'+p.cod+'" aria-label="cantidad"></td>'+
        '<td><button class="sumar" data-add="'+p.cod+'">Sumar</button></td>'+
      '</tr>';
    }).join("")+
    '</tbody></table></div>';
  const pri = caja.querySelector("tr[data-cod]");
  if(pri) pri.classList.add("marcado");
  return hits.map(h=>h.p);
}
function agregarPed(cod, cuantos){
  const cant = Math.max(1, Math.floor(+cuantos || 1));
  const l = PED.linea.find(x=>x.cod===cod);
  if(l) l.cant += cant; else PED.linea.push({cod, cant});
  marcarNuevo(cod);
  toast(cant+" × "+prod(cod).tit.slice(0,46)+" al pedido.");
  document.getElementById("qPed").value = "";
  document.getElementById("resPed").innerHTML = "";
  pintarPedido();
}
document.getElementById("qPed").addEventListener("input", buscarPed);
document.getElementById("qPed").addEventListener("keydown",e=>{
  if(e.key !== "Enter") return;
  const hits = buscarPed();
  const t = document.querySelector("#resPed tr.marcado");
  if(t) agregarPed(t.dataset.cod, 1);
  else if(hits.length) agregarPed(hits[0].cod, 1);
});
document.getElementById("resPed").addEventListener("click",e=>{
  // Sirve el botón Sumar y también tocar el renglón en cualquier lado,
  // menos adentro del casillero de la cantidad.
  if(e.target.closest("input")) return;
  const b = e.target.closest("[data-add]") || e.target.closest("tr[data-cod]");
  if(!b) return;
  const cod = b.dataset.add || b.dataset.cod;
  const campo = document.querySelector('#resPed input[data-q="'+cod+'"]');
  agregarPed(cod, campo ? +campo.value : 1);
});
document.getElementById("resPed").addEventListener("keydown",e=>{
  if(e.key!=="Enter") return;
  const i = e.target.closest("input[data-q]"); if(!i) return;
  e.preventDefault();
  agregarPed(i.dataset.q, +i.value);
});
document.getElementById("tbPed").addEventListener("input",e=>{
  const i = e.target.closest("input[data-c]"); if(!i) return;
  const l = PED.linea.find(x=>x.cod===i.dataset.c); if(!l) return;
  l.cant = Math.max(1, Math.floor(+i.value || 1));
  pintarPedido();
});
document.getElementById("tbPed").addEventListener("click",e=>{
  const b = e.target.closest("button[data-x]"); if(!b) return;
  PED.linea = PED.linea.filter(x=>x.cod !== b.dataset.x);
  pintarPedido();
});
document.getElementById("pedFaltan").addEventListener("click",e=>{
  if(!e.target.closest("#btnAlProveedor")) return;
  toast("Los faltantes quedaron anotados en el pedido al proveedor. Los vas a ver en Listas cuando llegue la lista nueva.");
});
document.getElementById("formaEntrega").addEventListener("click",e=>{
  const b = e.target.closest("button[data-e]"); if(!b) return;
  PED.entrega = b.dataset.e;
  for(const x of document.querySelectorAll("#formaEntrega button")) x.setAttribute("aria-pressed", String(x===b));
  document.getElementById("dirEnvio").hidden = PED.entrega !== "envio";
});
document.getElementById("senia").addEventListener("input",e=>{
  PED.senia = Math.max(0, +e.target.value || 0); pintarPedido();
});
document.getElementById("btnGuardarPed").addEventListener("click",()=>{
  const c = clienteDe(PED.cliente);
  const total = PED.linea.reduce((a,l)=>a+prod(l.cod).contado*l.cant,0);
  const hayFalta = PED.linea.some(l=>entregaDe(prod(l.cod), l.cant).falta > 0);
  PEDIDOS_ABIERTOS.unshift({
    nro:"P-"+PED.nro, cli:PED.cliente,
    est: hayFalta ? "esperando mercadería" : "preparando",
    ent: PED.entrega, cuando: document.getElementById("fecha").value || "a confirmar",
    lin: PED.linea.map(l=>[l.cod, l.cant]), senia: Math.min(PED.senia, total),
  });
  toast("Pedido P-"+PED.nro+" guardado para "+c.n+" por "+fmt(total)+
    (hayFalta ? ". Queda esperando mercadería." : ". Ya se puede preparar."));
  PED.nro++; PED.linea = []; PED.senia = 0;
  document.getElementById("senia").value = 0;
  pintarPedido();
});
document.getElementById("btnWhatsPed").addEventListener("click",()=>{
  const c = clienteDe(PED.cliente);
  const doc = PEDCFG.doc || docDe(c)[0];
  const nro = letraDe(doc)+" "+sucAct().pv+"-"+String(PED.nro).padStart(8,"0");
  const lineas = PED.linea.map(l=>({p:prod(l.cod), cant:l.cant}));
  const bruto = lineas.reduce((a,x)=>a+x.p.contado*x.cant,0);
  const total = bruto - Math.round(bruto*PEDCFG.desc/100);
  abrirEnvio({
    quien: c ? c.n : "el cliente",
    tit: doc.replace(/^\\d+\\./,""), nro, lineas,
    total: total - (PED.senia||0), senia: PED.senia||0
  });
});
document.getElementById("btnVaciarPed").addEventListener("click",()=>{
  PED.linea = []; PED.senia = 0;
  document.getElementById("senia").value = 0; pintarPedido();
});
(function fechaPorDefecto(){
  const d = new Date(); d.setDate(d.getDate() + 2);
  document.getElementById("fecha").value = d.toISOString().slice(0,10);
})();

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
  document.querySelector('#sQuien button[data-q="prov"]').click();
  document.getElementById("sProv").value = s.prov;
  if(s.modo === "sube"){
    document.querySelector('#sModo button[data-m="sube"]').click();
    document.getElementById("sPct").value = s.valor;
  } else {
    // La lista avisa que baja el descuento: se carga la cadena que rige y
    // se le cambia el primero, que es el que el proveedor mueve.
    document.querySelector('#sModo button[data-m="desc"]').click();
    PF.seis = cadenaDe(s.prov).slice(0,6);
    PF.seis[0] = limD(s.d2);
    pintarSeis();
  }
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

/* ------------------------------------------- preguntarle hablando ----
   El navegador escucha y escribe lo que oye; cuando la frase termina,
   la pregunta sale sola. Sirve con las manos ocupadas, que es como
   trabaja el del mostrador. Chrome y Edge lo tienen; otros no. */
(function microfono(){
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const bot = document.getElementById("mic");
  const caja = document.getElementById("preg");
  let rec = null, escuchando = false;

  bot.addEventListener("click",()=>{
    if(!Rec){
      toast("Este navegador no deja dictar. En Chrome o Edge sí anda.");
      return;
    }
    if(escuchando){ rec.stop(); return; }
    rec = new Rec();
    rec.lang = "es-AR";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = ()=>{
      escuchando = true; bot.classList.add("on");
      caja.placeholder = "Te escucho… hablá tranquilo";
    };
    rec.onresult = e=>{
      let t = "";
      for(const r of e.results) t += r[0].transcript;
      caja.value = t.trim();
      if(e.results[e.results.length-1].isFinal){
        const v = caja.value.trim();
        if(v){ caja.value = ""; responder(v); }
      }
    };
    rec.onerror = ev=>{
      toast(ev.error==="not-allowed" || ev.error==="service-not-allowed"
        ? "Hay que darle permiso al micrófono: está en el candado de la barra de direcciones."
        : (ev.error==="no-speech" ? "No se escuchó nada. Probá de nuevo." : "No se entendió. Probá de nuevo."));
    };
    rec.onend = ()=>{
      escuchando = false; bot.classList.remove("on");
      caja.placeholder = "Preguntá lo que quieras, o tocá el micrófono y hablá";
    };
    rec.start();
  });
})();

/* ============================== los campos del pedido, los mismos de GBP */
/* La pantalla de GBP (Pedidos - Generar y Emitir) te hace bajar a mano, en
   cada pedido: documento a emitir, condicion de venta, vendedor, descuento,
   entregar por, lista de precios y deposito. Son los mismos campos que hay
   aca. La diferencia es que aca vienen elegidos, abajo dice por que, y si
   no te gusta lo cambias. */
const VENDEDORES = ["Mauro","Horacio","Agustín","Freddy","Daniel","Carlos","Miguel","Damián"];
const DOCUMENTOS = ["01.Factura A","02.Factura B","03.Presupuesto X cnc","04.Remito","05.Pedido interno"];
const ENTREGAS = ["00-Retira en Local","01-Reparto propio CABA/GBA","02-Transporte a cargo del cliente"];
const LISTAS = ["01.Lista 1","02.Lista 2","03.Lista 3 corralón"];
/* Los mismos dos depositos, escritos como los pide el pedido. */
const DEP_OPC = ["01-Dep "+DEPOSITOS.BA, "02-Dep "+DEPOSITOS.TS];
/** El que le toca a la sucursal en la que estas parado. */
const depOpcDe = () => depAct()==="BA" ? DEP_OPC[0] : DEP_OPC[1];

const PEDCFG = { doc:null, cond:null, entrega:null, lista:null, dep:null, desc:0 };

/** Que comprobante corresponde, mirando la condicion fiscal del cliente. */
function docDe(c){
  if(!c) return ["02.Factura B","no hay cliente elegido"];
  if(c.t==="Responsable Inscripto") return ["01.Factura A","es responsable inscripto"];
  if(c.t==="IVA Exento") return ["02.Factura B","está exento de IVA"];
  return ["02.Factura B","es consumidor final"];
}
/** Si puede comprar en cuenta corriente o tiene que pagar ahora. */
function condDe(c){
  if(!c || c.lim<=0) return ["02-Transferencia","no tiene cuenta corriente abierta"];
  if(c.saldo>c.lim) return ["02-Transferencia","ya se pasó del límite de su cuenta"];
  return ["08-Cuenta corriente 30 días","tiene cuenta y le queda "+fmt(c.lim-c.saldo)];
}
function listaDe(c){
  return (c && c.lim>0)
    ? ["03.Lista 3 corralón","compra en cuenta: le toca la de corralón"]
    : ["02.Lista 2","venta al público"];
}
function entregaPorDe(c){
  return (c && c.lim>0)
    ? ["01-Reparto propio CABA/GBA","los pedidos de cuenta se mandan"]
    : ["00-Retira en Local","lo más común en mostrador"];
}

function campo(id, et, opciones, valor, porque, auto){
  return '<div class="campo'+(auto?" auto":"")+'">'+
    '<label for="'+id+'">'+et+'</label>'+
    '<select id="'+id+'" data-k="'+id+'">'+
      opciones.map(function(o){ return '<option'+(o===valor?' selected':'')+'>'+o+'</option>'; }).join("")+
    '</select>'+
    (porque ? '<span class="por">'+porque+'</span>' : '')+
  '</div>';
}

function pintarCamposPedido(){
  const c = clienteDe(PED.cliente);
  const sDoc = docDe(c), sCond = condDe(c), sLis = listaDe(c), sEnt = entregaPorDe(c);
  // Lo que eligieron a mano manda; si no, va la sugerencia.
  const vDoc  = PEDCFG.doc     || sDoc[0];
  const vCond = PEDCFG.cond    || sCond[0];
  const vLis  = PEDCFG.lista   || sLis[0];
  const vEnt  = PEDCFG.entrega || sEnt[0];
  const hoy = new Date().toLocaleDateString("es-AR");

  document.getElementById("camposPed").innerHTML =
    campo("fDoc","Documento a emitir",DOCUMENTOS,vDoc,sDoc[1],!PEDCFG.doc)+
    campo("fCond","Condición de venta",Object.keys(MULT).concat(["09-Cheque a 30 días"]),vCond,sCond[1],!PEDCFG.cond)+
    campo("fLista","Lista de precios",LISTAS,vLis,sLis[1],!PEDCFG.lista)+
    campo("fEnt","Entregar por",ENTREGAS,vEnt,sEnt[1],!PEDCFG.entrega)+
    '<div class="campo"><label for="fVend">Vendedor</label>'+
      '<input id="fVend" type="text" readonly value="'+S.usuario+'" style="background:var(--surface-2);color:var(--ink-2)">'+
      '<span class="por">sale de tu usuario</span></div>'+
    campo("fDep","Depósito",DEP_OPC,PEDCFG.dep||depOpcDe(),"el de "+sucAct().n,!PEDCFG.dep)+
    '<div class="campo"><label for="fDesc">Descuento</label>'+
      '<input id="fDesc" data-k="fDesc" type="number" min="0" max="40" step="1" value="'+PEDCFG.desc+'">'+
      '<span class="por">'+(PEDCFG.desc>0?"en por ciento, sobre toda la mercadería":"sin descuento")+'</span></div>'+
    '<div class="campo"><label for="fNro">Número y fecha</label>'+
      '<input id="fNro" type="text" value="P-'+PED.nro+' · '+hoy+'" readonly style="background:var(--surface-2);color:var(--ink-2)">'+
      '<span class="por">sale solo, no hay que pedirlo</span></div>';
}

document.getElementById("camposPed").addEventListener("change",function(e){
  const k = e.target.dataset.k; if(!k) return;
  const v = e.target.value;
  if(k==="fDoc")   PEDCFG.doc = v;
  if(k==="fCond")  PEDCFG.cond = v;
  if(k==="fLista") PEDCFG.lista = v;
  if(k==="fEnt")   PEDCFG.entrega = v;
  if(k==="fDep")   PEDCFG.dep = v;
  if(k==="fDesc")  PEDCFG.desc = Math.max(0, Math.min(40, +v||0));
  pintarPedido();
});

/* ====================================== el escritorio, como el menú de GBP */
const ESCRITORIO = [
  ["Vender", [
    ["Generar nuevo pedido","Tomar lo que el cliente pide. Lo que no hay se ve en el renglón, no cuando llega el camión.","pedidos"],
    ["Venta de mostrador","Cobrar y entregar en el momento. Es el POS.","mostrador"],
    ["Presupuestos","Guardar sin mover stock ni caja, esperando que el cliente vuelva.","mostrador"],
    ["Rentabilidad","Qué deja cada venta, por rubro, marca, vendedor y sucursal.","renta"],
    ["Contable","Libro IVA, notas de crédito y los archivos para el contador.","contable"],
    ["Pedidos de la web","Lo que entra por la tienda y por Mercado Libre, en la misma cola.","web"],
    ["Preparar y despachar","Armar el bulto, marcar el remito y sacarlo.","web"]
  ]],
  ["Cobrar", [
    ["Caja del día","Lo que entró, por dónde entró y en qué mostrador.","caja"],
    ["Cuenta corriente de clientes","Quién debe, cuánto y cuánto le queda. Se ve al elegir el cliente.","pedidos"],
    ["Ingresar cobranzas","Imputar un pago a las facturas que salda.",null],
    ["Valores recibidos","Cheques: dónde están y cuándo vencen.",null],
    ["Transferencias entre cajas y bancos","Mover plata entre cajas, bancos y sucursales.",null]
  ]],
  ["Comprar", [
    ["Listas de proveedor","Leerla como llega: PDF, Excel o la foto que mandaron por WhatsApp.","listas"],
    ["La Red","Si el descuento que te da tu proveedor es el que le da al resto.","red"],
    ["Órdenes de compra","Pedirle al proveedor lo que falta, con lo que se vendió a la vista.",null],
    ["Contabilizar compras y gastos","Cargar la factura del proveedor y que impacte en el costo.",null],
    ["Cuenta corriente de proveedores","A quién le debés y cuándo vence.",null],
    ["Órdenes de pago","Pagarle y que quede imputado solo.",null]
  ]],
  ["Mercadería", [
    ["Productos y costos","Qué deja cada artículo con el precio que tiene puesto hoy.","productos"],
    ["Consultar artículos","Buscar como lo nombra el cliente, no por código.","mostrador"],
    ["Ajustar stock","Corregir lo que el conteo dice distinto, con el motivo anotado.",null],
    ["Publicaciones","Mercado Libre y la tienda, con el mismo stock y el mismo precio.",null]
  ]],
  ["Mirar", [
    ["Mis indicadores","Los números del negocio sin que nadie arme un reporte.","gerencia"],
    ["Preguntarle al sistema","En castellano, y contesta con tus números.","asistente"],
    ["C.R.M.","Qué le vendiste a cada cliente y cuándo conviene llamarlo.",null]
  ]],
  ["Administración", [
    ["Facturación ARCA","El CAE sale solo al cerrar la venta.",null],
    ["Libro IVA","Compras y ventas del mes, listo para el contador.",null],
    ["Asientos contables","Lo que ya pasó, asentado sin volver a cargarlo.",null],
    ["Usuarios y permisos","Quién puede ver el costo y quién no.",null]
  ]]
];

function pintarEscritorio(){
  document.getElementById("escritorio").innerHTML = ESCRITORIO.map(function(g){
    return '<div class="esc-g"><h3>'+g[0]+'</h3>'+
      g[1].map(function(it){
        const t = it[0], d = it[1], v = it[2];
        return '<button class="esc-i"'+(v?' data-ir="'+v+'"':' disabled')+'>'+
          '<span><span class="t"'+(v?'':' style="color:var(--ink-3)"')+'>'+t+'</span>'+
          '<span class="d">'+d+'</span></span>'+
          '<span class="ch pill '+(v?"p-ok":"p-n")+'">'+(v?"andando":"en el plan")+'</span>'+
        '</button>';
      }).join("")+
    '</div>';
  }).join("");
}
document.getElementById("escritorio").addEventListener("click",function(e){
  const b = e.target.closest("button[data-ir]"); if(!b) return;
  irA(b.dataset.ir);
});

/* ======================================================= inicio */
// Arranca con algo en pantalla: un cliente, una venta a medio armar y una
// busqueda hecha. Una demo que abre vacia no se entiende sola.
document.getElementById("q").value = "termotanque";
/* ============================================== RENTABILIDAD Y CONTABLE
   Las ventas sembradas no traian ni vendedor ni numero de comprobante:
   sin eso no hay libro IVA que mostrar. Se los ponemos una sola vez, al
   arrancar, con numeros que terminan justo debajo del que sigue. */
(function completarVentas(){
  const ctr = {};
  for(const su of SUCURSALES) ctr[su.id] = {A:S.nro[su.id].A-18, B:S.nro[su.id].B-34};
  const conCuit = CLIENTES.filter(c=>c.t==="Responsable Inscripto");
  for(const v of S.ventas){
    v.vend = VENDEDORES[Math.floor(az()*VENDEDORES.length)];
    if(!v.facturada) continue;
    const esA = az() < 0.24;
    v.letra = esA ? "A" : "B";
    v.cli = esA && conCuit.length ? conCuit[Math.floor(az()*conCuit.length)].id : "";
    v.nro = v.letra+" "+sucDe(v.suc).pv+"-"+String(ctr[v.suc][v.letra]++).padStart(8,"0");
  }
})();

/* Tres devoluciones del dia, para que la pantalla del contador tenga lo
   que de verdad tiene: facturas y notas de credito. */
const NOTAS_CREDITO = (function(){
  const fact = S.ventas.filter(v=>v.facturada);
  const motivos = ["Devolución: el inodoro vino rajado",
                   "Error de facturación: se cargó de más",
                   "Devolución: el cliente se arrepintió"];
  const out = [];
  for(let i=0; i<Math.min(3, fact.length); i++){
    const v = fact[Math.floor((i+1)*fact.length/4)];
    if(!v) continue;
    const parte = i===1 ? 1 : 0.5;              // una es total, dos parciales
    const total = Math.round(ventaCobrado(v) * parte);
    out.push({
      suc: v.suc, hora: v.hora, letra: v.letra,
      nro: "NC "+v.letra+" "+sucDe(v.suc).pv+"-"+String(410+i).padStart(8,"0"),
      anula: v.nro, motivo: motivos[i], total
    });
  }
  return out;
})();

const HOY = new Date().toLocaleDateString("es-AR");
const neto21 = t => t/1.21;
const iva21  = t => t - t/1.21;

/** La sucursal que se esta mirando en cada pantalla. "" = las tres. */
const S_FIL = { renta:"", conta:"" };
function filtrar(id){ return id ? S.ventas.filter(v=>v.suc===id) : S.ventas; }
function solapas(cont, cual, fn){
  document.getElementById(cont).innerHTML =
    [["","Todas"]].concat(SUCURSALES.map(x=>[x.id,x.n]))
      .map(([id,n])=>'<button data-s="'+id+'" aria-pressed="'+(id===S_FIL[cual])+'">'+n+'</button>').join("");
}
for(const [cont,cual,fn] of [["rentaSucs","renta",()=>pintarRenta()],["contaSucs","conta",()=>pintarContable()]]){
  document.getElementById(cont).addEventListener("click",e=>{
    const b = e.target.closest("button[data-s]"); if(!b) return;
    S_FIL[cual] = b.dataset.s; fn();
  });
}

/** Junta lo vendido por una clave cualquiera (rubro, marca, vendedor…). */
function agrupar(vs, clave){
  const m = {};
  for(const v of vs) for(const l of v.linea){
    const p = prod(l.cod), k = clave(p, v);
    const g = m[k] || (m[k] = {vend:0, costo:0, un:0});
    g.vend  += p.contado * l.cant;
    g.costo += p.costo   * l.cant;
    g.un    += l.cant;
  }
  return m;
}
const filaMargen = (nom, g, mx) => {
  const deja = g.vend - g.costo, mp = g.costo>0 ? deja/g.costo*100 : 0;
  const cls = mp>=S.objetivo ? "p-ok" : (mp>=10 ? "p-warn" : "p-bad");
  return '<tr><td class="nom" style="min-width:150px">'+nom+'</td>'+
    '<td class="r">'+fmt(g.vend)+'</td>'+
    '<td class="r" style="color:var(--ink-2)">'+fmt(g.costo)+'</td>'+
    '<td class="r" style="font-weight:600">'+fmt(deja)+'</td>'+
    '<td class="r"><span class="pill '+cls+'">'+pct(mp)+'</span></td>'+
    '<td style="width:120px"><span class="mini"><i style="width:'+
      Math.max(2, Math.round(Math.abs(deja)/mx*100))+'%"></i></span></td></tr>';
};

function pintarRenta(){
  solapas("rentaSucs","renta");
  const vs = filtrar(S_FIL.renta);
  const quien = S_FIL.renta ? sucDe(S_FIL.renta).n : "las tres razones sociales";

  const vendido = vs.reduce((a,v)=>a+ventaBase(v),0);
  const cobrado = vs.reduce((a,v)=>a+ventaCobrado(v),0);
  const costo   = vs.reduce((a,v)=>a+v.linea.reduce((b,l)=>b+prod(l.cod).costo*l.cant,0),0);
  const deja    = vendido - costo;
  const mp      = costo>0 ? deja/costo*100 : 0;
  const un      = vs.reduce((a,v)=>a+v.linea.reduce((b,l)=>b+l.cant,0),0);
  const cls     = mp>=S.objetivo ? "" : (mp>=10 ? "" : "alerta");

  document.getElementById("rentaTiles").innerHTML =
    tile("Vendido de contado", fmt(vendido), vs.length+" ventas · "+quien) +
    tile("Costó la mercadería", fmt(costo), "lo que hay que reponer") +
    tile("Deja", fmt(deja), pct(mp)+" sobre el costo", cls) +
    tile("Entró por caja", fmt(cobrado), fmt(cobrado-vendido)+" es recargo de tarjeta") +
    tile("Ticket promedio", fmt(vs.length?cobrado/vs.length:0), un+" unidades en total");

  // El aviso de arriba dice lo que importa en una sola frase.
  const flojas = vs.filter(v=>{
    const c = v.linea.reduce((a,l)=>a+prod(l.cod).costo*l.cant,0);
    return c>0 && (ventaBase(v)-c)/c*100 < 10;
  });
  document.getElementById("rentaAviso").innerHTML =
    '<span>'+(mp>=S.objetivo?"✔":"⚠")+'</span><div><b>'+
    (mp>=S.objetivo
      ? "Hoy el negocio deja "+pct(mp)+", arriba del objetivo de "+S.objetivo+"%."
      : "Hoy el negocio deja "+pct(mp)+", abajo del objetivo de "+S.objetivo+"%.")+
    '</b> '+flojas.length+' de '+vs.length+' ventas dejaron menos del 10%. '+
    'El recargo de tarjeta ('+fmt(cobrado-vendido)+') entró por caja pero no es ganancia: lo paga la tarjeta.</div>';

  // Rubro y marca.
  const rub = agrupar(vs, p=>p.rub);
  const mxR = Math.max(1, ...Object.values(rub).map(g=>Math.abs(g.vend-g.costo)));
  document.getElementById("tbRubro").innerHTML = Object.entries(rub)
    .sort((a,b)=>(b[1].vend-b[1].costo)-(a[1].vend-a[1].costo))
    .map(([k,g])=>filaMargen(k, g, mxR)).join("");

  const mar = agrupar(vs, p=>p.prov);
  const topM = Object.entries(mar).sort((a,b)=>(b[1].vend-b[1].costo)-(a[1].vend-a[1].costo)).slice(0,10);
  const mxM = Math.max(1, ...topM.map(([,g])=>Math.abs(g.vend-g.costo)));
  document.getElementById("tbMarca").innerHTML = topM.map(([k,g])=>filaMargen(k, g, mxM)).join("");

  // Articulo por articulo, los que mas dejan arriba y los que pierden abajo.
  const art = {};
  for(const v of vs) for(const l of v.linea){
    const p = prod(l.cod);
    const g = art[l.cod] || (art[l.cod] = {p, un:0, vend:0, costo:0});
    g.un += l.cant; g.vend += p.contado*l.cant; g.costo += p.costo*l.cant;
  }
  document.getElementById("tbArt").innerHTML = Object.values(art)
    .sort((a,b)=>(b.vend-b.costo)-(a.vend-a.costo))
    .map(g=>{
      const d = g.vend-g.costo, m = g.costo>0 ? d/g.costo*100 : 0;
      const c = m>=S.objetivo ? "p-ok" : (m>=10 ? "p-warn" : "p-bad");
      return '<tr><td class="num" style="font-size:12px">'+g.p.cod.split("+")[0]+'</td>'+
        '<td class="nom" style="min-width:250px">'+g.p.tit+'<small>'+g.p.prov+'</small></td>'+
        '<td class="r">'+g.un+'</td><td class="r">'+fmt(g.vend)+'</td>'+
        '<td class="r" style="font-weight:600'+(d<0?';color:var(--bad)':'')+'">'+fmt(d)+'</td>'+
        '<td class="r"><span class="pill '+c+'">'+pct(m)+'</span></td></tr>';
    }).join("");

  // Sucursal, vendedor, tarjeta y hora.
  document.getElementById("tbRentaSuc").innerHTML = SUCURSALES.map(su=>{
    const mias = S.ventas.filter(v=>v.suc===su.id);
    const ve = mias.reduce((a,v)=>a+ventaBase(v),0);
    const co = mias.reduce((a,v)=>a+v.linea.reduce((b,l)=>b+prod(l.cod).costo*l.cant,0),0);
    const d = ve-co, m = co>0 ? d/co*100 : 0;
    const c = m>=S.objetivo ? "p-ok" : (m>=10 ? "p-warn" : "p-bad");
    return '<tr><td class="nom">'+su.n+'</td><td class="r">'+fmt(ve)+'</td>'+
      '<td class="r" style="font-weight:600">'+fmt(d)+'</td>'+
      '<td class="r"><span class="pill '+c+'">'+pct(m)+'</span></td></tr>';
  }).join("");

  const pv = {};
  for(const v of vs) pv[v.vend||"—"] = (pv[v.vend||"—"]||0) + ventaBase(v) -
    v.linea.reduce((a,l)=>a+prod(l.cod).costo*l.cant,0);
  const mxV = Math.max(1, ...Object.values(pv));
  document.getElementById("porVend").innerHTML = Object.entries(pv)
    .sort((a,b)=>b[1]-a[1]).map(([k,n])=>barra(k, n, mxV)).join("");

  const tj = {};
  for(const v of vs){
    const t = tj[v.forma] || (tj[v.forma] = {cob:0, rec:0, n:0});
    t.cob += ventaCobrado(v); t.rec += ventaCobrado(v)-ventaBase(v); t.n++;
  }
  document.getElementById("tbTarjeta").innerHTML = Object.entries(tj)
    .sort((a,b)=>b[1].cob-a[1].cob).map(([k,t])=>
      '<tr><td class="nom">'+formaCorta(k)+'</td><td class="r">'+fmt(t.cob)+'</td>'+
      '<td class="r"'+(t.rec>0?' style="color:var(--bad);font-weight:600"':' style="color:var(--ink-3)"')+'>'+
        (t.rec>0?fmt(t.rec):"—")+'</td>'+
      '<td class="r">'+t.n+'</td></tr>').join("");

  const hr = {};
  for(const v of vs){ const h = v.hora.slice(0,2)+":00"; hr[h] = (hr[h]||0) + ventaCobrado(v); }
  const mxH = Math.max(1, ...Object.values(hr));
  document.getElementById("porHora").innerHTML = Object.keys(hr).sort()
    .map(k=>barra(k, hr[k], mxH)).join("");
}

/* ------------------------------------------------------ contable ----- */
function pintarContable(){
  solapas("contaSucs","conta");
  const id = S_FIL.conta;
  const vs = filtrar(id);
  const quien = id ? sucDe(id).n : "las tres razones sociales";
  const fact = vs.filter(v=>v.facturada);
  const sinF = vs.filter(v=>!v.facturada);
  const ncs  = id ? NOTAS_CREDITO.filter(n=>n.suc===id) : NOTAS_CREDITO;

  const totF = fact.reduce((a,v)=>a+ventaCobrado(v),0);
  const totNC = ncs.reduce((a,n)=>a+n.total,0);
  const totSinF = sinF.reduce((a,v)=>a+ventaCobrado(v),0);

  document.getElementById("contaTiles").innerHTML =
    tile("Neto gravado", fmt(neto21(totF-totNC)), "facturas menos notas de crédito") +
    tile("IVA débito fiscal", fmt(iva21(totF-totNC)), "21% · es lo que se le debe a ARCA") +
    tile("Total facturado", fmt(totF), fact.length+" comprobantes · "+quien) +
    tile("Notas de crédito", fmt(totNC), ncs.length+" · se restan del libro") +
    tile("Sin comprobante", fmt(totSinF), sinF.length+" ventas · NO van al libro", totSinF>0?"alerta":"");

  // Las bajadas.
  document.getElementById("bajadas").innerHTML = [
    ["ventas","Todas las ventas","Una fila por venta, facturada o no, con sucursal, vendedor, forma de pago y margen. Es el archivo de la casa, no el del contador."],
    ["iva","Libro IVA Ventas","Facturas A y B con neto, IVA y total, como lo pide el contador. Las ventas sin comprobante no entran."],
    ["nc","Notas de crédito","Las devoluciones y los errores, con la factura que anulan."],
    ["det","Detalle por artículo","Cada renglón de cada factura, por si el contador o la auditoría lo pide."]
  ].map(([k,t,d])=>'<button data-baja="'+k+'"><span class="t">'+t+'</span><span class="d">'+d+'</span></button>').join("");

  document.getElementById("contaNota").innerHTML =
    'Los archivos salen en <b>CSV con punto y coma</b>, que es lo que abre el Excel en castellano. '+
    'Van con la fecha y la razón social en el nombre, así no se mezclan.';

  // Libro IVA.
  document.getElementById("ivaCount").textContent = fact.length + " comprobantes";
  document.getElementById("tbIva").innerHTML = fact.slice().reverse().map(v=>{
    const t = ventaCobrado(v), c = v.cli ? CLIENTES.find(x=>x.id===v.cli) : null;
    return '<tr><td class="num" style="font-size:12px">'+HOY+'</td>'+
      '<td><span class="pill '+(v.letra==="A"?"p-n":"p-ok")+'">Factura '+v.letra+'</span></td>'+
      '<td class="num" style="font-size:12px">'+v.nro+'</td>'+
      '<td style="font-size:12px;color:var(--ink-2);white-space:nowrap">'+sucDe(v.suc).n+'</td>'+
      '<td class="nom" style="min-width:160px">'+(c?c.n:"Consumidor final")+'</td>'+
      '<td class="num" style="font-size:12px">'+(c?c.doc:"—")+'</td>'+
      '<td class="r">'+fmt(neto21(t))+'</td><td class="r" style="color:var(--ink-2)">'+fmt(iva21(t))+'</td>'+
      '<td class="r" style="font-weight:600">'+fmt(t)+'</td></tr>';
  }).join("") || '<tr><td colspan="9" class="vacio">No hay facturas en '+quien+'.</td></tr>';

  // Notas de credito.
  document.getElementById("ncCount").textContent = ncs.length + (ncs.length===1?" nota":" notas");
  document.getElementById("tbNC").innerHTML = ncs.map(n=>
    '<tr><td class="num" style="font-size:12px">'+HOY+'</td>'+
    '<td class="num" style="font-size:12px">'+n.nro+'</td>'+
    '<td class="num" style="font-size:12px;color:var(--ink-2)">'+n.anula+'</td>'+
    '<td class="nom" style="min-width:180px">'+n.motivo+'</td>'+
    '<td class="r">−'+fmt(neto21(n.total))+'</td>'+
    '<td class="r" style="color:var(--ink-2)">−'+fmt(iva21(n.total))+'</td>'+
    '<td class="r" style="font-weight:600">−'+fmt(n.total)+'</td></tr>').join("")
    || '<tr><td colspan="7" class="vacio">Hoy no hubo devoluciones.</td></tr>';

  // Lo que queda afuera.
  const porc = (totF+totSinF)>0 ? Math.round(totSinF/(totF+totSinF)*100) : 0;
  document.getElementById("afueraTot").innerHTML =
    '<div class="tr"><span>Entró en total</span><b>'+fmt(totF+totSinF)+'</b></div>'+
    '<div class="tr"><span>Con comprobante</span><b>'+fmt(totF)+'</b></div>'+
    '<div class="tr big"><span>Sin comprobante</span><b>'+fmt(totSinF)+'</b></div>'+
    '<div class="tr"><span>Es el '+porc+'% de lo que entró</span><b>'+sinF.length+' ventas</b></div>';
  document.getElementById("afueraNota").innerHTML =
    '<b>Esto no va en el archivo del contador</b>, porque no son comprobantes: no existen para ARCA. '+
    'Quedan acá, en un solo registro, para que la casa sepa cuánto entró de verdad. '+
    'Que el número esté a la vista es justamente lo que permite achicarlo.';
}

/* ------------------------------------------------- los archivos ----- */
/** Un numero como lo espera el Excel en castellano: coma decimal. */
const num2 = n => (Math.round(n*100)/100).toFixed(2).replace(".",",");
function bajarCSV(nombre, filas){
  const csv = filas.map(f=>f.map(c=>{
    const t = String(c==null ? "" : c);
    return /[;"\\r\\n]/.test(t) ? '"'+t.replace(/"/g,'""')+'"' : t;
  }).join(";")).join("\\r\\n");
  const blob = new Blob(["\\ufeff"+csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 500);
  toast("Bajó "+nombre+". Eso es lo que se adjunta al mail del contador.");
}
function sufijo(){
  const d = new Date();
  const f = d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  return (S_FIL.conta ? sucDe(S_FIL.conta).n.replace(/[^A-Za-z]/g,"") : "TODAS")+"-"+f+".csv";
}
document.getElementById("bajadas").addEventListener("click",e=>{
  const b = e.target.closest("button[data-baja]"); if(!b) return;
  const vs = filtrar(S_FIL.conta);
  const ncs = S_FIL.conta ? NOTAS_CREDITO.filter(n=>n.suc===S_FIL.conta) : NOTAS_CREDITO;

  if(b.dataset.baja==="ventas"){
    const f = [["Fecha","Hora","Razon social","Punto de venta","Comprobante","Tipo","Facturada",
                "Puesto","Vendedor","Forma de pago","Cliente","Neto","IVA","Total cobrado","Costo","Deja"]];
    for(const v of vs){
      const t = ventaCobrado(v);
      const co = v.linea.reduce((a,l)=>a+prod(l.cod).costo*l.cant,0);
      const c = v.cli ? CLIENTES.find(x=>x.id===v.cli) : null;
      f.push([HOY, v.hora, sucDe(v.suc).n, sucDe(v.suc).pv, v.nro||"", v.facturada?("Factura "+v.letra):"Sin comprobante",
              v.facturada?"SI":"NO", v.puesto, v.vend, formaCorta(v.forma), c?c.n:"Consumidor final",
              num2(neto21(t)), num2(iva21(t)), num2(t), num2(co), num2(ventaBase(v)-co)]);
    }
    bajarCSV("ventas-"+sufijo(), f);

  } else if(b.dataset.baja==="iva"){
    const f = [["Fecha","Tipo","Punto de venta","Numero","Razon social","Cliente","CUIT/DNI",
                "Condicion IVA","Neto gravado","IVA 21%","Total"]];
    for(const v of vs.filter(x=>x.facturada)){
      const t = ventaCobrado(v), c = v.cli ? CLIENTES.find(x=>x.id===v.cli) : null;
      f.push([HOY, "Factura "+v.letra, sucDe(v.suc).pv, v.nro, sucDe(v.suc).n,
              c?c.n:"Consumidor final", c?c.doc:"", c?c.t:"Consumidor Final",
              num2(neto21(t)), num2(iva21(t)), num2(t)]);
    }
    for(const n of ncs){
      f.push([HOY, "Nota de credito "+n.letra, sucDe(n.suc).pv, n.nro, sucDe(n.suc).n,
              "Anula "+n.anula, "", "", num2(-neto21(n.total)), num2(-iva21(n.total)), num2(-n.total)]);
    }
    bajarCSV("libro-iva-ventas-"+sufijo(), f);

  } else if(b.dataset.baja==="nc"){
    const f = [["Fecha","Comprobante","Razon social","Anula","Motivo","Neto","IVA 21%","Total"]];
    for(const n of ncs)
      f.push([HOY, n.nro, sucDe(n.suc).n, n.anula, n.motivo,
              num2(-neto21(n.total)), num2(-iva21(n.total)), num2(-n.total)]);
    bajarCSV("notas-de-credito-"+sufijo(), f);

  } else {
    const f = [["Fecha","Comprobante","Razon social","Codigo","Articulo","Rubro","Marca",
                "Cantidad","Precio unitario","Subtotal","Costo unitario"]];
    for(const v of vs.filter(x=>x.facturada)) for(const l of v.linea){
      const p = prod(l.cod);
      f.push([HOY, v.nro, sucDe(v.suc).n, p.cod, p.tit, p.rub, p.prov,
              l.cant, num2(p.contado), num2(p.contado*l.cant), num2(p.costo)]);
    }
    bajarCSV("detalle-por-articulo-"+sufijo(), f);
  }
});

cargarSeis(); pintarCadena();
pintarSucs(); pintarUsuarios(); pintarEscritorio(); pintarCamposVenta(); pintarDtos(); pintarTicket(); buscar(); pintarProd(); pintarWeb();
</script>
</body>
</html>
`;
