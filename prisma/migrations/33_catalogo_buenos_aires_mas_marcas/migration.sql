-- MasMarcasAlCatalogoDeBuenosAires
--
-- Cuatro marcas mas al catalogo de Buenos Aires: Heineken, Hydros, Narf y
-- Dogo. Mismas reglas que la 32, que son las que se decidieron ahi:
--
--   PAUSADOS (active = false). "Todo pausado en Buenos Aires por el
--   momento". Quedan cargados y visibles en el panel de Buenos Aires, pero
--   no en su tienda. Esa tienda ademas sigue cerrada.
--
--   SIN STOCK (stock = 0). El stock que figura hoy esta fisicamente en
--   Cordoba. Ponerlo aca seria decir que en Rincon 43 hay mercaderia que no
--   esta.
--
--   CON EL PRECIO DE HOY, como punto de partida y nada mas. Se edita desde
--   el panel de Buenos Aires.
--
-- ON CONFLICT DO NOTHING: lo que Buenos Aires ya tenga cargado no se pisa.
--
-- Los cuatro codigos de marca estan verificados contra src/lib/marcas.ts
-- antes de escribir esto: 'heineken', 'hydros', 'narf' y 'dogo'. Si se
-- escribiera uno que no existe, esto copiaria cero articulos sin dar ningun
-- error, y nadie se enteraria hasta abrir el panel.
--
-- Va por marca del articulo y no por el titulo, para no arrastrar cualquier
-- cosa que la mencione en la descripcion. Si falta alguno, es que no tiene
-- la marca cargada en el panel.

INSERT INTO "BranchProduct"
  (id, "branchId", "productId", price, "salePrice", stock, active, "createdAt", "updatedAt")
SELECT gen_random_uuid()::text,
       bsas.id,
       p.id,
       p.price,
       p."salePrice",
       0,
       false,
       now(),
       now()
FROM "Product" p
CROSS JOIN (SELECT id FROM "Branch" WHERE slug = 'bsas') bsas
WHERE lower(p.brand) IN ('heineken', 'hydros', 'narf', 'dogo')
  AND p."itemId" <> '__RESET_PRICES_MARKER__'
ON CONFLICT ("branchId", "productId") DO NOTHING;
