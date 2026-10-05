-- AddPaywayFieldsToOrder
ALTER TABLE "Order" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayPaymentId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywaySiteTxId" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayAuthCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayCardBrand" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayCardLast4" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayCardInstallments" INTEGER;
ALTER TABLE "Order" ADD COLUMN "paywayErrorCode" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayErrorMessage" TEXT;
ALTER TABLE "Order" ADD COLUMN "paywayRawResponse" TEXT;
