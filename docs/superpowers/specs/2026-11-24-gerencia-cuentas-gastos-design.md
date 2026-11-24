# Gerencia: cuentas, gastos, cierres de caja y reportes (Punto)

Fecha: 24/11/2026. Pedido de Damián (dueño de Sanitarios Conesa), en el sistema Punto
(`/sistema`), que reemplaza a GBP. Sucursales / razones sociales: `srl`, `cnc`, `tsl`
(Traslasierra, la piloto).

## Para qué

Damián quiere que **Gerencia** tenga todo lo que hoy no tiene: los **gastos diarios y
mensuales de cada sucursal**, **las cajas** (efectivo, Mercado Pago, bancos) con su saldo, el
**cierre de caja** de cada día y **reportes de ventas** por período. Lo primero que quiere ver
al abrir Gerencia es **"Lo que quedó"**: la ganancia real de cada sucursal (lo vendido, menos lo
que costó la mercadería, menos los gastos).

Hoy Gerencia (Resumen, Rentabilidad, Contable) muestra solo lo del día, y no existe ningún
gasto en Punto. La solapa "Caja del día" está aparte y suma las ventas del día por sucursal,
vendedor y forma de pago.

## Lo que decidió Damián

1. **Gastos del día:** salen de la caja de la sucursal y los anota **el cajero**. **Gerencia
   también puede anotar** un gasto.
2. **Cuentas:** la plata puede salir del **efectivo**, de **Mercado Pago** o de un **banco**
   (caja de ahorro o cuenta corriente). Cada gasto dice **de qué cuenta salió**, y el sistema
   **calcula el saldo de cada cuenta**.
3. **Bancos y Mercado Pago: se sube el extracto.** Damián baja de su home banking (o de la
   web de Mercado Pago) el archivo de movimientos (Excel/CSV, o PDF si el banco no da otro) y
   lo sube en Punto. Punto lo lee renglón por renglón, **reconoce lo que ya tiene** (por
   ejemplo, una transferencia de un cliente que ya está cobrada en una venta) para no
   duplicarlo, **muestra lo nuevo para clasificar** ("EDENOR" → Luz) y **se acuerda** de cómo
   se clasificó para la próxima. Al final **compara el saldo** del extracto con el de Punto y
   muestra la diferencia.
4. **Gastos fijos del mes** (alquiler, sueldos, contador…): se cargan **una vez** con su monto
   y día de vencimiento, y **aparecen solos cada mes como "a pagar"**; al pagarlos se marcan
   como pagados diciendo de qué cuenta salió la plata.
5. **Cierre de caja diario:** al terminar el día el cajero **cuenta el efectivo** y lo
   escribe; Punto lo compara con lo que tendría que haber y anota la **diferencia** (falta o
   sobra) y **quién cerró**.
6. **Reportes de ventas** por período (hoy, semana, mes, entre fechas), con **"Lo que quedó"
   arriba de todo**.
7. **Buenos Aires son dos, separadas:** Conesa SRL y Sanitarios CNC tienen cada una **su caja
   de efectivo, sus cuentas y sus gastos**, aunque estén en el mismo lugar. "Lo que quedó",
   cierres y saldos van por razón social: SRL, CNC y Traslasierra.

## Llamadas mías (de Claude), para que Damián las revise

- **Cada sucursal carga sus cuentas** desde Gerencia (nombre, tipo, banco, caja de ahorro o
  cuenta corriente, **saldo con el que arranca** y desde qué fecha). Sin números de cuenta ni
  CBU: no hacen falta.
- **Qué forma de pago va a qué cuenta** se elige una vez por sucursal (las de Punto hoy:
  efectivo, transferencia, QR o billetera, débito, crédito 1/3/6 cuotas, cuenta corriente 30
  días). Las ventas cobradas entran solas a esa cuenta. La **cuenta corriente 30 días no entra
  a ninguna cuenta** al vender: es plata a cobrar (cobrarla queda fuera de este trabajo).
- **Pasar plata entre cuentas** (depositar el efectivo en el banco, retirar): un movimiento
  que sale de una y entra a la otra; el cierre de caja lo descuenta.
- **El cajero solo anota gastos del efectivo de su sucursal**; gerencia, de cualquier cuenta y
  sucursal. Un gasto mal anotado no se borra: se anula (queda a la vista, como los
  comprobantes eliminados).
- **Rubros de gasto** armados con lo común y editables: alquiler, luz, gas, agua, internet y
  teléfono, sueldos, cargas sociales, impuestos, gastos bancarios, honorarios del contador,
  publicidad, fletes, combustible, limpieza, librería, mantenimiento, varios.
- **"Lo que quedó" del mes** cuenta los gastos **de ese mes**, pagados o todavía a pagar (si
  no, un mes con el alquiler sin pagar se vería mejor de lo que fue). Se muestra **sin IVA**:
  el IVA no es de la empresa. Lo vendido sin IVA, menos el costo de la mercadería sin IVA
  (el costo de cada renglón guardado en la venta), menos los gastos sin IVA.
- **Un gasto es de la razón social que lo paga.** Si es compartido (por ejemplo, el alquiler
  de Buenos Aires), al anotarlo se puede **repartir por porcentaje** entre SRL y CNC (50 y 50
  de entrada). Un usuario sin sucursal fija elige de qué caja anota o cierra.
- **Otros movimientos de caja** además de ventas y gastos: **pago a proveedor** (no es gasto en
  "Lo que quedó": la mercadería ya está en el costo), **retiro del dueño** (no es gasto),
  **cobranza de cuenta corriente** y **seña** (entran a la cuenta pero no son una venta nueva),
  **fondo de cambio** (lo que queda en la caja pasa al día siguiente).
