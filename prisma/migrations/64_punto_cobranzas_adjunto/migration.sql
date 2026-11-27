-- El comprobante de pago adjunto a una cobranza (V.0.11.292).
--
-- Damian, 27/11/2026: "agregale adjuntar comprobante" (la foto o el PDF de
-- la transferencia). Uno por cobranza, guardado en la base como las fotos de
-- los productos. Solo agrega columnas que pueden quedar vacias.

ALTER TABLE "PuntoCobranza" ADD COLUMN IF NOT EXISTS "adjunto" BYTEA;
ALTER TABLE "PuntoCobranza" ADD COLUMN IF NOT EXISTS "adjuntoTipo" TEXT;
ALTER TABLE "PuntoCobranza" ADD COLUMN IF NOT EXISTS "adjuntoNombre" TEXT;
ALTER TABLE "PuntoCobranza" ADD COLUMN IF NOT EXISTS "adjuntoEn" TIMESTAMP(3);
ALTER TABLE "PuntoCobranza" ADD COLUMN IF NOT EXISTS "adjuntoPor" TEXT;
