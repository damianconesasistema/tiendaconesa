-- Reset de la caja de efectivo desde Gerencia (V.0.11.256).
--
-- Damian, 24/11/2026: "poneme un reset tambien pero solo en gerencia se
-- pueda hacer porque ahora vamos a completar pero a modo de ejemplo, no
-- tenemos la caja real". Los cierres reseteados no se borran: quedan
-- marcados (cuando y quien) y dejan de contar; la caja vuelve a "todavia no
-- se abrio". Solo agrega dos columnas que pueden quedar vacias.

ALTER TABLE "PuntoCierre" ADD COLUMN IF NOT EXISTS "reseteadoEn" TIMESTAMP(3);
ALTER TABLE "PuntoCierre" ADD COLUMN IF NOT EXISTS "reseteadoPor" TEXT;
