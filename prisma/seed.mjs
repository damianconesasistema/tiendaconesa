// Importa los 779 productos desde src/data/products.json a la DB Prisma.
// Mantiene idempotencia: usa itemId como clave unica (upsert).
// Si la DB ya tiene productos y no se paso --force, no hace nada.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";

const prisma = new PrismaClient();
const force = process.argv.includes("--force");

// IMPORTANTE: el seed NO debe correr solo nunca mas.
//
// Antes la condicion era `existing > 0` => si la DB se quedaba sin productos
// (por ejemplo borrandolos desde el panel), el siguiente deploy re-importaba
// los 779 del JSON pisando precios, ofertas, stock y el estado activo/pausado.
// Eso hacia parecer que "se reactivo todo solo".
//
// Ahora hay que pedirlo explicitamente: SEED_PRODUCTS=1 o --force.
const explicit = force || process.env.SEED_PRODUCTS === "1";
if (!explicit) {
  const existing = await prisma.product.count();
  console.log(
    `Seed skip: no se pidio seed explicito (hay ${existing} productos). ` +
      `Para re-importar desde el JSON: SEED_PRODUCTS=1 o node prisma/seed.mjs --force.`,
  );
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
