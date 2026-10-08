-- Marca del producto. Slug en minuscula (fv, ferrum, piazza...), igual al id
-- de src/lib/marcas.ts. Nullable: los productos viejos quedan sin marca hasta
-- que se corre la deteccion automatica desde el panel.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "brand" TEXT;
CREATE INDEX IF NOT EXISTS "Product_brand_idx" ON "Product"("brand");
