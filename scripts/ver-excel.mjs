// Muestra el Excel crudo, tal cual, sin interpretar nada.
//   node ver-excel.mjs "C:/ruta/archivo.xlsx"
import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";

const p = process.argv[2];
const wb = XLSX.read(readFileSync(p), { type: "buffer" });
for (const hoja of wb.SheetNames) {
  console.log(`\n===== HOJA: ${hoja} =====`);
  const filas = XLSX.utils.sheet_to_json(wb.Sheets[hoja], {
    header: 1,
    defval: null,
    raw: true,
  });
  console.log(`${filas.length} filas`);
  for (const [i, f] of filas.slice(0, Number(process.argv[3]) || 14).entries()) {
    const celdas = f.map((c) => (c === null ? "·" : String(c).slice(0, 34)));
    console.log(`  ${String(i + 1).padStart(3)} | ${celdas.join(" | ")}`);
  }
  if (filas.length > (Number(process.argv[3]) || 14)) console.log(`  ... (${filas.length - (Number(process.argv[3]) || 14)} filas más)`);
}
