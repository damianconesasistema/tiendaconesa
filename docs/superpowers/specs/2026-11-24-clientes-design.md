# Clientes en Punto (diseño corto)

Fecha: 24/11/2026. Pedido de Damián, después de cargar los 3.800 clientes de GBP:
"tendrías que hacerme una sección clientes donde están todos los datos de ellos".
Aprobó la propuesta ("Sí, armala").

## Para qué

Hoy los clientes solo se ven buscándolos desde la venta, de a 50, y no se pueden
corregir. Con 3.800 cargados de GBP (13 sin documento, sin teléfono ni mail porque
GBP no los exporta) hace falta un lugar para verlos todos y completarlos.

## Qué es

Una solapa **Clientes** en la barra, al lado de Proveedores, hecha como Proveedores:

- **Lista** de todos: nombre (con el domicilio abajo), CUIT o DNI, condición de IVA,
  localidad y provincia, teléfono, mail, lista de precios, límite de cuenta
  corriente e ID de GBP. Se ven los primeros 300 de lo filtrado (como Artículos) y
  el total.
- **Buscador** por nombre, CUIT, DNI, localidad, domicilio, teléfono o mail, sin
  tildes ni mayúsculas. **Filtros**: condición de IVA y provincia. Tilde "ver los
  dados de baja".
- **Excel y PDF** de lo filtrado (todo, no solo lo que se ve).
- **Ficha** al tocar un cliente (o "Editar"): todos los campos editables, "Traer de
  ARCA" con el CUIT o el DNI, y "Dado de baja" (no se borra: se marca, como hoy).
- **Nuevo cliente** desde la misma pantalla.

## Reglas

- Área nueva de permisos **"Clientes"**. El que tiene todo (Damián, Daniel) la ve
  sola; al que tiene una lista hay que tildársela en Usuarios.
- El CUIT no se repite: si al editar se pone uno que ya tiene otro cliente, no se
  guarda y se ofrece abrir ese.
- El ID de GBP no se edita.
- Los datos de personas no van en el código (el repositorio es público): la lista
  la da `/sistema/clientes` solo con usuario y el área Clientes.
- Celular: la tabla se desliza de costado; la ficha ocupa la pantalla.

## Lo que no es (por ahora)

- Los comprobantes de cada cliente en su ficha: es el segundo paso, ya propuesto.
- Saldo de cuenta corriente y cobranzas: va con Gerencia (cierre de caja y
  después).

## Cómo (llamadas mías)

- Servidor: `GET /sistema/clientes?todos=1` devuelve todos (también los dados de
  baja) y `PUT {id, cambios}` cambia solo lo que vino, revisado con las mismas
  reglas del alta (`limpiarCliente`). Las dos con el área "clientes".
- Página: la lista se pide al abrir la solapa y se filtra en el navegador (3.800
  clientes son ~1 MB, menos que los artículos).
- Alternativa descartada: buscar en el servidor en cada tecla, como en la venta.
  Para filtrar por IVA o provincia, exportar todo y contar, hace falta la lista
  entera; y ya se trae entera la de artículos, que es más grande.
