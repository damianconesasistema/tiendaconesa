-- Una sucursal puede estar publicada en el sitio sin tener la tienda abierta.
--
-- Son dos cosas distintas y hasta ahora eran una sola:
--   active        -> si el local se muestra en la pagina (direccion, mapa,
--                    telefono, horarios)
--   tiendaActiva  -> si en su subdominio se puede comprar
--
-- Buenos Aires tiene que aparecer en conesa.com.ar desde ya, pero NO puede
-- vender todavia: cobraria en la cuenta de MercadoPago de Traslasierra y
-- facturaria con el CUIT de Carlos. Es decir, plata y factura del
-- contribuyente equivocado. Se habilita cuando tenga lo suyo.
ALTER TABLE "Branch" ADD COLUMN "tiendaActiva" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Branch" SET "tiendaActiva" = false WHERE subdominio = 'buenosaires';
