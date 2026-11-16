-- La tienda online es solo la de Buenos Aires (16/11/2026)
--
-- Damian: "la tienda de Traslasierra sacala, no va mas"; "Traslasierra se
-- menciona como sucursal, pero no la tienda, solo la de Buenos Aires"; "si
-- volvemos a activarla en algun momento la prendemos".
--
-- tiendaOnline dice si una sucursal TIENE tienda online. Traslasierra sigue
-- activa como local (direccion, horarios, redes en el sitio), pero sin
-- tienda: no aparece en el panel de productos. Para volver a prenderla:
--   UPDATE "Branch" SET "tiendaOnline" = true WHERE slug = 'traslasierra';
--
-- Y se abre la tienda de Buenos Aires: Damian, "ya habilita el pago de
-- producto, el carrito etc". Se vuelve a cerrar con el boton "Cerrar tienda"
-- del panel, en Sucursales. No se activa ningun producto: cada producto
-- sigue en el estado en que esta.

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "tiendaOnline" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Branch" SET "tiendaOnline" = false WHERE slug = 'traslasierra';

UPDATE "Branch" SET "tiendaActiva" = true WHERE slug = 'bsas';
