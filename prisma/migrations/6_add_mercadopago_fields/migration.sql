-- AddMercadoPagoFieldsToOrder
ALTER TABLE "Order" ADD COLUMN "mpPreferenceId" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpStatusDetail" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpPaymentType" TEXT;
ALTER TABLE "Order" ADD COLUMN "mpRawResponse" TEXT;
