-- Los proveedores del sistema Punto, traidos de GlobalBluePoint.
--
-- Damian, 22/11/2026: "este es el listado de proveedores del sistema tanto
-- de buenos aires como de traslasierra". Es el Excel de proveedores que
-- exporta GBP: los de las dos sucursales en una sola lista. Un renglon por
-- proveedor (no un Setting JSON como los articulos): mas adelante cada uno
-- lleva su cadena de descuentos ("cadena"), y volver a importar el Excel la
-- tiene que dejar como esta. Se reconoce a cada uno por el ID de GBP
-- (gbpId), no por el CUIT: hay proveedores con CUIT de relleno y repetidos.
-- Lo escribe src/lib/punto-proveedores.ts.
--
-- "actualizadoEn" sin DEFAULT, como lo arma Prisma: lo pone Prisma en cada
-- escritura (@updatedAt).
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

CREATE TABLE IF NOT EXISTS "PuntoProveedor" (
    "id" TEXT NOT NULL,
    "gbpId" INTEGER NOT NULL,
    "cuit" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "claseFiscal" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "condicionCompra" TEXT NOT NULL,
    "moneda" TEXT NOT NULL,
    "inactivo" BOOLEAN NOT NULL DEFAULT false,
    "cadena" JSONB,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "actualizadoPor" TEXT NOT NULL,

    CONSTRAINT "PuntoProveedor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoProveedor_gbpId_key" ON "PuntoProveedor"("gbpId");
CREATE INDEX IF NOT EXISTS "PuntoProveedor_razonSocial_idx" ON "PuntoProveedor"("razonSocial");
CREATE INDEX IF NOT EXISTS "PuntoProveedor_cuit_idx" ON "PuntoProveedor"("cuit");
