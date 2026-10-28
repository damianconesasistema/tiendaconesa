-- Coordenadas del local, para la ficha que lee Google.
--
-- Van una por sucursal y no inventadas: un punto mal puesto en el mapa manda
-- al cliente a otra cuadra, y eso es peor que no tener punto. Por eso
-- Balvanera queda vacia hasta que alguien mire la direccion real en el mapa
-- (boton derecho sobre el local, "copiar coordenadas").

ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

-- Traslasierra ya las tenia escritas en el codigo del sitio.
UPDATE "Branch" SET lat = -31.8431, lng = -65.0206
  WHERE slug = 'traslasierra' AND lat IS NULL;
