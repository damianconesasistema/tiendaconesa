-- Los precios, el stock y la visibilidad pasan a ser de cada sucursal.
--
-- La tabla BranchProduct ya existia pero estaba sin usar: se lleno una sola
-- vez en octubre, al crear las sucursales, y desde entonces el panel siguio
-- editando Product. O sea que esas filas tienen los precios de octubre.
--
-- Aca se rehacen copiando EXACTAMENTE lo que hay hoy en Product, que es lo
-- que la tienda de Traslasierra esta mostrando y cobrando. Asi la tabla por
-- sucursal queda al dia y en la tienda no cambia nada.
--
-- Buenos Aires queda SIN filas a proposito (Damian, 29/10: "por ahora sin
-- nada, vamos a hacer la carga como hacemos siempre"). Un producto sin fila
-- en una sucursal no se muestra en esa tienda.

-- La sucursal principal es la de menor orden con la tienda abierta. Hoy es
-- Traslasierra: Buenos Aires va primero en el sitio pero todavia no vende.
WITH principal AS (
  SELECT id FROM "Branch"
  WHERE active AND "tiendaActiva"
  ORDER BY orden ASC
  LIMIT 1
)
INSERT INTO "BranchProduct" (
  id, "branchId", "productId", price, "salePrice", stock, active,
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  principal.id,
  p.id,
  p.price,
  p."salePrice",
  p.stock,
  p.active,
  now(),
  now()
FROM "Product" p, principal
-- El marcador del reseteo de precios no es un producto: no va al panel.
WHERE p."itemId" <> '__RESET_PRICES_MARKER__'
ON CONFLICT ("branchId", "productId") DO UPDATE SET
  price       = EXCLUDED.price,
  "salePrice" = EXCLUDED."salePrice",
  stock       = EXCLUDED.stock,
  active      = EXCLUDED.active,
  "updatedAt" = now();

-- Las filas de la otra sucursal que habian quedado de la carga de octubre se
-- borran: tenian precios viejos y Damian pidio arrancar sin nada.
DELETE FROM "BranchProduct" bp
USING "Branch" b
WHERE b.id = bp."branchId"
  AND b.id <> (
    SELECT id FROM "Branch"
    WHERE active AND "tiendaActiva"
    ORDER BY orden ASC
    LIMIT 1
  );
