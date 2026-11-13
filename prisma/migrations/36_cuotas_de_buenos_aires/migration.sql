-- CuotasDeBuenosAires
--
-- Los costos de ofrecer cuotas de la cuenta de MercadoPago de Buenos Aires,
-- que Damian paso el 13/11/2026:
--
--   3 cuotas 23%   6 cuotas 31%   9 cuotas 42%   12 cuotas 53%   18 cuotas 74%
--
-- Eso es lo que PAGA DE MAS EL CLIENTE (confirmado por el), no el costo que
-- publica MercadoPago. El sitio guarda el costo del plan y saca el recargo
-- solo, asi que aca va la cuenta al reves: que costo hay que cargar para que
-- el recargo de exactamente esos numeros.
--
--   costo total = (6,60 de cobro + costo del plan) x 1,21 de IVA
--   recargo     = 1 / (1 - costo total) - 1
--
-- Verificado uno por uno sobre un articulo de $100.000:
--   3 -> $123.000   6 -> $131.000   9 -> $142.000   12 -> $153.000   18 -> $174.000
--
-- Van con el nombre de la sucursal pegado atras (":bsas"). La clave sin
-- nombre sigue existiendo y es la que usan Traslasierra y conesa.com.ar: este
-- archivo no toca ni un precio de Traslasierra.
--
-- Lo que NO entra aca, porque Damian no lo paso: el recargo de 1 pago de
-- Buenos Aires. Hasta que se cargue, usa el general (13,63636% = 12% de
-- descuento por contado).

INSERT INTO "Setting" (key, value, "updatedAt") VALUES
  ('mp_planes:bsas',
   '[{"cuotas":3,"costo":8.8539},{"cuotas":6,"costo":12.9571},{"cuotas":9,"costo":17.8442},{"cuotas":12,"costo":22.0285},{"cuotas":18,"costo":28.5477}]',
   now()),
  -- Hasta donde se puede pagar en cuotas. Tiene que llegar al plan mas largo
  -- que se ofrece: si queda mas abajo, MercadoPago no deja pagar en 18 aunque
  -- el sitio las muestre.
  ('mp_cuotas_max:bsas', '18', now()),
  -- Solo por si algun dia se pide una cantidad de cuotas que no esta en la
  -- lista. Va el de 6, que es el mismo criterio que la clave general.
  ('recargo_mp_cuotas_pct:bsas', '31', now())
ON CONFLICT (key) DO NOTHING;
