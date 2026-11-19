-- Contrasena provisoria de los usuarios del panel
--
-- Damian, 19/11/2026: "haceme una parte del panel la parte de usuarios para
-- crearlos por favor, que tenga reseteo de password, etc completo sin mail
-- sino usuario y contrasena". Cuando admin crea a alguien o le resetea la
-- contrasena, esa contrasena es provisoria: la primera vez que la persona
-- entra, el panel le pide que elija la suya. Ver src/lib/usuarios.ts.

ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "debeCambiarClave" BOOLEAN NOT NULL DEFAULT false;