- **Tarjetas y QR:** lo cobrado va a una cuenta **"A acreditar"** de la sucursal hasta que el
  extracto muestra el depósito; la diferencia (comisiones, su IVA, retenciones) queda como
  gasto **"Comisiones de tarjeta y Mercado Pago"**. En "Lo que quedó" la venta cuenta por lo
  cobrado (con el recargo de cuotas) y las comisiones como gasto, así nada se descuenta dos
  veces. Hasta que se suban extractos, las comisiones no están, y la pantalla lo dice.
- **IVA:** se saca solo donde el comprobante lo lleva (facturas; las notas de crédito
  restan). Lo que sale sin comprobante o como pedido interno va entero. En los gastos, el
  cajero pone el total; gerencia puede poner el IVA si hay factura A; si no, el gasto va entero.
- **Cada forma de pago tiene una cuenta fija por sucursal.** Si una transferencia entró a otra
  cuenta, se corrige al conciliar el extracto; la venta y el cobro no se tocan.
- **La plata se cuenta por cobro, no por papel:** cuenta el comprobante con el que se cobró
  la venta; un remito que acompaña a una factura no suma otra vez.
- **Buenos Aires todavía vende en GBP:** todo anda para las tres, pero "Lo que quedó" y el
  cierre de Buenos Aires tienen ventas recién cuando vendan por Punto. Se arranca usando en
  Traslasierra.
- **Tienda web:** sus ventas van en los reportes como renglón aparte "Tienda web"; en el
  extracto de Mercado Pago se reconocen como cobros de la web.
- **Un cierre hecho no se reescribe:** guarda lo contado y lo esperado de ese momento; si
  después se edita un comprobante de ese día, el día muestra "cambió después del cierre".
- **Extractos (parte 5):** hace falta un archivo de ejemplo de cada banco y de Mercado Pago
  para armar la lectura.
- **Orden de trabajo** (cada parte se publica y se usa sola):
  1. Cuentas y gastos (anotar desde Caja y desde Gerencia; gastos del día y del mes por
     sucursal; pasar entre cuentas).
  2. "Lo que quedó" y reportes de ventas por período (con Excel y comparación con el mes
     anterior).
  3. Ventas que entran solas a las cuentas + cierre de caja diario + saldo de cada cuenta.
  4. Gastos fijos del mes "a pagar", con aviso de los que vencen.
  5. Subir extracto de banco y de Mercado Pago, con reglas que se acuerdan.

## Lo que no es

- **No toca la facturación ni ARCA:** nada de esto cambia cómo se emite un comprobante ni el
  CAE. Ninguna sucursal es agente de retención ni de percepción (confirmado 24/11/2026).
- **No se conecta al banco ni a Mercado Pago.** Solo lee el archivo que Damián baja. El token
  y la app de cobros de Mercado Pago **no se tocan**.
- No es contabilidad completa (asientos, balance): eso sigue siendo del contador. Sí puede
  bajarse en Excel para mandárselo.
- No cobra cuentas corrientes de clientes ni paga a proveedores (OC): queda para después.

## Lo que sería un fracaso aunque funcione

- Que un mismo peso aparezca dos veces (una venta por transferencia que entra por la venta y
  otra vez por el extracto; un gasto fijo pagado contado como pagado y como a pagar).
- Que el cajero tenga que cargar algo dos veces, o que el cierre de caja no dé por culpa del
  sistema y no de la plata.
- Que algo de esto frene o rompa la venta o la emisión de comprobantes.
- Que el mostrador vea gastos, saldos o ganancias (del otro lado hay un cliente mirando).

## Límites del lugar

- Repositorio **público**: nada de montos, cuentas ni datos reales en el código; todo va a la
  base.
- La página de Punto es un solo HTML generado (`src/app/sistema/punto.ts`); lo nuevo sigue su
  estilo (solapas, tarjetas, tablas, mismos colores). Rutas del servidor en
  `src/app/sistema/*`, con usuario y permisos de Punto (`src/lib/punto-permisos.ts`: ya
  existen las áreas `caja` y `gerencia`).
- Ventas: `PuntoDocumento` (lo emitido: tipo, sucursal, total, `datos` con renglones, costo y
  forma de pago; los eliminados tienen `eliminadoEn`) y `PuntoVenta` (el trámite: estados
  hasta `cobrada`). Los presupuestos no son plata; las notas de crédito restan.
- Base Postgres con Prisma; migraciones **solo agregando** (se publican con
  `prisma migrate deploy` en cada push a main).
- Plata en pesos con centavos.

## Lo que queda para quien lo construya

- Cómo guardar los movimientos (tablas nuevas de cuentas, movimientos, gastos fijos, cierres,
  reglas del extracto), siempre con **una sola fuente de verdad** por peso: si las ventas se
  leen de los documentos o se copian a movimientos, que no se cuenten dos veces.
- Cómo reconocer en el extracto lo que ya está (monto, fecha, una ventana de días) y cómo leer
  los formatos de cada banco (columnas que cambian de nombre; PDF con el lector que Punto ya
  usa para fotos y PDF).
- Los permisos nuevos que hagan falta (por ejemplo "anotar gastos", "cuentas y extractos").
- Pantallas: dónde va cada cosa dentro de Gerencia (solapas nuevas al lado de Resumen,
  Rentabilidad y Contable) y el botón "Anotar gasto" / "Cerrar caja" en Caja.
