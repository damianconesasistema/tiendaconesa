-- Usuarios del panel
--
-- Damian, 18/11/2026: "haceme un usuario para cada uno podemos?". Hasta aca
-- habia un solo usuario, "admin", con la contrasena de /etc/conesa.env. Ese
-- sigue igual (es el principal: el unico que crea y saca usuarios); cada
-- persona tiene ademas el suyo, con su contrasena guardada cifrada (scrypt,
-- nunca la contrasena en si). Ver src/lib/usuarios.ts.
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

CREATE TABLE IF NOT EXISTS "AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoIngreso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_username_key" ON "AdminUser"("username");
