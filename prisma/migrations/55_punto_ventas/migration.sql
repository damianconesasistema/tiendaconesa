-- La venta de Punto pasa al servidor, con caja, pedidos y clientes.
--
-- Damian, 22/11/2026: "Todo tiene que estar en el servidor, nada de en
-- ninguna maquina local, porque se va a leer con varios usuarios en
-- diferentes computadoras y en diferentes lugares", y "que el comprobante
-- pase a un estado de al cajero ... los vendedores no puedan cobrar, sino
-- que el cajero es el encargado de cobrar y emitir".
--
-- PuntoVenta: la venta que se esta armando (una por usuario y pestana,
-- "lugar"), los borradores, los tickets que esperan en la caja de una
-- sucursal, los que esta cobrando un cajero y los pedidos tomados. Lo escribe
-- src/lib/punto-ventas.ts; el paso a "cobrada" lo hace
-- src/lib/punto-documentos.ts al emitir, en la misma transaccion. El unico de
-- (usuario, lugar) es el que asegura una sola venta abierta por pestana: en
-- Postgres dos NULL no chocan, asi que los borradores (lugar NULL) no se
-- molestan entre si.
--
-- PuntoCliente: los clientes, que hasta hoy vivian en cada compu. Lo escribe
-- src/lib/punto-clientes.ts.
--
-- PuntoProveedor.flete: el flete del proveedor en % (0 a 100). Se carga en
-- Punto; volver a importar el Excel de GBP no lo toca.
--
-- PuntoProveedor, el resto (segunda parte de la V.0.99.82). Damian: "dame la
-- posibilidad de editar esos proveedores y tambien eliminar", "que ponga un
-- contacto de vendedor y algun numero de telefono de WhatsApp ... Tambien
-- mail". gbpId pasa a aceptar NULL: el proveedor que se da de alta en Punto
-- no viene de GBP (en Postgres muchos NULL no chocan en el unico). contacto,
-- whatsapp, email y notas se cargan en Punto; editados son los datos de GBP
-- retocados a mano, que el Excel ya no pisa; eliminadoEn / eliminadoPor es el
-- eliminar que no borra (como PuntoDocumento).
--
-- PuntoCompra: los pedidos a los proveedores (ordenes de compra, OC-0001),
-- con los costos y los totales que calcula el servidor. Lo escribe
-- src/lib/punto-compras.ts. El numero sale de PuntoNumerador ("n2:compra").
-- marcas: las de los ultimos "sumar" que entraron (la pagina repite la marca
-- si reintenta): asi un reintento no suma dos veces lo mismo.
--
-- ALTER COLUMN ... DROP NOT NULL no falla si ya acepta NULL: tambien se
-- puede correr dos veces.
--
-- "actualizadoEn" sin DEFAULT, como lo arma Prisma: lo pone Prisma en cada
-- escritura (@updatedAt).
--
-- IF NOT EXISTS: si por algun motivo corre dos veces, no rompe el arranque
-- (ver la leccion de la migracion 15 en prisma/pre-start.mjs).

ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "flete" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "PuntoVenta" (
    "id" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "estado" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "vendedor" TEXT NOT NULL,
    "vendedorUsuario" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "lugar" TEXT,
    "tomadoPor" TEXT,
    "tomadoEn" TIMESTAMP(3),
    "documentoId" TEXT,
    "origenId" TEXT,
    "cliente" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "datos" JSONB NOT NULL,

    CONSTRAINT "PuntoVenta_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PuntoCliente" (
    "id" TEXT NOT NULL,
    "gbpId" INTEGER,
    "cuit" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "condicionIva" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "lista" TEXT NOT NULL,
    "limite" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "inactivo" BOOLEAN NOT NULL DEFAULT false,
    "creadoPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PuntoCliente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PuntoVenta_estado_sucursal_idx" ON "PuntoVenta"("estado", "sucursal");
CREATE INDEX IF NOT EXISTS "PuntoVenta_usuario_estado_idx" ON "PuntoVenta"("usuario", "estado");
CREATE UNIQUE INDEX IF NOT EXISTS "PuntoVenta_usuario_lugar_key" ON "PuntoVenta"("usuario", "lugar");

CREATE UNIQUE INDEX IF NOT EXISTS "PuntoCliente_gbpId_key" ON "PuntoCliente"("gbpId");
CREATE INDEX IF NOT EXISTS "PuntoCliente_nombre_idx" ON "PuntoCliente"("nombre");
CREATE INDEX IF NOT EXISTS "PuntoCliente_cuit_idx" ON "PuntoCliente"("cuit");

-- PuntoProveedor: alta en Punto, contacto, editados y eliminar.
ALTER TABLE "PuntoProveedor" ALTER COLUMN "gbpId" DROP NOT NULL;
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "contacto" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "notas" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "editados" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "creadoPor" TEXT NOT NULL DEFAULT '';
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "eliminadoEn" TIMESTAMP(3);
ALTER TABLE "PuntoProveedor" ADD COLUMN IF NOT EXISTS "eliminadoPor" TEXT;

-- PuntoCompra: los pedidos a los proveedores.
CREATE TABLE IF NOT EXISTS "PuntoCompra" (
    "id" TEXT NOT NULL,
    "nro" INTEGER NOT NULL,
    "proveedorId" TEXT,
    "proveedor" TEXT NOT NULL,
    "sucursal" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "renglones" JSONB NOT NULL,
    "neto" DOUBLE PRECISION NOT NULL,
    "iva" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "nota" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "creadoPor" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "enviadoEn" TIMESTAMP(3),
    "cerradoEn" TIMESTAMP(3),
    "marcas" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "PuntoCompra_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PuntoCompra_estado_sucursal_idx" ON "PuntoCompra"("estado", "sucursal");
CREATE INDEX IF NOT EXISTS "PuntoCompra_proveedorId_idx" ON "PuntoCompra"("proveedorId");
