-- Los accesorios no llevan "Grifería Accesorios –" adelante (16/11/2026)
--
-- Damian, sobre "Grifería Accesorios – Jabonera Mikka FV 0168/31-CR Cromo":
-- "eso de Grifería Accesorios no deberia estar en el titulo, sino el resto
-- como sigue". El titulo nuevo ya se arma asi (src/lib/fv-ficha.ts,
-- SIN_RUBRO_ADELANTE). Esto corrige los que ya se crearon: les saca SOLO ese
-- comienzo, el resto del titulo queda tal cual.
--
-- Solo articulos del subrubro accesorios cuyo titulo empieza exactamente
-- con ese texto. Un titulo que ya se edito a mano y no empieza asi no se
-- toca. No cambia precios, stock, fotos ni si esta activo o pausado.
-- Se puede correr dos veces: la segunda no encuentra nada.

UPDATE "Product"
SET "title" = regexp_replace("title", '^Grifer(í|i)a Accesorios[[:space:]]*(–|-)[[:space:]]*', '', 'i')
WHERE "subcategory" = 'accesorios'
  AND "title" ~* '^Grifer(í|i)a Accesorios[[:space:]]*(–|-)';
