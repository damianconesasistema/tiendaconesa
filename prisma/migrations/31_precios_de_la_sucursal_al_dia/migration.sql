-- SyncBranchProductWithProduct
--
-- Deja el catalogo de Traslasierra al dia ANTES de que la tienda empiece a
-- leer de ahi los precios.
--
-- Hasta esta version la tienda mostraba y cobraba el precio del ARTICULO
-- ("Product"). La tabla del local ("BranchProduct") existia y el panel ya la
-- leia, pero se lleno una sola vez el dia que se separaron las sucursales.
-- Si quedo algo viejo ahi adentro y la tienda empieza a leerla sin mas, el
-- sitio publica precios que no son — en produccion y al instante.
--
-- Por eso se copia el articulo a la fila del local, y no al reves: el precio
-- del articulo es EXACTAMENTE el que el cliente esta viendo hoy en la tienda.
-- Despues de esta migracion la tienda lee otra tabla pero muestra los mismos
-- numeros que mostraba ayer. Ese es el punto: que el cambio no se note.
--
-- Va contra 'traslasierra' escrito con todas las letras, y no contra "la que
-- tiene la tienda abierta", que es como lo resuelve el resto del sistema. Dos
-- razones: es el local que viene mostrando este catalogo y eso es un hecho
-- historico, no una regla; y si el dia del cambio la tienda esta cerrada por
-- lo que sea, "la que vende" no es nadie y esto no haria nada, que es el
-- unico caso en el que de verdad hace falta.
--
-- El catalogo de Buenos Aires se carga aparte, con sus precios. Dar de alta
-- aca los articulos del local que todavia no abrio seria ponerle el precio
-- del vecino.
--
-- Corre una sola vez. El dia a dia lo mantienen las pantallas del panel, que
-- escriben en las dos tablas mientras dure la transicion.

-- 1) Las filas que ya existen: se ponen al dia.
UPDATE "BranchProduct" bp
SET price       = p.price,
    "salePrice" = p."salePrice",
    stock       = p.stock,
    active      = p.active,
    "updatedAt" = now()
FROM "Product" p,
     (SELECT id FROM "Branch" WHERE slug = 'traslasierra') b
WHERE bp."productId" = p.id
  AND bp."branchId"  = b.id;

-- 2) Las que falten: se dan de alta con lo mismo que muestra la tienda.
--
-- Sin esto, un articulo que esta publicado pero no tiene fila en el local
-- desapareceria del sitio el dia del cambio. ON CONFLICT DO NOTHING para que
-- no choque con lo que ya arreglo el paso 1.
--
-- El marcador de precios no es un articulo de verdad: no va.
INSERT INTO "BranchProduct"
  (id, "branchId", "productId", price, "salePrice", stock, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       b.id, p.id, p.price, p."salePrice", p.stock, p.active, now(), now()
FROM "Product" p
CROSS JOIN (SELECT id FROM "Branch" WHERE slug = 'traslasierra') b
WHERE p."itemId" <> '__RESET_PRICES_MARKER__'
ON CONFLICT ("branchId", "productId") DO NOTHING;
