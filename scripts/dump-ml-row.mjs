import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const buffer = readFileSync(process.argv[2]);
const wb = XLSX.read(buffer, { type: "buffer" });
const sheet = wb.Sheets["Publicaciones"];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

console.log("Total filas:", rows.length);
console.log("Total columnas:", Object.keys(rows[0]).length);
console.log("\n=== TODAS LAS COLUMNAS ===");
console.log(Object.keys(rows[0]).join("\n"));

console.log("\n=== PRIMERA PUBLICACION COMPLETA ===");
for (const [k, v] of Object.entries(rows[0])) {
  if (v != null && String(v).trim() !== "") {
    console.log(`${k}: ${String(v).substring(0, 150)}`);
  }
}

console.log("\n=== 3 TITULOS DE MUESTRA ===");
for (let i = 0; i < Math.min(3, rows.length); i++) {
  console.log(`[${i}]`, rows[i].TITLE, "| $", rows[i].PRICE);
}
