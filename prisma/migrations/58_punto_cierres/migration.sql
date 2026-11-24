-- El cierre de la caja de efectivo de cada razon social (V.0.11.255).
--
-- Damian, 24/11/2026: "caja en efectivo necesito todos los dias cerrar la
-- misma y abrir y saber cuanto hay, es decir cuando abro a la mañana con X
-- plata que se conto el dia anterior al cierre del dia" y "necesitamos un
-- panel donde se ingrese los billetes que hay en la caja de efectivo".
--
-- PuntoCierre: cada cierre (y la primera apertura), con los billetes
-- contados, lo que tendria que haber, la diferencia, lo que se retiro y con
-- lo que abre el siguiente. Solo agrega una tabla: no toca nada de lo que ya
-- hay. Lo escribe src/lib/punto-cierres.ts.

CREATE TABLE IF NOT EXISTS "PuntoCierre" (
    "id" TEXT NOT NULL,
    "idLocal" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "desde" TIMESTAMP(3),
    "hasta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apertura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ventas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "movimientos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esperado" DOUBLE PRECISION NOT NULL,
    "contado" DOUBLE PRECISION NOT NULL,
    "diferencia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "retiro" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "destino" TEXT NOT NULL DEFAULT '',
    "queda" DOUBLE PRECISION NOT NULL,
    "billetes" JSONB NOT NULL,
    "nota" TEXT NOT NULL DEFAULT '',
    "usuario" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PuntoCierre_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoCierre_idLocal_key" ON "PuntoCierre"("idLocal");
CREATE INDEX IF NOT EXISTS "PuntoCierre_sucursal_hasta_idx" ON "PuntoCierre"("sucursal", "hasta");
