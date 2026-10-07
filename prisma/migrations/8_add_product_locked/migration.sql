-- AddLockedToProduct
-- Candado: si locked = true, el producto no se puede editar ni eliminar.
-- Protege contra cambios masivos accidentales (precio, stock, activo, borrado).
ALTER TABLE "Product" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;
