// Prueba el lector de los Excel del sistema contra archivos de verdad.
//
//   npx tsx scripts/probar-excel-sistema.mts "C:/ruta/a/la/carpeta"
//
// No toca la base ni el sitio: abre cada archivo, muestra que regla de precio
// dedujo y las primeras filas. Sirve para revisar de un vistazo que no este
// tomando el contado como lista (que es el error que cuesta plata) antes de
// que nadie importe nada.

import { readdirSync, statSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as XLSX from "xlsx";
import { leerExportDelSistema } from "../src/lib/excel-sistema";

const raiz = process.argv[2];
if (!raiz) {
  console.error("Falta la carpeta con los Excel.");
  process.exit(1);
}

const archivos: string[] = [];
(function recorrer(dir: string) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) recorrer(p);
    else if (/\.xlsx?$/i.test(n)) archivos.push(p);
  }
})(raiz);

let reconocidos = 0;
for (const p of archivos.sort()) {
  const nombre = p.split(/[\\/]/).pop();
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(readFileSync(p), { type: "buffer" });
  } catch (e) {
    console.log(`\n${nombre}\n  no se pudo abrir: ${(e as Error).message}`);
    continue;
  }

  const lectura = leerExportDelSistema(wb);
  if (!lectura) {
    console.log(`\n${nombre}\n  no parece un export del sistema`);
    continue;
  }

  reconocidos++;
  console.log(`\n${nombre}`);
  console.log(`  ${lectura.regla}`);
  console.log(
    `  ${lectura.filas.length} productos · stock: ${lectura.traeStock ? "sí" : "no"}`,
  );
  for (const a of lectura.avisos) console.log(`  aviso: ${a}`);
  for (const f of lectura.filas.slice(0, 2)) {
    const oferta = f.oferta !== null ? ` · oferta ${f.oferta}` : "";
    const stock = f.stock !== null ? ` · stock ${f.stock}` : "";
    console.log(
      `    ${f.itemCode} ${f.descripcion.slice(0, 44)} → ${f.precio}${oferta}${stock}`,
    );
  }
}

console.log(
  `\n${reconocidos} de ${archivos.length} archivos reconocidos como export del sistema.`,
);
