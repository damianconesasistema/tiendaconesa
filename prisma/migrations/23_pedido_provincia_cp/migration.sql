-- Provincia y codigo postal del pedido.
--
-- Hasta ahora el checkout solo dejaba elegir una localidad de una lista fija
-- del Valle de Traslasierra. El que entraba desde cualquier otro lado no
-- tenia su localidad en la lista: no podia comprar. Eso explica buena parte
-- de "entra gente y no compran".
--
-- El codigo postal ademas es lo que va a decidir que sucursal atiende cada
-- pedido, que es el dato que hoy esta cargado en el panel y no lee nadie.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "province" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
