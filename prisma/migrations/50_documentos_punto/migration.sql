-- Lo que se emite en el sistema Punto, guardado en la base
--
-- Damian, 21/11/2026: "el presupuesto que emiti donde queda? deberian
-- mostrarse todos los presupuestos y ver lo que estuve presupuestando o
-- facturando". Hasta ahora Punto lo tenia en la memoria de la pestaña: el
-- presupuesto solo gastaba el numero y al recargar no quedaba nada. Un
-- renglon por documento (no un Setting JSON: dos puestos a la vez se pisan,
-- ver la migracion 49), y el numero lo da el servidor con PuntoNumerador.
-- Lo escribe src/lib/punto-documentos.ts.
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

CREATE TABLE IF NOT EXISTS "PuntoDocumento" (
    "id" TEXT NOT NULL,
    "idLocal" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "comp" TEXT NOT NULL,
    "letra" TEXT,
    "sucursal" TEXT NOT NULL,
    "pv" TEXT NOT NULL,
    "numero" INTEGER,
    "pedido" INTEGER NOT NULL,
    "usuario" TEXT NOT NULL,
    "vendedor" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "origenId" TEXT,
    "datos" JSONB NOT NULL,

    CONSTRAINT "PuntoDocumento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoDocumento_idLocal_key" ON "PuntoDocumento"("idLocal");
CREATE UNIQUE INDEX IF NOT EXISTS "PuntoDocumento_sucursal_letra_numero_key" ON "PuntoDocumento"("sucursal", "letra", "numero");
CREATE INDEX IF NOT EXISTS "PuntoDocumento_createdAt_idx" ON "PuntoDocumento"("createdAt");
CREATE INDEX IF NOT EXISTS "PuntoDocumento_tipo_createdAt_idx" ON "PuntoDocumento"("tipo", "createdAt");
CREATE INDEX IF NOT EXISTS "PuntoDocumento_origenId_idx" ON "PuntoDocumento"("origenId");

-- El ultimo numero usado de cada serie ("srl:B", "tsl:X", "pedido").
CREATE TABLE IF NOT EXISTS "PuntoNumerador" (
    "clave" TEXT NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PuntoNumerador_pkey" PRIMARY KEY ("clave")
);
