-- Baja los precios guardados un 2,22% para que el precio de 1 pago vuelva a
-- ser el que era.
--
-- QUE PASO
-- La migracion 26 subio el descuento por transferencia de 10% a 12%. Pero la
-- base guarda el precio de CONTADO y de ahi deriva el de 1 pago sumandole el
-- recargo. Al cambiar solo el recargo, el numero guardado no se movio, asi
-- que lo que subio fue el precio de 1 pago en vez de bajar el de
-- transferencia. Al reves de lo que se queria.
--
-- Ejemplo real, el termotanque Heineken 165:
--
--                      1 pago      transferencia
--   antes             766.140          689.533     (-10%)
--   despues de la 26  783.560          689.533     (-12%)   <- mal, subio
--   con esta          766.140          674.203     (-12%)   <- asi va
--
-- LA REGLA DEL NEGOCIO (la fijo Damian): la Lista 2 de GBP ES el precio de 1
-- pago. Ese no se toca nunca; el descuento sale del otro lado.
--
-- LA CUENTA
-- Se reconstruye el precio de 1 pago con el recargo VIEJO (11,11%, que daba
-- 10% de descuento) y se le saca el 12%:
--
--   nuevo_contado = round( round(contado * 1.1111) * 0.88 )
--
-- Se hace en dos pasos y no con un factor directo a proposito: asi el numero
-- que queda es exactamente el 88% del precio de 1 pago que se veia en la
-- tienda, y no un redondeo de un redondeo que se desvia unos pesos.
--
-- QUE NO SE TOCA
--   * PriceHistory y OrderItem: son registros de lo que paso. Cambiarlos
--     seria reescribir el pasado, y las facturas ya emitidas no coinciden.
--   * El marcador __RESET_PRICES_MARKER__.
--
-- ESTO CORRE UNA SOLA VEZ. Si se aplicara dos veces bajaria los precios otro
-- 2,22%. Por eso va como migracion y no como script suelto: Prisma anota que
-- ya se hizo.

UPDATE "Product"
SET "price" = ROUND(ROUND("price" * 1.1111) * 0.88),
    "salePrice" = CASE
      WHEN "salePrice" IS NULL THEN NULL
      ELSE ROUND(ROUND("salePrice" * 1.1111) * 0.88)
    END
WHERE "itemId" <> '__RESET_PRICES_MARKER__';

-- Los precios por sucursal son los que de verdad muestra cada tienda.
UPDATE "BranchProduct" bp
SET "price" = ROUND(ROUND(bp."price" * 1.1111) * 0.88),
    "salePrice" = CASE
      WHEN bp."salePrice" IS NULL THEN NULL
      ELSE ROUND(ROUND(bp."salePrice" * 1.1111) * 0.88)
    END
FROM "Product" p
WHERE p.id = bp."productId"
  AND p."itemId" <> '__RESET_PRICES_MARKER__';
