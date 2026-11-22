-- Punto arranca de cero.
--
-- Damian, 22/11/2026: "El presupuesto ya necesito que sea 0001, o sea, que
-- arranque de principio". Confirmo en el chat ese mismo dia: borrar para
-- siempre los comprobantes de prueba ("Si, borralos"). Todo lo que habia en
-- PuntoDocumento eran pruebas (el sistema se usaba como demo hasta ese dia)
-- y los numeradores venian de numeros inventados (X 3301, B 48214...).
--
-- Corre una sola vez (queda anotada en _prisma_migrations). Los articulos
-- de GBP (Setting punto.articulos.v1) NO se tocan: son datos de verdad.
-- Desde aca cada serie arranca en 1, salvo que alguien corrija el numero a
-- mano para seguir la numeracion de GBP.

DELETE FROM "PuntoDocumento";
DELETE FROM "PuntoNumerador";
