// Prueba la cuenta de los combos contra datos de verdad, sin tocar la base.
//
//   npx tsx scripts/probar-combos.mts <lista.xlsx> <combos.jsonl> [descuento]
//
// La lista es el Excel del sistema (su columna de precio se toma como precio
// de 1 pago). El jsonl es un combo por linea, con itemId, title, price y
// salePrice tal como estan hoy publicados.
//
// Imprime, combo por combo, lo que mostraria la tienda hoy y lo que mostraria
// con esta lista. Sirve para mirar la cuenta antes de que nadie importe nada:
// si un combo baja un 16%, se ve aca.

import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { leerExportDelSistema } from "../src/lib/excel-sistema";
import { piezasDelCombo, unPagoDelCombo } from "../src/lib/combos";
import { precioVitrina } from "../src/lib/precios";

const [lista, jsonl, descRaw] = process.argv.slice(2);
const DESC = Number(descRaw ?? 12);
const RECARGO = 11.11; // el de 1 pago que usa la tienda

const wb = XLSX.read(readFileSync(lista), { type: "buffer" });
const l = leerExportDelSistema(wb);
if (!l) {
  console.error("No reconoci el archivo como export del sistema.");
  process.exit(1);
}

// Codigo -> precio de 1 pago, que es lo que trae la columna.
const unPago = new Map<string, number>();
for (const f of l.filas) unPago.set(f.itemCode, Math.round(f.precio));

console.log(`${l.regla}`);
console.log(`${unPago.size} piezas en la lista · descuento del combo ${DESC}%\n`);

const plata = (n: number) =>
  n.toLocaleString("es-AR", { maximumFractionDigits: 0 }).padStart(11);

let tocados = 0;
let incompletos = 0;

for (const linea of readFileSync(jsonl, "utf8").trim().split("\n")) {
  const p = JSON.parse(linea) as {
    itemId: string;
    title: string;
    price: number;
    salePrice: number | null;
  };
  const piezas = piezasDelCombo(p.itemId);
  if (!piezas) {
    console.log(`${p.itemId}: el codigo no dice de que piezas esta hecho`);
    continue;
  }
  const faltan = piezas.filter((c) => !unPago.has(c));
  if (faltan.length === piezas.length) continue; // no tiene que ver con esta lista

  const sueltas = piezas.map((c) => unPago.get(c) ?? 0);
  const ahora = unPagoDelCombo(sueltas, DESC);
  const contadoHoy = p.salePrice ?? p.price;
  const hoy = precioVitrina(contadoHoy, RECARGO);
  const dif = Math.round(((ahora - hoy) / hoy) * 100);

  console.log(`${p.itemId}  ${p.title.slice(0, 46)}`);
  console.log(`  piezas ${piezas.join(" + ")}`);
  if (faltan.length) {
    incompletos++;
    console.log(`  FALTA ${faltan.join(", ")} en la lista -> no se toca`);
    console.log("");
    continue;
  }
  tocados++;
  const suma = sueltas.reduce((a, b) => a + b, 0);
  console.log(`  sueltas suman ${plata(suma)}  (1 pago)`);
  console.log(`  1 pago hoy    ${plata(hoy)}`);
  console.log(`  1 pago nuevo  ${plata(ahora)}   ${dif > 0 ? "+" : ""}${dif}%`);
  console.log(
    `  se guarda     tachado ${plata(Math.round(suma / (1 + RECARGO / 100)))} · real ${plata(Math.round(ahora / (1 + RECARGO / 100)))}  (contado)`,
  );
  console.log("");
}

console.log(`${tocados} combos se recalculan · ${incompletos} quedan como estan`);
