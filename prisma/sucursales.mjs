// Crea las sucursales y pasa el catalogo actual a Traslasierra.
//
// Corre en cada arranque, pero el relleno de productos es UNA sola vez por
// sucursal: solo si esa sucursal todavia no tiene ningun producto cargado.
//
// Eso es a proposito. Si rellenara siempre, el dia que el admin apague un
// producto en una sucursal o lo borre, el proximo deploy se lo volveria a
// crear: el mismo problema que ya tuvo el seed de productos, que "reactivaba
// todo solo".

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Los datos fiscales de Traslasierra salen de las variables que YA estan
// configuradas, no escritos aca: asi no quedan dos fuentes de verdad para
// el CUIT ni el CUIT de nadie guardado en el repositorio.
const SUCURSALES = [
  {
    slug: "traslasierra",
    name: "Traslasierra",
    orden: 1,
    razonSocial: process.env.NEXT_PUBLIC_RAZON_SOCIAL || null,
    cuit: process.env.NEXT_PUBLIC_CUIT || null,
    iibb: process.env.NEXT_PUBLIC_IIBB || null,
    inicioAct: process.env.NEXT_PUBLIC_INICIO_ACTIVIDADES || null,
    address: "Av. Belgrano 758",
    city: "Villa Cura Brochero",
    province: "Córdoba",
    postalCode: "5891",
    phone: "03544 40-0979",
    whatsapp: "5493544430522",
    email: "sanitariosconesatraslasierra@gmail.com",
    hours: "Lunes a viernes de 8:30 a 17 · Sábados de 9 a 14",
    // Arranca con los codigos del valle de los que estoy seguro. El resto
    // los completa Damian desde el panel: inventar codigos postales seria
    // peor que dejarlos faltando, porque mandaria pedidos a la sucursal
    // equivocada sin que nadie se entere.
    codigosPostales: "5891,5889,5887,5870",
    cubreTodoElPais: false,
  },
  {
    slug: "bsas",
    name: "Buenos Aires",
    orden: 2,
    // Los datos FISCALES (razon social, CUIT, IIBB) los carga Damian: es
    // otro titular y no los tengo. Sin ellos no se puede facturar desde
    // esta sucursal, que es justamente lo que queremos: mejor que no
    // facture a que facture con el CUIT equivocado.
    address: "Rincón 43/51",
    city: "Ciudad Autónoma de Buenos Aires",
    province: "Buenos Aires",
    postalCode: "1081",
    phone: "011 4951-4297",
    email: null,
    hours: "Lunes a viernes de 8:30 a 17 · Sábados de 8 a 13:30",
    // Es la que llega a cualquier lado, asi que atiende todo CP que no
    // caiga en la zona de otra sucursal.
    cubreTodoElPais: true,
  },
];

for (const s of SUCURSALES) {
  // update vacio: si ya existe no se pisa nada de lo que haya cargado el
  // admin por el panel.
  const b = await prisma.branch.upsert({
    where: { slug: s.slug },
    update: {},
    create: s,
  });
  console.log(`· sucursal ${b.slug} (${b.name})`);
}

// --- Relleno del catalogo en Traslasierra -----------------------------
//
// Hoy el precio y el stock viven en Product. Se copian a BranchProduct
// para Traslasierra, que es la sucursal que existe. Product queda intacto:
// la tienda publica lo sigue leyendo de ahi hasta que la etapa 2 cambie
// las lecturas, asi esto se puede subir sin que el cliente note nada.

const traslasierra = await prisma.branch.findUnique({
  where: { slug: "traslasierra" },
  select: { id: true },
});

const yaTiene = await prisma.branchProduct.count({
  where: { branchId: traslasierra.id },
});

if (yaTiene > 0) {
  console.log(`· Traslasierra ya tiene ${yaTiene} productos, no se toca`);
} else {
  const productos = await prisma.product.findMany({
    where: { itemId: { not: "__RESET_PRICES_MARKER__" } },
    select: {
      id: true,
      price: true,
      salePrice: true,
      stock: true,
      active: true,
    },
  });

  if (productos.length === 0) {
    console.log("· no hay productos para copiar");
  } else {
    const r = await prisma.branchProduct.createMany({
      data: productos.map((p) => ({
        branchId: traslasierra.id,
        productId: p.id,
        price: p.price,
        salePrice: p.salePrice,
        stock: p.stock,
        active: p.active,
      })),
      skipDuplicates: true,
    });
    console.log(`· Traslasierra: ${r.count} productos copiados`);
  }
}

// Buenos Aires arranca SIN productos a proposito. Se cargan desde el panel
// cuando Damian tenga los precios de alla; mientras tanto, una sucursal sin
// productos simplemente no muestra nada, que es lo correcto.

await prisma.$disconnect();
