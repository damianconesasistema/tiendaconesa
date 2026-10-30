-- El codigo visible de cada articulo pasa a ser el numero pelado, el mismo
-- con el que el sistema de Conesa lo nombra.
--
-- Los codigos del sitio se habian armado a mano como MARCA-numero
-- (HEINEKEN-8354, FW-3489). El numero de atras es el del sistema, asi que el
-- prefijo no agrega nada: obliga a traducir a mano cada vez que se compara el
-- panel con el sistema, que es justo lo que se hace para cargar precios y
-- stock.
--
-- Lo que NO se toca, a proposito:
--   * los combos (COMBO-...): son armados del sitio, no existen en el sistema,
--     y el codigo lleva adentro las piezas que los forman.
--   * los codigos sin numero atras (los cargados a mano, tipo MAN-XXXX).
--   * los numeros que ya estan ocupados por otro articulo, o que dos
--     articulos distintos se pelearian: esos quedan como estan y se ven en el
--     listado del final.
--   * el marcador __RESET_PRICES_MARKER__.
--
-- Los links viejos no se rompen: /tienda/HEINEKEN-8354 redirige al nuevo
-- (src/lib/codigo-viejo.ts). Hace falta porque esos links estan dando vueltas
-- por WhatsApp, por Instagram y en Google.

-- 1) Queda guardado el codigo del sistema, que es de donde salio el numero.
--    Sirve para que la importacion del Excel enganche exacto.
UPDATE "Product"
SET "codigoSistema" = regexp_replace("itemId", '^.*-', '')
WHERE ("codigoSistema" IS NULL OR "codigoSistema" = '')
  AND "itemId" ~ '^[A-Za-z]+-[0-9]+$';

-- 2) El codigo visible pasa a ser ese numero.
UPDATE "Product" p
SET "itemId" = n.nuevo
FROM (
  SELECT id, regexp_replace("itemId", '^.*-', '') AS nuevo
  FROM "Product"
  WHERE "itemId" ~ '^[A-Za-z]+-[0-9]+$'
) n
WHERE p.id = n.id
  -- El numero tiene que quedar libre: ni de un articulo que ya lo use,
  -- ni peleado entre dos que terminen en el mismo numero. Sin este control
  -- la migracion entera se cae por el codigo repetido y no cambia nada.
  AND NOT EXISTS (SELECT 1 FROM "Product" o WHERE o."itemId" = n.nuevo)
  AND (
    SELECT count(*) FROM "Product" q
    WHERE q."itemId" ~ '^[A-Za-z]+-[0-9]+$'
      AND regexp_replace(q."itemId", '^.*-', '') = n.nuevo
  ) = 1;
