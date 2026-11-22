-- Comprobantes de Punto eliminados.
--
-- Damian, 22/11/2026: "ahi tambien debes dar la posiblidad de imprimir,
-- eliminar". Eliminar NO borra la fila: la marca. Sale de la lista, de los
-- totales y de la Caja, pero queda (con quien y cuando) en el filtro
-- "Eliminados" y se puede recuperar. Asi un click equivocado no pierde un
-- presupuesto, y el numero de una factura no queda libre para otra.
--
-- Columnas que pueden quedar vacias: no hay que llenar nada de lo que ya
-- esta. IF NOT EXISTS por si corre dos veces (ver prisma/pre-start.mjs).

ALTER TABLE "PuntoDocumento" ADD COLUMN IF NOT EXISTS "eliminadoEn" TIMESTAMP(3);
ALTER TABLE "PuntoDocumento" ADD COLUMN IF NOT EXISTS "eliminadoPor" TEXT;
