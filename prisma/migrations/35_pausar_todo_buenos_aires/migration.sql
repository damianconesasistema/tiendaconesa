-- PausarTodoBuenosAires
--
-- "lo de buenos aires de la tienda todo pausado por favor" (Damian,
-- 13/11/2026). Lo copiado hasta hoy ya entro pausado, pero esto lo deja
-- escrito y no depende de que las migraciones anteriores hayan salido como
-- se esperaba: pausa TODO lo que hoy tenga Buenos Aires, sin excepcion.
--
-- Pausado quiere decir que el articulo no se muestra ni se puede comprar en
-- buenosaires.conesa.com.ar. NO lo borra: el precio, el titulo y las fotos
-- quedan como estan, listos para cuando se decida publicarlo.
--
-- No toca el stock (ya esta en 0: la mercaderia esta fisicamente en
-- Cordoba) ni toca a Traslasierra.
--
-- Corre una sola vez. Lo que se publique despues desde el panel de Buenos
-- Aires queda publicado; esta migracion no lo vuelve a pausar.

UPDATE "BranchProduct" bp
SET active = false, "updatedAt" = now()
FROM (SELECT id FROM "Branch" WHERE slug = 'bsas') b
WHERE bp."branchId" = b.id AND bp.active;
