-- AddFacturacionFieldsToOrder
-- Datos del comprobante electronico que devuelve ARCA al facturar el pedido.
ALTER TABLE "Order" ADD COLUMN "cbteTipo" INTEGER;
ALTER TABLE "Order" ADD COLUMN "ptoVta" INTEGER;
ALTER TABLE "Order" ADD COLUMN "cbteNro" INTEGER;
ALTER TABLE "Order" ADD COLUMN "cae" TEXT;
ALTER TABLE "Order" ADD COLUMN "caeVto" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "facturadoAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "facturaNeto" INTEGER;
ALTER TABLE "Order" ADD COLUMN "facturaIva" INTEGER;
ALTER TABLE "Order" ADD COLUMN "afipRaw" TEXT;
