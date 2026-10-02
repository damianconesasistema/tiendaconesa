// Setea price = RESET_PRICES y salePrice = null en TODOS los productos.
// Idempotente: solo corre si el valor no coincide con el ultimo aplicado.
// Deja un marcador en la fila "RESET_PRICES_APPLIED" dentro de Product para
// evitar re-aplicar en cada deploy.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const target = Number(process.env.RESET_PRICES);

if (!Number.isFinite(target) || target <= 0) {
  console.log("RESET_PRICES invalido, skip");
  await prisma.$disconnect();
  process.exit(0);
}

// Chequear ultimo valor aplicado via el itemId sentinela
const SENTINEL = "__RESET_PRICES_MARKER__";
const marker = await prisma.product.findUnique({ where: { itemId: SENTINEL } });
if (marker && marker.price === target) {
  console.log(`Reset ya aplicado para target=${target}, skip`);
  await prisma.$disconnect();
  process.exit(0);
}

const { count } = await prisma.product.updateMany({
  where: { itemId: { not: SENTINEL } },
  data: { price: target, salePrice: null },
});
console.log(`✓ ${count} productos actualizados a ${target}`);

// Actualizar/crear marcador
await prisma.product.upsert({
  where: { itemId: SENTINEL },
  create: {
    itemId: SENTINEL,
    title: "__marker__",
    category: "otros",
    price: target,
    active: false,
  },
  update: { price: target },
});

await prisma.$disconnect();
