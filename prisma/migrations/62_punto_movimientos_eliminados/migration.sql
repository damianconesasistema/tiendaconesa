-- Movimientos de plata eliminados (V.0.11.262).
--
-- Damian, 25/11/2026: "ademas de anular dame la posibilidad de eliminar para
-- que no aparezca pero tambien deja la posibilidad de ver los eliminados".
-- Eliminar no borra: marca. Un eliminado siempre esta anulado tambien (no
-- cuenta en los saldos). Solo agrega dos columnas que pueden quedar vacias.

ALTER TABLE "PuntoMovimiento" ADD COLUMN IF NOT EXISTS "eliminadoEn" TIMESTAMP(3);
ALTER TABLE "PuntoMovimiento" ADD COLUMN IF NOT EXISTS "eliminadoPor" TEXT;
