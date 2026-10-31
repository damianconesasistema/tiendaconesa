-- El descuento por transferencia pasa de 10% a 12%. Lo pidio Damian el
-- 31/10/2026.
--
-- EL NUMERO QUE SE GUARDA NO ES EL DESCUENTO, ES EL RECARGO
-- La base guarda el precio de contado y la tienda le suma el recargo para
-- mostrar el de 1 pago. El descuento que ve el cliente es la diferencia entre
-- los dos, medida sobre el precio de vitrina, asi que no es el mismo numero:
--
--   recargo = 1 / (1 - descuento) - 1
--
--   descuento 10%  ->  recargo 11,11%      (el que habia)
--   descuento 12%  ->  recargo 13,63636%   (el nuevo)
--
-- Los decimales importan: el recargo exacto es 100/0,88 - 100. Redondeado a
-- 13,64 los precios quedan unos pesos por debajo de hacer la cuenta a mano,
-- y eso se nota cuando alguien revisa el Excel con la calculadora.
--
-- Por que hace falta esta migracion y no alcanza con cambiar el valor por
-- defecto del codigo: si el panel ya tiene el recargo guardado, ese gana
-- sobre el default y el cambio no se veria en ningun lado.
--
-- Solo pisa el valor viejo (11,11) o la falta de valor. Si alguien puso otro
-- numero a mano desde el panel, ese se respeta: no es trabajo de una
-- migracion deshacer una decision que se tomo despues.
INSERT INTO "Setting" ("key", "value", "updatedAt")
VALUES ('recargo_mp_1pago_pct', '13.63636', now())
ON CONFLICT ("key") DO UPDATE
  SET "value" = '13.63636', "updatedAt" = now()
  WHERE "Setting"."value" IN ('11.11', '11,11');
