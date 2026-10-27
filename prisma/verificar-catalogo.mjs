// Revisa, SIN tocar ninguna base, que el catalogo se pueda reconstruir
// entero con los Excel que quedaron afuera de Railway.
//
// Lee exactamente lo mismo que restaurar-catalogo.mjs y en el mismo orden,
// pero en vez de escribir, cuenta y avisa lo que falta. Sirve para saber de
// antemano con que nos vamos a encontrar, en lugar de descubrirlo a mitad
// de la carga con el servidor nuevo recien hecho.
//
// Uso:
//   node prisma/verificar-catalogo.mjs

import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const FUENTES = [
  "C:/Users/Damian Gonzalez/Downloads/productos-conesa_2026-10-17_21-48.xlsx",
  "C:/Users/Damian Gonzalez/Desktop/conesa/PRODUCTOS/TST-PARA-SUBIR.xlsx",
  "C:/Users/Damian Gonzalez/Desktop/conesa/PRODUCTOS/FLOWATER-PARA-SUBIR.xlsx",
];

const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

const filas = new Map();
let faltanArchivos = false;

for (const ruta of FUENTES) {
  const nombre = ruta.split("/").pop();
  if (!existsSync(ruta)) {
    console.log(`FALTA el archivo: ${nombre}`);
    faltanArchivos = true;
    continue;
  }
  const wb = XLSX.readFile(ruta);
  const datos = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    defval: "",
  });
  let nuevos = 0;
  let pisados = 0;
  for (const f of datos) {
    const codigo = String(f.codigo ?? "").trim();
    if (!codigo) continue;
    if (filas.has(codigo)) pisados++;
    else nuevos++;
    filas.set(codigo, f);
  }
  console.log(
    `OK ${nombre.padEnd(40)} ${String(datos.length).padStart(4)} filas` +
      `  (${nuevos} nuevos, ${pisados} actualizan uno anterior)`,
  );
}

console.log(`\nTotal de productos a cargar: ${filas.size}\n`);

// Lo que de verdad importa revisar: que nada quede sin precio (no se podria
// vender) y que no se pierdan las descripciones tecnicas, que es lo que ya
// se rompio una vez.
const problemas = { sinPrecio: [], sinTitulo: [], sinDescripcion: [], sinCategoria: [] };
const porCategoria = new Map();
const porMarca = new Map();
let activos = 0;
let conOferta = 0;

for (const [codigo, f] of filas) {
  const precio = num(f.precio);
  const titulo = String(f.titulo ?? "").trim();
  const desc = String(f.descripcion ?? "").trim();
  const cat = String(f.categoria ?? "").trim();
  const marca = String(f.marca ?? "").trim() || "(sin marca)";

  if (!precio) problemas.sinPrecio.push(codigo);
  if (!titulo) problemas.sinTitulo.push(codigo);
  if (!desc) problemas.sinDescripcion.push(codigo);
  if (!cat) problemas.sinCategoria.push(codigo);

  const oferta = num(f.oferta);
  if (oferta && precio && oferta < precio) conOferta++;
  if (String(f.activo ?? "").trim().toUpperCase() !== "NO") activos++;

  porCategoria.set(cat || "(sin categoria)", (porCategoria.get(cat || "(sin categoria)") ?? 0) + 1);
  porMarca.set(marca, (porMarca.get(marca) ?? 0) + 1);
}

console.log("Por categoria:");
for (const [c, n] of [...porCategoria].sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(n).padStart(4)}  ${c}`);
}

console.log("\nPor marca:");
for (const [m, n] of [...porMarca].sort((a, b) => b[1] - a[1])) {
  console.log(`   ${String(n).padStart(4)}  ${m}`);
}

console.log(`\nActivos al cargar: ${activos}`);
console.log(`Con precio de oferta: ${conOferta}`);

console.log("\n--- Revision ---");
let hayProblemas = faltanArchivos;
const avisar = (lista, texto) => {
  if (lista.length === 0) return;
  hayProblemas = true;
  console.log(`\n${lista.length} ${texto}:`);
  for (const c of lista.slice(0, 20)) console.log(`   - ${c}`);
  if (lista.length > 20) console.log(`   ... y ${lista.length - 20} mas`);
};

avisar(problemas.sinPrecio, "SIN PRECIO (no se cargarian)");
avisar(problemas.sinTitulo, "sin titulo");
avisar(problemas.sinCategoria, "sin categoria (irian a 'otros')");
avisar(problemas.sinDescripcion, "sin descripcion");

if (!hayProblemas) {
  console.log("\nTodo en orden: el catalogo se puede reconstruir completo.");
} else {
  console.log("\nRevisar lo de arriba antes de cargar.");
}
