-- Subrubro
--
-- Un rubro con muchos productos se vuelve una lista larga: los 121 FV de
-- noviembre van todos a Griferia. Damian pidio separarlos como venian en las
-- pestañas de su Excel: duchas, lavatorio, bidet, cocina, accesorios.
--
-- Es una columna del articulo y no del local: un juego de lavatorio es de
-- lavatorio en las dos sucursales. Va vacia en todo lo que ya existe; nada
-- cambia hasta que se elige un subrubro. Guarda el slug ("lavatorio"); los
-- nombres y la lista de cada rubro viven en src/lib/subrubros.ts.
--
-- IF NOT EXISTS en los dos: si por algun motivo corre dos veces, no rompe el
-- arranque (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "subcategory" TEXT;

CREATE INDEX IF NOT EXISTS "Product_subcategory_idx" ON "Product"("subcategory");
