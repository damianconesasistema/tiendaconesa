// Importa los 779 productos desde src/data/products.json a la DB Prisma.
// Mantiene idempotencia: usa itemId como clave unica (upsert).
// Si la DB ya tiene productos y no se paso --force, no hace nada.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

const existing = await prisma.product.count();
if (existing > 0 && !force) {
  console.log(`Seed skip: la DB ya tiene ${existing} productos. Usa --force para re-seedear.`);
  await prisma.$disconnect();
  process.exit(0);
}

const products = JSON.parse(
  readFileSync("src/data/products.json", "utf8"),
);

console.log(`Importando ${products.length} productos...`);

let created = 0;
let updated = 0;
let featured = 0;

// Primeros 12 productos variados por categoria = destacados en home
const CATEGORIES_FOR_FEATURED = [
  "sanitarios",
  "griferia",
  "banera",
  "accesorios",
  "salamandras",
  "calefones",
  "piletas",
  "materiales",
];
const featuredIds = new Set();
for (const cat of CATEGORIES_FOR_FEATURED) {
  const first = products.find(
    (p) => p.category === cat && p.price > 0,
  );
  if (first) featuredIds.add(first.itemId);
}

for (const p of products) {
  const data = {
    itemId: p.itemId,
    title: p.title,
    category: p.category || "otros",
    price: Math.round(p.price || 0),
    salePrice: p.salePrice ? Math.round(p.salePrice) : null,
    stock: p.stock > 0 ? p.stock : 0,
    active: p.status !== "Inactiva",
    featured: featuredIds.has(p.itemId),
  };
  const r = await prisma.product.upsert({
    where: { itemId: p.itemId },
    update: data,
    create: data,
  });
  if (r.featured) featured++;
  if (r.createdAt.getTime() === r.updatedAt.getTime()) created++;
  else updated++;
}

console.log(`\n✓ Creados: ${created}`);
console.log(`✓ Actualizados: ${updated}`);
console.log(`✓ Destacados (featured): ${featured}`);
console.log(`✓ Total en DB: ${await prisma.product.count()}`);

await prisma.$disconnect();
