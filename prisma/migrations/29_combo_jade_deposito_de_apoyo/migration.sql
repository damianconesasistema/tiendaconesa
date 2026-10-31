-- El combo Jade de 3 piezas llevaba mal una pieza en el codigo.
--
-- La migracion 28 le puso 9898+9815+9577. El 9815 es el "DERPLA DEPOSITO A
-- CODO JADE", que va colgado de la pared. El combo lleva el de APOYO, que va
-- sentado sobre el inodoro: 22100, "DEPOSITO APOYO CLASICO 14.5CM (JADE)".
-- Lo confirmo Damian.
--
-- La cuenta ya lo decia, y conviene dejarlo escrito porque es el metodo para
-- la proxima: todos los combos de Pringles subieron 8,4% con esta lista. Con
-- el 22100 este sube 8,4% tambien; con el 9815 subia 12,8% y con el 3754
-- (Cuarzo/Jade) subia 21%. El que da el mismo numero que los demas es el que
-- el combo tenia desde el principio.
--
-- Los links no se rompen: 9898+9815+9577 y el MAN- original redirigen al
-- codigo nuevo (src/lib/codigo-viejo.ts, RENOMBRADOS).
UPDATE "Product"
SET "itemId" = '9898+22100+9577'
WHERE "itemId" = '9898+9815+9577'
  AND NOT EXISTS (
    SELECT 1 FROM "Product" o WHERE o."itemId" = '9898+22100+9577'
  );
