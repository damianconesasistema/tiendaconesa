-- La agenda de pagos a proveedores (V.0.11.257).
--
-- Damian, 24/11/2026: "necesito en proveedores agendas de pago y setearlas
-- con fechas y que me avise el sistema que tengo que realizar pagos". Se
-- cargan a mano.
--
-- PuntoPago: cada pago a hacer (o cada cuota), con su vencimiento, cuantos
-- dias antes avisa, y al pagarlo de que cuenta salio. Solo agrega una tabla:
-- no toca nada de lo que ya hay. Lo escribe src/lib/punto-pagos.ts.

CREATE TABLE IF NOT EXISTS "PuntoPago" (
    "id" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "cuota" INTEGER NOT NULL DEFAULT 1,
    "cuotas" INTEGER NOT NULL DEFAULT 1,
    "proveedorId" TEXT,
    "proveedor" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "concepto" TEXT NOT NULL DEFAULT '',
    "monto" DOUBLE PRECISION NOT NULL,
    "vence" TEXT NOT NULL,
    "forma" TEXT NOT NULL DEFAULT '',
    "avisar" INTEGER NOT NULL DEFAULT 3,
    "nota" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "version" INTEGER NOT NULL DEFAULT 1,
    "creadoPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "pagadoDia" TEXT,
    "pagadoEn" TIMESTAMP(3),
    "pagadoPor" TEXT,
    "montoPagado" DOUBLE PRECISION,
    "cuentaId" TEXT,
    "marcaPago" TEXT,
    "anuladoEn" TIMESTAMP(3),
    "anuladoPor" TEXT,
    "motivo" TEXT,

    CONSTRAINT "PuntoPago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoPago_grupo_cuota_key" ON "PuntoPago"("grupo", "cuota");
CREATE INDEX IF NOT EXISTS "PuntoPago_estado_vence_idx" ON "PuntoPago"("estado", "vence");
