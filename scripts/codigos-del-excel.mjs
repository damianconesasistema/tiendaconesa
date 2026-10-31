// Lista los codigos y precios que el lector saca de un Excel del sistema.
//   npx tsx scripts/codigos-del-excel.mjs "C:/ruta/archivo.xlsx"
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { leerExportDelSistema } from "../src/lib/excel-sistema.ts";

const wb = XLSX.read(readFileSync(process.argv[2]), { type: "buffer" });
const l = leerExportDelSistema(wb);
if (!l) { console.log("no reconocido"); process.exit(0); }
console.log(l.regla);
console.log(`${l.filas.length} filas`);
for (const f of l.filas)
  console.log(`${f.itemCode}\t${Math.round(f.precio)}\t${f.descripcion.slice(0, 40)}`);
