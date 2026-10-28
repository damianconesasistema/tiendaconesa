-- Cada sucursal va a tener su propia tienda en un subdominio
-- (traslasierra.conesa.com.ar, balvanera.conesa.com.ar), y el sitio resuelve
-- por ahi de quien son los datos: que CUIT factura, a que cuenta va la plata,
-- que precios muestra.
--
-- Estos dos campos no podian seguir siendo variables de entorno. Las
-- NEXT_PUBLIC_ se graban dentro de la pagina al compilar, asi que una misma
-- compilacion no puede tener dos QR distintos ni dos CUIT distintos. En la
-- base si.
--
-- subdominio: la parte de adelante del dominio, sin puntos ("balvanera").
-- afipQr: el codigo del QR de Data Fiscal, que es propio de cada CUIT y de
-- cada domicilio, y es obligatorio mostrarlo en la tienda.

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "subdominio" TEXT;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "afipQr" TEXT;

-- El subdominio arranca igual al slug, que es como ya se las identifica.
UPDATE "Branch" SET "subdominio" = "slug" WHERE "subdominio" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Branch_subdominio_key" ON "Branch"("subdominio");
