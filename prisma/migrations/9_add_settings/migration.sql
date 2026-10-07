-- AddSettingTable
-- Configuracion editable desde el panel (clave/valor).
-- Primer uso: recargo porcentual por pagar con MercadoPago.
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- AddSurchargeToOrder
-- Recargo por pagar con tarjeta (MercadoPago cobra comision y el precio
-- publicado es de contado). Se guarda aparte para poder auditarlo.
ALTER TABLE "Order" ADD COLUMN "surcharge" INTEGER NOT NULL DEFAULT 0;
