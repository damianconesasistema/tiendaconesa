-- Avisos de envio por mail
--
-- Damian, 18/11/2026: "cuando hay un seguimiento del envio que esta en
-- camino, le podemos avisar tambien por mail".
--
-- Al pasar un pedido a "En entrega" se elige como va (flete propio,
-- Andreani, OCA...) y, si tiene, el numero y el link de seguimiento: van en
-- el mail al cliente. "avisos" guarda que mails se le mandaron por los
-- cambios de estado y cuando (JSON), para verlo en el pedido.
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "transporte" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "seguimiento" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "linkSeguimiento" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "avisos" TEXT;
