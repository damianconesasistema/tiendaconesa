-- Las cobranzas de cuenta corriente de los clientes (V.0.11.289).
--
-- Damian, 27/11/2026: "nos pagaron la venta a cuenta corriente de ayer, ahora
-- hay que confirmar el pago"; "la transferencia fue a banco santander";
-- "tambien deberiamos anotarlo". Cada cobranza salda una o varias ventas en
-- cuenta corriente (imputaciones) y anota la "cobranza" en la cuenta donde
-- entro la plata (PuntoMovimiento con el mismo idLocal como grupo). Solo
-- agrega una tabla: no toca nada de lo que ya hay. Lo escribe
-- src/lib/punto-cobranzas.ts.

CREATE TABLE IF NOT EXISTS "PuntoCobranza" (
    "id" TEXT NOT NULL,
    "idLocal" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dia" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL DEFAULT '',
    "cliente" TEXT NOT NULL,
    "clienteDoc" TEXT NOT NULL DEFAULT '',
    "forma" TEXT NOT NULL,
    "cuentaId" TEXT,
    "cuentaNombre" TEXT NOT NULL DEFAULT '',
    "operacion" TEXT NOT NULL DEFAULT '',
    "nota" TEXT NOT NULL DEFAULT '',
    "monto" DOUBLE PRECISION NOT NULL,
    "imputaciones" JSONB NOT NULL,
    "anuladoEn" TIMESTAMP(3),
    "anuladoPor" TEXT,
    "motivo" TEXT,

    CONSTRAINT "PuntoCobranza_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoCobranza_idLocal_key" ON "PuntoCobranza"("idLocal");
CREATE UNIQUE INDEX IF NOT EXISTS "PuntoCobranza_sucursal_numero_key" ON "PuntoCobranza"("sucursal", "numero");
CREATE INDEX IF NOT EXISTS "PuntoCobranza_clienteId_idx" ON "PuntoCobranza"("clienteId");
CREATE INDEX IF NOT EXISTS "PuntoCobranza_creadoEn_idx" ON "PuntoCobranza"("creadoEn");
