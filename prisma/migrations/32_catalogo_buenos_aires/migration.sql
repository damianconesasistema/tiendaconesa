-- CopiarMarcasAlCatalogoDeBuenosAires
--
-- Buenos Aires arranca su catalogo con cuatro marcas: Piazza, Pringles,
-- Ferrum y TST.
--
-- El ARTICULO no se duplica: es el mismo producto, con el mismo titulo, la
-- misma foto y el mismo codigo, y ya esta en la tabla "Product". Lo que se
-- crea aca es la fila que dice "Buenos Aires tambien lo lleva", que es donde
-- viven los datos que SON de cada local.
--
-- Tres decisiones que vale la pena dejar escritas, porque son del negocio y
-- no de la programacion:
--
--   PAUSADOS (active = false). Es lo que se pidio. Quedan cargados y
--   visibles en el panel de Buenos Aires, pero no en su tienda. Esa tienda
--   ademas sigue cerrada: esto no la abre ni la toca.
--
--   SIN STOCK (stock = 0). El stock que figura hoy esta fisicamente en
--   Cordoba. Copiarlo seria decir que en Rincon 43 hay mercaderia que no
--   esta, y el dia que esa tienda abra se venderia algo que nadie puede
--   entregar. Cero es lo unico honesto hasta que alguien cuente el deposito.
--
--   CON EL PRECIO DE HOY, como punto de partida. Es un numero para arrancar,
--   no el precio de Buenos Aires: son dos negocios distintos, con otros
--   costos y otro flete. Se edita desde el panel de Buenos Aires.
--
-- ON CONFLICT DO NOTHING: si Buenos Aires ya tiene ese articulo cargado, no
-- se le pisa nada. Un precio que alguien ya puso vale mas que el que copia
-- esta migracion.
--
-- Van TODOS los de esas marcas, esten publicados o no, porque lo que se
-- pidio fue el catalogo de la marca y uno pausado no molesta a nadie. Si
-- falta alguno es porque no tiene la marca cargada en el panel: la copia se
-- guia por la marca del articulo y no por el titulo, para no arrastrar
-- cualquier cosa que diga "ferrum" en la descripcion.

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
WHERE lower(p.brand) IN ('piazza', 'pringles', 'ferrum', 'tst')
  AND p."itemId" <> '__RESET_PRICES_MARKER__'
ON CONFLICT ("branchId", "productId") DO NOTHING;
