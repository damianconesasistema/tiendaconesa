import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { leerExportDelSistema } from "../src/lib/excel-sistema";

const wb = XLSX.read(readFileSync(process.argv[2]), { type: "buffer" });
const l = leerExportDelSistema(wb)!;
const f = (n: number) => Math.round(n).toLocaleString("es-AR").padStart(11);
console.log("codigo   Lista 2 (archivo)   1 pago -12%   contado -10%   descripcion");
for (const r of l.filas) {
  const unPago = Math.round(r.precio * 0.88);
  const contado = Math.round(unPago / 1.1111);
  console.log(
    `${r.itemCode.padEnd(7)} ${f(r.precio)}       ${f(unPago)}    ${f(contado)}   ${r.descripcion.slice(0, 32)}`,
  );
}
