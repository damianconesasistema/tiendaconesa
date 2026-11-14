import { prisma } from "@/lib/db";
import { idSucursalPrincipal } from "@/lib/sucursal-panel";

// El puente entre el articulo y la sucursal principal.
//
// Como quedo la cosa mientras se separan los dos locales:
//
//   - La tienda y el panel ya LEEN los precios de la tabla de cada sucursal.
//   - Varias pantallas de edicion siguen ESCRIBIENDO en el articulo, que es
//     el precio de cuando habia un solo local.
//
// Si no se hiciera nada mas, Damian cambiaria un precio y el panel seguiria
// mostrando el viejo. Por eso despues de cada cambio se copia el articulo a
// las filas de la sucursal principal.
//
// A QUIEN le copia es lo delicado de este archivo. Tiene que ser la MISMA
// sucursal que `precios-sucursal.ts` deja escribir el articulo (la principal,
// linea del puente) y la misma que tiene habilitadas las pantallas en lote.
// Si el puente escribe el articulo cuando se edita un local y el espejo lo
// copia a OTRO, cambiar un precio en uno se lo cambia al otro sin avisar. Eso
// es plata, no una molestia.
//
// Por eso ahora lo pregunta en vez de tenerlo escrito: `idSucursalPrincipal`
// es la misma funcion que usa el panel para decidir la principal, asi que no
// pueden discrepar. Antes decia "traslasierra" con todas las letras porque el
// resto del sistema lo resolvia como "la que tiene la tienda abierta", y
// cerrarla un rato dejaba al espejo sin a quien copiarle: cero filas, sin
// error y sin aviso. Esa trampa ya no existe, porque la principal tiene su
// respaldo para cuando estan todas cerradas (SLUG_PRINCIPAL).
//
// Es temporal y a proposito: cuando TODAS las pantallas de edicion escriban
// la tabla de la sucursal, este archivo se borra. Dejarlo documentado es lo
// que evita que dentro de dos meses alguien lo vea y no entienda por que hay
// dos lugares con el mismo precio.

/** Copia precio, oferta, stock y visibilidad del articulo a las filas que YA
 *  existen en la sucursal principal.
 *
 *  No crea filas: un producto que se saco de un local tiene que seguir
 *  afuera, y crearlo de nuevo en cada guardado lo haria reaparecer. */
export async function sincronizarSucursalPrincipal(): Promise<void> {
  try {
    const idPrincipal = await idSucursalPrincipal();
    if (!idPrincipal) {
      // Sin principal no hay a quien copiarle. Antes esto era una consulta
      // que actualizaba cero filas y no se notaba; ahora por lo menos queda
      // en el registro del servidor.
      console.error("[espejo] no hay sucursal principal; no se copio nada");
      return;
    }
    await prisma.$executeRaw`
      UPDATE "BranchProduct" bp
      SET price = p.price,
          "salePrice" = p."salePrice",
          stock = p.stock,
          active = p.active,
          "updatedAt" = now()
      FROM "Product" p
      WHERE bp."productId" = p.id
        AND bp."branchId" = ${idPrincipal}
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
