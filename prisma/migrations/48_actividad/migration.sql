-- Registro de actividad del panel
--
-- Damian, 19/11/2026: "quiero que cada modificacion o lo que se haga en el
-- panel quede asentado con el usuario que toco". Una fila por accion: quien,
-- cuando, que hizo y sobre que. Lo escribe src/lib/actividad.ts y se ve en
-- Panel -> Registro.

CREATE TABLE IF NOT EXISTS "Actividad" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "detalle" TEXT,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Actividad_fecha_idx" ON "Actividad"("fecha");
CREATE INDEX IF NOT EXISTS "Actividad_usuario_idx" ON "Actividad"("usuario");
