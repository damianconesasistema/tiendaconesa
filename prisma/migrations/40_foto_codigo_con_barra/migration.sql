-- La foto de los articulos con barra en el codigo (16/11/2026)
--
-- Los FV se crearon por Excel con su codigo ("0167/17-CR") y la foto de la
-- pagina de FV quedo guardada, pero la direccion de la foto se armo con la
-- barra sin codificar: "/api/productos/0167/17-CR/imagen" es otra direccion
-- y daba 404, asi que el panel mostraba el icono roto. Damian: "las fotos no
-- termino subiendolas".
--
-- El codigo nuevo ya la arma bien (src/lib/rutas-producto.ts). Esto corrige
-- la que quedo anotada en los que ya estan: solo la direccion. No toca las
-- fotos, ni precios, ni stock, ni si el articulo esta activo o pausado.
-- Se puede correr dos veces: deja lo mismo.

UPDATE "Product"
SET "imageUrl" = '/api/productos/' || replace("itemId", '/', '%2F') || '/imagen?v=1763300000'
WHERE "itemId" LIKE '%/%'
  AND "imageUrl" LIKE '/api/productos/%/imagen%';
