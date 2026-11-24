-- Gerencia, parte 1: cuentas y gastos de cada razon social.
--
-- Damian, 24/11/2026: "en gerencia necesito que tenga un lugar donde sea los
-- gastos diarios y los gastos mensuales de cada sucursal"; "puede ser
-- efectivo, la caja de mercado pago, la caja de los bancos: eso debemos
-- asociarlo y que vos ya lo computes".
--
-- PuntoCuenta: el efectivo, Mercado Pago y cada banco de srl, cnc y tsl, con
-- el saldo con el que arrancan. PuntoMovimiento: cada gasto, pago a
-- proveedor, retiro, cobranza, sena, ajuste o pase entre cuentas. Solo
-- agrega tablas: no toca nada de lo que ya hay. Lo escribe
-- src/lib/punto-cuentas.ts.

CREATE TABLE IF NOT EXISTS "PuntoCuenta" (
    "id" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "banco" TEXT NOT NULL DEFAULT '',
    "clase" TEXT,
    "saldoInicial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "desde" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuntoCuenta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PuntoMovimiento" (
    "id" TEXT NOT NULL,
    "idLocal" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "rubro" TEXT NOT NULL DEFAULT '',
    "detalle" TEXT NOT NULL DEFAULT '',
    "iva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reparto" JSONB,
    "anuladoEn" TIMESTAMP(3),
    "anuladoPor" TEXT,
    "motivo" TEXT,

    CONSTRAINT "PuntoMovimiento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoCuenta_sucursal_nombre_key" ON "PuntoCuenta"("sucursal", "nombre");
CREATE UNIQUE INDEX IF NOT EXISTS "PuntoMovimiento_idLocal_cuentaId_key" ON "PuntoMovimiento"("idLocal", "cuentaId");
CREATE INDEX IF NOT EXISTS "PuntoMovimiento_cuentaId_fecha_idx" ON "PuntoMovimiento"("cuentaId", "fecha");
CREATE INDEX IF NOT EXISTS "PuntoMovimiento_sucursal_fecha_idx" ON "PuntoMovimiento"("sucursal", "fecha");
CREATE INDEX IF NOT EXISTS "PuntoMovimiento_grupo_idx" ON "PuntoMovimiento"("grupo");

DO $$ BEGIN
  ALTER TABLE "PuntoMovimiento" ADD CONSTRAINT "PuntoMovimiento_cuentaId_fkey"
    FOREIGN KEY ("cuentaId") REFERENCES "PuntoCuenta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
