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
    // Antes esto tambien daba de alta en la principal los articulos que no
    // estaban en ninguna sucursal. Se saco: ahora el alta y la importacion
    // crean la fila en el local que se esta editando (precios-sucursal.ts),
    // y dejar esta regla significaba que un producto cargado para Buenos
    // Aires terminara en Traslasierra si algo fallaba en el medio.
  } catch (e) {
    // Que no voltee el guardado: el cambio del articulo ya se grabo y es lo
    // que ve el cliente. Si esto falla, el panel muestra un precio viejo
    // hasta el proximo guardado, que es molesto pero no rompe nada.
    console.error("[espejo] no se pudo sincronizar la sucursal principal:", e);
  }
}
