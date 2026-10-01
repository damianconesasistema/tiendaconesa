import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const file = process.argv[2];
if (!file) {
  console.error("Uso: node inspect-ml-excel.mjs <archivo.xlsx>");
  process.exit(1);
}

const buffer = readFileSync(file);
const wb = XLSX.read(buffer, { type: "buffer" });

console.log("=== HOJAS ===");
console.log(wb.SheetNames);

for (const name of wb.SheetNames) {
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  console.log(`\n=== HOJA: ${name} ===`);
  console.log(`Filas: ${rows.length}`);
  if (rows.length > 0) {
    const sample = rows[0];
    console.log("Columnas:", Object.keys(sample));
    console.log("\nPRIMERA FILA:");
    for (const [k, v] of Object.entries(sample)) {
      const val = v == null ? "null" : String(v).substring(0, 100);
      console.log(`  ${k}: ${val}`);
    }
  }
}
