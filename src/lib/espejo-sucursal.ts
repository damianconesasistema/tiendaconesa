import { prisma } from "@/lib/db";

// El puente entre el articulo y la sucursal que hoy vende.
//
// Como quedo la cosa mientras se separan los dos locales:
//
//   - El panel ya LEE los precios de la tabla de cada sucursal.
//   - Las pantallas de edicion siguen ESCRIBIENDO en el articulo, que es lo
//     que la tienda de Traslasierra muestra y cobra hoy.
//
// Si no se hiciera nada mas, Damian cambiaria un precio y el panel seguiria
// mostrando el viejo. Por eso despues de cada cambio se copia el articulo a la
// fila de la sucursal principal (la de menor orden con la tienda abierta).
//
// Es temporal y a proposito: cuando la tienda lea los precios de la sucursal
// —y la de Buenos Aires tenga los suyos— este archivo se borra y cada panel
// escribe directo en su sucursal. Dejarlo documentado es lo que evita que
// dentro de dos meses alguien lo vea y no entienda por que hay dos lugares
// con el mismo precio.

/** Copia precio, oferta, stock y visibilidad del articulo a las filas que YA
 *  existen en la sucursal principal.
 *
 *  No crea filas: un producto que se saco de un local tiene que seguir
 *  afuera, y crearlo de nuevo en cada guardado lo haria reaparecer. */
export async function sincronizarSucursalPrincipal(): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "BranchProduct" bp
      SET price = p.price,
          "salePrice" = p."salePrice",
          stock = p.stock,
          active = p.active,
          "updatedAt" = now()
      FROM "Product" p,
           (SELECT id FROM "Branch"
             WHERE active AND "tiendaActiva"
             ORDER BY orden ASC
             LIMIT 1) b
      WHERE bp."productId" = p.id
        AND bp."branchId" = b.id
    `;
    // Un articulo que no esta en NINGUNA sucursal es uno recien creado
    // (publicar, duplicar, importar): sin fila no aparece en ningun panel y
    // seria invisible. Se le da de alta en la principal.
    //
    // La condicion es "en ninguna", no "en la principal": uno que se saco a
    // proposito de Traslasierra pero vive en Buenos Aires tiene fila en la
    // otra, asi que esto no lo trae de vuelta. Cuando el importador de la
    // segunda sucursal este hecho, va a crear la fila el mismo antes de que
    // esto corra.
    await prisma.$executeRaw`
      INSERT INTO "BranchProduct" (
        id, "branchId", "productId", price, "salePrice", stock, active,
        "createdAt", "updatedAt"
      )
      SELECT gen_random_uuid()::text, b.id, p.id, p.price, p."salePrice",
             p.stock, p.active, now(), now()
      FROM "Product" p,
           (SELECT id FROM "Branch"
             WHERE active AND "tiendaActiva"
             ORDER BY orden ASC
             LIMIT 1) b
      WHERE NOT EXISTS (
        SELECT 1 FROM "BranchProduct" x WHERE x."productId" = p.id
      )
      ON CONFLICT ("branchId", "productId") DO NOTHING
    `;
  } catch (e) {
    // Que no voltee el guardado: el cambio del articulo ya se grabo y es lo
    // que ve el cliente. Si esto falla, el panel muestra un precio viejo
    // hasta el proximo guardado, que es molesto pero no rompe nada.
    console.error("[espejo] no se pudo sincronizar la sucursal principal:", e);
  }
}
