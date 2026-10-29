-- El codigo con el que el sistema de Conesa nombra a cada articulo.
--
-- En el sitio los codigos se armaron a mano como MARCA-1234 (HEINEKEN-8354,
-- FW-3489) y en el sistema son el numero pelado. Para importar la lista tal
-- cual sale del sistema hay que emparejarlos, y hacerlo por el numero de atras
-- del codigo funciona pero depende de como se haya escrito el prefijo.
--
-- Con esta columna el enganche es exacto. La primera importacion la completa
-- sola emparejando por el numero; de ahi en adelante no hay que adivinar.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "codigoSistema" TEXT;
CREATE INDEX IF NOT EXISTS "Product_codigoSistema_idx" ON "Product"("codigoSistema");
