-- Envio de Buenos Aires (16/11/2026)
--
-- Lo que paso Damian:
--   - se envia SOLO dentro del mapa de Mercado Envios Flex (repartiendo por
--     fuera de Mercado Envios), y la zona sale del codigo postal: CABA del
--     1000 al 1440 y tres listas del conurbano (src/lib/zona-envio.ts);
--   - el envio se cobra JUNTO con la compra: CABA $5.500, Zona 1 $7.300,
--     Zona 2 $9.100, Zona 3 $10.500;
--   - desde $100.000 es gratis, a todas las zonas;
--   - pedir siempre todos los datos del envio, piso y depto incluidos;
--   - la etiqueta tiene que decir la zona y si el envio ya esta pago.
--
-- Tres columnas en el pedido, todas con IF NOT EXISTS para que una segunda
-- corrida no rompa el arranque (ver la migracion 15 en prisma/pre-start.mjs).
-- El costo del envio ya tenia su columna (shippingCost), que hasta hoy
-- quedaba siempre en 0.

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "floor" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "zonaEnvio" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "envioGratis" BOOLEAN NOT NULL DEFAULT false;

-- El tope y los precios de Buenos Aires. Quedan en la tabla Setting con el
-- nombre de la sucursal atras, como los recargos de MercadoPago, y se
-- cambian desde Configuracion del panel de Buenos Aires. DO NOTHING: si ya
-- los cargaron desde el panel, no se pisan.
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('envio_gratis_desde:bsas', '100000', now())
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES (
  'envio_precios:bsas',
  '{"CABA":5500,"Zona 1":7300,"Zona 2":9100,"Zona 3":10500}',
  now()
)
ON CONFLICT ("key") DO NOTHING;

-- Lo que el checkout le promete al cliente de Buenos Aires decia "Al resto
-- del pais, a coordinar", y ahora fuera del mapa no se envia. Se cambia SOLO
-- si sigue siendo el texto original de la migracion 18: si alguien lo
-- escribio distinto desde el panel, es suyo y no se toca.
UPDATE "Branch"
SET "zonaEnvio" = 'Capital y Gran Buenos Aires. Gratis desde $100.000.'
WHERE slug = 'bsas'
  AND "zonaEnvio" = 'Envios en Capital y Gran Buenos Aires. Al resto del pais, a coordinar.';
