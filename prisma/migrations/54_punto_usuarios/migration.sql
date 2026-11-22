-- Usuarios y permisos del sistema Punto.
--
-- Damian, 22/11/2026: "me falta el panel de usuarios donde ahi yo seleccione
-- que area puede ver cada usuario o a que tiene acceso". Ver
-- src/lib/punto-permisos.ts y src/app/sistema/usuarios/route.ts.
--
-- punto: las areas (Venta, Caja, Gerencia...) y acciones (importar, eliminar,
-- corregir el numero) de Punto que puede usar, separadas por coma. NULL =
-- todo: asi los usuarios que ya existen siguen exactamente como hoy.
-- sucursal: "srl", "cnc" o "tsl" si solo vende como esa. NULL = elige
-- cualquiera, como hoy.
-- adminPunto: puede administrar los usuarios de Punto.
--
-- Los dos que administran los usuarios de Punto son damian y daniel: lo
-- decidio Damian ese mismo dia. Si alguno todavia no existe, el UPDATE no
-- hace nada y se lo da admin despues, desde Usuarios en Punto.
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "punto" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "sucursal" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "adminPunto" BOOLEAN NOT NULL DEFAULT false;

UPDATE "AdminUser" SET "adminPunto" = true WHERE "username" IN ('damian','daniel');
