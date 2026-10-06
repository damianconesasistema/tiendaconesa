-- ProductImage: de 1 imagen a galeria (1:N) con posicion
-- Quitar el unique de productId (permitir varias imagenes por producto)
DROP INDEX IF EXISTS "ProductImage_productId_key";

-- Nuevas columnas
ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Indice para ordenar la galeria por producto
CREATE INDEX IF NOT EXISTS "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");
