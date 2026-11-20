-- Comparador de precios: un renglon por producto
--
-- Hasta V.0.99.54 todo lo que encontraba el comparador iba junto en el
-- Setting "comparador_precios", y si dos usuarios buscaban a la vez el
-- ultimo pisaba lo del otro (Damian, 20/11/2026: "si, arreglalo"). Lo viejo
-- lo pasa src/lib/comparador.ts (pasarLoViejo) la primera vez que se abre el
-- comparador.

CREATE TABLE IF NOT EXISTS "ComparacionPrecio" (
    "itemId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "datos" JSONB NOT NULL,

    CONSTRAINT "ComparacionPrecio_pkey" PRIMARY KEY ("itemId")
);
