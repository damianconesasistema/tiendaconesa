// Reconstruye el catalogo en una base vacia, sin necesitar la base vieja.
//
// Railway cayo con la base adentro y sin backups. Por suerte el catalogo se
// puede rearmar con lo que quedo afuera: el export en Excel que bajamos del
// panel el 17/10 (80 productos) y los dos archivos que generamos despues
// para TST y Flowater (28). Da los 108, con precio, stock, descripcion,
// categoria y marca.
//
// Las fotos van aparte, con restaurar-fotos.mjs.
//
// Uso:
//   DATABASE_URL="postgresql://..." node prisma/restaurar-catalogo.mjs
//
// Es idempotente: se puede correr de nuevo sin duplicar nada.

import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Pasala: DATABASE_URL="postgresql://..." node ...');
  process.exit(1);
}

const prisma = new PrismaClient();

const FUENTES = [
  "C:/Users/Damian Gonzalez/Downloads/productos-conesa_2026-10-17_21-48.xlsx",
  "C:/Users/Damian Gonzalez/Desktop/conesa/PRODUCTOS/TST-PARA-SUBIR.xlsx",
  "C:/Users/Damian Gonzalez/Desktop/conesa/PRODUCTOS/FLOWATER-PARA-SUBIR.xlsx",
];

const SI = (v) => String(v ?? "").trim().toUpperCase() === "SI";
const num = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

// Las filas de los tres archivos, con el ultimo que gana: los de TST y
// Flowater son mas nuevos que el export, asi que pisan bien.
const filas = new Map();
for (const ruta of FUENTES) {
  if (!existsSync(ruta)) {
    console.log(`· falta (se saltea): ${ruta.split("/").pop()}`);
    continue;
  }
  const wb = XLSX.readFile(ruta);
  const datos = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    defval: "",
  });
  for (const f of datos) {
    const codigo = String(f.codigo ?? "").trim();
    if (!codigo) continue;
    filas.set(codigo, f);
  }
  console.log(`· leido ${ruta.split("/").pop()}: ${datos.length} filas`);
}

console.log(`\n${filas.size} productos para cargar\n`);

let creados = 0;
let actualizados = 0;

for (const [codigo, f] of filas) {
  const precio = num(f.precio);
  if (!precio) {
    console.log(`  ! ${codigo} sin precio, se saltea`);
    continue;
  }
  const oferta = num(f.oferta);
  const datos = {
    title: String(f.titulo ?? "").trim(),
    category: String(f.categoria ?? "otros").trim() || "otros",
    price: Math.round(precio),
    salePrice: oferta && oferta < precio ? Math.round(oferta) : null,
    stock: Math.max(0, num(f.stock) ?? 0),
    // activo/destacado vienen como SI/NO
    active: f.activo === "" ? true : SI(f.activo),
    featured: SI(f.destacado),
    description: String(f.descripcion ?? "").trim() || null,
    memo: String(f.memo ?? "").trim() || null,
    ...(String(f.marca ?? "").trim()
      ? { brand: String(f.marca).trim() }
      : {}),
    ...(String(f.sku ?? "").trim() ? { sku: String(f.sku).trim() } : {}),
  };

  const existia = await prisma.product.findUnique({
    where: { itemId: codigo },
    select: { id: true },
  });

  await prisma.product.upsert({
    where: { itemId: codigo },
    create: { itemId: codigo, ...datos },
    update: datos,
  });

  if (existia) actualizados++;
  else creados++;
}

console.log(`\n✓ Creados: ${creados}`);
console.log(`✓ Actualizados: ${actualizados}`);
console.log(`✓ Total en la base: ${await prisma.product.count()}`);
console.log(`\nFaltan las fotos: node prisma/restaurar-fotos.mjs`);

await prisma.$disconnect();
