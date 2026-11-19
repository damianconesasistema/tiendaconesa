-- Que miran y que buscan los que entran a la tienda
--
-- Damian, 19/11/2026: "me podes tagear cada producto para saber que miran o
-- buscan los que entran?" y "en lo que es el panel de productos no cuentes
-- ahi porque somos nosotros". Una fila por producto (o por palabra buscada)
-- y por dia de Argentina. Lo cuenta src/lib/miradas.ts y lo muestra
-- Panel -> Que miran.
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

CREATE TABLE IF NOT EXISTS "VistaDiaria" (
    "itemId" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VistaDiaria_pkey" PRIMARY KEY ("itemId", "dia")
);

CREATE INDEX IF NOT EXISTS "VistaDiaria_dia_idx" ON "VistaDiaria"("dia");

CREATE TABLE IF NOT EXISTS "BusquedaDiaria" (
    "termino" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "resultados" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BusquedaDiaria_pkey" PRIMARY KEY ("termino", "dia")
);

CREATE INDEX IF NOT EXISTS "BusquedaDiaria_dia_idx" ON "BusquedaDiaria"("dia");
