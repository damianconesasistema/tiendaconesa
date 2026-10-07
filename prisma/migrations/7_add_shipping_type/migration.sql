-- AddShippingTypeToProduct
ALTER TABLE "Product" ADD COLUMN "shippingType" TEXT DEFAULT 'ambos';
