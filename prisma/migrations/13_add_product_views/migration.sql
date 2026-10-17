-- Visitas a la ficha del producto. Las cuenta el navegador (una por sesion y
-- por producto), no el servidor: asi no suman los bots ni cada refresh.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Product_views_idx" ON "Product"("views");
