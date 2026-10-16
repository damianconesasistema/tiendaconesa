-- AddNotaCreditoFieldsToOrder
-- Datos de la nota de credito que anula la factura del pedido.
ALTER TABLE "Order" ADD COLUMN "ncTipo" INTEGER;
ALTER TABLE "Order" ADD COLUMN "ncNro" INTEGER;
ALTER TABLE "Order" ADD COLUMN "ncCae" TEXT;
ALTER TABLE "Order" ADD COLUMN "ncCaeVto" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "ncAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "ncMotivo" TEXT;
ALTER TABLE "Order" ADD COLUMN "ncRaw" TEXT;
