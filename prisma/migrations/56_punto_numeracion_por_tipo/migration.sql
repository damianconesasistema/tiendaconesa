-- La numeracion de Punto, por tipo de comprobante (V.0.99.96).
--
-- La nota de credito B de Traslasierra tiene su propia serie (en ARCA es
-- otro tipo de comprobante: la Factura B es el 6, la Nota de Credito B el 8),
-- pero el unico (sucursal, letra, numero) la hacia chocar con la Factura B del
-- mismo numero: la primera nota de credito B 0006-00000001 no se podia
-- guardar porque ya estaba la factura B 0006-00000001. Con el tipo adentro,
-- cada tipo numera aparte. Las letras de los tipos de antes no se repiten
-- entre si (A y B factura, X presupuesto, R remito, P pedido interno), asi
-- que para ellos sigue igual de unico.
DROP INDEX IF EXISTS "PuntoDocumento_sucursal_letra_numero_key";
CREATE UNIQUE INDEX IF NOT EXISTS "PuntoDocumento_sucursal_tipo_letra_numero_key"
  ON "PuntoDocumento"("sucursal", "tipo", "letra", "numero");
