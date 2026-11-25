-- Lo que piden los clientes y no tenemos (V.0.11.260).
--
-- Daniel, 25/11/2026: "en la parte de vender o presupuestar ... un boton que
-- diga notas donde yo pueda ingresar una nota de texto o voz donde sugiera
-- algun producto que me piden los clientes". Lo anota el vendedor desde la
-- venta; gerencia lo ve agrupado en Proveedores. Solo agrega una tabla: no
-- toca nada de lo que ya hay. Lo escribe src/lib/punto-notas.ts.

CREATE TABLE IF NOT EXISTS "PuntoNotaCliente" (
    "id" TEXT NOT NULL,
    "idLocal" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "porVoz" BOOLEAN NOT NULL DEFAULT false,
    "cantidad" INTEGER,
    "cliente" TEXT NOT NULL DEFAULT '',
    "sucursal" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" TEXT NOT NULL DEFAULT 'nueva',
    "resueltoEn" TIMESTAMP(3),
    "resueltoPor" TEXT,
    "motivo" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "PuntoNotaCliente_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoNotaCliente_idLocal_key" ON "PuntoNotaCliente"("idLocal");
CREATE INDEX IF NOT EXISTS "PuntoNotaCliente_estado_creadoEn_idx" ON "PuntoNotaCliente"("estado", "creadoEn");
