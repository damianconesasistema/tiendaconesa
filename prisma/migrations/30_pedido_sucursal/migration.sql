-- AddBranchToOrder
-- De que sucursal es cada pedido: el local que cobra y que factura.
--
-- Queda opcional a proposito. Los pedidos que ya estan cargados no tienen
-- sucursal y no hay manera honesta de adivinarsela: ponerles una seria
-- inventar de que local fue una venta. Los que entren de ahora en mas si la
-- traen. ON DELETE SET NULL: borrar una sucursal no se puede llevar puestos
-- los pedidos que cobro.
ALTER TABLE "Order" ADD COLUMN "branchId" TEXT;

CREATE INDEX "Order_branchId_idx" ON "Order"("branchId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
