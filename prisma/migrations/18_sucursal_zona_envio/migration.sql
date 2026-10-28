-- Que envia cada sucursal, en texto y escrito por el que vende.
--
-- Antes esto salia de cubreTodoElPais, que es la casilla que decide a cual
-- de las dos le entra un pedido de un codigo postal sin zona asignada. Son
-- dos cosas distintas: una es a quien le llega el pedido, la otra es que se
-- le promete al cliente. Mezcladas, la tienda de Balvanera publicaba
-- "Envios a todo el pais" cuando por ahora solo cubre AMBA.
--
-- Va en texto libre, como los horarios, porque la realidad del reparto no
-- entra en una casilla: hay zonas que se cubren, zonas que se coordinan y
-- zonas que no.

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "zonaEnvio" TEXT;

UPDATE "Branch" SET "zonaEnvio" =
  'Envios en el Valle de Traslasierra. Fuera de la zona, a coordinar.'
  WHERE slug = 'traslasierra' AND "zonaEnvio" IS NULL;

UPDATE "Branch" SET "zonaEnvio" =
  'Envios en Capital y Gran Buenos Aires. Al resto del pais, a coordinar.'
  WHERE slug = 'bsas' AND "zonaEnvio" IS NULL;
