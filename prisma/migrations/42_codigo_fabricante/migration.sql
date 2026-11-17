-- Codigo de fabricante
--
-- Damian, 17/11/2026: "faltaria que la ficha del producto tenga el campo
-- CODIGO DE FABRICANTE y ahi puesto el codigo del producto de fabrica, eso
-- deberia levantar cuando se hace la carga del mismo y tambien editarse desde
-- la ficha del producto".
--
-- Es el codigo con que la marca nombra al producto ("AGAR0IMP 13" en Daccord,
-- "0207/B1" en FV). Con ese se lo busca en la pagina de la marca: si esta
-- cargado, se busca exactamente ese. Es del articulo, no del local. Va vacio
-- en todo lo que ya existe: se completa solo la proxima vez que se lo
-- encuentra en la pagina de su marca.
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "codigoFabricante" TEXT;
