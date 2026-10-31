-- El combo Jade de 3 piezas pasa a tener el codigo de sus piezas.
--
-- POR QUE
-- Ese combo se cargo a mano desde el panel, asi que recibio un codigo
-- inventado: MAN-MUY8KPEI-CQDW. Ese codigo no dice de que esta hecho, y asi
-- es como el panel recalcula los combos cuando se sube una lista de precios.
-- Resultado: era el unico combo de Pringles que NO se actualizaba. Quedo en
-- 440.244 / 299.197 mientras los otros seis se recalcularon solos, y es
-- justamente el mas visitado de todos (935 visitas).
--
-- Con 9898+9815+9577 pasa a recalcularse como los demas:
--   9898  inodoro largo Jade
--   9815  deposito a codo Jade
--   9577  bidet Jade 3 agujeros
--
-- LOS LINKS VIEJOS NO SE ROMPEN
-- /tienda/MAN-MUY8KPEI-CQDW redirige al codigo nuevo (src/lib/codigo-viejo.ts,
-- RENOMBRADOS). Hace falta: con 935 visitas ese link esta compartido por
-- WhatsApp y cargado en Google.
--
-- NO pisa nada si el codigo nuevo ya existiera: ahi no hace nada y el combo
-- queda como esta, que es preferible a romper dos productos de una.
UPDATE "Product"
SET "itemId" = '9898+9815+9577'
WHERE "itemId" = 'MAN-MUY8KPEI-CQDW'
  AND NOT EXISTS (
    SELECT 1 FROM "Product" o WHERE o."itemId" = '9898+9815+9577'
  );
