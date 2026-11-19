-- Permisos y estado de los usuarios del panel
--
-- Damian, 19/11/2026: "poneme status de los usuarios, o partes del panel que
-- puede ver o no para tildar seria permisos". Ver src/lib/permisos.ts.
--
-- permisos: las partes del panel que ve, separadas por coma. NULL = todo
-- (asi los usuarios que ya existen siguen viendo lo mismo que hoy).
-- ultimaActividad: la ultima vez que abrio una pantalla del panel, para el
-- "conectado ahora" de la lista de usuarios.

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "permisos" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "ultimaActividad" TIMESTAMP(3);
