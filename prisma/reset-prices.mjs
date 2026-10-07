// Reset one-shot de precios: setea price = RESET_PRICES y salePrice = null
// en TODOS los productos. SOLO corre UNA VEZ por valor distinto de
// RESET_PRICES (se persiste un marcador en Product). NUNCA re-aplica en
// deploys posteriores, para no pisar los cambios que hace el admin
// (precios reales, ofertas, pausados).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const target = Number(process.env.RESET_PRICES);

if (!Number.isFinite(target) || target <= 0) {
  console.log("RESET_PRICES invalido, skip");
  await prisma.$disconnect();
  process.exit(0);
}

const SENTINEL = "__RESET_PRICES_MARKER__";
const marker = await prisma.product.findUnique({ where: { itemId: SENTINEL } });

// Si ya se aplicó este mismo valor, NO hacer nada más. El admin ya es dueño
// de precios / ofertas / activo-pausado a partir de acá.
if (marker && marker.price === target) {
  console.log(`Reset ya aplicado para target=${target}, skip (no se toca nada).`);
  await prisma.$disconnect();
  process.exit(0);
}

// Primera aplicación de este valor: reseteamos SOLO precios y ofertas.
// NO tocamos "active": el estado activo/pausado lo maneja el admin.
const { count } = await prisma.product.updateMany({
  where: { itemId: { not: SENTINEL } },
  data: { price: target, salePrice: null },
});
console.log(`✓ ${count} productos reseteados a ${target} (precios/ofertas).`);

// Marcador para no re-aplicar
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
