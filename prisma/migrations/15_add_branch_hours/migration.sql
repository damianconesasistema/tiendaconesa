-- Agrega la columna de horarios de la sucursal.
--
-- Esta columna ya figura dentro de la migracion 14, pero se escribio ahi
-- DESPUES de que esa migracion ya habia corrido en produccion. Prisma lleva
-- las migraciones aplicadas por nombre: como la 14 ya estaba registrada,
-- nunca volvio a ejecutarla y la columna quedo sin crearse. La tienda
-- arrancaba, prisma/sucursales.mjs hacia el upsert de las sucursales,
-- Postgres respondia "The column Branch.hours does not exist" y el servicio
-- se caia en el arranque.
--
-- Va con IF NOT EXISTS a proposito: en una base nueva la 14 ya la crea, y
-- entonces esta migracion tiene que poder pasar de largo sin romper.

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "hours" TEXT;
