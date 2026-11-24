// Version del panel admin. Formato: V.MAYOR.MINOR.PATCH
//
// CADA VERSION NUEVA VA COMO ENTRADA EN VERSION_HISTORY (abajo, la mas nueva
// primero), con su fecha y que cambio, y se sube APP_VERSION. La pantalla
// "Version del panel" (/admin/version) muestra esa lista. Damian,
// 18/11/2026: "porque no actualiza los cambios ahi": desde la V.0.61 los
// cambios se anotaban solo en comentarios aca arriba y la pantalla quedo en
// la V.0.60.0. Esos comentarios pasaron a la lista.

// Desde el 23/11/2026 (Damián): V.año.mes.número. El año arranca en 0
// (2026), el mes va con dos cifras y el número cuenta las versiones del mes
// (pasa de 100 si hace falta). Diciembre arranca en V.0.12.01; enero de 2027,
// V.1.01.01.
export const APP_VERSION = "V.0.11.246";

export type VersionEntry = {
  version: string;
  date: string; // ISO yyyy-mm-dd
  changes: string[];
};

// Historial de versiones visible en el panel. La mas nueva primero.
export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "V.0.11.246",
    date: "2026-11-24",
    changes: [
      "Punto → Usuarios: PERFILES (\"que los usuarios vean como ejemplo perfil vendedor, cajero, etc\"). Cada tarjeta tiene un selector Perfil: Vendedor (Venta, Comprobantes, Clientes; no cobra ni ve costos), Cajero (lo del vendedor más Caja, Cobrar y emitir y Ver Recibo X), Depósito (Comprobantes y Despachar), Encargado (lo anterior más Artículos, Proveedores, Listas, Simulador, Importar de GBP y Eliminar comprobantes) y Gerencia (todo). Elegir uno tilda sus permisos y se guarda con Guardar; si después se cambia un tilde, dice Personalizado. El perfil no se guarda aparte: se reconoce por lo tildado.",
      "Punto → Usuarios: las sucursales (\"por qué algunos usuarios me marca las sucursales que tiene acceso y otros no\"). El que puede usar todas ahora se ve con las tres tildadas y \"(todas)\"; antes se veía sin ninguna, que quería decir lo mismo. Destildar todas avisa que queda con las tres.",
    ],
  },
  {
    version: "V.0.11.245",
    date: "2026-11-24",
    changes: [
      "Punto, Revisar: \"Precio raro\" pasa de 15 a 30 veces lo común en su marca y rubro. Con 15 saltaban 153, casi todos repuestos chicos o equipos grandes que están bien; con 30 quedan 72 y sigue apareciendo el RAMAL DX 110 en dólares a $27 millones.",
    ],
  },
  {
    version: "V.0.11.244",
    date: "2026-11-24",
    changes: [
      "Punto, Artículos: cuadro REVISAR (\"un verificador de renta: si tengo algún artículo con algo mal que te llame la atención hacémelo saber\"). Arriba de la lista, cuántos hay de cada cosa: Pierde plata (la Lista 1 o el contado por debajo del costo), Margen bajo (menos del 10%), Listas al revés (la Lista 2 menor que la 1, o el por mayor más caro que la Lista 1), Le falta algo (sin costo o sin precio), Precio raro (15 veces arriba o abajo de lo común en su marca y rubro), No cierra con GBP, Combos (sin piezas o con una pieza que ya no está) y Stock negativo (vendido de más; la lista lo mostraba en 0). Tocando uno, la lista de abajo muestra solo esos, con el motivo en rojo, para corregirlos ahí; Excel y PDF exportan esos mismos.",
    ],
  },
  {
    version: "V.0.11.243",
    date: "2026-11-24",
    changes: [
      "Seguridad del ingreso (\"hay alguna forma de darle seguridad para que no sea vulnerada\"): el que prueba contraseñas se frena 15 minutos. 5 equivocadas con el mismo usuario desde la misma conexión, 20 desde la misma conexión a cualquier usuario, o 30 al mismo usuario desde cualquier lado. Queda anotado en Actividad con la conexión. Antes solo esperaba 0,4 segundos por intento.",
      "Punto → Usuarios: botón Liberar (\"agregame también liberar usuario\"). Al que quedó frenado por equivocarse la contraseña lo deja volver a probar en el momento; también destraba la conexión del local, para que los demás no queden afuera. En la tarjeta dice \"frenado por contraseñas equivocadas\".",
      "Buscadores (\"el sistema la url no tiene que estar taggeada en ningún buscador\"): /sistema y /admin ya no se nombran en robots.txt, que lo lee cualquiera; en su lugar el servidor manda \"noindex\" en todo lo de adentro. Además: siempre por https (HSTS), el ingreso no se puede meter adentro de otra página y los links de afuera no reciben la dirección de adentro.",
    ],
  },
  {
    version: "V.0.11.242",
    date: "2026-11-24",
    changes: [
      "Punto, Clientes: la lista ya no corta en la B (\"solo hay hasta la B\" / \"poné por páginas así no es interminable\"). Va por páginas de 100: « Primera · ‹ Anterior · Página 3 de 38 · Siguiente › · Última ». Buscar o filtrar vuelve a la primera; después de guardar una ficha queda en la misma página.",
      "Punto, ficha del cliente: \"Lo que compró\". Sus comprobantes (sin los eliminados), el más nuevo primero, con fecha, número, sucursal, total y el PDF de cada uno; arriba cuánto compró en total (facturas y Recibo X, menos las notas de crédito), cuántas compras, la última y cuántos presupuestos. Se buscan por el cliente guardado en cada comprobante y también por su CUIT o DNI. Los Recibo X los ve solo el que tiene \"Ver Recibo X\". Lo vendido antes de Punto sigue en GBP.",
    ],
  },
  {
    version: "V.0.11.241",
    date: "2026-11-24",
    changes: [
      "Punto, solapa CLIENTES (\"tendrías que hacerme una sección clientes donde están todos los datos de ellos\"), al lado de Proveedores: la lista de todos (nombre, CUIT o DNI, condición de IVA, domicilio, localidad, provincia, teléfono, mail, lista, límite de cuenta corriente e ID de GBP), buscador, filtros por condición de IVA y provincia, ver los dados de baja, Excel y PDF de lo filtrado. Tocando uno se abre su ficha: se cambia cualquier dato (se guarda solo lo que se tocó), Traer de ARCA con el CUIT o el DNI, y dar de baja (no se borra). El CUIT no se repite: si ya lo tiene otro, ofrece abrir ese. También Nuevo cliente. Área nueva en Usuarios: \"Clientes\" (el que tiene todo la ve sola; a los demás hay que tildársela).",
    ],
  },
  {
    version: "V.0.11.240",
    date: "2026-11-24",
    changes: [
      "Punto, clientes de GBP (\"ahí tenés la lista de clientes\"): el servidor recibe la lista de a tandas de 200 (permiso \"Importar de GBP\") y anota un solo renglón por tanda en Actividad, en vez de uno por cliente. Mismas reglas que el alta de a uno: el CUIT y el ID de GBP no se repiten, y el que ya estaba queda como está.",
    ],
  },
  {
    version: "V.0.11.239",
    date: "2026-11-24",
    changes: [
      "Punto, el remito como los de los proveedores (\"ahí tenés un ejemplo de remito como son\"): DESTINATARIO con su documento, condición de IVA y condición de venta, el domicilio de entrega (de la ficha del cliente; si no tiene, una línea para escribirlo) y una línea para el transporte; columnas CANT. · U.M. · CÓDIGO · DETALLE; abajo CANTIDAD DE UNIDADES e IMPORTE DECLARADO (sin impuestos), y Recibí conforme.",
    ],
  },
  {
    version: "V.0.11.238",
    date: "2026-11-24",
    changes: [
      "Punto, el remito: sigue sin precios por renglón, y abajo dice el \"Valor declarado (sin impuestos)\" (\"los remitos salen sin precio siempre, sí con total como valor declarado sin impuesto\"): en la factura con CAE, el neto que tiene ARCA; si no, el total sin el IVA de cada renglón.",
    ],
  },
  {
    version: "V.0.11.237",
    date: "2026-11-24",
    changes: [
      "Punto, Pedidos por cobrar: botón \"Eliminar\" también en el pedido que tenés tomado vos (\"que aparezca el botón de eliminar ahí\"); antes solo en el que esperaba en la caja. No se cobra y sale de la caja.",
    ],
  },
  {
    version: "V.0.11.236",
    date: "2026-11-24",
    changes: [
      "Punto, Usuarios: permiso \"Ver Recibo X\" para cada usuario (que los empleados no vean lo vendido con Recibo X). Lo tienen los que tienen todo; al resto no les aparecen los Recibo X en Comprobantes, Caja ni Gerencia, y el servidor no se los manda (tampoco el PDF). Siguen guardados y en los informes de gerencia: un solo libro. El que cobra igual puede emitirlos.",
    ],
  },
  {
    version: "V.0.11.235",
    date: "2026-11-24",
    changes: [
      "Punto, todo se actualiza solo para todos (\"cuando uno borra o anula, debería actualizar a todos los usuarios que están viendo\"; \"cada acción\"): cada 15 segundos, con la pestaña a la vista, y al volver a la pestaña, se vuelve a leer lo de hoy (Caja, Gerencia, Rentabilidad, Contable), la lista de Comprobantes, Presupuestos de hoy, Pedidos por cobrar y las cuentas. Lo que otro eliminó sale, lo que otro cambió se actualiza y lo nuevo aparece. No se repinta si no cambió nada ni con una ventanita abierta.",
    ],
  },
  {
    version: "V.0.11.234",
    date: "2026-11-24",
    changes: [
      "Punto, la Venta: botón \"Cerrar sin guardar\" (\"agregame un cerrar sin guardar los comprobantes de presupuesto\"), cuando hay algo cargado o se está cambiando un presupuesto: pregunta y deja la venta en blanco; el presupuesto original queda como estaba.",
    ],
  },
  {
    version: "V.0.11.233",
    date: "2026-11-24",
    changes: [
      "Punto, Usuarios: cada usuario puede tener varias sucursales (\"me tendría que dejar elegir sucursales, más de una\"): casillas CONESA SRL, SANITARIOS CNC y TRASLASIERRA al crearlo y en cada usuario; ninguna tildada = cualquiera. El que tiene varias elige entre las suyas en la venta (los desplegables muestran solo esas); el que tiene una sigue fijo en la suya. El servidor controla lo mismo al emitir, cobrar, ver la caja y mover plata.",
    ],
  },
  {
    version: "V.0.11.232",
    date: "2026-11-24",
    changes: [
      "Punto, WhatsApp: el texto dice siempre \"Te paso de Sanitarios Conesa el detalle…\", en todas las sucursales (\"el texto ese siempre tiene que decir te paso de Sanitarios Conesa\"); y el título del panel sin la letra repetida (\"Factura B B 0006-…\" pasa a \"Factura B 0006-…\").",
    ],
  },
  {
    version: "V.0.11.231",
    date: "2026-11-24",
    changes: [
      "Punto, centavos en todo el sistema (\"que los precios tengan centavos en los presupuestos y todo el sistema\"): toda la plata se ve con centavos ($5.454,32); el descuento de la venta y de los pedidos se calcula al centavo (antes se redondeaba a pesos, y de ahí salía el \"Redondeo $ 0,18\" del PDF), y el IVA contenido también; los precios que se arman desde un costo (simulador, aplicar costos nuevos) ya no se suben a los $100.",
    ],
  },
  {
    version: "V.0.11.230",
    date: "2026-11-24",
    changes: [
      "Punto, PDF con descuento: la columna del precio de lista dice \"P. LISTA UNIT.\" (\"P. LISTA UNIT. que diga el PDF\"); en la Factura A, \"LISTA UNIT. S/IVA\".",
    ],
  },
  {
    version: "V.0.11.229",
    date: "2026-11-24",
    changes: [
      "Punto, cobrar: sin el aviso de arriba (\"el cartel sacalo\"); \"Entregar sin comprobante\" pasa a ser \"Emitir Recibo X\" (\"tiene que ser un Recibo X\"): el PDF sale como RECIBO con la caja X no fiscal, y en las listas dice Recibo X.",
      "Punto, Comprobantes: botón Remito en cada venta (factura, recibo X, pedido interno; \"falta la posibilidad de hacer REMITO\"): imprime el remito de esa venta con los mismos artículos y cantidades, sin precios, el total de unidades y \"Recibí conforme\" (firma, aclaración, DNI, fecha). No es otro comprobante: no tiene número propio ni mueve stock.",
    ],
  },
  {
    version: "V.0.11.228",
    date: "2026-11-24",
    changes: [
      "Punto, un presupuesto ya emitido no se emite de nuevo (\"le di emitir presupuesto y me lo duplicó; no debería dejarme volver a emitirlo si ya lo hice, solo imprimirlo\"): si la venta viene de un presupuesto y no se cambió nada (artículos, cantidades, descuento, cliente), el botón dice \"Imprimir presupuesto · 0006-…\" e imprime ese mismo, sin otro número; si se cambió algo, pregunta antes de emitir uno nuevo.",
      "Punto, Presupuestos de hoy: botón Eliminar (\"que aparezca para eliminar los presupuestos ahí\"), el mismo de Comprobantes: va a Eliminados y se recupera; solo con el permiso de eliminar.",
    ],
  },
  {
    version: "V.0.11.227",
    date: "2026-11-24",
    changes: [
      "Punto, el presupuesto se imprime solo al emitirlo (\"lo que hice fue imprimirlo para dárselo al cliente\"), con el mismo PDF de Comprobantes → Imprimir; después el cursor queda en Cant.",
      "Punto, Presupuestos de hoy: Imprimir y WhatsApp al lado de Cobrar; y Cobrar lo cobra ahí mismo, con la Factura que le toca ya elegida (A si es responsable inscripto con CUIT, B si no) y a la vista Entregar sin comprobante y Cerrar como pedido interno (\"debería ya seleccionarse la Factura B en caso de DNI o Factura A en caso de CUIT; también que aparezca la parte de negro\"). \"No cobrar ahora\" lo deja en la venta.",
      "Punto, el PDF con descuento (factura A y B, presupuesto y sin comprobante; \"el descuento que lo haga por ítem\"): cada renglón con el precio de lista, el precio con el descuento y el importe ya descontado; abajo el total y cuánto se descontó. Los renglones suman exacto el total del comprobante (en la A, el neto que tiene ARCA); si el descuento redondeado a pesos deja centavos, van en un renglón Redondeo. Los importes que van a ARCA no cambian.",
    ],
  },
  {
    version: "V.0.11.226",
    date: "2026-11-24",
    changes: [
      "Punto, Gerencia → Cuentas y gastos (parte 1; Damián: \"en gerencia necesito que tenga un lugar donde sea los gastos diarios y los gastos mensuales de cada sucursal\"): cada razón social (SRL, CNC, Traslasierra) carga sus cuentas (efectivo, Mercado Pago, bancos con caja de ahorro o cuenta corriente) con el saldo con el que arrancan; se anotan gastos, pagos a proveedor, retiros, cobranzas, señas, pases entre cuentas y ajustes; un gasto compartido se reparte por %; nada se borra, se anula. Gerencia ve los gastos de hoy y del período por razón social, por día y por rubro, las cuentas con su saldo y los movimientos. En Caja, \"Anotar movimiento\": el cajero anota lo que sale o entra del efectivo de su sucursal (y deposita en el banco). Las ventas todavía no entran solas a las cuentas: es la parte 3.",
      "Punto, la Venta: después de sumar un artículo el cursor vuelve a Cant. (\"que vuelva el foco a cantidad siempre\"); CONFIRMAR PEDIDO en mayúsculas.",
    ],
  },
  {
    version: "V.0.11.225",
    date: "2026-11-24",
    changes: [
      "Punto, la Venta: \"Confirmar pedido\" va directo a la caja de la sucursal donde estás, sin preguntar (\"por default en la que estoy parado\"). Para otra, el botón nuevo \"Pasar a otra sucursal\", en la misma fila, que ofrece las otras cajas (se cobra con su CUIT) y tiene una cruz para cerrarlo (\"ponele un cerrar\"), que también se cierra con Esc.",
    ],
  },
  {
    version: "V.0.11.224",
    date: "2026-11-24",
    changes: [
      "Punto, la Venta: la Sucursal y el número de comprobante de arriba, redondeados como los demás campos (\"que sea redondeado como el resto\"), con el borde rojo al tocarlos.",
    ],
  },
  {
    version: "V.0.11.223",
    date: "2026-11-24",
    changes: [
      "Punto, la Venta: el nombre del artículo usa el lugar que sobra (\"podés usar menos líneas en la descripción\"): hasta 560 px en vez de 255, así un combo entra en dos renglones en vez de cuatro. El número del Total, en negro (\"el total ponelo en negro\"), con su recuadro. Y sin \"Otras opciones\" (\"mostrá todos\"): \"Mandárselo por WhatsApp\", que era lo único que tenía adentro, va en la fila con los otros botones.",
    ],
  },
  {
    version: "V.0.11.222",
    date: "2026-11-24",
    changes: [
      "Punto, la Venta más ordenada (\"los botones ponelos arriba de Artículos de la venta\"; \"los totales abajo a la derecha, destacados con algún color\"; \"la sucursal ponela al lado del número de comprobante y subí todo un poco\"): Emitir presupuesto, Confirmar pedido, Guardar como borrador y Otras opciones pasan arriba de los artículos (lo que se abre, se abre para abajo); la barra de abajo queda con los totales a la derecha y el Total en rojo; la Sucursal va al lado del número y el Cliente sube al lado del Vendedor: un renglón menos y más lugar para los artículos.",
    ],
  },
  {
    version: "V.0.11.221",
    date: "2026-11-23",
    changes: [
      "El IVA del combo, claro (\"¿le estás sumando el IVA de vuelta? ... poné el costo sin IVA, de la suma de los productos\"): no se sumaba dos veces, pero se leía como si sí. En un combo la casilla dice \"Suma de los productos, sin IVA\" (con la aclaración), el cálculo muestra la suma sin IVA y \"Más el IVA de los productos, una sola vez\" (sin la fila de descuentos, que ya están en cada producto), y el aviso de las piezas da el total sin IVA y con IVA.",
    ],
  },
  {
    version: "V.0.11.220",
    date: "2026-11-23",
    changes: [
      "Combos sin stock (\"para presupuestar, si no hay en stock debería dejarme igual cargar el precio; no me permite venderlo pero sí presupuestar\"): el combo sin stock para armarlo se puede sumar a la venta (avisa qué falta) y el presupuesto sale igual. Lo que no deja es venderlo: al emitir la factura, el remito, el pedido interno o la venta sin comprobante, y al confirmar el pedido para la caja, se controla que alcancen las piezas (y que no haya algo que se vende solo en combo cargado suelto).",
    ],
  },
  {
    version: "V.0.11.219",
    date: "2026-11-23",
    changes: [
      "Combos, el código de fabricante (\"debería sumarse los artículos que elijo y ponerse automáticamente como 3764+4387+5212\"): con cada pieza que se suma o se saca, el Código de fabricante del combo se arma solo con los de las piezas unidos con \"+\" (de cada pieza su código de fabricante; si no tiene, su código). Si se escribe otro a mano, ese queda.",
    ],
  },
  {
    version: "V.0.11.218",
    date: "2026-11-23",
    changes: [
      "Artículos, ORDENAR (\"ponerlo al lado de marca, rubro, que se pueda elegir por más viejos, últimos creados, mayor precio, menor precio\"): el botón Últimos creados pasa a ser una lista \"Ordenar\" al lado de Proveedor, Marca y Rubro: últimos creados, más viejos, mayor y menor precio (Lista 2), menor y mayor margen, más y menos stock, nombre y marca de la A a la Z. Tocar el título de una columna sigue ordenando por esa columna.",
    ],
  },
  {
    version: "V.0.11.217",
    date: "2026-11-23",
    changes: [
      "CÓMO SE VENDE (\"que el artículo se le pueda setear vender en combo o vender suelto; si pongo solo combo no me deja venderlo individual, y con los 2 de los 2 modos\"): en Crear uno, \"Se vende: Suelto / En combo\" (los dos tildados, como siempre; no deja destildar los dos). Solo en combo: la venta no lo deja sumar suelto y lo marca en la búsqueda. Sin \"En combo\": no se puede usar como pieza de un combo. En Artículos se marca \"solo en combo\" o \"solo suelto\". Se guarda en el servidor (dato de Punto: el import de GBP no lo toca).",
    ],
  },
  {
    version: "V.0.11.216",
    date: "2026-11-23",
    changes: [
      "Combos, sumar piezas (\"deberías dejar buscar por nombre, código del fabricante, código SKU, etc.\"): la casilla de la pieza busca mientras se escribe, por código, código de fabricante, nombre, marca, proveedor, rubro o subrubro, en cualquier orden, y muestra hasta 8 artículos con su stock y Lista 2. Se elige con el mouse o con las flechas y Enter, y se suma.",
    ],
  },
  {
    version: "V.0.11.215",
    date: "2026-11-23",
    changes: [
      "LA FORMA DE LA MARCA (\"que los artículos de una marca, por ejemplo PIAZZA, como cargué uno me guarde la forma ... así ya tengo\"): en Crear uno y en Adjuntar, al elegir la marca se copia la forma del último artículo de esa marca creado en Punto: proveedor, rubro, descuentos, pago contado y días, IVA, moneda, Lista 1, Lista 2 y por mayor. Solo se completa lo que todavía está como viene; se avisa qué se copió y \"No usarla\" lo deja como estaba.",
      "Rubro COMBO (\"en rubro se pondría combo para que se sepa que ya es un combo\"): al tildar \"Es un combo\" el rubro pasa a COMBO (y vuelve al de antes si se destilda); los combos armados en Punto y los 25 de GBP con COMBO en el nombre se ven con rubro COMBO. COMBO va al final de la lista de rubros.",
    ],
  },
  {
    version: "V.0.11.214",
    date: "2026-11-23",
    changes: [
      "Adjuntar, el código de fabricante (\"en el Excel no cargó el código de fabricante que yo lo había puesto\"): con una columna \"Código\" a secas y otra \"Código de fabricante\", el código salía de la primera y el de fabricante quedaba como marca o sin usar. Ahora la columna que dice código + fabricante es siempre el código; \"Artículo\", \"Item\" o \"Nro\" solo cuentan si ninguna dice código; la opción se llama \"Código de fabricante\"; y si ninguna columna quedó como código, se avisa.",
    ],
  },
  {
    version: "V.0.11.213",
    date: "2026-11-23",
    changes: [
      "Artículos, ÚLTIMOS CREADOS PRIMERO (\"cuando busco me tendría que aparecer últimos creados\"): el servidor anota cuándo se crea cada artículo nuevo; la lista arranca ordenada por eso (el más nuevo arriba), el botón \"Últimos creados\" vuelve a ese orden y los creados hace menos de 7 días llevan \"nuevo\".",
      "Adjuntar, varios de una vez (\"por default Lista 1 25 y Lista 2 25, y lo otro que me deje seleccionar como si estuviera creando uno\"; \"no me tomó el proveedor\"): Lista 1 y Lista 2 arrancan en 25%; Proveedor, Marca, Rubro y Subrubro se eligen de listas como en Crear uno (con \"+ nuevo\"), y el pago contado lleva sus días. Los artículos cargados así guardan el proveedor (antes no había dónde ponerlo), el subrubro y el pago contado.",
    ],
  },
  {
    version: "V.0.11.212",
    date: "2026-11-23",
    changes: [
      "Crear uno, el cálculo (\"Lista 1 mayorista y Lista 2 mayorista, y después Lista 1 y Lista 2 normal\"): con precio por mayor van primero la Lista 1 mayorista y la Lista 2 mayorista, y después la Lista 1 y la Lista 2.",
    ],
  },
  {
    version: "V.0.11.211",
    date: "2026-11-23",
    changes: [
      "Crear uno, el cálculo (\"cambiar el orden\"): la Lista 2 por mayor va antes que la Lista 2, que queda última. Orden: Lista mayorista, Lista 1, Lista 2 por mayor, Lista 2.",
    ],
  },
  {
    version: "V.0.11.210",
    date: "2026-11-23",
    changes: [
      "Crear uno, el cálculo (\"acá debería aparecer lista mayorista, lista 1 y lista 2\"): después de Te cuesta van Lista mayorista, Lista 1 y Lista 2, y abajo la Lista 2 por mayor.",
      "STOCK MÍNIMO POR SUCURSAL (\"necesito setearle el stock mínimo del artículo por sucursal\"): dos casillas debajo del stock de cada sucursal, guardadas en el servidor (dato de Punto: el import de GBP no lo toca). En la lista de Artículos, debajo del stock va \"mín N\", en rojo si está por debajo.",
    ],
  },
  {
    version: "V.0.11.209",
    date: "2026-11-23",
    changes: [
      "Pago contado (\"en qué cantidad de días es esa promoción, por default 60 días\"): al lado del % del descuento por pago contado va a cuántos días (60 por defecto).",
      "El descuento por pago contado ahora se guarda en el servidor con sus días (dato de Punto: el import de GBP no lo toca) y entra en el costo al recargar. Antes no se guardaba y, al recargar, el costo salía sin él.",
    ],
  },
  {
    version: "V.0.11.208",
    date: "2026-11-23",
    changes: [
      "Crear uno (\"cuando pongo un artículo nuevo y pongo guardar no me guardó\"; \"el código SKU que quede libre siempre\"): con el código vacío, Guardar frenaba sin ningún cartel. Ahora el código siempre queda libre: si se borra vuelve el que sigue, y al guardar, si está vacío o ya es de otro artículo, se pone uno libre solo, se avisa y se guarda.",
      "El aviso del artículo a medio cargar dice quién lo estaba cargando y, sin título, de qué proveedor y marca es.",
    ],
  },
  {
    version: "V.0.11.207",
    date: "2026-11-23",
    changes: [
      "SUBRUBRO (\"en subrubro debería aparecer, poneme para crear, son categorías lavatorio, ducha, bidet\"): en Crear uno, debajo de Rubro, una lista de subrubros (los de siempre y los que ya tienen los artículos) y \"+ Crear un subrubro nuevo\". Se guarda en el servidor como dato de Punto (el import de GBP no lo toca) y se puede buscar por él.",
    ],
  },
  {
    version: "V.0.11.206",
    date: "2026-11-23",
    changes: [
      "La barra de arriba dice \"Sucursal:\" en vez de \"Vendés como:\".",
      "Artículos (\"que me busque por proveedor también, no solo marca; primero siempre proveedor\"): los filtros van Proveedor, Marca, Rubro, y el buscador avisa que busca por proveedor y marca.",
    ],
  },
  {
    version: "V.0.11.205",
    date: "2026-11-23",
    changes: [
      "BORRADOR DEL ARTÍCULO (\"si estoy cargando un artículo, ¿hay forma de que me guarde el borrador? recargué y me borró todo ... que mantenga los datos el sistema\"): lo que se escribe en Crear uno se guarda solo en el servidor (uno por usuario, /sistema/borrador) y en la compu. Si se recarga o se cierra sin guardar, en Artículos aparece \"Tenés un artículo a medio cargar\" con Seguir cargándolo y Descartar. Se borra al guardar el artículo.",
      "Artículos: el buscador en rojo (\"ponelo en rojo para llamar la atención\") y sin las etiquetas de proveedores abajo (\"marea\"); queda la lista Proveedor.",
    ],
  },
  {
    version: "V.0.11.204",
    date: "2026-11-23",
    changes: [
      "Casillas de números (\"si escribís directo te pone 010 y no 10\"): con 0 se vacían al entrar (si se sale sin escribir, vuelve el 0); con otro número quedan marcadas para escribir encima.",
      "Crear uno: Lista 1 y Lista 2 arrancan en 25% (\"poneme Lista 1 y Lista 2 por default 25%\").",
    ],
  },
  {
    version: "V.0.11.203",
    date: "2026-11-23",
    changes: [
      "Crear uno: la lista de proveedores trae también los de la pantalla Proveedores (PRECONS entre ellos), aunque no se haya abierto esa pantalla; los inactivos no van.",
    ],
  },
  {
    version: "V.0.11.202",
    date: "2026-11-23",
    changes: [
      "Crear uno (\"haceme proveedor y después marca\"; \"en marca me debería dar a elegir las marcas que tengo, si no crear una nueva\"): primero el Proveedor (los de Proveedores y los que tienen los artículos, o uno nuevo) y después la Marca, de una lista con todas (las del proveedor elegido arriba) o \"+ Crear una marca nueva\". Si la nueva ya existe, se elige esa. El proveedor se guarda en el artículo y se toma su flete %.",
      "Crear uno (\"ahí escribe siempre en mayúscula\"): el título, la marca y el proveedor nuevos y el código del fabricante pasan a mayúscula mientras se escriben.",
      "Crear uno (\"ponele código de fabricante\"): el campo \"Código del proveedor\" pasa a \"Código de fabricante\" y se guarda en el servidor (el de un artículo cargado en Punto se perdía al recargar).",
    ],
  },
  {
    version: "V.0.11.201",
    date: "2026-11-23",
    changes: [
      "Artículos se adapta a la pantalla (\"no se ve todo; debería adaptarse y no generar scroll\"): la tabla pedía 1.650 px de ancho. Ahora la cadena de descuentos, el código del fabricante y los nombres largos se parten en renglones, las celdas van más juntas en pantallas medianas, debajo de 1440 px se va la columna Estado (el margen ya va en color) y debajo de 1180 px la Lista 1. Entra entera de 1024 a 1920 px.",
    ],
  },
  {
    version: "V.0.11.200",
    date: "2026-11-23",
    changes: [
      "La barra de arriba en un solo renglón en todas las pantallas (\"el menú de arriba lo pone en 2 renglones\"): según el ancho, la fecha pasa a \"Lun 23/11\", del dólar queda la venta, Asistente y Usuarios quedan como ícono y se van las palabras Usuario/Vendés como.",
      "Venta (\"el total se puede hacer abajo y distribuirlo, y que siempre esté visible\"): en la compu los artículos van a lo ancho y el Total es una barra pegada abajo, con los números y los botones en fila. Mientras hay resultados de búsqueda no va pegada, para no taparlos. Los borradores pasan arriba de los artículos.",
      "Venta (\"que te avise que tenés más artículos\"): si hay renglones que no se ven, aparece \"↓ N artículos más\" y lleva hasta el último.",
      "Artículos: el buscador destacado en amarillo; los botones de arriba son de proveedores y no de marcas; \"Cargar uno\" pasa a \"Crear uno\".",
    ],
  },
  {
    version: "V.0.11.199",
    date: "2026-11-23",
    changes: [
      "Rubros (\"los caños figuran como grifería, ¿qué es eso?\"): la palabra caño ya no manda a Grifería (agarraba unos 170 caños de agua y desagüe); las canillas con caño siguen en Grifería por su subrubro de GBP. Los bajo mesada pasan a Accesorios y lo de desagüe a Varios.",
      "Venta (\"redistribuí el total para que se vea mejor artículos de la venta\"): la columna del Total es más angosta y sus botones más apretados; ese lugar se lo lleva la grilla de los artículos.",
    ],
  },
  {
    version: "V.0.11.198",
    date: "2026-11-23",
    changes: [
      "PRESUPUESTOS PARA EL CAJERO (\"cuando se emiten los presupuestos deberían quedar en un lugar donde el cajero también lo puede ver\"): en Comprobantes, debajo de Pedidos por cobrar, \"Presupuestos de hoy\" de esa caja, los que todavía no se vendieron, con \"Cobrar\" (lo pasa a la venta). Se actualiza solo cada 20 segundos.",
      "Localidad (\"que me chequee las localidades para que sea más fácil completarse\"): en el cliente nuevo y en el proveedor, al escribir se despliegan las localidades conocidas (Traslasierra y alrededores, Buenos Aires y las que ya tienen clientes y proveedores). Al elegirla queda bien escrita y se pone la provincia sola.",
      "Venta (\"en vez de precio poné LISTA 2 y otra columna aplicándole el descuento que selecciona arriba\"): en los renglones, la columna Precio pasa a ser la Lista elegida y al lado va el precio con el descuento de arriba (y el recargo de la tarjeta, si hay); el subtotal sale de ese. El total se calcula igual.",
    ],
  },
  {
    version: "V.0.11.197",
    date: "2026-11-23",
    changes: [
      "Web (\"acá se tiene que ver el panel de la tienda\"): la solapa muestra adentro el panel de la tienda (/admin), con el mismo usuario, y un link para abrirlo en otra pestaña. Los pedidos de ejemplo que había quedan escondidos.",
      "El pie de Punto ya no dice que no toca la tienda ni el facturador (factura con ARCA y ahora muestra el panel).",
      "Venta (\"apenas entrás acá andá al foco de la cantidad para empezar a cargar\"): al entrar a Venta el cursor queda en Cant., con el número marcado para escribir encima. En el celular no, para que no salte el teclado solo.",
    ],
  },
  {
    version: "V.0.11.196",
    date: "2026-11-23",
    changes: [
      "Usuarios, ventana de la contraseña (\"ponele un cerrar que no me deja salir de ahí\"): una X arriba, tocar afuera la cierra y, ya guardada, el botón dice \"Cerrar\".",
      "Inicio: los íconos más grandes, y el desplegable de abajo (antes \"Todo lo de GlobalBluePoint, con el nombre que le dan ustedes\") se llama ÁRBOL DEL SISTEMA.",
    ],
  },
  {
    version: "V.0.11.195",
    date: "2026-11-23",
    changes: [
      "Usuarios, resetear contraseña (\"eso que no aparezca así porque no tengo forma de copiarlo, y que me deje elegir una contraseña\"): en vez del cartel del navegador, una ventana donde escribís la contraseña que quieras (o dejás la que propone), con botón Copiar. Tildado como antes: la persona elige la suya al entrar; destildado, le queda esa.",
    ],
  },
  {
    version: "V.0.11.194",
    date: "2026-11-23",
    changes: [
      "FLETE POR MONTO EN CADA ARTÍCULO (\"por monto, no por porcentaje\"; el caso de PRECONS): en Artículos hay una columna \"Flete $\" para escribirlo ahí mismo, en pesos por unidad con IVA. Se suma al costo, las listas suben en la misma proporción (el margen queda) y se guarda en el servidor. Vacío: va el flete % del proveedor, si tiene. La columna se puede ordenar para ver juntos los que tienen flete.",
    ],
  },
  {
    version: "V.0.11.193",
    date: "2026-11-23",
    changes: [
      "ÍCONOS EN TODO (\"en todo el sistema quiero que todo sea con íconos para acceder más rápido\"): Comprobantes tiene arriba los íconos de qué mostrar (facturas, sin comprobante, remitos, pedidos internos, presupuestos, notas, sin despachar, eliminados) y \"Nuevo comprobante\"; Proveedores, los de pedido a proveedor, sacar faltantes, nuevo proveedor e importar de GBP.",
      "Los botones de la venta, de cada renglón de Comprobantes, de los pedidos por cobrar, de las solapas de Gerencia y Proveedores y de Usuarios llevan su ícono adelante.",
    ],
  },
  {
    version: "V.0.11.192",
    date: "2026-11-23",
    changes: [
      "EDITAR LO YA EMITIDO (\"siempre todo eso debería poder editarse\"): en Comprobantes, el pedido interno, la venta sin comprobante, el remito y la factura interna (sin CAE) tienen \"Editar\" (para quien cobra). Se abre en la venta con los precios con que se vendió (lo que se agrega va a precio de hoy) y \"Guardar cambios\" lo guarda con el mismo número, con la versión anterior guardada. El stock se acomoda: vuelve lo de antes y sale lo de ahora.",
      "Lo que tiene CAE no se edita (ya está en ARCA): se corrige con nota de crédito. Una factura con notas tampoco se edita.",
    ],
  },
  {
    version: "V.0.11.191",
    date: "2026-11-23",
    changes: [
      "Venta: el número del comprobante va arriba, al lado de \"Comprobante\" (\"eso ponelo arriba\"), con su \"corregirlo\". Sale de la grilla de campos.",
    ],
  },
  {
    version: "V.0.11.190",
    date: "2026-11-23",
    changes: [
      "PRECIO DE LA VENTA COMO GBP (\"Sí, como GBP\"): cada renglón va a la Lista elegida tal cual (Lista 2 o Lista 1). Efectivo, transferencia, QR y cuenta corriente ya no bajan 12% solos: el descuento se elige en Descuento, como en GBP. Antes el contado bajaba 12% solo y, con el Descuento 12% encima, quedaba un descuento doble.",
      "Tarjeta, sobre la Lista: débito y crédito en 1 pago, la Lista; 3 cuotas +8%; 6 cuotas +20% (los mismos precios con tarjeta que antes).",
    ],
  },
  {
    version: "V.0.11.189",
    date: "2026-11-23",
    changes: [
      "INICIO CON ÍCONOS (\"los íconos deberían estar en la principal y que uno elija qué hacer\"): Punto abre en Inicio, \"¿Qué hacemos?\", con un ícono grande para Vender o presupuestar y uno por cada cosa: Comprobantes, Artículos, Proveedores, Caja, Web, Simulador, Gerencia, Usuarios y Asistente (solo lo que cada usuario puede usar). Lo de GBP con sus nombres quedó abajo, para desplegar.",
      "Artículos: arriba, cuatro íconos con su frase: Importar de GBP, Adjuntar, Cargar uno y Armar un combo. Al buscar, si lo escrito es un proveedor o una marca, se ofrece elegirlo y queda elegido como filtro.",
      "La versión pasa a numerarse V.año.mes.número: esta es la 189 de noviembre de 2026.",
    ],
  },
  {
    version: "V.0.100.1",
    date: "2026-11-23",
    changes: [
      "VENTA: \"Lista de precios\" arriba, como en GBP: Lista 2 (la de siempre) o Lista 1. Los renglones, la búsqueda, el total y el comprobante van con la lista elegida, y viaja con el pedido hasta la caja. El precio por mayor también respeta la lista elegida.",
      "\"Borrar datos\" borra todo (\"ahí debería borrar todo si pongo borrar datos\"): los datos del comprobante y también los artículos. Si había artículos, pregunta antes.",
      "Comprobantes: los presupuestos van en su propia lista, aparte de los comprobantes (\"separámelo de lo que es presupuestos y lo que es comprobantes\"). En Pedidos por cobrar, el que ya estás cobrando en esta pestaña tiene \"Ir a cobrarlo\", que lleva a la venta.",
    ],
  },
  {
    version: "V.0.100.0",
    date: "2026-11-23",
    changes: [
      "PRECIO POR MAYOR (\"del costo, la Lista 1 se reemplaza por la lista mayorista y la Lista 2 lo calcula de la lista mayorista\"): en la ficha, \"Se ofrece por mayor\" arma la lista mayorista (costo + el % mayorista, en lugar de la Lista 1) y la Lista 2 por mayor (la mayorista + el % de Lista 2 del artículo). En la venta, desde las unidades que se pongan, ese renglón va a la Lista 2 por mayor y lo dice. Antes solo se veía en la ficha: no se usaba ni se guardaba. Ahora queda en el servidor, para todas las compus.",
      "Arreglo: en los artículos de GBP sin el Excel de descuentos, el % de la Lista 2 sobre la Lista 1 quedaba en 25 fijo y, al guardar la ficha, la Lista 2 se rearmaba mal (por ejemplo, de $90.000 a $99.995). Ahora es siempre el de GBP.",
    ],
  },
  {
    version: "V.0.99.99",
    date: "2026-11-23",
    changes: [
      "PUNTO EN EL CELULAR (\"el sistema se va a poder utilizar desde el celular ... necesito que esté optimizado todo\"): ninguna pantalla se pasa del ancho del teléfono (antes la venta pedía 508 px y todo se veía achicado y cortado). Lo de dos columnas pasa a una, la barra de arriba queda en dos renglones y no se queda pegada, las solapas se corren con el dedo y los campos no hacen zoom al tocarlos.",
      "En el celular, la búsqueda de la venta, los renglones de la venta, los pedidos por cobrar y lo emitido se ven como tarjetas enteras: precio, cantidad, Sumar, Abrir y cobrar y los botones de cada comprobante a la vista, sin correr de costado. Los atajos de teclado no se muestran en el teléfono.",
      "Comprobantes: la factura con CAE dice CAE (la interna, sin CAE); una nota de crédito o de débito no ofrece Despachado; la nota al pie, al día. En la ficha del artículo, si la Lista 1 da por debajo del costo dice eso (decía \"Falta la Lista 1\"). Ya no se ve una cajita roja vacía arriba de los renglones de la venta.",
    ],
  },
  {
    version: "V.0.99.98",
    date: "2026-11-23",
    changes: [
      "FACTURA ELECTRÓNICA EN TRASLASIERRA (\"adaptar la que tenías seteada en la tienda de Traslasierra ... el punto 6, y optimizar la factura para usarla en el sistema\"): en Punto, la Factura A y B de Traslasierra salen por ARCA con el CUIT de Carlos Daniel Conesa y el punto de venta 6 (el de la tienda de Traslasierra, que ya no vende). El número es el que da ARCA y queda con su CAE. Si ARCA no la autoriza, no se guarda nada y la venta queda como estaba. Las notas de crédito y de débito de esas facturas también van por ARCA, con la factura asociada. Buenos Aires sigue con comprobantes internos.",
      "Va con la condición de IVA del cliente y el IVA separado por alícuota (21 % y 10,5 %). Si se corta la respuesta de ARCA, al volver a tocar el botón primero se fija en ARCA si ya salió, para no hacer dos facturas.",
      "El PDF de la factura con CAE: sin marca de agua, con el código del comprobante, los datos fiscales del emisor (razón social, CUIT, Ingresos Brutos, inicio de actividades), el documento y la condición de IVA del cliente, la Factura A con los precios sin IVA y el IVA discriminado, la B con el IVA contenido (Ley 27.743), y el CAE con su vencimiento y el QR de ARCA.",
      "Un comprobante con CAE no se puede eliminar: se anula con nota de crédito. En el PDF de la venta sin comprobante ya no queda una línea en blanco.",
    ],
  },
  {
    version: "V.0.99.97",
    date: "2026-11-23",
    changes: [
      "Arreglo: la primera nota de crédito B de una sucursal no se podía hacer (chocaba con la Factura B del mismo número). Ahora cada tipo de comprobante numera aparte, como en ARCA: Factura B, Nota de crédito B y Nota de débito B tienen cada una su serie.",
    ],
  },
  {
    version: "V.0.99.96",
    date: "2026-11-23",
    changes: [
      "NOTAS DE CRÉDITO Y DE DÉBITO A y B, atadas a la factura: en Comprobantes, cada factura A o B tiene \"Nota de crédito\" y \"Nota de débito\" (para quien puede cobrar). La de crédito: marcás cuántos de cada artículo devuelve y el motivo; el total es la parte de la factura, con su descuento o recargo, y lo devuelto vuelve al stock del depósito de la factura. No deja devolver más de lo que queda sin devolver. La de débito: un monto con IVA y el motivo. Cada una con su propia numeración por sucursal. Internas como las facturas de Punto: todavía sin CAE.",
      "La nota de crédito aparece en el Contable (Notas de crédito) y la de débito en el Libro IVA y la Caja. Eliminar una nota de crédito vuelve a sacar del stock lo devuelto; una factura con notas vigentes no se puede eliminar (primero la nota).",
      "Arreglo: al emitir, la compu que cobraba descontaba el stock dos veces en pantalla (el servidor estaba bien).",
    ],
  },
  {
    version: "V.0.99.95",
    date: "2026-11-23",
    changes: [
      "COMBOS (\"armar combos asignando los artículos y poniéndole aparte un porcentaje, como si fuera un artículo más ... y descuenta el stock de esos artículos\"): en la ficha de un artículo, \"Es un combo de artículos que ya están\": se suman las piezas por código y cantidad. El costo es la suma de los costos de las piezas, la Lista 1 es el % que le ponés encima y la Lista 2 sobre la 1. El stock es el que alcanza para armarlo en cada depósito, y al venderlo se descuenta cada pieza. Si cambia el costo de una pieza, el combo cambia solo.",
      "Un combo sin stock de alguna pieza no se puede sumar a la venta: avisa cuál falta.",
      "Artículos: \"Solo combos\" muestra los combos de GBP (los que dicen COMBO) y los armados en Punto. Un combo de GBP se puede abrir y armar con sus piezas: desde ahí descuenta las piezas.",
    ],
  },
  {
    version: "V.0.99.94",
    date: "2026-11-23",
    changes: [
      "STOCK EN EL SERVIDOR (\"tiene que descontar cuando vendés en negro o vendés en blanco\"; \"los presupuestos no descuentan\"): al cobrar, la factura, el sin comprobante y el pedido interno descuentan del depósito de donde sale la venta (Buenos Aires o Traslasierra). El presupuesto no toca el stock. Eliminar una venta devuelve lo vendido; recuperarla lo vuelve a descontar. Un combo descuenta cada pieza.",
      "Cargar lo que llegó de una orden de compra suma al stock de esa sucursal (solo la diferencia con lo ya cargado).",
      "El Excel de GBP sigue mandando: cada import pisa el stock. Guardar un artículo desde Punto ya no pisa el stock que bajó una venta en otra compu: solo lo manda si se lo cambió a mano.",
    ],
  },
  {
    version: "V.0.99.93",
    date: "2026-11-23",
    changes: [
      "LAS LISTAS SIGUEN AL DÓLAR (\"los que tienen precio en dólar, si varía el dólar, debería cambiar ... la Lista 1 y Lista 2\"): en los artículos con costo en dólares, la Lista 1 y la Lista 2 suben o bajan en la misma proporción que el dólar (del formador, o el propio del artículo) contra el dólar con que vinieron de GBP; el margen queda igual. Los importados el 23/11 vinieron a $1.600. Los artículos en pesos no cambian.",
    ],
  },
  {
    version: "V.0.99.92",
    date: "2026-11-23",
    changes: [
      "DÓLAR DEL FORMADOR: quedó cargado en $1.600 (BNA venta del 23/11), elegido por Damián. Con él, los 164 artículos de GBP con el costo en dólares tienen su costo en pesos.",
      "UN DÓLAR PROPIO POR ARTÍCULO (\"si llega a tener otro dólar que toma, que se pueda elegir\"): en la ficha de un artículo en dólares, tildando Solo para este artículo, ese artículo usa su dólar; sin tildar, el del formador (que cambia para todos). Se guarda en el servidor y el import de GBP no lo pisa.",
    ],
  },
  {
    version: "V.0.99.91",
    date: "2026-11-23",
    changes: [
      "TODO DESDE EL SERVIDOR (\"que todo sea desde el servidor\"): el dólar del formador sale solo del servidor (antes cada compu guardaba una copia) y la copia vieja se borra. En la compu queda solo el respaldo de la venta que se está cargando, por si se corta internet, y la marca que evita facturar dos veces si se corta justo al emitir: siempre manda lo del servidor.",
    ],
  },
  {
    version: "V.0.99.90",
    date: "2026-11-23",
    changes: [
      "EL CIRCUITO DE PEDIDOS (\"el vendedor no puede emitir factura, sino que confirma y pasa a comprobantes/pedidos, y ahí el cajero es el que cobra\"): en Venta ya no se factura. Se emite presupuesto o se toca Confirmar pedido (eligiendo la caja, también de otra sucursal).",
      "PEDIDOS POR COBRAR EN COMPROBANTES: arriba de Comprobantes, los pedidos confirmados que esperan, con un número en la solapa. El cajero toca Abrir y cobrar y elige: Emitir factura, Entregar sin comprobante o Cerrar como pedido interno. Si el cliente se fue, Anular.",
      "EN PREPARACIÓN (\"que pase al otro estado, que es de preparación\"): en Comprobantes, el filtro En preparación (sin despachar) muestra lo emitido que el depósito todavía no despachó; ahí se toca Despachado.",
      "BORRAR DATOS (\"un botón que borre todos los datos en comprobante por si quiero cambiarlo\"): en Venta, al lado de + Crear. El comprobante vuelve a consumidor final, sin descuento y el documento de siempre; los artículos quedan.",
    ],
  },
  {
    version: "V.0.99.89",
    date: "2026-11-23",
    changes: [
      "SE RECARGABA SOLA (\"se está refrescando sola la web\"): con la 88 el número de versión de la página quedó en 87 y la página creía que siempre había una nueva. Ahora el número lo pone el servidor al entregar la página, y la recarga automática se hace una sola vez por versión.",
      "BOTÓN GUARDAR ARRIBA EN LA FICHA (\"cuando editás un artículo tenga un botón guardar\").",
      "DESCUENTOS INDIVIDUALES (\"estás sumando los descuentos del artículo ... tenés que ponerlo individualmente\"): cada descuento de GBP va en su casillero, también en los que no cierran con la Lista 1 (quedan marcados \"no cierra\").",
    ],
  },
  {
    version: "V.0.99.88",
    date: "2026-11-23",
    changes: [
      "INGRESO PROPIO DEL SISTEMA (\"eso tiene que ser un login aparte, no es el login de la página, es del sistema\"): la pantalla de ingreso a Punto ya no muestra el encabezado, el pie ni los botones de la tienda, y lleva el ícono del sistema.",
    ],
  },
  {
    version: "V.0.99.87",
    date: "2026-11-23",
    changes: [
      "NADA LOCAL (\"acordate que no quiero nada local\"): lo que se carga o se edita de un artículo (Cargar uno, la ficha, el costo o el IVA en la tabla, el simulador, las listas por adjunto) se guarda en el servidor y lo ven todas las compus. Antes quedaba solo en esa compu. Lo viejo guardado en cada compu se sube una vez (los artículos cargados a mano) o se olvida (los cambios a artículos de GBP) y se borra.",
      "SIEMPRE LA ÚLTIMA VERSIÓN (\"forzá para que siempre traiga la última versión\"): si se sube una versión nueva y no estás en medio de nada (sin artículos en la venta, sin cambios sin guardar), la página se recarga sola. Si estás cargando algo, aparece la franja roja.",
      "SI ALGO FALLA, SE VE: si la página no puede arrancar o algo se rompe, aparece abajo un aviso rojo con el motivo y el botón Reparar esta compu (borra lo guardado en ese navegador y recarga; no se pierde nada, todo está en el servidor). Antes no se veía nada y quedaban cosas sin andar.",
      "ARTÍCULOS CON LISTA 1 Y LISTA 2 (\"vos tenés Lista 1, Lista 2, que debería aparecerte\"): la tabla muestra las dos.",
      "LISTAS ADENTRO DE PROVEEDORES (\"el Listas debería ir adentro de Proveedores\"): en Proveedores hay dos solapitas, Proveedores y Listas de precios.",
      "IMPORTAR MÁS SIMPLE (\"debería estar más visible\"): arriba una línea con lo que se va a cargar y el botón Guardar en el sistema grande; las notas, en Ver detalles.",
    ],
  },
  {
    version: "V.0.99.86",
    date: "2026-11-23",
    changes: [
      "LISTA 2 COMO PRECIO (\"tenés que mostrar LISTA 2 SIEMPRE EL PRECIO, NO DE CONTADO NI DE 1 PAGO\"): el buscador de la venta y la tabla de Artículos muestran una sola columna, Lista 2, con los centavos, como viene del Excel de GBP.",
      "LOS ARTÍCULOS DE GBP NO SE PIERDEN EN SILENCIO (\"los artículos no se ven\"): si al abrir Punto no llegan (el servidor se estaba reiniciando, se cortó internet), prueba de nuevo hasta 3 veces y, si sigue sin poder, avisa arriba con el motivo.",
    ],
  },
  {
    version: "V.0.99.85",
    date: "2026-11-23",
    changes: [
      "TODOS LOS ARTÍCULOS DE GBP (\"tenés los artículos para crearlos ... tomar la lista de costos, Lista 1 y Lista 2\"): Importar, en Artículos, lee los tres Excel que exporta GBP, juntos o de a uno: el de listas (crea y actualiza los artículos con su costo, Lista 1, Lista 2 y stock), el de descuentos y el de artículos (código del fabricante, mínimo y óptimo). Se guardan de a tandas. Un artículo sin Lista 2 no se crea. Solo va a Punto: la tienda no se toca.",
      "LOS DESCUENTOS DE CADA ARTÍCULO (\"entrando en cada artículo debería ver los descuentos que tiene el costo, Lista 1, Lista 2\"): el costo sale como lo arma GBP: la lista del proveedor, cada descuento uno sobre otro, los recargos y el IVA. La ficha del artículo lo muestra paso a paso hasta la Lista 1 y la Lista 2, y al lado lo que dice GBP. En la tabla, la cadena de descuentos va debajo del costo. Antes el costo se sacaba de la Lista 1 ÷ 1,25, que daba bien en Piazza pero no en las marcas con otro margen: ahora el margen que se ve es el de verdad.",
      "OCHO DESCUENTOS (\"lo que ves en negativo son descuentos también ... que se puedan poner 8\"): un artículo puede tener hasta 8 descuentos uno sobre otro (eran 6). Los recargos negativos de GBP entran como descuentos, después de los cuatro de GBP; los positivos quedan como recargo.",
      "ELIMINAR UN PEDIDO A PROVEEDOR (\"que se pueda eliminar si quiero hacer un pedido y me arrepiento\"): botón Eliminar el pedido. El que todavía no se guardó se descarta; el guardado queda anulado (no se borra) y deja de verse en la lista.",
      "LA TABLA DE ARTÍCULOS DE A 300: con 7.000 artículos se trababa al pintarlos todos. Se ven los primeros 300 y Mostrar más suma otros 300; para encontrar uno, Buscar.",
      "ÍCONO DEL SISTEMA (\"ponele un favicon pero que se diferencie de la tienda ... el mismo en otro color más claro\"): la pestaña de Punto lleva el ícono de la tienda en un rojo más claro, para no confundirlas.",
      "QUIÉN ESTÁ EN LÍNEA (\"avisame qué usuarios están online en usuarios\"): arriba de Usuarios, la franja En línea ahora con un punto verde por cada uno que tiene Punto o el panel abierto; en cada usuario, en línea o la última vez que anduvo (hace 2 horas, ayer a las 18:40). Se actualiza sola cada minuto. Cada pestaña abierta avisa que sigue ahí aunque no se toque nada.",
      "RESETEAR CONTRASEÑA EN TODOS (\"a todos los usuarios poneme resetear contraseña ... que pueda Carlos, Daniel y Damián hacerlo, por las dudas\"): el botón está en cada usuario. Carlos, Daniel y Damián resetean la de cualquiera (menos la propia) y por eso entran a Usuarios; los demás que administran usuarios, solo la de los que son solo de Punto. En el tuyo, Cambiar mi contraseña.",
      "FILTROS DE ARTÍCULOS A LA VISTA (\"buscar por proveedor, por el nombre, el código, marca, que esté más destacado ... si quiero ver solamente los de Piazza\"): arriba de la tabla, un buscador grande (código, nombre o código del fabricante) y tres listas: Marca, Proveedor y Rubro, cada una con cuántos tiene. Las 30 marcas con más artículos están a un toque (Piazza, Pringles, FV, Dema...). Limpiar filtros vuelve a todo. Lo elegido ya no se pierde al importar. Los artículos sin marca en GBP toman el nombre del proveedor en vez de una palabra suelta.",
      "EXPORTAR A EXCEL Y PDF (\"que se puedan exportar los proveedores, todo que sea exportable en PDF y en Excel\"): en Proveedores y en Artículos, botones Excel y PDF que exportan lo que estás viendo (con los filtros puestos: por ejemplo, solo Piazza). El Excel es un .xlsx con los números como números, la primera fila fija y el filtro puesto; el PDF abre la hoja para imprimir o guardar como PDF.",
      "BOTÓN SUBIR (\"un botón subir abajo a la derecha ... que se habilite cuando se hace largo el scroll\"): aparece abajo a la derecha cuando bajaste más de una pantalla y media, y te lleva arriba de todo.",
      "LO QUE ENCONTRÓ LA REVISIÓN: los descuentos de GBP de más de 95% (unidades sacadas del precio de una caja, hasta 99,5%) ya no se recortan; el simulador de precios y el pedido a proveedor cuentan los recargos de GBP (el pedido los muestra); unos 260 artículos cuyos descuentos de GBP dan un costo más alto que su Lista 1 (DELTA, SALADILLO, DISEÑOS MODERNOS) sacan el costo de la Lista 1 ÷ 1,25 y quedan marcados \"no cierra\" para revisarlos en GBP; importar solo el Excel de descuentos o el de artículos ya no hace olvidar lo corregido a mano en cada compu; los artículos que cambiaron de código en GBP se encuentran por su ID; si al Excel de descuentos o de artículos le falta una columna, no se importa; si una tanda falla, la pantalla se pone al día con lo que sí se guardó; los descuentos se escriben con coma.",
      "MÁS RÁPIDO CON 7.000 ARTÍCULOS: el stock, los importes y la búsqueda por código se arman una sola vez. Cargar el catálogo pasó de varios segundos a menos de medio, y Rentabilidad y Gerencia no se traban.",
    ],
  },
  {
    version: "V.0.99.84",
    date: "2026-11-23",
    changes: [
      "CREAR ARRIBA (\"el botón ese de vaciar, poner crear arriba\"): en Venta, el botón Vaciar (que estaba abajo, en Otras opciones) pasa arriba, en Comprobante, como + Crear: empieza un comprobante nuevo en blanco (sin artículos, consumidor final). Si había artículos cargados, pregunta antes de sacarlos.",
    ],
  },
  {
    version: "V.0.99.83",
    date: "2026-11-23",
    changes: [
      "LA BARRA DE ARRIBA, MÁS CORTA (\"gerencia ahí dentro mete contable y rentabilidad así hacemos lugar\"): Rentabilidad y Contable ahora están adentro de Gerencia, con tres solapitas: Resumen, Rentabilidad y Contable. La fila de solapas entra entera, sin correrse para el costado.",
      "PEDIDOS SALE DE LA BARRA (\"pedido hay que sacarlo porque es redundante\"): los pedidos internos se hacen en Venta y se ven en Comprobantes. No se borró nada.",
      "ASISTENTE Y USUARIOS ARRIBA (\"asistente que vaya arriba al lado de la versión\", \"usuarios ponelo al lado del botón salir\"): Asistente está al lado de la versión y Usuarios al lado de Salir.",
      "PRODUCTOS PASA A LLAMARSE ARTÍCULOS (\"productos cambialo por artículos\"): la solapa, la pantalla y el tilde de Usuarios.",
      "GUARDAR EN USUARIOS (\"me falta como un guardar ahí para confirmar\"): los tildes, la sucursal y \"administra usuarios\" ya no se guardan solos. El usuario tocado se marca en rojo con \"Sin guardar\" y se confirma con Guardar (o se vuelve atrás con Deshacer). Si se cierra la página con algo sin guardar, el navegador pregunta.",
      "AVISO DE VERSIÓN NUEVA (\"avisame cuando hay una nueva versión en el sistema para recargar la página\"): cada 2 minutos Punto se fija si se subió una versión nueva. Si hay, aparece una franja roja arriba con el botón Recargar. No recarga sola, para no cortar una venta.",
    ],
  },
  {
    version: "V.0.99.82",
    date: "2026-11-22",
    changes: [
      "TODO EN EL SERVIDOR (\"Todo tiene que estar en el servidor, nada de en ninguna máquina local, porque se va a leer con varios usuarios en diferentes computadoras\"): la venta que se está armando se guarda sola en el servidor; los borradores, los pedidos tomados y los clientes nuevos también, y se ven desde cualquier compu con el mismo usuario. Lo que había quedado solo en una compu se sube solo la primera vez (migración 55).",
      "CAJA (\"los vendedores no puedan cobrar, sino que el cajero es el encargado de cobrar y emitir\"): permiso nuevo \"Cobrar y emitir\". El vendedor arma la venta y toca Mandar a caja; el cajero la ve en Caja → Por cobrar (se actualiza sola y avisa cuando llega una), la toma, elige con o sin comprobante y emite. Dos cajeros no pueden cobrar el mismo ticket. El que no tiene el permiso solo emite presupuestos. A los usuarios con permisos elegidos hay que tildarles Cobrar si cobran.",
      "PASAR A OTRA SUCURSAL (\"un botón para pasar pedidos o presupuesto de sucursales ... como los diferentes CUITs\"): Mandar a caja deja elegir la caja de cualquier sucursal; se cobra con el CUIT de esa.",
      "QUIÉN VENDIÓ, QUIÉN COBRÓ Y QUIÉN DESPACHÓ (\"que figure el nombre del primer vendedor ... quien le cobra en caja ... quien lo despacha\"): el comprobante sale a nombre del vendedor que armó la venta (la comisión es suya) y queda quién lo cobró. En Comprobantes, el botón Despachado anota quién entregó la mercadería del depósito y cuándo (permiso nuevo \"Despachar en el depósito\").",
      "PRECIOS DE HOY EN PRESUPUESTOS (\"levantar un presupuesto viejo y ... actualizarlo a valores actuales, pero también mantenerme el viejo\"): botón Precios de hoy en Comprobantes. Hace un presupuesto nuevo con los precios de ahora y el viejo queda igual; los dos dicen de cuál salen.",
      "FLETE Y OTRO COSTO (\"que el costo del envío se siga manteniendo\"): cada artículo puede tener un flete fijo por unidad y un \"otro costo\" con el nombre que quieras (embalaje, comisión...). Se suman al costo, la Lista 1 y la Lista 2 salen de ese costo, y no se pierden al volver a importar la lista de GBP. Cada proveedor puede tener un flete en % para los artículos que no tienen uno fijo.",
      "PROVEEDORES COMPLETOS (\"dar de alta un nuevo proveedor ... que yo ponga el CUIT y me levante todos los datos solo ... un contacto de vendedor y algún número de WhatsApp ... También mail\"): alta con el CUIT (trae los datos de ARCA), editar cualquier dato, eliminar (se puede recuperar), contacto del vendedor, WhatsApp y mail. Lo que se retoca a mano no lo pisa el Excel de GBP.",
      "PEDIDOS A PROVEEDORES (\"me lo pongas con los costos ... con los descuentos y cuánto es el valor de la mercadería que le estoy pidiendo\"): órdenes de compra OC-0001 por proveedor, con lista, descuentos, costo de cada artículo, neto, IVA y total. Se mandan por WhatsApp o mail y se imprimen. Los faltantes de un pedido de cliente se suman con un botón, y lo que quedó pendiente (sin stock de fábrica) aparece marcado como ya pedido la próxima vez.",
      "BULTO DE COMPRA (\"ese artículo se vende en combo de 6 unidades ... por más que yo necesite 2, van a pedir 6\"): cada artículo puede decir de a cuántos se compra; el pedido al proveedor redondea para arriba y deja anotado cuántos hacían falta.",
      "FACTURA A O B SEGÚN EL CLIENTE: a un consumidor final o exento solo se le ofrece Factura B; a un responsable inscripto, Factura A; a un monotributista, A (y B si se elige).",
      "PADRÓN: si se escribe un DNI, queda el DNI (antes se cambiaba por el CUIT); si se escribe un CUIT, queda el CUIT entero.",
      "DÓLAR DEL FORMADOR EN EL SERVIDOR: el valor que se usa para los precios en dólares es el mismo en todas las compus.",
      "NOMBRE ENTERO EN LA VENTA (\"los artículos no me deja leerlos\"): el nombre del artículo ya no se corta con puntos suspensivos; baja de renglón.",
      "UN PRESUPUESTO NO SE VENDE DOS VECES: si dos cajeros lo pasaban a venta a la vez, salían dos ventas del mismo presupuesto. Ahora el segundo recibe un aviso.",
    ],
  },
  {
    version: "V.0.99.81",
    date: "2026-11-22",
    changes: [
      "PUNTO, USUARIOS Y PERMISOS (\"me falta el panel de usuarios donde ahi yo seleccione que area puede ver cada usuario o a que tiene acceso\"): pestaña Usuarios para los que administran (damian y daniel). Por cada usuario se tilda qué ve (Venta, Comprobantes, Pedidos, Productos, Listas, Proveedores, Simulador, Caja, Rentabilidad, Contable, Gerencia...) y qué puede hacer (importar de GBP, eliminar comprobantes, corregir numeración), y su sucursal. Lo no tildado no aparece y el servidor tampoco lo deja hacer. Se crean usuarios con contraseña provisoria, se resetea y se desactiva. Daniel no puede tocar la contraseña de un usuario que entra al panel de la tienda (migración 54).",
      "ARTÍCULO A MANO (\"que en el comprobante se pueda hacer carga manual de artículos, por si no está ingresado en el sistema\"): botón al lado del buscador; descripción, cantidad, precio e IVA. Sale en el comprobante y en el PDF, no mueve stock y no entra al catálogo.",
      "PADRÓN DE ARCA (\"si yo pongo un DNI o un cuit, ¿podés traer todos los datos reales?\"): en Cliente nuevo, Traer los datos consulta ARCA con el certificado de la tienda (solo consulta, no emite nada). Con DNI prueba los CUIT posibles. Si ARCA no tiene habilitado el servicio para el certificado, lo avisa.",
      "DEPÓSITO CÓRDOBA: el depósito de Traslasierra se llama como en GBP.",
    ],
  },
  {
    version: "V.0.99.80",
    date: "2026-11-22",
    changes: [
      "PUNTO PASA A SER EL SISTEMA (\"la palabra demo ya no la quiero, la quiero ya como sistema\"): vive en conesa.com.ar/sistema. La dirección vieja (/sistema/demo) lleva sola a la nueva, también desde una pestaña que quedó abierta.",
      "SIN DATOS INVENTADOS: afuera el catálogo de muestra, las 46 ventas de ejemplo de la Caja, las notas de crédito, los clientes, el padrón, los pedidos y las listas de ejemplo, y las cadenas de descuento inventadas. Los artículos salen solo del servidor. Se sacó también un costo real (el del 5135) que había quedado escrito en el código, que es público.",
      "NUMERACIÓN DESDE 0001 (\"el presupuesto ya necesito que sea 0001, que arranque de principio\"): se borraron los comprobantes de prueba (autorizado ese día) y cada serie arranca en 1. Una pestaña con la página vieja no puede emitir: pide recargar, para que no arranque la serie con los números inventados de antes (migración 53).",
      "TRASLASIERRA PRIMERO: Punto arranca en Traslasierra (Buenos Aires queda en pausa) y su punto de venta pasa a ser el 0006, el mismo con el que se va a facturar en ARCA.",
      "PROVEEDORES (\"este es el listado de proveedores del sistema tanto de buenos aires como de traslasierra\"): pestaña nueva con los proveedores de GBP guardados en el servidor (razón social, CUIT, condición de IVA, domicilio, teléfono, condición de compra, moneda). Se importan con el Excel de GBP; el mismo proveedor se actualiza por su ID (migración 52).",
      "EXCEL DE GBP: las celdas vacías se leían como \"Column1\" (el primer texto de la planilla). Ahora quedan vacías; también corrige la importación de artículos.",
      "WHATSAPP CON LINK QUE ANDA (\"eso no funciona\"): el link del mensaje apuntaba a una página que no existía. Ahora, desde Comprobantes, el botón WhatsApp manda el detalle con un link firmado que abre el PDF del comprobante (tienda.conesa.com.ar/comprobante/...), sin usuario y sin que se pueda adivinar el de otro. Desde una venta sin emitir se manda el detalle sin link.",
      "CANTIDAD ANTES DE BUSCAR (lo que planteó Daniel): un casillero Cant. al lado del buscador de la venta; también se puede escribir 3*inodoro o 3x inodoro. Después de sumar vuelve a 1.",
      "NUEVO COMPROBANTE (\"no tengo la opción\"): botón en Comprobantes que abre la venta en blanco; si había una empezada, ofrece guardarla como borrador.",
    ],
  },
  {
    version: "V.0.99.79",
    date: "2026-11-22",
    changes: [
      "PUNTO, COMPROBANTES CON PDF, IMPRIMIR, EDITAR Y ELIMINAR (\"esto si fue emitido tendria que bajar el pdf o dejarme editarlo\", \"ahi tambien debes dar la posiblidad de imprimir, eliminar\"): cada comprobante tiene su PDF (con el logo, la sucursal, el cliente, los artículos y el total; nunca el costo) para bajar o imprimir. Ninguno es fiscal: el presupuesto dice \"documento no válido como factura\" y la factura interna sale con la marca \"SIN CAE\".",
      "EDITAR PRESUPUESTOS: un presupuesto que todavía no se vendió vuelve a la venta (a precio de hoy) y al guardarlo queda con el MISMO número; lo de antes queda guardado. Si dos puestos lo cambian a la vez, el segundo recibe un aviso en vez de pisar al primero. Facturas, remitos y ventas no se editan.",
      "ELIMINAR: saca el comprobante de la lista, de los totales y de la Caja, pero no lo borra: queda en el filtro \"Eliminados\" con quién y cuándo, y de ahí se recupera. El número no se vuelve a usar. Queda anotado en Actividad (migración 51).",
      "LOGIN EN PUNTO (\"podes ponerle login al sistema punto\"): el botón Salir ahora cierra la sesión y vuelve a la pantalla de ingreso (antes no hacía nada, y por eso nunca volvía a pedir usuario). El que entra vende a su nombre: el usuario de arriba es el de la sesión y para cambiarlo se sale y se entra con otro.",
      "SIMULADOR DE COSTO DENTRO DE PUNTO (\"agregalo al punto como uno mas para entrar\"): pestaña nueva Simulador, el mismo de la página del jefe. Se sacó La Red (\"borra el de la red que nose que es\"): era una idea con números inventados.",
      "SIN \"MOSTRADOR\" (\"los usuarios y mostrador no es algo redundante? ... lo importante es saber quien vende\"): el puesto salía del usuario y mostraba lo mismo dos veces. Se sacó de la barra, del ticket, de Comprobantes, de la Caja y del CSV del Contable; la Caja, la Gerencia y el Asistente ahora muestran por vendedor. Se sumó Mariano a los vendedores.",
    ],
  },
  {
    version: "V.0.99.78",
    date: "2026-11-21",
    changes: [
      "PUNTO, LO EMITIDO QUEDA GUARDADO (\"el presupuesto que emití, ¿dónde queda? deberían mostrarse todos los presupuestos y ver lo que estuve presupuestando o facturando\"): cada presupuesto, factura, remito y venta sin comprobante se guarda en el servidor antes de limpiar la venta, con el precio, el costo, el cliente, el descuento y la forma de pago de ese momento. El número lo da el servidor: dos puestos o una pestaña recargada nunca sacan el mismo, y la numeración no se puede bajar. Si se corta la conexión, Punto pregunta si quedó guardado antes de decir nada: no se duplica. Las facturas de Punto quedan marcadas \"sin CAE\": todavía no van a ARCA (el aviso \"CAE pedido a ARCA\" era falso y se sacó).",
      "PUNTO, PANTALLA COMPROBANTES: todo lo emitido, de todos los puestos, con filtros (tipo, sucursal, período), buscador, totales presupuestado / facturado y el detalle de cada uno. Desde un presupuesto se toca \"Pasar a venta\" y, al emitirla, el presupuesto queda \"vendido\" con el número de la venta.",
      "PUNTO, AL RECARGAR NO SE BORRA NADA (\"cuando refrescás no debería borrarse nada de lo que cargué\"): la venta empezada, los borradores, el pedido que se está tomando (cliente, entrega, fecha, dirección, notas), los clientes y pedidos nuevos, quién vende y en qué sucursal quedan en la compu y vuelven al recargar. Cada pestaña tiene lo suyo; lo de una pestaña cerrada lo levanta la próxima. Lo emitido hoy vuelve a la Caja y al Contable. Si los artículos de GBP no cargan, lo guardado espera y vuelve cuando carguen.",
      "PUNTO, ARREGLOS: un remito o un pedido interno ya no entran al Libro IVA como factura; el Contable muestra el cliente de una factura aunque se haya cargado en otra compu; el recargo de tarjeta y el margen salen con el descuento restado; en Pedidos el buscador devuelve el cursor al sumar.",
    ],
  },
  {
    version: "V.0.99.77",
    date: "2026-11-21",
    changes: [
      "PUNTO, EL BUSCADOR SE LIMPIA AL SUMAR (\"cuando agregás un artículo debería borrarse del buscador para volver a buscar otro y seguir agregando\"): en la venta, al tocar Sumar (o Enter) el artículo entra, el buscador queda vacío y con el cursor adentro para buscar el siguiente. Igual que en Pedidos.",
    ],
  },
  {
    version: "V.0.99.76",
    date: "2026-11-21",
    changes: [
      "PUNTO, RUBROS Y MARCA AL IMPORTAR DE GBP (con el Excel de Pringles): los asientos de inodoro quedaban en \"VARIOS\" y un mueble sin marca en GBP quedaba con marca \"20.ZISCONTINUADOS\" (el nombre del rubro de GBP). Ahora asientos y artefactos (mamparas, receptáculos) van a Sanitarios, el amoblamiento a Accesorios, herrajes y kits a Repuestos, y un artículo sin marca toma la del nombre o la del proveedor; si no hay, queda VARIOS.",
    ],
  },
  {
    version: "V.0.99.75",
    date: "2026-11-21",
    changes: [
      "PUNTO, ARTÍCULOS DESDE GBP (\"en el sistema que estamos armando me podés agregar todos los productos de PIAZZA, te mando el Excel de GBP\"): en Productos hay una tarjeta nueva, \"Desde GBP\": se suelta el Excel que exporta GlobalBluePoint, muestra lo que encontró (por marca, con lista del proveedor, costo, Lista 1, Lista 2 y stock) y con un botón se guarda. Se guarda en el servidor y no en el código, que es público: así los costos no quedan a la vista y los ven todos los puestos que entran con usuario. El mismo código se actualiza; lo demás queda como estaba. El costo con IVA sale de la Lista 1 (Lista 1 ÷ 1,25, la regla de la casa), porque la columna \"Costo\" de GBP es en realidad la lista del proveedor. Los combos cuyas piezas vienen todas de GBP pasan a valer la suma de sus piezas. Queda anotado en el Registro.",
      "PUNTO, LEE LOS EXCEL DE GBP: el lector de Excel de Punto no encontraba la hoja (GBP la llama \"sheet.xml\", sin número) ni los renglones (GBP escribe las etiquetas con prefijo, <x:row>). Ahora los lee, también en \"Por adjunto\".",
    ],
  },
  {
    version: "V.0.99.74",
    date: "2026-11-21",
    changes: [
      "SIMULADOR DE COSTO, EL MOTIVO CUANDO LA IA NO PUEDE LEER: si la lectura de un PDF o una foto fallaba, Cloudflare tapaba la respuesta con su propio \"error code: 502\" y la página no podía decir qué pasó. Ahora llega el motivo (Google saturado, tardó demasiado, sin cupo...). Y la espera queda debajo de los 100 segundos que aguanta Cloudflare.",
    ],
  },
  {
    version: "V.0.99.73",
    date: "2026-11-21",
    changes: [
      "SIMULADOR DE COSTO, LEE PDF Y FOTOS (\"podes hacer que lea excel, pdf o imagenes y me haga el calculo y me muestre?\"): la lista del proveedor puede ser un Excel, un CSV, un PDF o una foto (como la lista Piazza/Hydros). El PDF y la foto los lee la IA, que devuelve la tabla con sus mismos títulos (Precio de lista, Costo unitario sin IVA...), y sigue igual que el Excel: se elige de qué columna sale el precio, se ven los precios calculados y se baja el Excel. Avisa que lo leído por IA hay que mirarlo contra el papel. Como la página va sin usuario, la lectura con IA tiene topes (8 cada 10 minutos y 40 por día por persona, 150 por día entre todos) para no gastar el cupo de Google que usa Punto.",
      "SIMULADOR DE COSTO, RECUADRO PARA ARRASTRAR (\"haceme el area para que yo adjunte o arrastre un archivo lo lea y me calcule todo\"): en vez del botón, un recuadro grande donde se arrastra el archivo o se toca para elegirlo. También se puede pegar una captura con Ctrl+V. Al leerlo, baja solo hasta los precios.",
    ],
  },
  {
    version: "V.0.99.72",
    date: "2026-11-21",
    changes: [
      "SIMULADOR DE COSTO, SUMA Y TOTAL DE LOS DESCUENTOS (\"que me diga cuanto es el total de todos los descuentos en porcentaje eso a modo informativo debajo de los descuentos\"): debajo de los 6 casilleros aparece la suma de los descuentos (35 + 10 + 5 = 50 %) y el total real, uno después del otro (44,42 %), que es el que se usa para el costo. En el combo, cada artículo con más de un descuento muestra también su total real.",
    ],
  },
  {
    version: "V.0.99.71",
    date: "2026-11-21",
    changes: [
      "COMPARADOR, UN JUEGO NO SE COMPARA CON UNA PIEZA SUELTA (\"aca me trajo una griferia pero eso es un combo\"): el juego Piazza Sensus de 4 piezas (bañera + bidet + lavatorio) salía comparado con la grifería de ducha sola, que se encontró por el código de esa pieza (10806GF). Ahora, si lo nuestro es un juego (dice combo, junta cosas con + o dice \"4 piezas\"), lo de afuera tiene que traer las mismas piezas; una pieza suelta u otro juego (lavatorio + bidet solo) no cuenta. Esto también limpia lo que ya estaba guardado, sin volver a buscar. Los precios agregados con un link quedan siempre.",
    ],
  },
  {
    version: "V.0.99.70",
    date: "2026-11-21",
    changes: [
      "SIMULADOR DE COSTO, ARMAR UN COMBO (\"dame la posibilidad de armar un combo que pongo 2 o mas articulos y me armes un precio\"): se cargan 2 o más artículos, cada uno con su cantidad, su precio de lista del proveedor y sus descuentos (ej. 35+10; vacío usa los de arriba). Cada uno muestra su costo y su Lista 2, y el combo tiene su tabla con costo, por mayor, Lista 1, Lista 2 y el descuento: la suma de las piezas. Se pueden agregar y quitar artículos.",
      "SIMULADOR DE COSTO, QUEDA GUARDADO LO ÚLTIMO (\"hace que quede guardado el ultimo que cargue y cotice\"): el precio, los descuentos, los porcentajes, el combo y el último Excel (con la hoja y las columnas elegidas) quedan guardados en el navegador. Al volver a abrir la página está todo como se dejó. Cada compu o celular guarda lo suyo. \"Empezar de nuevo\" lo borra.",
    ],
  },
  {
    version: "V.0.99.69",
    date: "2026-11-21",
    changes: [
      "SIMULADOR DE COSTO, 6 DESCUENTOS DEL PROVEEDOR (\"poneme 6 descuentos\"): ahora se pone el precio de lista del proveedor y hasta 6 descuentos, uno después del otro (ej. 35 + 10 + 5). Da el costo sin IVA y el descuento total, y de ahí sale todo lo demás como antes. Vacíos, el costo es la lista, como en el Excel.",
      "SIMULADOR DE COSTO, MUCHOS ARTÍCULOS CON UN EXCEL (\"subir un excel y que me hagas un calculo gral de precios\"): se sube el Excel del proveedor (.xlsx, .xls o .csv), se elige la columna del precio (la adivina sola, igual que la fila de los títulos y la del artículo) y se baja el mismo Excel con 9 columnas nuevas a la derecha: costo, por mayor, Lista 1 y Lista 2 sin y con IVA, y la Lista 2 con el descuento. Trae una segunda hoja con los descuentos y porcentajes que se usaron. El archivo se lee en la compu de quien lo sube: no viaja al servidor.",
      "SIMULADOR DE COSTO, LETRA DE CONESA (\"poneme la tipografia de conesa tambien y los numeros igual\"): Montserrat en los títulos y los números, como los precios de la tienda, e Inter en el texto.",
    ],
  },
  {
    version: "V.0.99.68",
    date: "2026-11-21",
    changes: [
      "SIMULADOR DE COSTO SUELTO, SIN USUARIO: el Excel \"SIMULADOR DE COSTO\" pasado a una página aparte, para mandar por link (tienda.conesa.com.ar/simulador-de-costo). Se pone el costo sin IVA y calcula solo, igual que el Excel: costo con IVA (21 %), venta por mayor (+12 %), Lista 1 (+25 %), Lista 2 (+25 % sobre la Lista 1) y la Lista 2 con el 12 % de descuento. Los porcentajes se pueden cambiar ahí mismo y al recargar vuelven a los del Excel. No pide usuario, no guarda nada y no aparece en Google.",
    ],
  },
  {
    version: "V.0.99.67",
    date: "2026-11-21",
    changes: [
      "PORTADA, CANTIDAD DE MARCAS REAL (\"Sí, cambialo\"): en los números de arriba decía \"20+ Marcas\" y son 13. Ahora muestra cuántas marcas hay en \"Trabajamos con las mejores\" (las que tienen logo y algo a la venta) y se actualiza sola cuando se suma una.",
    ],
  },
  {
    version: "V.0.99.66",
    date: "2026-11-21",
    changes: [
      "COMPARADOR, LOS COMBOS SUMANDO SUS PIEZAS (\"Sí, hacelo\"): los combos (Piazza Amalfi, Pringles Jade, Onix...) salían \"No hay datos\" porque las otras tiendas casi nunca venden el combo armado. Ahora, al buscar un combo, se busca también cada pieza (por su código del combo) y se suma lo que cobra cada tienda que vende TODAS las piezas: aparece como \"suma de piezas\", con el detalle de cada pieza y su link. Si ninguna tienda tiene todas, se suma lo más barato de cada pieza en distintas tiendas, como referencia. Si una pieza no está cargada o nadie la vende, no se suma (daría un total más barato que el real). Al abrir el combo se ve en cuántas tiendas está cada pieza.",
      "COMPARADOR, MÁS EXACTO CON LOS COMBOS Y LAS PIEZAS: cada pieza tiene que ser de la misma línea que el combo (el inodoro Amalfi no es pieza del combo Padova) y traer lo mismo (el \"inodoro con asiento\" no es el \"inodoro con depósito y asiento\"; la tapa cuenta como asiento). Un combo de otra tienda tiene que traer las mismas piezas (\"inodoro + bidet\" no es \"inodoro + depósito\"). Y en todo el comparador: largo y corto son modelos distintos, y un combo de afuera no se compara con un producto suelto nuestro.",
    ],
  },
  {
    version: "V.0.99.65",
    date: "2026-11-21",
    changes: [
      "COMPARADOR, AGREGAR EL PRECIO DE OTRA TIENDA CON UN LINK (\"todos estos que no encuentra no hay forma de buscar nuevamente, mismo que haga un search en google que aparecen\"): al abrir un producto (la flechita, o \"Otras palabras o un link\" al lado de \"No hay datos\") hay un cuadro \"¿Lo viste en otra tienda? Pegá el link\". Se pega el link de la página del producto en esa tienda (por ejemplo, lo que encontraste en Google) y se lee el precio de ahí. Queda como el mismo modelo, marcado \"tu link\", y en cada búsqueda se actualiza el precio. Se puede sacar con la ✕. Si el precio leído es muy distinto del tuyo, avisa en vez de guardarlo. El programa no le pregunta a Google: el link lo elegís vos.",
      "COMPARADOR, LOS DOS PRECIOS NUESTROS JUNTOS Y DESTACADOS (\"pone los 2 precios nuestros un poco más junto y destacame los precios nuestros\"): Lista 2 y Transferencia van pegados, en un recuadro amarillo.",
      "LEER PÁGINAS DE TIENDAS NUBE Y SODIMAC: la ficha del producto de las tiendas Tiendanube (Casa Andy, Sanige y muchas más) venía adentro de la ficha de la página y no se leía (se tomaba la de un producto relacionado o ninguna); Sodimac la escribe en minúscula. Ahora se leen bien, también en \"Traer desde un link\".",
      "BOTÓN SUBIR A LA DERECHA (\"el subir ponemelo a la derecha por favor\"): ahora está abajo a la derecha. Cuando sale el aviso de ventas nuevas, el aviso queda por encima.",
    ],
  },
  {
    version: "V.0.99.64",
    date: "2026-11-21",
    changes: [
      "COMPARADOR, ALTA RECUPERACIÓN ES OTRO MODELO (\"no es el de alta recuperación que es más caro, lo está comparando con el común\", con el termotanque Heineken 120 L): si uno dice \"alta recuperación\" (o \"doble servicio\") y el otro no, ya no se toman como el mismo modelo, para los dos lados. Y se busca con esas palabras enteras (antes buscaba \"termotanque eléctrico alta\" y las tiendas traían el común). Lo que había traído una búsqueda anterior también se revisa con esta regla. \"Solar\" tampoco se mezcla con eléctrico o gas.",
      "COMPARADOR, BUSCAR DE NUEVO CON OTRAS PALABRAS (\"poneme ahí para hacer una rebúsqueda\"): al abrir un producto (la flechita) hay un cuadro con las palabras con que se buscó, para cambiarlas y tocar \"Buscar de nuevo\". Las palabras quedan para las próximas búsquedas de ese producto; \"Volver a buscar con el título\" las saca. Igual solo aparece el mismo modelo (mismo tipo, medidas y rasgos). Si se escribe el código del modelo, se busca ese.",
      "COMPARADOR, LISTA 2 Y TRANSFERENCIA (\"cuando decís nuestro precio ponele lista 2 arriba y al lado también poné el precio de transferencia\"): la columna \"Nuestro precio\" ahora se llama \"Lista 2\" y al lado está \"Transferencia\". Las dos se pueden ordenar. Los porcentajes siguen contra Lista 2.",
    ],
  },
  {
    version: "V.0.99.63",
    date: "2026-11-21",
    changes: [
      "TRAER DESDE UN LINK, SI EL SERVIDOR NO PUEDE LA BAJA TU COMPU (\"me sigue sin cargar\", con la foto de Sika en sika.scene7.com): hay webs de fotos que no le contestan al servidor de la tienda (está en Google) pero sí a una compu. Ahora, si el servidor no pudo bajar la foto del link, la baja tu compu y se sube como cualquier foto (con \"Mejorar\" si está prendido). Anda con las webs que lo permiten, como Sika y MercadoLibre.",
      "TRAER DESDE UN LINK, EL MOTIVO EXACTO: si no se pudo, el mensaje dice qué contestó la web (por ejemplo \"la web de la foto contestó 403\" o \"no contestó a tiempo\") y queda anotado en Panel → Registro como \"Error en /admin/productos/…\", con el link.",
    ],
  },
  {
    version: "V.0.99.62",
    date: "2026-11-20",
    changes: [
      "TRAER DESDE UN LINK, FOTOS CON LINK RARO (\"porque aveces no sube las fotos que le pongo link?\", con una foto de Sika en sika.scene7.com): un link a una foto que no termina en .jpg ni .webp (como los de Sika, que terminan en \"?fmt=webp-alpha\") no se reconocía como foto y contestaba \"no encontré un producto\". Ahora se fija qué contesta la web: si es una foto, la agrega. También se aceptan las fotos de los servidores que usan las marcas (scene7, Cloudinary, Wix, Squarespace, Contentful).",
      "TRAER DESDE UN LINK, DICE POR QUÉ NO SUBIÓ: antes decía \"ninguna foto nueva\" o \"no se pudo bajar o ya estaba cargada\". Ahora dice cuál de todas: el producto ya tiene 10 fotos (el máximo), la foto ya estaba cargada, la página no tiene fotos del producto (y cómo copiar el link de la foto) o la página no dejó bajarla (y que se puede guardar en la compu y subir). Si no se agregó, el link queda en el cuadro para volver a probar.",
    ],
  },
  {
    version: "V.0.99.61",
    date: "2026-11-20",
    changes: [
      "MEJORAR LA FOTO, PRODUCTO CORTADO EN LA FOTO (\"porque se corta al final la foto?\", con un Sikadur-31): si en la foto de donde se saca el producto viene cortado en un borde (la lata se sale por abajo), al mejorarla se centraba con blanco alrededor y el corte quedaba en el aire. Ahora queda pegado a ese borde, como en la foto original. Si el producto está entero, se centra como siempre. Para la foto que ya quedó así: borrarla y volver a subirla.",
    ],
  },
  {
    version: "V.0.99.60",
    date: "2026-11-20",
    changes: [
      "TRAER DESDE UN LINK, LINK DIRECTO A UNA FOTO (\"esa es la imagen\", con una foto de MercadoLibre): si el link es directamente una foto (termina en .jpg, .png, .webp, o es una foto de MercadoLibre), se agrega esa foto, sin tocar el título ni la descripción. Antes contestaba \"no encontré un producto en esa página\". Anda en la ficha del producto y en el alta de artículos.",
    ],
  },
  {
    version: "V.0.99.59",
    date: "2026-11-20",
    changes: [
      "FOTOS DE LA FICHA, QUE NO SE CAIGA LA PANTALLA (\"no me deja subir fotos\", \"que es esto que tira?\"): si al subir una foto, traer de un link, traer de la web de la marca, borrar, ordenar o poner principal el servidor daba un error, se caía toda la pantalla (\"No se pudo mostrar esta pantalla\") y no se sabía por qué. Ahora el error aparece al lado de las fotos, la pantalla sigue andando y se puede volver a probar. Si es porque se publicó una versión nueva, se recarga sola.",
      "ERRORES ANOTADOS EN EL REGISTRO: cada error del servidor y cada vez que sale la pantalla de error queda en Panel → Registro como \"Error en …\", con la pantalla, qué falló, el código y quién estaba (buscá \"Error\"). La pantalla de error ahora muestra un código para identificarlo. Las contraseñas nunca se anotan.",
    ],
  },
  {
    version: "V.0.99.58",
    date: "2026-11-20",
    changes: [
      "TRAER DESDE UN LINK, FOTOS DE KLAUKOL / SIKA (\"ahi pegue esta url y no me trae los productos\"): la página de Klaukol no tiene foto para compartir ni ficha para Google; la foto es una imagen común con el nombre del producto, y además está en otro servidor de Sika (dynamicmedia.sika.com), que no se aceptaba. Ahora, si la página no trae fotos de otra forma, se toma la imagen que lleva el nombre del producto, en su tamaño original; y valen las fotos de otro servidor de la misma empresa. Sirve en la ficha del producto y en el alta de artículos (\"Pegar link de la página del producto\").",
    ],
  },
  {
    version: "V.0.99.57",
    date: "2026-11-20",
    changes: [
      "FICHA DEL PRODUCTO, PRECIOS ALINEADOS (\"alineame eso\"): Precio con transferencia, Lista 2 · 1 pago, Precio oferta y Stock quedaban a distintas alturas porque unos títulos ocupan dos renglones y otros uno. Ahora los títulos ocupan siempre el mismo alto y las cuatro cajas quedan en la misma línea.",
    ],
  },
  {
    version: "V.0.99.56",
    date: "2026-11-20",
    changes: [
      "ALTA DE ARTÍCULOS, MARCA PARA TODOS (\"agregame ahi para aplicar marca a todo si elijo una\"): el cuadro de marca solo aparecía mientras quedaban artículos sin marca, y la ponía solo a esos. Ahora está siempre, arriba de la lista: elegís una marca y \"Aplicar a los N\" se la pone a todos los tildados de la lista que estás viendo, aunque ya tengan otra. Si quedan algunos sin marca, también está \"Solo a los N sin marca\". Si el rubro no lo cambiaste a mano, se vuelve a calcular con la marca nueva.",
    ],
  },
  {
    version: "V.0.99.55",
    date: "2026-11-20",
    changes: [
      "COMPARADOR, QUE NO SE PISEN LAS BÚSQUEDAS (\"cuando hago una busqueda de compara precios eso puede quedar guardado para todos los usuarios\", \"sí, arreglalo\"): lo buscado ya quedaba guardado para todos los usuarios, pero todo junto en un solo lugar, y si dos personas buscaban a la vez se podía perder lo que había encontrado una. Ahora se guarda un renglón por producto y cada búsqueda escribe solo los suyos. Lo que ya estaba buscado pasa solo a la forma nueva la primera vez que se abre el Comparador.",
    ],
  },
  {
    version: "V.0.99.54",
    date: "2026-11-19",
    changes: [
      "COMPARADOR, MÁS TIENDAS POR MARCA (\"así hacé con todos\", \"los que no tienen precio\", \"sumala cuando termines\"): se suman 26 tiendas para las marcas que no traían precio. Dogo: la tienda oficial de Dogo, Centro de Materiales y Pinturerías MM. Fluvial: CER y Mukdise. Heineken: Rodo, Casa Andy, Val-Mar y Gastromak. TST: Somos Rex, Artef, Grill West, Casa Martínez, Sanitarios Campana, Domia Home y Punto Parrilla. Mi Pileta y Piazza: Foschia, Grupo Gemme, Deco Miracema, 2448 Materiales, Sanitarios Vera y Saniclick. Y además Abelson, MAQPRO, Proyectar Materiales e Intermarble. Probado: la amoladora Dogo 900 W pasó de 2 a 4 precios; la bomba Fluvial Magna, la bacha Mi Pileta 802E, la grifería Piazza Novara, el extractor TST S300 y el termotanque Heineken THE-50 ahora traen precios.",
      "TIENDANUBE CORTABA: cuando se le preguntaba a muchas tiendas Tiendanube juntas, Tiendanube dejaba de contestar (aguanta unas 25 preguntas de golpe y después una por segundo) y quedaban como \"no contestó\". Ahora cada pregunta espera su turno, se le hace una sola pregunta a cada tienda, primero a las que tienen la marca, y las que no llegan quedan para la próxima búsqueda conservando lo que habían traído antes. En el detalle dice \"Quedaron para la próxima búsqueda\".",
      "MEDIDAS: si los dos dicen pulgadas, litros, watts o HP y no coinciden, no es el mismo modelo (el extractor TST S300 de 6 pulgadas ya no se compara con el de 4, que tiene el mismo código).",
    ],
  },
  {
    version: "V.0.99.53",
    date: "2026-11-19",
    changes: [
      "SALIR (\"el salir no funciona\"): al salir se borraba la sesión de esta dirección pero quedaba viva la de *.conesa.com.ar, y se seguía adentro. Ahora se borran las dos y vuelve a la pantalla de entrada.",
      "REGISTRO DE ACTIVIDAD (\"quiero que cada modificacion o lo que se haga en el panel quede asentado con el usuario que toco\"): pestaña nueva Registro. Cada acción del panel que sale bien queda anotada con fecha, hora, usuario, qué hizo y sobre qué (código del producto, pedido, campo y valor): productos, precios, stock, fotos, pedidos, facturas y notas de crédito, marcas, sucursales, configuración, usuarios y permisos (88 acciones). También las entradas al panel y los intentos con contraseña equivocada. Se filtra por usuario y se busca por texto. Las contraseñas y claves nunca se anotan.",
    ],
  },
  {
    version: "V.0.99.52",
    date: "2026-11-19",
    changes: [
      "ÚLTIMO EN STOCK SIN TAPAR LA FOTO (\"eso se puede corregir para que no pise\"): el cartel pasa abajo de la foto, arriba del rubro, en el catálogo, la portada y los relacionados.",
    ],
  },
  {
    version: "V.0.99.51",
    date: "2026-11-19",
    changes: [
      "COMPARADOR CON FERRETERÍAS (\"buscalo ahi mismo y traeme un precio y link\", con la amoladora Dogo 900 W sin datos): suma Pideweb y Delta Ferretería Industrial, que venden Dogo. La amoladora DOG54015 ahora aparece en Delta a $83.000 y en Pideweb a $83.699. En las tiendas Tiendanube también se mira su código interno, que a veces es el de fábrica.",
    ],
  },
  {
    version: "V.0.99.50",
    date: "2026-11-19",
    changes: [
      "COMPARADOR EN UNA COLUMNA (\"ponelo en una columna prolijo y que quede ordenado\"): las tiendas de cada fila, a la izquierda y con el precio de ancho fijo, así quedan uno debajo del otro en todas las filas.",
      "La columna se llama \"Mismo modelo que vende la competencia\" (\"aca ponele mismo modelo que vende la competencia\").",
      "TABLA POR MODELO (\"en cada uno de los sitios armalo tipo tabla por modelo\"): en cada producto, una tablita Sitio | Precio | %, una fila por tienda de la más barata a la más cara, con las columnas alineadas en todos los productos.",
      "PORCENTAJE POR TIENDA (\"poneme el porcentaje en cada competencia si estoy arriba o abajo\"): al lado de cada tienda, en rojo con + si estamos más caros que ella y en verde con − si estamos más baratos.",
      "BUSCAR EN GOOGLE (\"si no encontras en las paginas de sanitarios proba en Google\"): cuando no hay datos, un link abre Google Shopping buscando la marca y el código del producto (o su título). El programa no le puede preguntar a Google solo (no hay forma permitida sin clave paga), por eso es un link para mirarlo a mano.",
    ],
  },
  {
    version: "V.0.99.49",
    date: "2026-11-19",
    changes: [
      "COMPARADOR, LAS TIENDAS DE CADA FILA (\"que se vea ordenado eso\"): como una tablita, el precio alineado y la tienda al lado en una sola línea, con la columna más ancha.",
    ],
  },
  {
    version: "V.0.99.48",
    date: "2026-11-19",
    changes: [
      "COMPARADOR POR TÍTULO (\"los termotanques Heineken podes buscar por el titulo tambien y con el resto tambien como TST\"): los productos sin código se buscan por el nombre con una regla menos estricta: el mismo tipo de producto (termotanque, campana...), la misma marca, todos sus números (50 L, 60 cm) y la mitad de las demás palabras, con precio cercano. Ejemplos: el Heineken 50 L eléctrico aparece en Sodimac y Easy; la campana TST Puelo 60 en Sanitarios San Martín y Sanicentro. Y no toma un modelo distinto cuando el nombre se contradice: conexión inferior/superior, eléctrico/gas, izquierda/derecha, simple/doble, interior/exterior, pared/mesada, monocomando/bimando.",
    ],
  },
  {
    version: "V.0.99.47",
    date: "2026-11-19",
    changes: [
      "COMPARADOR (\"hay productos que antes me traias de Easy y ahora no\"): con 37 tiendas a la vez varias tardaban más de 10 segundos y quedaban como \"no contestó\", borrando lo que antes sí habían traído. Ahora se consultan de a 8 tiendas, se espera hasta 15 segundos, y si una no contesta se conserva lo que había traído la vez anterior.",
      "COMPARADOR, LA FILA (\"cuando no hay data pone no hay data\" / \"si es mas de uno me lo mostras por sitio\"): sin precios dice \"No hay datos\", sin la lista de tiendas que no contestaron (el detalle sigue en la flechita); y si el producto está en varias tiendas, se ven todas, una por sitio, de la más barata a la más cara.",
      "BOTÓN SUBIR EN EL PANEL (\"agregame un boton subir que a veces es engorroso\"): abajo a la izquierda, aparece al bajar y lleva al principio de la pantalla.",
      "CÓDIGO DE FABRICANTE ENTRE PARÉNTESIS (\"en Mi Pileta fijate que los articulos tienen el codigo de fabricante entre los ()\"): los productos que lo tenían vacío lo toman del paréntesis del título, una vez y al guardar (\"(455)\" de Mi Pileta, \"(FW-ASIMEITAN)\" de Flowater, \"(112100)\" de Fluvial). Lo que no es un código, como \"(1/2)\" o \"(BLANCO)\", no se toma. Queda anotado en Novedades cuántos fueron.",
    ],
  },
  {
    version: "V.0.99.46",
    date: "2026-11-19",
    changes: [
      "COMPARADOR EN 37 CASAS DE SANITARIOS (\"pone todas las casas de sanitarios que encuentres y busca en ellas los productos por codigo, marca, titulo\" / \"lo mismo tenes que hacerlo con todas las marcas\"): además de Easy, Blaisten, Carrefour y Santagal, ahora Sodimac, Edificor, Casapick, Sanige, Ricardo Ospital, Cañoplast, Filhos, Banchero, Brufau, Comar Design, Creta Disegno, Anacleto, Sanitarios Hogar, Tecnofast, Sanitarios San Martín, Larralde, GM Sanitarios, Sanicentro, Cerymat, Totos, Sanitarios Alvarez, Daddona, Accesaniga, Suriani Bedetti, Sanitarios José C. Paz, Rakú, Soles Pergamino, Ruco Hogar, Moro, DePlano, Axantra, Ferrocons y SaniPlast. Se probaron una por una: son las que dejan ver sus precios. Ejemplo: el Arizona 0189/B1-CR aparece en 8 tiendas, de $144.716 a $217.430.",
      "Para todas las marcas: el código se reconoce aunque cada tienda lo escriba distinto (\"22301TNE\" = \"22301 TNE\"); los productos sin código de modelo se buscan por el nombre (todos sus números y casi todas sus palabras, misma marca y precio cercano, marcados \"por nombre\"); y no se toma un producto de otro color (el asiento Ariel 509 blanco no es el 509 arena).",
    ],
  },
  {
    version: "V.0.99.45",
    date: "2026-11-19",
    changes: [
      "COMPARADOR CON MÁS TIENDAS (\"tenes Santagal tambien ... muchos lugares para buscar el codigo, titulo, modelo\"): suma Santagal (su código es el de FV, así que lo encuentra exacto: por ejemplo el Alerce 0295/D7-CR a $259.324) y Carrefour. Sigue la regla de solo el mismo modelo (mismo código y marca). Para que aparezcan, tocá \"Buscar precios de todos\".",
      "VER TIENDA (\"el boton de ver tienda que vaya directo a la tienda\"): lleva a tienda.conesa.com.ar/tienda; editando un producto, a su ficha en la tienda.",
    ],
  },
  {
    version: "V.0.99.44",
    date: "2026-11-19",
    changes: [
      "FV: CÓDIGO DE FABRICANTE = SKU (\"A FV AGREGALE EL CODIGO DE FABRICANTE QUE ES EL MISMO QUE SKU POR FAVOR A TODOS LOS PRODUCTOS\"): se completa una vez en todos los productos FV que lo tenían vacío (los que ya tenían uno cargado no se tocan) y queda anotado en Novedades cuántos fueron. De ahora en más, al guardar un FV con ese campo vacío, toma el SKU.",
    ],
  },
  {
    version: "V.0.99.43",
    date: "2026-11-19",
    changes: [
      "COMPARADOR SIN MERCADOLIBRE (\"Seguimos sin ML\"): sale el cartel amarillo de \"Conectar MercadoLibre\". La cuenta de MercadoLibre de Conesa ya tiene su única aplicación (\"Tienda Buenos Aires\", la de los cobros de Mercado Pago, que no se toca) y MercadoLibre no deja crear otra. El comparador sigue con Easy y Blaisten.",
    ],
  },
  {
    version: "V.0.99.42",
    date: "2026-11-19",
    changes: [
      "MERCADOLIBRE, CÓMO CONECTARLO: las instrucciones decían que alcanzaba con el permiso de lectura, pero la tienda necesita también \"Acceso offline\" (sin eso MercadoLibre no da la llave para renovar la conexión y conectar falla). Ahora lo dicen, y que PKCE va apagado.",
    ],
  },
  {
    version: "V.0.99.41",
    date: "2026-11-19",
    changes: [
      "FICHA DEL PRODUCTO, PRECIOS (\"el precio que mostras ahi es el precio de LISTA 2?\" / \"poneme precio con transferencia y lista 2\"): el campo que se guarda ahora se llama \"Precio con transferencia\" y al lado está \"Lista 2 · 1 pago\" (lo que paga con tarjeta, con el recargo de Mercado Pago). Escribiendo uno se calcula el otro, así se puede cargar directo la Lista 2 de GBP. Debajo de la oferta se ve cuánto queda con tarjeta.",
    ],
  },
  {
    version: "V.0.99.40",
    date: "2026-11-19",
    changes: [
      "FOTOS DE LA FICHA (\"cuando cambio de foto deberia cargar la que hago foco\"): al tocar una miniatura se ve grande esa foto (marcada con un recuadro), con flechitas para pasar de una a otra, el cartel \"Foto 3 de 5\" y el botón \"Poner como principal\". \"Mejorar\" y \"Quitar el fondo\" de abajo trabajan sobre la que se está viendo.",
    ],
  },
  {
    version: "V.0.99.39",
    date: "2026-11-19",
    changes: [
      "ESTRELLAS DE GOOGLE EN LA PORTADA (\"Solo estrellas, sin clave\"): \"Lo que dicen nuestros clientes\" con el mapa de Google de cada local, que trae la tarjeta oficial con el promedio de estrellas y la cantidad de opiniones (hoy Buenos Aires 4,3 con 404 y Traslasierra 4,7 con 26), siempre al día y sin clave. Abajo, \"Ver las opiniones en Google\". En el celular, por el ancho, Google muestra el mapa sin la tarjeta y queda el botón. Si algún día se carga la clave de Google, en su lugar salen las opiniones con su texto.",
    ],
  },
  {
    version: "V.0.99.38",
    date: "2026-11-19",
    changes: [
      "PEDIDO: los botones en una sola fila, alineados, dentro de un recuadro (Factura, WhatsApp, Nota de crédito, Editar datos, Etiqueta, Recibo) y Eliminar a la derecha; el estado al lado del título (\"alinea eso por favor los botones que quede lindo\"). La hora de creación salía 3 horas adelantada (hora del servidor): ahora es la de Argentina, igual que \"Pago confirmado el\", que ahora tiene también la hora.",
      "CLIENTES: la columna Desde con fecha y hora completas en hora argentina (\"arregla la fecha ponele con los datos completos de fecha y hora\"), por ejemplo 18/11/2026 14:32.",
      "USUARIO SIN PARTES DEL PANEL (\"el usuario daniel entro le pide cambiar la contraseña la cambia guarda y le vuelve a pedir\"): la contraseña sí se guardaba, pero el que no tiene ninguna pestaña tildada caía en su usuario, que solo mostraba \"Cambiar mi contraseña\", y parecía que se la volvía a pedir. Ahora, si solo tiene el sistema Punto, va directo al sistema; y su pantalla se llama \"Mi usuario\", dice que la contraseña ya está guardada y muestra lo que puede usar (o que pida a admin que le tilde algo).",
    ],
  },
  {
    version: "V.0.99.37",
    date: "2026-11-19",
    changes: [
      "OJITO EN LAS CONTRASEÑAS (\"PONELE EL OJITO PARA VER LA PASSWORD SIEMPRE EN TODOS LOS LUGARES DONDE TENGA CONTRASEÑA\"): en la entrada al panel, al crear usuarios, al ponerles o cambiar la contraseña, y en las claves de MercadoLibre y de Google. Tocándolo se ve lo que se escribió.",
      "QUIÉN ESTÁ EN LÍNEA (\"poneme en el panel quienes estan online en el panel este momento\"): arriba, al lado del reloj, un punto verde con los nombres de los que tienen el panel abierto ahora. Cada panel abierto avisa cada minuto; el que lo cierra sale de la lista en unos 3 minutos.",
      "ENTRADA AL SISTEMA PUNTO (\"armame un panel de login para entrar con usuario que no sea una flotante de windows\"): /sistema/demo ya no pide la clave con la ventanita del navegador. Lleva a una pantalla de ingreso, con los mismos usuarios y contraseñas del panel. Entra el que tiene tildado \"Sistema Punto\" en Usuarios → Permisos (los que ven todo, incluido admin, ya lo tienen).",
    ],
  },
  {
    version: "V.0.99.36",
    date: "2026-11-19",
    changes: [
      "NOVEDADES ARRIBA (\"EL BOTON DE NOVEDADES PONELO ARRIBA DONDE DICE PANEL ADMIN LA VERSION Y SANITARIOS CONESA\"): sale de las pestañas y pasa a un botón al lado de la versión, con cuántas novedades hubo esta semana.",
    ],
  },
  {
    version: "V.0.99.35",
    date: "2026-11-19",
    changes: [
      "OPINIONES (\"LAS OPINIONES NO TIENEN QUE ESTAR EN EL PANEL SOLO QUE ESTEN EN LA WEB PRINCIPAL\"): sin pestaña en el panel. Van solo en la portada de la tienda.",
    ],
  },
  {
    version: "V.0.99.34",
    date: "2026-11-19",
    changes: [
      "MARCAS DE LA PORTADA (\"ARREGLAME ESAS 2 QUE NO SE VEN Y LAS QUE NO ESTAN ACTIVAS NO LO MUESTRES\"): Pluvius y Fluvial tenían el logo blanco (el de fondos oscuros) y sobre la tarjeta blanca no se veían; ahora un logo claro se pasa a oscuro al guardarlo, y los que ya estaban se arreglan solos una vez. En la portada solo aparecen las marcas que tienen al menos un producto a la venta.",
      "ÚLTIMO EN STOCK (\"CUANDO QUEDA 1 EN STOCK, ULTIMO EN STOCK Y LLAMANDO LA ATENCION DEL COMPRADOR\"): cartel naranja titilando \"¡Último en stock!\" sobre la foto en el catálogo, las ofertas y destacados de la portada y los relacionados, y en la ficha, grande, con \"Queda 1 sola unidad: llevala antes de que se agote\".",
      "COMPARTIR (\"QUE TE COPIE EL LINK Y YA VOS LO PUEDAS PEGAR EN WHATSAPP\"): en la ficha, \"¿Se lo querés mostrar a alguien?\" con dos botones a la vista: Enviar por WhatsApp (abre WhatsApp con el mensaje y el link ya escritos) y Copiar link (avisa que está copiado y que hay que pegarlo). En el celular, además, Otras apps. Si el navegador no deja copiar, el link queda a la vista para copiarlo a mano. Cada vez que alguien comparte va a Analytics.",
    ],
  },
  {
    version: "V.0.99.33",
    date: "2026-11-19",
    changes: [
      "OPINIONES DE GOOGLE EN LA PORTADA (\"podriamos agregar las opinion de google positivas en la pagina home\" / \"Automatico de Google\"): pestaña nueva Opiniones con tres pasos: la clave de Google (la carga admin), el local de cada sucursal en Google (se busca y se elige) y desde cuántas estrellas se muestran (4 y 5 de entrada). Se traen solas de Google cada 12 horas y no se guardan en la base, como pide Google. En la portada, \"Lo que dicen nuestros clientes\": el promedio y la cantidad de opiniones de cada local, y hasta 6 opiniones con su autor, link a Google y para denunciarlas, el aviso de cómo se eligieron y \"Google Maps\". Si Google no contesta, la portada sale igual, sin el bloque.",
      "PESTAÑAS (\"ESO DE ATENCION AL CLIENTE Y PRODUCCION NO LO PONGAS\"): sin títulos de grupo, en una sola fila: Dashboard, Pedidos, Clientes primero y después el resto como estaba (Productos, Marcas, Qué miran, Sucursales, Mercado Pago, Comparador, Novedades, Opiniones, Usuarios). Las casillas de permisos, igual, sin títulos.",
    ],
  },
  {
    version: "V.0.99.32",
    date: "2026-11-19",
    changes: [
      "PRECIO DE OFERTA (\"ACA EL PRECIO DE OFERTA NO ME LO TOMA\"): cuando un número no se puede guardar, ahora dice por qué, en un cartel rojo debajo del campo, hasta que se corrige. Antes se ponía rojo un segundo y no explicaba nada. La oferta tiene que ser MENOR que el precio: es el precio rebajado; el normal, el que sale tachado, va en Precio.",
      "AYUDA MEMORIA EN TODO EL PANEL (\"PODES PONERLE UN LABEL EXPLICANDO QUE HACE CADA COSA\"): cada pantalla tiene arriba un renglón que explica para qué sirve. La tabla de productos tiene una (i) en cada columna (Precio, Lista 2 · 1 pago, Oferta, Stock, Visitas, Estado, Destacado y los botones), igual que los campos de la ficha del producto y el estado de los pedidos. Las pestañas lo dicen al pasar el mouse.",
    ],
  },
  {
    version: "V.0.99.31",
    date: "2026-11-19",
    changes: [
      "USUARIOS · ESTADO (\"poneme status de los usuarios\"): activo o desactivado, \"en el panel ahora\" si anduvo en los últimos 5 minutos, contraseña provisoria, qué partes ve, el último ingreso y la última vez que anduvo por el panel.",
      "USUARIOS · PERMISOS (\"partes del panel que puede ver o no para tildar\"): casillas por cada parte del panel, agrupadas en Atención al cliente y Producción y mejora del panel. Lo que no tiene tildado no le aparece en las pestañas y, si escribe la dirección, el panel lo lleva a una parte que sí puede ver. Su contraseña la puede cambiar siempre. Los usuarios que ya estaban siguen viendo todo.",
      "PESTAÑAS AGRUPADAS (\"DASHBOARD, PEDIDOS, CLIENTES eso junto al principio\"): primero Atención al cliente (Dashboard, Pedidos, Clientes), después Producción y mejora del panel (Productos, Marcas, Comparador, Qué miran, Novedades, Mercado Pago, Sucursales) y al final Usuarios.",
    ],
  },
  {
    version: "V.0.99.30",
    date: "2026-11-19",
    changes: [
      "SEO PARA GOOGLE (\"arma tambien todo el SEO para google de la pagina tienda\"): cada producto le decía a Google que era una copia de la portada (y por eso Google no los mostraba). Ahora cada página tiene su propia dirección oficial.",
      "Mapa del sitio para Google (tienda.conesa.com.ar/sitemap.xml) con la portada, el catálogo, cada rubro, subrubro y marca, y cada producto publicado con su foto. Se arma solo con lo que está a la venta.",
      "robots.txt: Google no recorre el panel, el sistema, el carrito ni el pago, pero sí las fotos de los productos.",
      "Cada producto lleva su ficha para Google: nombre, marca, código, fotos, precio, si hay stock y la devolución de 10 días sin costo. Con eso Google puede mostrar el precio y \"En stock\" en el resultado. También el camino Inicio › Tienda › Rubro › Producto.",
      "Cada rubro, subrubro y marca del catálogo es una página para Google con su título y su descripción (por ejemplo \"Grifería FV\"), y el título grande del catálogo dice el rubro o la marca elegidos.",
      "El carrito y el pago no aparecen en Google. La ficha de los locales va en la página desde el principio.",
    ],
  },
  {
    version: "V.0.99.29",
    date: "2026-11-19",
    changes: [
      "QUÉ MIRAN (pestaña nueva): los productos que más abren los que entran a la tienda y lo que escriben en el buscador, hoy, en 7, 30 o 90 días, con una lista aparte de lo que buscan y no encuentran (\"me podes tagear cada producto para saber que miran o buscan los que entran?\"). Se guarda día por día desde el 19/11/2026.",
      "LO DE NOSOTROS NO CUENTA (\"en lo que es el panel de productos no cuentes ahi porque somos nosotros\"): ni las visitas, ni las búsquedas, ni Google Analytics, ni el pixel de Meta, con el panel abierto o desde una compu o un celular donde alguna vez se entró al panel. El panel tampoco manda nada a Analytics.",
      "ANALYTICS: cada búsqueda de la tienda va como evento \"search\" con lo que se buscó (también al pixel de Meta), y cada producto visto lleva su marca.",
      "USUARIOS (pestaña a la vista, \"haceme una parte del panel la parte de usuarios... que tenga reseteo de password, etc completo sin mail\"): crear, cambiar el nombre, resetear la contraseña (genera una provisoria y la muestra una sola vez para dictársela), ponerle una contraseña, desactivar y borrar. La contraseña que pone admin es provisoria: la primera vez que la persona entra, el panel le pide que elija la suya. Todo con usuario y contraseña, sin mail.",
    ],
  },
  {
    version: "V.0.99.28",
    date: "2026-11-18",
    changes: [
      "USUARIOS: cada persona entra al panel con su propio usuario y contraseña (\"haceme un usuario para cada uno\"). Se manejan tocando \"Usuario: admin\" arriba a la derecha: admin crea, desactiva o borra usuarios y les puede cambiar la contraseña; cada uno puede cambiar la suya. Las contraseñas se guardan cifradas. Si se desactiva o se borra a alguien, deja de entrar al momento aunque tenga el panel abierto. admin sigue igual que antes.",
      "DASHBOARD: \"Productos activos\" cuenta los de la sucursal del panel (antes contaba la lista de Traslasierra y no cambiaba al activar o pausar en Buenos Aires).",
      "PEDIDOS (dashboard y lista): fecha y hora de cada pedido en hora argentina, con qué pagó, y lo que compró, un renglón por producto.",
      "NOVEDADES: se actualizan cada vez que se entra al panel (si el último chequeo fue hace más de 10 minutos) y al abrir Novedades, además del chequeo de todos los días. La hora se muestra en hora argentina.",
    ],
  },
  {
    version: "V.0.99.27",
    date: "2026-11-18",
    changes: [
      "Esta pantalla vuelve a mostrar todos los cambios (Damian, 18/11/2026: \"porque no actualiza los cambios ahi\"). Desde la V.0.61 los cambios se anotaban en otro lado y aca habia quedado la V.0.60.0: se cargaron las 91 versiones que faltaban, cada una con la fecha en que se publico. Desde ahora cada version nueva aparece aca.",
    ],
  },
  {
    version: "V.0.99.26",
    date: "2026-11-18",
    changes: [
      "Comparador: se ordena tocando el titulo de cada columna (producto, nuestro precio, precio afuera, diferencia; otro toque da vuelta) (Damian, 18/11/2026: \"ponele filtros ahi\"). Y MercadoLibre (\"busca en mercadolibre no busca\"): MercadoLibre ya no deja buscar sin una cuenta conectada (contesta 403), asi que la pantalla avisa y lleva a conectar la de Conesa; conectada, ademas de la ficha de catalogo busca las publicaciones comunes que nombran el mismo codigo y marca.",
    ],
  },
  {
    version: "V.0.99.25",
    date: "2026-11-18",
    changes: [
      "Agencia J&M como transporte, primera y elegida de entrada al pasar un pedido a \"En entrega\" (Damian, 18/11/2026: \"seria los envios por ahora con la Agencia J&M\").",
    ],
  },
  {
    version: "V.0.99.24",
    date: "2026-11-18",
    changes: [
      "Avisos de envio por mail (Damian, 18/11/2026: \"cuando hay un seguimiento del envio que esta en camino, le podemos avisar tambien por mail\"). En la ficha del pedido, al pasarlo a \"En entrega\" se elige como va (nuestro reparto, Andreani, OCA, Correo, Via Cargo, Cruz del Sur) con numero y link de seguimiento, y al cliente le llega \"tu pedido esta en camino\" (o \"listo para retirar\" si lo retira); al pasarlo a \"Entregado\", \"gracias por tu compra\". Casilla para no mandarlo; los mails mandados quedan anotados en el pedido (migracion 43). Mail de la tienda: tiendasanitariosconesa@gmail.com (\"hagamos un mail para la tienda\"): las respuestas de los clientes van ahi (reply-to; pedidos@conesa.com.ar no es una casilla) y ahi llega el aviso de cada venta (antes iba al de Traslasierra, tambien las de Buenos Aires). El pie de los mails lleva los datos del local que vende.",
    ],
  },
  {
    version: "V.0.99.23",
    date: "2026-11-18",
    changes: [
      "Mejorar las fotos al subirlas (Damian, 18/11/2026: \"podes hacer que el subir fotos de la ficha del producto mejore la foto cuando la sube? hacelo por ia si es posible\"). Prendido de entrada en la ficha: el fondo gris o amarillento pasa a blanco, corrige el tono, centra el producto en un cuadrado blanco (si el fondo es blanco), si es chica la agranda al doble con IA (Swin2SR liviano, en el navegador, gratis) y le da nitidez. Para las ya cargadas: la estrellita de cada foto o \"Mejorar la foto principal\". src/lib/mejorar-foto.ts.",
    ],
  },
  {
    version: "V.0.99.22",
    date: "2026-11-18",
    changes: [
      "Despues de publicar, el panel abierto ya no se rompe (Damian, 18/11/2026, con \"This page couldn't load\": \"no para de salirme esa pantalla que onda?\"). Era la pestaña con la version vieja pidiendo cosas que la nueva ya no tiene. Ahora: si una pantalla falla por eso se recarga sola (una vez; si vuelve a fallar, un mensaje en castellano), y el panel pregunta cada minuto que version hay (/api/version) y, si cambio, muestra una franja para recargar antes de guardar. Comparador: no se muestran las busquedas de antes de V.0.99.17 (tomaban \"2000\" o una fecha como codigo: \"eso no tiene nada que ver\"), filtro por marca y los rubros como en Productos (\"habilita los filtros ahi\").",
    ],
  },
  {
    version: "V.0.99.21",
    date: "2026-11-18",
    changes: [
      "Publicar sin cortar la tienda (Damian, 18/11/2026: \"porque tira eso cada vez que subis\" ... \"Si, armalo\"). Dos lugares para la tienda, conesa@3000 y conesa@3001 (deploy/conesa@.service): la version nueva se prende en el que esta apagado, cuando contesta nginx le pasa las visitas (reload, sin cortar) y recien ahi se apaga la vieja. Si la nueva no arranca, queda la vieja; si no alcanza la memoria (1 GB), se hace como antes. La primera vez pasa solo de la forma vieja a la nueva y, si nginx no acepta el cambio, vuelve atras. Todo en deploy/cambiar-version.sh, que usan la publicacion automatica, deploy/publicar.sh y deploy/actualizar.sh.",
    ],
  },
  {
    version: "V.0.99.20",
    date: "2026-11-18",
    changes: [
      "Volver de un producto a la lista deja todo como estaba (Damian, 18/11/2026: \"cuando vuelvo para atras si estoy editando un producto deberia volver al punto donde estaba ... me resetea los filtros\"). Con la flecha del navegador o \"Volver a productos\", la lista baja hasta el producto que se edito y lo marca un momento; con la pestana PRODUCTOS de arriba, ademas vuelve a poner los filtros. Se recuerda media hora, en esa pestana del navegador. src/components/admin/RecordarLista.tsx.",
    ],
  },
  {
    version: "V.0.99.19",
    date: "2026-11-18",
    changes: [
      "Publicar corta menos (Damian, 18/11/2026, con una pantalla de 502: \"porque tira eso cada vez que subis\"). La compilacion nueva se desempaqueta aparte y se pone en su lugar recien al lado del reinicio: antes la version vieja atendia medio minuto con los archivos de la nueva. Si la base no se pudo preparar, ya no se reinicia: sigue la version de antes. Queda el arranque, unos nueve segundos (.github/workflows/publicar.yml).",
    ],
  },
  {
    version: "V.0.99.18",
    date: "2026-11-18",
    changes: [
      "\"Equipamiento de Baño\", con B mayuscula (Damian, 18/11/2026: \"poneme Baño con B mayuscula aca\"), en el panel y la tienda.",
    ],
  },
  {
    version: "V.0.99.17",
    date: "2026-11-18",
    changes: [
      "Comparador: solo el mismo modelo, sin \"parecidos\" (Damian, 18/11/2026: \"los parecidos no esta bueno que aparezcan porque trae cualquier cosa\"). Lo que no nombra el codigo con la misma marca no se guarda ni se muestra (tampoco lo guardado antes). Un producto sin codigo de modelo ya no se busca: dice que le falta el codigo de fabricante, y hay un filtro para ver cuales son.",
    ],
  },
  {
    version: "V.0.99.16",
    date: "2026-11-18",
    changes: [
      "Comparador: una medida ya no cuenta como codigo (Damian, 18/11/2026: \"se ve que esta buscando otra cosa y no el codigo que corresponde\"; de \"67.5 X 40.5 X 20 CM\" salia \"40.5\" y daba como mismo modelo una lija a $8.700, \"2742% mas caro\"). Mismo modelo ahora pide el codigo en el nombre o la referencia (no en una descripcion larga), la misma marca y un precio que tenga sentido; busca tambien con los codigos de la descripcion y por palabras con la marca. Mercado Pago: arriba de todo, el control automatico de todos los dias (cuando corrio y que encontro) con \"Chequear ahora\"; la fecha de revision a mano queda aparte (\"esto no deberia preguntar todos los dias?\"). Panel: las pestanas ya no tienen barra de desplazamiento; si no entran en una fila bajan a la siguiente (\"hacelo adaptativo a la pantalla\").",
    ],
  },
  {
    version: "V.0.99.15",
    date: "2026-11-18",
    changes: [
      "Comparador de precios, pestana nueva del panel (Damian, 18/11/2026: \"armame un comparador de precios con los publicados ... un panel aparte donde esten todas las publicaciones y busque por internet el mismo modelo\"). Los publicados del local con el precio de debito o 1 pago, y a cuanto los venden Easy, Blaisten (catalogo publico de VTEX) y MercadoLibre (ficha exacta, cuando la cuenta de Conesa este conectada). Busca por codigo de fabricante, los codigos del titulo y la ayuda memoria (tambien sin el cero de adelante: Blaisten pone \"207/B1\") y por palabras del titulo. \"Mismo modelo\" solo si nombra el mismo codigo; lo demas, \"parecido\", aparte. Buscar uno, o todos los de la lista de a tres, con Frenar; queda guardado (Setting \"comparador_precios\"). src/lib/comparador.ts.",
    ],
  },
  {
    version: "V.0.99.14",
    date: "2026-11-18",
    changes: [
      "Herramientas con subrubros (Damian, 18/11/2026: \"bombas de agua sacalo de ahi y hay que ponerlo como subrubro en herramientas\" y \"creame en herramienta Pistola de Calor, Amoladora, Taladro, Lijadora, Pulidora, Caladora y etiquetame bien los productos que tengo de DOGO\"). Subrubros de fabrica en src/lib/subrubros.ts (el rotomartillo va con Taladro). Una sola vez (src/lib/herramientas-una-vez.ts): lo del rubro \"Bombas de Agua\" pasa a Herramientas > Bombas de Agua y ese rubro sale de la lista; todo Dogo pasa a Herramientas con el subrubro que dice su titulo; lo de Herramientas sin subrubro, el del titulo. Respaldo de rubro y subrubro anteriores en Setting \"herramientas_antes\".",
    ],
  },
  {
    version: "V.0.99.13",
    date: "2026-11-18",
    changes: [
      "El buscador de la tienda perdona (Damian, 18/11/2026: \"porque no busca cuando pongo palabras claves ... que busque con terminos mal escritos o que suenen a lo que esta buscando el cliente\"). Sin tildes ni signos, cada palabra por separado en el titulo, la marca, el rubro, el subrubro y el codigo; mal escritas (una letra de mas, de menos, dada vuelta), lo que suena igual (b/v, s/z/c, ll/y, k/qu, h), singular o plural, y palabras de todos los dias (canilla = griferia, bacha = pileta, tapa = asiento). Ordena por lo que mejor coincide, y si nada tiene todas las palabras, muestra lo que tiene alguna. src/lib/buscar.ts.",
    ],
  },
  {
    version: "V.0.99.12",
    date: "2026-11-18",
    changes: [
      "\"+ Agregar rubro / subrubro nuevo...\" con una ventanita de la pagina y no la del navegador (Damian, 18/11/2026, en Crear por Excel: \"aca no me deja crear subrubro\"): Chrome puede bloquear las ventanas del navegador y ahi la opcion no hacia nada. Y en Crear por Excel ahora se ven los rubros y subrubros agregados a mano antes (quedaban afuera porque llegan recien al subir el archivo).",
    ],
  },
  {
    version: "V.0.99.11",
    date: "2026-11-18",
    changes: [
      "Marcas: se puede sacar del listado cualquier marca sin productos (Damian, 18/11/2026: \"dame posibilidad de eliminar marcas que no van del listado\"). Las del codigo se esconden (Setting \"marcas_ocultas\") y vuelven, con su logo, si se agregan de nuevo con el mismo nombre; las que tienen productos siguen con el candado. \"Lo mas visto\" pasa siempre solo (\"eso tiene que ir pasando automatico\"): ya no se frena con el mouse encima, solo unos segundos despues de tocar una flecha o deslizarla.",
    ],
  },
  {
    version: "V.0.99.10",
    date: "2026-11-18",
    changes: [
      "Marcas: \"subir logo\" / \"cambiar logo\" en cada marca, con la imagen que elige Damian en la compu (18/11/2026: \"dejame editar los logos trayendo yo la imagen del logo, porque a veces carga cualquier cosa\"). Sirve para cualquier marca, tenga o no pagina, y pisa el traido de la web o el del codigo; \"sacar\" lo deja como antes. Se recorta y se pasa a PNG igual que los de la web.",
    ],
  },
  {
    version: "V.0.99.9",
    date: "2026-11-18",
    changes: [
      "\"Lo mas visto\": si el deslizamiento suave no arranca (navegador viejo, ahorro de energia), pasa igual de golpe.",
    ],
  },
  {
    version: "V.0.99.8",
    date: "2026-11-18",
    changes: [
      "\"Lo mas visto\" sin barra de desplazamiento (\"ojo el scroll ese queda feo\"), con una flechita en cada punta y pasando solo de a uno cada 4 segundos (\"que vaya pasando solo de a 1 pero lento\"), frenando con el mouse encima, y con los colores del sitio en vez del fondo negro. El orden \"Recomendados\" del catalogo se mezcla en cada visita, alternando categorias y marcas (\"no muestres siempre los mismos\").",
    ],
  },
  {
    version: "V.0.99.7",
    date: "2026-11-18",
    changes: [
      "Destacados variados y \"Lo mas visto\". Damian, 18/11/2026: \"reformulame lo que muestra destacados, hace un variete de los productos, y se puede hacer un banner en la tienda donde destaque los productos que tienen mas visitas?\". Destacados se reparte por categoria y marca (src/lib/variedad.ts) y cambia cada dia; si no alcanzan los marcados, se completa con los mas vistos. Banner \"Lo mas visto\" (el contador de visitas de cada ficha) en la portada y arriba del catalogo cuando no hay filtros.",
    ],
  },
  {
    version: "V.0.99.6",
    date: "2026-11-18",
    changes: [
      "Sin stock, pausado. Damian, 18/11/2026: \"necesito que los productos que estan en la tienda sin stock queden pausados, no se muestren\". La tienda solo muestra lo que tiene stock; guardar stock en 0 (ficha, lista, Excel) lo pausa ahi mismo, y publicar algo con 0 no se puede (queda pausado); y cada 10 minutos (el vigia, y al abrir el panel) se pausan los que hayan quedado publicados con 0, contandolo en las novedades. Nunca se publica nada solo: cuando vuelve el stock, se publica a mano.",
    ],
  },
  {
    version: "V.0.99.5",
    date: "2026-11-18",
    changes: [
      "Fondos lisos sin IA. Damian, 18/11/2026, con los asientos de Daccord (blancos sobre azul marino): \"estas fotos le quise eliminar el fondo y no me dejo\". Antes de usar la IA se mira el borde de la foto: si es de un color parejo, oscuro o de color, se saca ese color (tambien el que asoma por el agujero del asiento y las motitas de polvo), al instante y sin bajar nada ni usar la memoria de la IA (src/lib/fondo-liso.ts). Si el fondo ya es blanco, queda como esta. Sobre gris claro o fondos con cosas, sigue la IA: ahi el color parejo borraria las partes blancas del producto.",
    ],
  },
  {
    version: "V.0.99.4",
    date: "2026-11-18",
    changes: [
      "Rubros y subrubros de la A a la Z, con \"Otros\" al final (Damian, 18/11/2026: \"ordename eso alfabeticamente siempre\"): en los desplegables de la ficha, el alta a mano y Crear por Excel, en los botones de categoria del panel y en el filtro de la tienda. Solo cambia como se muestran.",
    ],
  },
  {
    version: "V.0.99.3",
    date: "2026-11-18",
    changes: [
      "Paginas hechas con Tiendanube (Ariel, arielstore.com.ar). Damian, 18/11/2026: \"le pongo el codigo de la pagina y no lo encuentra el modelo y no me trae las fotos\". Tres cosas: las fotos estan en el servidor de Tiendanube (dcdn-us.mitiendanube.com), que no estaba entre los permitidos; la pagina trae la ficha para Google de los productos relacionados y no la del suyo, y se leia la primera (el link del 226-P salia como \"222-M\"): ahora solo vale la que coincide con el titulo de la pagina; y las fotos grandes vienen en data-zoom-url sin \"https:\". Ademas la pagina de resultados de la busqueda se tomaba como si fuera el producto: ahora solo si hay un resultado o la busqueda lleva directo. Y las letras escritas \"&aacute;\" en las descripciones se pasan a \"a\" con tilde.",
    ],
  },
  {
    version: "V.0.99.2",
    date: "2026-11-17",
    changes: [
      "Productos: \"Ocultar sin stock\" (Damian, 17/11/2026: \"quisiera filtrar por los que tienen 0 en stock para no verlos\"). Va aparte de los filtros rapidos y se suma a cualquiera (por ejemplo, Inactivos sin los que estan en 0); sigue puesto al cambiar de categoria, de pagina, al volver de una ficha y en las acciones en lote (\"todos los que coinciden\").",
    ],
  },
  {
    version: "V.0.99.1",
    date: "2026-11-17",
    changes: [
      "Subir fotos con \"Quitar fondo\" cerraba la pestaña a veces. Damian, 17/11/2026: \"porque me tira eso cuando quiero subir una foto a veces?\" (\"This page couldn't load\": Chrome la cierra cuando se queda sin memoria). La IA trabajaba con la foto entera (una de celular de 12 megapixeles abierta son ~50 MB, y se copiaba varias veces) y no soltaba su memoria despues de cada foto, asi que con unas cuantas seguidas no alcanzaba. Ahora la foto se achica antes (1600 px, lo mismo que se sube) y al terminar cada una se sueltan los tensores, la foto abierta y los lienzos.",
    ],
  },
  {
    version: "V.0.99.0",
    date: "2026-11-17",
    changes: [
      "Titulos en mayusculas. Damian, 17/11/2026: \"los titulos ponemelos todos iguales, si queda en minuscula le pones mayuscula ... mantengamos una linea en los titulos\". Todo titulo que se guarda (alta a mano, ficha, Crear por Excel, precios y stock por Excel) queda en mayusculas, con sus tildes (src/lib/titulo-en-linea.ts), y los cuadros del titulo ya lo muestran asi mientras se escribe. Los que ya estaban se pasan una sola vez desde el programa (no como migracion: si falla, la tienda sigue igual), guardando antes los originales en Setting \"titulos_antes_de_mayusculas\".",
    ],
  },
  {
    version: "V.0.98.2",
    date: "2026-11-17",
    changes: [
      "\"Volver a productos\" tambien abajo del boton Guardar cambios de la ficha (Damian, 17/11/2026), con los mismos filtros que el de arriba.",
    ],
  },
  {
    version: "V.0.98.1",
    date: "2026-11-17",
    changes: [
      "Filtros de la tienda. Damian, 17/11/2026: elegir Accesorios con Heineken puesta daba \"sin resultados\" (\"si no hay productos no elija por marca sino por categoria\"), y \"pongo griferia, en marcas me deberias mostrar las marcas que vende griferia y no todas\". Ahora la categoria manda: si la marca elegida no tiene nada ahi, se saca sola; la lista de marcas muestra solo las que tienen algo en la categoria (y subrubro) elegida, con cuantos; y el numero de cada categoria es lo que se ve al tocarla. Rubros renombrados: \"Sanitarios\" ahora es \"Loza sanitaria\" y \"Piletas\" es \"Bacha de cocina\" (los links no cambian); las tarjetas, la ficha y Descripciones toman el nombre de la lista unica.",
    ],
  },
  {
    version: "V.0.98.0",
    date: "2026-11-17",
    changes: [
      "Novedades y chequeo diario. Damian, 17/11/2026: \"podes hacer que el chequeo de las cuotas lo haga automaticamente todos los dias e informe en el panel como una leyenda de noticias, asi tambien los productos que se pausaron o quedaron bajo en stock etc.\". Una leyenda negra corre arriba de todo el panel con las novedades de la semana (se frena con el mouse; cada una lleva a donde corresponde), y una pestaña \"Novedades\" con todas y \"Chequear ahora\". El chequeo corre solo una vez por dia (lo dispara el vigia de GitHub y tambien abrir el panel): compara cada local con la foto del dia anterior (pausados, publicados, sin stock, con 1 o 2, cargados) y, para las cuotas, lo que de verdad se llevo Mercado Pago en las ventas con tarjeta de los ultimos 30 dias contra lo que calcula la tienda (Mercado Pago no publica su tabla de costos). Avisa tambien si paso un mes sin revisar los costos, y los combos que pausa una carga de stock.",
    ],
  },
  {
    version: "V.0.97.0",
    date: "2026-11-17",
    changes: [
      "Mercado Pago · Cuotas. Damian, 17/11/2026: \"en el panel puede haber una parte que diga MERCADO PAGO ... los costos, margenes que manejan, porque van cambiando mes a mes, y asi yo saber si tengo que modificar o no los precios de la financiacion\". Pestaña nueva en el panel: el costo por cobrar, el IVA y el costo de cada plan de cuotas sin interes (los copia de la app: Mercado Pago no los da por su sistema), con la cuenta en vivo de lo que se lleva Mercado Pago, el recargo al cliente (hoy -> nuevo) y un ejemplo sobre $100.000. Al guardar, los precios en cuotas de la tienda pasan a ser esos (antes eran fijos de octubre y no habia donde cambiarlos). Avisa si en 1 pago se pierde plata. Si paso un mes sin revisarlos, avisa ahi y en el Dashboard; \"Ya los mire: siguen igual\" lo da por revisado. La cuenta vive en src/lib/costos-mp.ts y es la misma que usa la tienda.",
    ],
  },
  {
    version: "V.0.96.0",
    date: "2026-11-17",
    changes: [
      "Stock de los combos por Excel. Damian, 17/11/2026: \"si yo te subo un excel con los SKU y el stock en caso de una marca como Pringles, tienen que actualizarse ... un combo lo componen 2 o 3 o 4 SKU, vos tenes que fijarte que haya 1 de cada 1 para poder formar ese combo; si falta uno ... hay que pausarlo\". Al subir stock, cada combo que tiene alguna pieza en el archivo queda con tantos como la pieza que menos hay (las que no vinieron, con su stock de hoy); si a uno le falta una pieza, se pausa. Ninguno se activa solo. Se ve antes de aplicar (\"Stock de los combos\") y se puede destildar. Un Excel con \"SKU\" y \"Stock\" sin columna de codigo tambien sirve: el codigo se busca como el del sitio, el del sistema o el SKU interno.",
    ],
  },
  {
    version: "V.0.95.0",
    date: "2026-11-17",
    changes: [
      "Codigo de fabricante. Damian, 17/11/2026: \"faltaria que la ficha del producto tenga el campo CODIGO DE FABRICANTE ... eso deberia levantar cuando se hace la carga del mismo y tambien editarse desde la ficha\". Columna nueva (migracion 42). Se completa solo: al crear por Excel (el codigo con que se lo encontro en la pagina de la marca, o el de la descripcion de GBP; en FV, el del sistema) y cada vez que se lo encuentra en la pagina de su marca si estaba vacio. Se edita en la ficha. Si esta cargado, se busca exactamente ese codigo: si trajo otro producto, se corrige el codigo y \"Buscar de nuevo\".",
    ],
  },
  {
    version: "V.0.94.1",
    date: "2026-11-17",
    changes: [
      "Quitar fondo. Damian, 17/11/2026: \"el borrar fondo de la imagen no funciono\" (std::bad_alloc: en WebAssembly el navegador le da poca memoria y BiRefNet no entra) \"hay alguna forma de volver a editar la foto una vez cargada?\". Ahora la IA corre en la placa de video (WebGPU) cuando el navegador puede, y si falla prueba una vez en WebAssembly; el error se explica en castellano. Y a una foto ya cargada se le saca el fondo: la goma en cada miniatura, y \"Quitar el fondo de la foto principal\" abajo de la grande. Queda en el mismo lugar de la galeria (con id nuevo, para que el navegador no muestre la vieja).",
    ],
  },
  {
    version: "V.0.94.0",
    date: "2026-11-17",
    changes: [
      "Logos de marca traidos de su pagina. Damian, 17/11/2026: \"a estas marcas le podes agregar el logo de la misma pagina automaticamente\". En Marcas: \"Traer los logos que faltan\" (todas las que tienen pagina y no logo), \"traer logo\" en cada una y \"sacar\" si trajo otra imagen. Al cargarle la pagina a una marca sin logo, el logo viene solo. Se busca el que la empresa declara para Google y las imagenes \"logo\" del encabezado; se prefiere el de fondo transparente y no el blanco (no se veria). Probado con Daccord, Roca, Peirano, Mi Pileta y Piazza. Se guarda en la base y se sirve en /api/marcas/logo/<id>. En la lista de Marcas el logo blanco de FV ahora se ve (en negro, como en el inicio).",
    ],
  },
  {
    version: "V.0.93.1",
    date: "2026-11-17",
    changes: [
      "Producto equivocado al traer de la web. Damian, 17/11/2026: \"me trajo un producto que no es, se puede ... buscar nuevamente el producto\". Daccord escribe el codigo como familia + variante (\"AGAR0IMP 13\", \"BACH0LOZ 08 07\"): AGAR0IMP son trece agarraderas y se buscaba solo eso, asi que venia la primera. Ahora se busca el codigo completo y la familia sola nunca: si no esta, dice que no esta. En la ficha, \"¿Es otro producto? Buscar de nuevo y reemplazar fotos y descripcion\": pregunta antes, baja las nuevas y recien ahi saca las de antes; si no lo encuentra, no toca nada. Las descripciones ya no repiten parrafos ni traen \"Ver instructivo\".",
    ],
  },
  {
    version: "V.0.93.0",
    date: "2026-11-17",
    changes: [
      "Rubros y subrubros a mano. Damian, 17/11/2026: \"en equipamiento de baño tambien agregame subrubro accesorios y tambien agregame la posibilidad de agregar a mano cualquier rubro o subrubro\". Cada desplegable de rubro y subrubro (Crear por Excel, la ficha, el alta a mano) tiene \"+ Agregar rubro / subrubro nuevo...\": pide el nombre y queda guardado (tabla Setting, como las marcas). La tienda los muestra en el filtro apenas tienen algo publicado. Los rubros salen de UNA lista (src/lib/rubros.ts): antes habia cinco y el mismo rubro decia \"Bañeras\" en la tienda y \"Equipamiento de baño\" en el inicio; ahora dice esto ultimo en todos lados. Subrubro \"Accesorios\" en Equipamiento de baño.",
    ],
  },
  {
    version: "V.0.92.0",
    date: "2026-11-17",
    changes: [
      "Crear por Excel: \"Buscar y reemplazar\" en los titulos (Damian, 17/11/2026: \"agregame un buscar y reemplazar aca en esta pagina, para editar los textos masivamente\"). Va sobre los tildados de la lista que se ve, sin importar mayusculas al buscar, por defecto solo palabras enteras (\"BL\" no toca \"BLANCO\"), muestra como quedan antes de aplicar y tiene Deshacer. Subrubro \"Asientos\" en Equipamiento de baño (\"aca faltara en equipamiento de baño subrubro asientos\"); los asientos de inodoro y Daccord ya caen ahi solos, y al cambiar el rubro a mano el subrubro se deduce del titulo. Publicar: si falla, el registro dice por que (memoria, disco, reinicios y errores de la tienda), sin entrar a la maquina.",
    ],
  },
  {
    version: "V.0.91.1",
    date: "2026-11-17",
    changes: [
      "Links de MercadoLibre, de nuevo. Damian: \"no me funciona desde ml\". Probado: desde un servidor, MercadoLibre manda TODA pagina suya a una pantalla de \"verificacion de cuenta\"; leerla no sirve nunca. Ahora un link de MercadoLibre no intenta abrir la pagina: sin la cuenta conectada lo dice enseguida, con el boton \"Conectar MercadoLibre\"; conectada, lo lee por su numero y si no puede dice que contesto MercadoLibre. Entiende tambien los links de publicacion nuevos (/up/MLAU..., wid=MLA... despues del #) y los cortos que arma la app del celular (meli.la, /sec/).",
    ],
  },
  {
    version: "V.0.91.0",
    date: "2026-11-17",
    changes: [
      "Sacarle la foto con el celular. Damian, 17/11/2026: \"subir foto desde el celular ... si ya lo tengo precargado que tenga la opcion de entrar con el celular para sacarle foto al producto, me elimine el fondo y arme la publicacion\". En la ficha: \"Sacar foto con la camara\" (input con capture=\"environment\": en el celular abre la camara de atras; en la compu, elegir archivo). Le saca el fondo con la IA que ya corre en el navegador (BiRefNet_lite fp16, ~110 MB la primera vez; no hay version mas chica) y la deja de principal. En la compu, la ficha muestra un QR que abre esa misma ficha en el celular con la camara primero y grande (?celular=1); si el celular no entro al panel, el login vuelve a la ficha (?volver=, solo rutas /admin/).",
    ],
  },
  {
    version: "V.0.90.1",
    date: "2026-11-17",
    changes: [
      "Links de MercadoLibre. Damian pego uno de la bacha 443 y salio \"no encontre un producto en esa pagina\": MercadoLibre no deja leer sus paginas desde un servidor (desde una casa si). Ahora: con MercadoLibre conectado, el link se lee por su numero (/p/MLA... es ficha de catalogo, MLA-... es publicacion) con la API; sin conectar, si la pagina no se deja leer, el aviso dice que hay que conectarlo. Y cuando la pagina se lee: todas las fotos de la galeria (data-zoom), sin repetir la misma en dos tamaños, y la descripcion de su bloque (antes salia codigo de la pagina: se sacan los scripts antes de buscarla y se descarta lo que parece codigo).",
    ],
  },
  {
    version: "V.0.90.0",
    date: "2026-11-17",
    changes: [
      "Traer foto y descripcion desde un link. Damian, 17/11/2026: \"agregame que pueda poner una url para que saque informacion, foto y descripcion\" y \"agregalo abajo del boton de traer fotos desde la web de la marca\". En la ficha, \"Traer desde un link\": suma las fotos a la galeria y pone la descripcion en el cuadro para revisar y Guardar (si ya habia texto, pregunta). En Crear por Excel, cada fila tiene \"Pegar link de la pagina del producto\", que lo muestra como lo que trae \"Buscar en la web\" (todo editable). Lee Shopify por su JSON y cualquier otra por su ficha para Google, la galeria de Magento, el bloque de descripcion y la tabla de caracteristicas; saca el \"- Piazza\" del final del nombre. Seguridad: solo sitios publicos; antes de pedir la pagina o una foto se resuelve el nombre y se rechaza la red interna (10.x, 192.168.x, 169.254.x, localhost, metadata.google.internal). Probado: Mi Pileta 406E (6 fotos), Ferrum Bari (4), Peirano, Piazza 21006. Y la IA: GEMINI_MODEL decia \"gemini-3.8-flash-lite\", que no existe (Google: \"is not found\"), y caian Escribir con IA, Descripciones de la web y la busqueda en Google. Si el modelo no existe, se le pregunta a Google cuales hay y se usa el flash mas nuevo.",
    ],
  },
  {
    version: "V.0.89.0",
    date: "2026-11-17",
    changes: [
      "MercadoLibre de respaldo para fotos y ficha. Damian, 17/11/2026: \"si no busca en la web de la marca, que busque en mercadolibre, pero tiene que ser exacto la buscada ahi porque puede traer cualquier cosa\". Con la cuenta de MercadoLibre de Sanitarios Conesa (dijo que tiene la suya; la de IKORA no se toca). Desde 2025 MercadoLibre no deja buscar sin cuenta (403), asi que hay una pantalla nueva, Productos -> Fotos de la web -> Conectar MercadoLibre (/admin/productos/mercadolibre): se carga el App ID y la clave de la aplicacion (la clave no se vuelve a mostrar) y se da el permiso entrando a MercadoLibre (OAuth; vuelve a tienda.conesa.com.ar/api/admin/mercadolibre/callback). El token dura 6 h y se renueva solo, de a una renovacion por vez (el refresh de MercadoLibre se quema al usarlo). Todo en Setting. Busca en el CATALOGO (fichas de producto, fotos de la marca), no en publicaciones de vendedores, y solo si es EXACTO: misma marca (atributo BRAND o en el nombre) y el codigo igual al Modelo o Numero de pieza, o como palabra entera en el nombre (\"445E\" no es \"445\"). Orden: pagina de la marca -> Google -> MercadoLibre; las marcas sin pagina van directo a MercadoLibre; FV y Piazza, si sus paginas no lo tienen. Las fotos de ahi se marcan \"(MercadoLibre)\".",
    ],
  },
  {
    version: "V.0.88.2",
    date: "2026-11-17",
    changes: [
      "El boton de la ficha dice \"Traer fotos desde la web de la marca\" (Damian, 17/11/2026: \"sino cambialo a traer fotos desde la web de la marca\"). Aparece en todo articulo con marca; si la marca no tiene su pagina web cargada, avisa que se carga en Marcas en vez de buscar.",
    ],
  },
  {
    version: "V.0.88.1",
    date: "2026-11-17",
    changes: [
      "La ficha del producto muestra los datos del LOCAL. Damian, 17/11/2026: \"cuando le pongo traer fotos me desactiva el producto, deberia quedar activo como estaba\". La ficha leia precio, stock y activo del articulo (que son los de Traslasierra) y al guardar los escribe en la fila del local (BranchProduct). Un producto de Buenos Aires activo se veia \"Inactivo\" con el tilde apagado; al refrescarse la pagina (traer fotos) y guardar, quedaba pausado. Ahora la ficha lee la fila del local que se edita, igual que la lista; si el local no lo lleva, lo muestra pausado.",
    ],
  },
  {
    version: "V.0.88.0",
    date: "2026-11-17",
    changes: [
      "Todas las fotos del modelo, no solo una. Damian, 17/11/2026: \"podes hacer que traiga mas de 1 foto del modelo?\". El lector junta la galeria entera (Shopify, WooCommerce, VTEX, la galeria de Magento, la ficha para Google; Piazza sus data-large_image), sin repetir la misma foto en otro tamaño o carpeta, sin logos ni la imagen de compartir, hasta 6. Se suman a la galeria del articulo (hasta 10), la primera de principal si no tenia ninguna. Probado: Mi Pileta 5 fotos (104EC, 304), Ferrum 4 (Bari, con el plano), Piazza 2, Peirano 1. Donde: Crear por Excel (\"Usar estas 5 fotos\", con las miniaturas; se crea de a 5), \"Traer fotos de <marca>\" en la ficha, y Fotos de la web, que suma \"Con una sola foto: sumarles las otras del modelo\" para los que ya tienen la primera. FV sigue con una (tiene una por terminacion).",
    ],
  },
  {
    version: "V.0.87.1",
    date: "2026-11-17",
    changes: [
      "Codigos cortos entre parentesis. Las bachas Mi Pileta (Damian, 17/11/2026: \"aca quiero buscar las fotos, como hacemos para hacer eso masivamente\") traen el codigo asi: \"(304)\", \"(406)\". Se pedian 4 caracteres minimo y quedaban afuera. Ahora entre parentesis alcanza con 3; sueltos en el texto siguen siendo 4 (un \"304\" suelto puede ser cualquier numero). Probado con mipileta.com.ar (Shopify): 104EC, 105EC y 304 con foto y descripcion. \"406\" no se toma por \"406E\" (puede ser otra variante) y \"445\" no esta en su pagina.",
    ],
  },
  {
    version: "V.0.87.0",
    date: "2026-11-17",
    changes: [
      "Fotos y descripcion de la pagina de CUALQUIER marca, y Google. Damian, 17/11/2026: \"aca deberia ser no FV o Piazza, podes buscar en la web de la marca que buscamos con el modelo, hacelo mas generico\", \"estaria bueno poner la web de la marca\", \"ademas de Google o internet que busca\" y \"podria estar cuando se hace la precarga por Excel, si no funciona del todo bien que uno pueda editarlo luego\". WEB DE LA MARCA: Marcas tiene la columna \"Pagina web\" (tambien al agregar una). Se guarda en Setting \"marcas_web\" y pisa la del codigo (FV, Piazza, Ferrum, Hydros, Roca y Peirano vienen cargadas). LECTOR GENERAL (src/lib/web-de-marca.ts): WooCommerce, VTEX y Shopify por su buscador en JSON; cualquier otra por su buscador comun o el formulario de la portada, entrando a los resultados que nombran el codigo. De la ficha lee el JSON-LD \"Product\" o las og:, el bloque de descripcion y la tabla de caracteristicas; corta los \"productos similares\". Un resultado vale solo si nombra el codigo. Si no esta, pregunta a Google (busqueda de Gemini) y sigue sus links solo si llevan al sitio de la marca. Fotos: solo del sitio de la marca o del servidor de fotos de su plataforma. Tope de 40 s por articulo; las pantallas piden de a 2. Probado: Peirano (A1452NI) y Ferrum (BAR-IN-011-BL, BAR-CL-001-BL) con foto, descripcion y caracteristicas. Hydros y el codigo AS de Ferrum (\"IKLM-B\") no aparecen en su buscador: quedan para Google. DONDE: Crear por Excel (busca solo al subir, todo editable antes de crear), Fotos de la web, \"Traer foto de <marca>\" y \"Buscar en la web\" de la ficha, y Descripciones de la web. FV y Piazza siguen con sus lectores propios.",
    ],
  },
  {
    version: "V.0.86.0",
    date: "2026-11-17",
    changes: [
      "\"Fotos y descripcion FV\" pasa a \"Fotos de la web\" y anda tambien con Piazza. Damian, 17/11/2026: \"eso que no diga fv porque va a ser para todas las marcas\". Las marcas cuya pagina oficial se sabe leer quedan en un solo lugar (src/lib/marcas-con-pagina.ts: FV y Piazza), y fichaDelFabricante (src/lib/fv.ts) elige el lector por la marca del articulo. Piazza busca su codigo en la descripcion de GBP (memo) y si no en el titulo (\"... Piazza 21006\"). Con eso, para Piazza tambien: la pantalla masiva, \"Traer foto de Piazza\" en la ficha, \"Buscar en la web\" de la descripcion (primero la pagina oficial) y \"Descripciones de la web\". Las otras marcas no tienen de donde traer foto; la pantalla lo explica.",
    ],
  },
  {
    version: "V.0.85.0",
    date: "2026-11-17",
    changes: [
      "Crear por Excel: marca nueva a mano y fotos antes de crear. Damian, 17/11/2026, con un Excel de bachas (SKU A03-02) sin marca: \"esa marca no la tengo, deberia poder agregarse la misma manualmente\" y \"el tema de las fotos, ahi en la precarga se puede hacer algo o solo cuando estamos ya creado el articulo?\". MARCA: los desplegables de marca (el de \"marca para todos\" y el de cada articulo) tienen al final \"+ Agregar marca nueva…\". Se escribe y queda en la lista de Marcas de la tienda (ahi despues se le pone el logo) y elegida. Si ya estaba, se elige esa. Si la columna del sistema trae una marca que no esta, boton \"agregarla\", que se la pone a todos los que la traen. La lista va de la A a la Z. FOTOS: cada articulo tiene un cuadrito de foto: clic para elegirla de la compu, arrastrar el archivo, o pegarla con Ctrl+V (en la web: clic derecho, \"Copiar imagen\"). Queda en el navegador y se sube recien al crear, despues de cada tanda (uploadOneImage, la de \"Cargar fotos por carpeta\"). La elegida a mano destilda la de la pagina del fabricante. Al final dice cuantos quedaron con foto.",
    ],
  },
  {
    version: "V.0.84.0",
    date: "2026-11-17",
    changes: [
      "La tienda pasa a tienda.conesa.com.ar. Damian, 17/11/2026: \"los subdominios no deberian estar mas, la idea es que sea tienda.conesa.com.ar y esa es la global\". Se cargo la direccion en Cloudflare (A 136.71.13.107, con proxy, como las otras) y abre lo mismo que conesa.com.ar. El que entra por conesa.com.ar, www, buenosaires, traslasierra o balvanera va a la misma pagina en tienda.conesa.com.ar (301, src/middleware.ts y src/lib/dominio.ts): los links viejos no se rompen. Siguen donde estan, sin redirigir: /api (el aviso de pago de MercadoPago no sigue redirecciones), /admin (el panel de cada sucursal, por el CUIT con que factura), /sistema (Punto), los archivos y todo lo que no sea GET. Google, los links que se comparten y los datos para buscadores dicen tienda.conesa.com.ar. La variable SITE_URL del servidor NO se toca: de ella salen el dominio \"de casa\" de MercadoPago y la direccion de los paneles.",
    ],
  },
  {
    version: "V.0.82.0",
    date: "2026-11-16",
    changes: [
      "Crear por Excel: Piazza se busca en su pagina oficial, y \"marca para todos\". Damian, 16/11/2026, subiendo \"pagina srl piazza.xlsx\": \"deberia buscar bien en la web, como se puede hacer para que la carga sea mas facil\". PIAZZA (src/lib/piazza.ts): en GBP el item_code de Piazza es interno (\"10001\", \"9935\"); el del fabricante viene en la descripcion (\"(10330)\", \"21006\", \"B0900\", \"P03-31400T\", \"BO904\" con O). Se prueba piazzagriferia.com/producto/<codigo>/ y trae nombre, foto, descripcion y el rubro de su categoria (Inodoros -> Sanitarios, Receptaculos y platos -> Bañeras, Bachas -> Piletas, bidets de loza \"B0...\" -> Sanitarios, el resto Griferia con el subrubro del nombre). Con su Excel: 37 de 68 encontrados; los otros son Hydros (otra marca) o modelos que Piazza ya no publica. El titulo, con el formato de FV: \"Grifería Ducha y bañera – Novara Bañera De Embutir C/ Transf. Piazza 21006\". El SKU sigue siendo el del sistema. \"Traer titulo y foto de FV\" pasa a \"Buscar en la web\" (FV y Piazza) y arranca solo al subir el Excel. MARCA PARA TODOS: 51 de 68 sin marca. Selector para ponerla de una a los que no tienen, que propone la del nombre del archivo, y recalcula el rubro con esa marca. RUBRO: una marca de \"griferia\" ya no manda si el titulo dice que es una pieza (inodoro, deposito, bacha, acrilico, plato de ducha, cabina, bidet de agujeros): \"PADOVA INODORO\" iba a Griferia.",
    ],
  },
  {
    version: "V.0.81.0",
    date: "2026-11-16",
    changes: [
      "\"Buscar descripciones en la web\" para muchos productos a la vez. Damian, 16/11/2026: \"se puede hacer que busquen en la web masivamente, para no hacer uno por uno\". Pantalla nueva (/admin/productos/descripciones, boton \"Descripciones de la web\" en Productos): los productos de este panel sin descripcion, con filtro por marca y rubro. Busca de a dos: FV en la pagina de FV, el resto en internet con la IA. No guarda solo: cada texto se ve en un cuadro editable y se guardan las tildadas; nunca pisa una descripcion que ya este. Si Google se queda sin cupo de busqueda, la IA escribe solo con el titulo: esas salen destildadas y marcadas. Si Google corta por limite, la tanda se frena.",
    ],
  },
  {
    version: "V.0.80.3",
    date: "2026-11-16",
    changes: [
      "Al guardar la ficha, rubro, subrubro y marca volvian al valor viejo en pantalla. Damian, 16/11/2026: \"cuando guardo, la categoria, el subrubro y la marca se resetea\". Con <form action={...}>, React 19 reinicia el formulario al terminar de guardar: los textos se actualizan, pero los desplegables vuelven a lo que tenian al abrir la pantalla. Se guardaba bien, pero el siguiente \"Guardar\" mandaba lo viejo y lo pisaba. Ahora la ficha (y \"Publicar articulo\", que con un error vaciaba todo lo cargado) manda los datos a mano, sin reiniciar.",
    ],
  },
  {
    version: "V.0.80.2",
    date: "2026-11-16",
    changes: [
      "Los accesorios no llevan \"Grifería Accesorios –\" en el titulo. Damian, 16/11/2026, sobre \"Grifería Accesorios – Jabonera Mikka FV 0168/31-CR Cromo\": \"eso de Grifería Accesorios no deberia estar en el titulo, sino el resto como sigue\". Queda \"Jabonera Mikka FV 0168/31-CR Cromo\". Las canillas siguen con \"Grifería Lavatorio – ...\" (lo habia pedido el mismo dia). En fv-ficha.ts, SIN_RUBRO_ADELANTE; sin el subrubro adelante no se le saca \"Accesorios\" al nombre (\"Arizona Kit 5 Accesorios\"). Migracion 41: a los accesorios ya creados les saca solo ese comienzo del titulo.",
    ],
  },
  {
    version: "V.0.80.1",
    date: "2026-11-16",
    changes: [
      "\"Traer de FV\" pasa a ser \"Buscar en la web\", para todas las marcas. Damian, 16/11/2026: \"ojo con eso porque hay muchas marcas, ponele buscar en la web\". Si el articulo es FV prueba primero la ficha oficial de fvsa.com; si FV no lo tiene (la jabonera Gran Gala 0172/42 ORO ya no esta en su pagina: daba \"FV no lo tiene\") o es otra marca, busca en internet con la IA. Igual que antes: pone el texto en el cuadro y se guarda con Guardar.",
    ],
  },
  {
    version: "V.0.80.0",
    date: "2026-11-16",
    changes: [
      "Descripcion de los FV desde la pagina de FV. Damian, 16/11/2026: \"faltaria que me traigas la descripcion de los articulos desde la pagina o internet\". De la ficha de FV sale el parrafo de la pestaña Descripcion y la tabla de caracteristicas (tipo, instalacion, diseño, tecnologia, prestaciones, caudal), mas la terminacion y el codigo FV (fv-ficha.ts, leerDescripcion). El color de la tabla no va: lista todas las terminaciones. Probado con 13 de los 121 de FV PAGINA: los 13 con descripcion. - Crear por Excel: llega junto con titulo y foto, tildada. - Pantalla \"Fotos y descripcion FV\": completa foto y descripcion a los FV que no las tienen. Nunca pisa una escrita a mano. - Ficha del panel: boton \"Traer de FV\" al lado de \"Escribir con IA\"; la pone en el cuadro para revisar y guardar. Para las otras marcas sigue \"Escribir con IA\" (busca en internet).",
    ],
  },
  {
    version: "V.0.79.0",
    date: "2026-11-16",
    changes: [
      "Fotos de los FV: se veian rotas; titulos FV completos desde el Excel; traer la foto de FV a articulos ya cargados. FOTOS ROTAS: Damian, 16/11/2026: \"las fotos no termino subiendolas, ahi lo cree, fijate\". Las fotos de FV SI se guardaron (la del 0167/17-CR pesa los mismos 17.502 bytes que la de fvsa.com), pero la direccion se armaba con la barra del codigo sin codificar: \"/api/productos/0167/17-CR/imagen\" daba 404. Ahora todas las direcciones de un articulo (foto, ficha de la tienda, ficha del panel) salen de src/lib/rutas-producto.ts con el codigo codificado. Sin esto, al publicar los FV su ficha tambien daba 404. Migracion 40: corrige la direccion anotada en los que ya estan (solo esa columna). TITULOS FV: \"no me estas trayendo los SKU y al titulo hay que agregarle Griferia, en el caso de FV\". El titulo con el rubro y el codigo salia solo si FV encontraba el articulo; si no, \"ALLEGRO LAVARROPAS FV\". Ahora todo FV arranca armado con lo que dice GBP (tituloFVDesdeGBP en fv-ficha.ts): \"Grifería Lavarropas – Allegro FV 0401/15-CR Cromo\". Probado con los 121 de FV PAGINA.xlsx: todos con Griferia y con el codigo. Y la busqueda en la pagina de FV arranca sola al subir el Excel. FOTOS DE FV para articulos ya cargados: \"podes hacer que levante por el codigo fotos del modelo desde la pagina de FV?\". Boton \"Traer foto de FV\" en la ficha del panel (la agrega a la galeria; si ya la tiene, no la repite) y pantalla \"Fotos de FV\" para todos los FV sin foto, de a cuatro y con el avance. FV tiene una foto por modelo y terminacion: no hay galeria para traer.",
    ],
  },
  {
    version: "V.0.78.3",
    date: "2026-11-16",
    changes: [
      "En la compu el ultimo renglon del pie se corre a la izquierda (sm:pr-20) en vez de subirlo: los dos botones flotantes ocupan la columna derecha y al subirlo lo tapaba la flecha.",
    ],
  },
  {
    version: "V.0.78.2",
    date: "2026-11-16",
    changes: [
      "El aire de abajo del pie tambien en la compu: el boton de WhatsApp tapaba el link \"Admin\" del ultimo renglon.",
    ],
  },
  {
    version: "V.0.78.1",
    date: "2026-11-16",
    changes: [
      "Pie de pagina ordenado en el celular. Damian, 16/11/2026: \"acomoda eso del final que se ve desordenado\". Los tres links legales iban dos en un renglon y el tercero abajo; ahora uno abajo del otro. Cada titular en su bloque (sucursal, razon social, CUIT) y el CUIT ya no se corta a la mitad (\"30-\" / \"71132164-7\"). El iPhone tomaba el CUIT por un telefono y lo subrayaba: formatDetection.telephone en false (los telefonos de verdad ya son links tel:). Mas aire abajo para que los botones flotantes no tapen el ultimo renglon.",
    ],
  },
  {
    version: "V.0.78.0",
    date: "2026-11-16",
    changes: [
      "Boton \"Comprar\" en las tarjetas; checkout con todos los datos obligatorios; \"Cordoba - Traslasierra\" en Nuestras sucursales. COMPRAR: Damian, 16/11/2026: \"poner agregar o comprar, porque tambien estaria bueno hacer carrito, pero si quiero comprar solo 1 producto\". Las tarjetas de la portada y de la tienda tienen \"Comprar\" y \"Agregar\" (src/components/BotonesCompra.tsx). Comprar paga SOLO ese producto y no toca el carrito, como en Mercado Libre: viaja en sessionStorage y el checkout lo usa con ?directo=1 (src/lib/cart.ts). El \"Comprar ahora\" de la ficha hace lo mismo; antes lo sumaba al carrito y cobraba todo junto. CHECKOUT: \"todos los campos obligatorios\". El DNI va siempre (antes era opcional para retirar); en el envio, piso/depto (\"si es casa, pone Casa\") y entre calles. Las notas siguen opcionales. Con DNI la factura B sale a su nombre: es el camino que ya existia, no cambia nada de ARCA. La pantalla y el servidor piden lo mismo. SUCURSALES: la tarjeta dice \"Cordoba - Traslasierra\" (solo el titulo; el nombre de la sucursal no cambia). Sin \"comprás en cualquiera de los dos\": la tienda online es la de Buenos Aires, y Traslasierra dice \"Atencion en el local. Consultas y pedidos por WhatsApp\". El boton de WhatsApp de esas tarjetas sacaba las letras D del numero en vez de lo que no es numero.",
    ],
  },
  {
    version: "V.0.77.0",
    date: "2026-11-16",
    changes: [
      "Se abre la tienda de Buenos Aires; la de Traslasierra se apaga (sigue como sucursal). Damian, 16/11/2026: \"la tienda de Traslasierra sacala, no va mas\"; \"Traslasierra se menciona como sucursal, pero no la tienda, solo la de Buenos Aires\"; \"si volvemos a activarla la prendemos\"; \"ya habilita el pago de producto, el carrito etc\". Migracion 39: Branch.tiendaOnline (Traslasierra en false) y tiendaActiva de Buenos Aires en true. Ningun producto se activa. Un local sin tienda online sigue en el sitio como sucursal, pero no aparece en el panel de productos (ni en el selector ni en el link al otro panel); en su propio panel de productos se avisa y se manda al de Buenos Aires. Textos: Legales tomaba la razon social de Buenos Aires con el domicilio y el contacto de Villa Cura Brochero, y ofrecia envio \"al Valle de Traslasierra\"; ahora todo es de la sucursal que vende. Arrepentimiento: mail y WhatsApp de la que vende. La portada arma \"Quienes somos\" con las sucursales activas y no con un texto fijo. Google: \"envio a coordinar\" -> envio a AMBA o retiro en Buenos Aires. Checkout: un codigo postal fuera del mapa dice \"Consulta el envio por WhatsApp\", con boton que manda el carrito y el CP. La categoria de la tarjeta ya no tapa la foto: va arriba del titulo, como en la tienda (portada y ficha del producto).",
    ],
  },
  {
    version: "V.0.76.0",
    date: "2026-11-16",
    changes: [
      "Botones \"Envio a AMBA\" y \"Retiro en sucursal Buenos Aires\"; activar/pausar en lote escribe en el local; vista previa entera. BOTONES: la ficha de cada producto decia \"Retiro en tienda · Villa Cura Brochero\" y \"Envio a Traslasierra · costo a coordinar\", escrito a mano. Ahora la ficha, la portada y el checkout salen de src/lib/entrega.ts con el local que vende: \"Envio a AMBA · Capital y GBA, gratis desde $100.000\" y \"Retiro en sucursal Buenos Aires · direccion, sin costo\". EN LOTE: activar/pausar escribia el articulo (catalogo de Traslasierra), asi que en Buenos Aires no publicaba nada; y con su tienda abierta se habria destrabado igual. Ahora va a la fila del local (guardarComercial), y \"todos los que coinciden\" usa el mismo filtro que la lista (src/lib/filtro-productos.ts). El freno de las pantallas que todavia escriben el articulo, y el puente de guardarComercial, quedan atados a Traslasierra (el local del articulo) y no a \"la que vende\": abrir la tienda de Buenos Aires no destraba esas pantallas ni hace que sus precios pisen el articulo. IMPORTAR: la vista previa muestra todas las filas, no 10.",
    ],
  },
  {
    version: "V.0.75.1",
    date: "2026-11-16",
    changes: [
      "\"Precios y stock por Excel\" lee el listado de existencias de GBP. Damian bajo de GBP el stock de Heineken: item_code, item_desc y una columna \"Dep BS AS\" (el deposito de Buenos Aires), sin precio. El lector buscaba \"Stk\" y exigia un precio, asi que lo rechazaba. Ahora: una columna \"Dep ...\" es stock; con varios depositos se toma el del local del panel; un archivo sin precio sirve para \"Solo stock\" (en \"precios\" avisa que elija Solo stock, y el alta lo rechaza porque sin precio no hay que publicar). Si el deposito es de otro local (subir \"Dep BS AS\" en el panel de Traslasierra) frena: seria vender alla lo que solo hay aca. Probado con el archivo real: 16 Heineken, los codigos con cero adelante intactos (\"00662\").",
    ],
  },
  {
    version: "V.0.75.0",
    date: "2026-11-16",
    changes: [
      "Envios de Buenos Aires: zona por codigo postal, cobrados con la compra, gratis desde $100.000; etiqueta nueva y recibo de MercadoPago para el que retira. Lo que paso Damian el 16/11/2026 (la tienda de Traslasierra no sigue, asi que es para Buenos Aires): se envia SOLO dentro del mapa de Mercado Envios Flex, repartiendo ellos. La zona sale del codigo postal: CABA 1000-1440 $5.500, Zona 1 $7.300, Zona 2 $9.100, Zona 3 $10.500 (listas en src/lib/zona-envio.ts; el 1642 vino en la 1 y en la 3, quedo en la 1). El envio se cobra JUNTO con la compra y desde $100.000 (precio de lista) es gratis a todas las zonas. Precios y tope se cambian desde Configuracion (migracion 38 los carga). CHECKOUT: el cliente escribe el codigo postal y ve la zona y el precio en el momento; fuera del mapa no puede elegir envio. Para un envio son obligatorios el DNI y todos los datos; se sumo piso/depto. Ya no aparece la lista de pueblos del Valle. COBRO: el servidor recalcula zona y precio (no confia en el navegador) y lo guarda en shippingCost, que hasta hoy era siempre 0. MercadoPago lo cobra como un renglon \"Envio Zona 2\", sin recargo. FACTURA: el importe que va a ARCA ya era order.total, que lo incluye; el PDF suma un renglon \"Envio\" para que el detalle cierre (renglonesDelPedido, armar-pdf.ts). Lo de ARCA no se toco. ETIQUETA (src/lib/etiqueta-envio.ts): zona y codigo postal grandes, piso, DNI, \"NO COBRAR\" (gratis o ya incluido) y el remitente del local del pedido; antes era siempre Villa Cura Brochero. RECIBO DE RETIRO: el \"Recibo de entrega de producto\" de MercadoPago, completado sobre su PDF original (pdf-lib), con boton en el pedido cuando retira; es la prueba ante un contracargo. Tambien: el mail de confirmacion, el carrito y la pantalla del pedido decian Traslasierra en un pedido de Buenos Aires.",
    ],
  },
  {
    version: "V.0.74.1",
    date: "2026-11-16",
    changes: [
      "La lista de productos muestra el codigo una sola vez. Decia \"SKU TST-10633 · 10633\": el SKU con la marca adelante y el codigo del articulo, el mismo numero dos veces. Lo que se carga desde el alta guarda los dos IGUALES, asi que los 121 FV iban a salir \"0207/C3-CR · 0207/C3-CR\". Damian: \"estas duplicando el sku\". Ahora, si el SKU termina en el codigo (comparando solo letras y numeros), se muestra \"SKU 10633\". Si es otro codigo de verdad, siguen saliendo los dos. Solo cambia lo que se ve: en la base no se toco nada.",
    ],
  },
  {
    version: "V.0.74.0",
    date: "2026-11-16",
    changes: [
      "Subrubros, y titulo y foto traidos de la pagina de FV. SUBRUBROS: columna nueva Product.subcategory (migracion 37) con la lista fija de cada rubro en src/lib/subrubros.ts. Griferia: Ducha y bañera, Lavatorio, Bidet, Cocina, Kit de baño, Lavarropas y Accesorios (Damian puso los accesorios FV en Griferia). En el alta se sugiere por la pestaña del Excel y si no dice nada, por el titulo. Se elige tambien en la ficha y en el producto nuevo. En la tienda se abren debajo de la categoria elegida (/tienda?cat=griferia&sub=lavatorio). Con el Excel de FV: 31 ducha y bañera, 22 lavatorio, 20 bidet, 35 accesorios, 7 cocina, 4 kit de baño, 2 lavarropas; ninguno sin subrubro. RUBRO POR MARCA: \"TRIADES LAVATORIO FV\" caia en Sanitarios, donde va el lavatorio de loza. FV, Piazza e Hydros llevan ahora rubro griferia y el alta lo toma de la marca; Ferrum no, porque hace las dos cosas. TRAER DE FV: boton en el alta que busca cada codigo en fvsa.com (src/lib/fv.ts y fv-ficha.ts) y propone titulo y foto. Titulo: rubro, subrubro y lo que dice la ficha de FV, con el codigo COMPLETO como lo escribe FV (el CCC es parte del codigo) y la terminacion en palabras solo si es segura (CR Cromo, NG Negro mate). Nunca el nombre de otra tienda. La foto se elige por el codigo exacto de la variante; si FV solo tiene la de otra terminacion se muestra marcada y SIN tildar. Nada se guarda hasta apretar Crear, y todo nace pausado igual que antes. FV deja en su pagina lo que ya no fabrica con \"DISCONTINUADO –\" adelante: se lee igual (tiene nombre y foto, y Conesa tiene stock), la palabra no va al titulo y se avisa en pantalla. No se repiten palabras: \"Libby Monocomando\" + \"Juego monocomando\" queda \"Juego monocomando Libby\", y \"Juego para bidé\" en Bidet queda \"Juego\". Probado en vivo con los 121 codigos del Excel de FV. El alta ahora se manda de a 10 con el avance a la vista: con las fotos, 121 articulos de una pasaban los 120 s del servidor. Tambien: el precio del alta dice \"LISTA 2 - PRECIO 1 PAGO\".",
    ],
  },
  {
    version: "V.0.73.5",
    date: "2026-11-16",
    changes: [
      "El Excel del sistema se lee en TODAS sus pestañas, y lo nuevo que se importa entra pausado. El lector ya recorria todas las hojas, pero descartaba en silencio las que no tenian la fila de titulos (item_code, item_desc...). Asi venia el de FV: la primera pestaña con titulos y otras cuatro por linea (duchas, bidet, accesorios, lavatorios) con los productos pegados directo. Se leian 13 de 121. Ahora una hoja sin titulos se lee con las columnas de la primera que si los tiene, SOLO si sus primeras filas encajan (codigo, descripcion con letras, precio mayor a cero, stock numerico o vacio). Si no encajan, la hoja no se lee y se avisa en la vista previa: leerla con las columnas corridas pondria el stock como precio. Probado con el archivo real: 121 de 121, con precio y stock de cada pestaña verificados contra la celda. Arregla tambien el alta de articulos, que usa el mismo lector. Lo segundo: el importador daba de alta lo nuevo PUBLICADO cuando el archivo no traia columna \"activo\", y el Excel del sistema nunca la trae. Subir una lista de proveedor publicaba todo lo que no estaba cargado sin que nadie lo eligiera. Ahora nace pausado. Lo que ya existe no cambia de estado salvo que el archivo traiga la columna. Damian: \"no actives nada\". Lo tercero, el mas peligroso: cuando un local empezaba a llevar un articulo que ya existia (guardarComercial creando la fila), la fila copiaba el estado del ARTICULO, que es el catalogo de Traslasierra y esta activo. Importar la lista de FV en el panel de Buenos Aires le habria creado publicados todos los FV ya cargados. Ahora una fila nueva nace pausada salvo que se diga otra cosa; el alta a mano pasa la casilla \"Activo\" del formulario explicitamente, asi que eso sigue igual.",
    ],
  },
  {
    version: "V.0.73.4",
    date: "2026-11-14",
    changes: [
      "Se volvio atras la 0.73.3: la principal sigue siendo Traslasierra. La 0.73.3 movia \"la sucursal principal\" a Buenos Aires, y con ella el espejo. El espejo no copia solo el precio: copia precio, oferta, stock Y si el producto esta activo. Lo que hay en Product es el catalogo de Traslasierra, que esta ACTIVO; las filas de Buenos Aires estan PAUSADAS a proposito. Apuntar el espejo a Buenos Aires le iba a copiar active = true a sus 54 filas en el primer guardado de cualquier producto —incluso desde el alta o al subir una foto, que no pasan por el freno de todaviaNoPorSucursal— y despausarle el catalogo entero. No alcanzo a correr: se verificaron los 54 en Pausado despues del deploy. El precio y el stock de Buenos Aires ya eran identicos a los de Traslasierra (los dejo asi la migracion 32/33), asi que el estado era lo unico que cambiaba. El error de fondo: \"la principal\" no es una etiqueta que se pueda mover. Las filas de Traslasierra SON una copia del articulo, y eso es un hecho de la historia. Para que Buenos Aires sea la unica tienda hay que SACAR el puente —y con el este espejo— para que Product deje de ser la fuente de nadie. Recien ahi \"principal\" no significa nada y no hay que elegirla.",
    ],
  },
  {
    version: "V.0.73.2",
    date: "2026-11-14",
    changes: [
      "En conesa.com.ar los recargos son los de la sucursal que vende. Los recargos de MercadoPago se leian por subdominio. En conesa.com.ar no hay subdominio, asi que se leian los generales; pero la venta la toma igual la sucursal que vende, que cobra en SU cuenta y factura con SU CUIT. El mismo carrito salia a dos precios segun por que puerta entro el cliente: Buenos Aires tiene cargado 31% en cuotas y hasta 18, y los generales son 25,71% y hasta 6. La pantalla de Configuracion no se movio: sigue mostrando y guardando lo mismo de antes (lo del subdominio, o lo general en conesa.com.ar). Es a proposito: si mostrara los de la sucursal que vende y guardara en los generales, entrar ahi y apretar Guardar pisaria los generales con los numeros de otro local, y los generales son los que usa la tienda que no tiene los suyos. Ahora ese cartel dice quien le cobra de verdad al cliente. Con todas las tiendas cerradas no cambia nada, porque no hay quien venda y se siguen leyendo los generales. Empieza a valer el dia que se abra una tienda.",
    ],
  },
  {
    version: "V.0.73.1",
    date: "2026-11-14",
    changes: [
      "El logo de Data Fiscal enlaza por http. Se cargo el codigo del QR de la S.R.L. (F960/D del sitio https://conesa.com.ar, declarado ante ARCA el 14/11/2026), y al probarlo aparecio que https://qr.afip.gob.ar no existe: no contesta TLS. El componente armaba el enlace con https, asi que el logo habria quedado apuntando a una direccion muerta. Ahora usa http, que es lo que da el propio script del F960/D y redirige solo a serviciosweb.afip.gob.ar. La imagen sigue por https, porque por http la bloquea el navegador.",
    ],
  },
  {
    version: "V.0.73.0",
    date: "2026-11-14",
    changes: [
      "Cada sucursal factura con SU certificado de ARCA. Damian decidio que la tienda online pasa a ser de Buenos Aires: cobra y factura la S.R.L. El certificado de la S.R.L. ya esta en el servidor (AFIP_CERT_BSAS / AFIP_KEY_BSAS), y este cambio es para que el sitio lo use. Las variables de ARCA ahora llevan el slug atras, igual que las de MercadoPago: AFIP_CUIT_BSAS, AFIP_PTO_VTA_BSAS, AFIP_CERT_BSAS, AFIP_KEY_BSAS. La sucursal que no tiene las suyas usa las peladas, que es lo que habia cuando la tienda era una sola: Traslasierra no se toca, y es la unica que hoy emite comprobantes con validez fiscal. Ese respaldo puede devolver el certificado del OTRO contribuyente. No es un descuido: antes de pedir el CAE se compara el CUIT de la sucursal del pedido con el que se va a usar, y si no coinciden no se emite (el freno de la 0.72.5, ahora comparando contra el que de verdad se va a usar y no contra AFIP_CUIT a secas). El ticket de acceso de ARCA se guarda por certificado y no por sitio. Un TA se le emite a UN certificado y vale para UN CUIT: compartirlo entre dos contribuyentes es pedir el CAE con el token del otro. La sucursal SIN certificado propio conserva la clave de cache de siempre, sin sufijo. Eso es a proposito: ARCA no emite un TA nuevo mientras haya uno valido (\"El CEE ya posee un TA valido\"), asi que cambiarle la clave a la tienda que hoy factura la dejaria sin facturar hasta 12 horas. El panel muestra el estado de ARCA del local en el que estas parado, prueba la conexion con SU certificado, y avisa cuando un local esta usando el general. Antes el panel de Buenos Aires probaba el certificado de Traslasierra y contestaba que todo andaba bien.",
    ],
  },
  {
    version: "V.0.72.5",
    date: "2026-11-14",
    changes: [
      "ARCA: no se factura con el CUIT de otro contribuyente. El sitio tiene UN solo certificado de ARCA, en el servidor, y atiende dos sucursales que son dos contribuyentes distintos: Traslasierra (Conesa Carlos Daniel) y Buenos Aires (Sanitarios Conesa S.R.L.). Todo el modulo de ARCA no sabia de sucursales: pedia el CAE con el CUIT que hubiera cargado, viniera el pedido de donde viniera. Un pedido de Buenos Aires facturado con el certificado de Traslasierra sale a nombre de quien no vendio, y eso no se deshace: se anula con nota de credito, a mano, y queda en los libros de los dos. Ahora emitirFactura y emitirNotaCredito comparan el CUIT de la sucursal del pedido con el del servidor, y si son distintos no emiten: devuelven que falta cargar el certificado de esa sucursal. La nota de credito importa por su propia razon: tiene que salir del mismo CUIT que emitio la factura. El dia que se cambie el certificado del servidor, anular una factura vieja desde el nuevo seria emitir la NC de un contribuyente contra el comprobante de otro. SOLO frena cuando puede probarlo: hacen falta los dos CUIT y que sean distintos. Sin sucursal en el pedido, sin CUIT en el panel o sin AFIP_CUIT, factura igual que siempre. Un freno que salta por un dato que falta dejaria de facturar un martes cualquiera sin que nadie haya tocado nada. Traslasierra no cambia en nada: su CUIT es el del certificado cargado, asi que la comparacion da igual y sigue de largo.",
    ],
  },
  {
    version: "V.0.72.4",
    date: "2026-11-13",
    changes: [
      "Los recargos de tarjeta son de cada sucursal, y entran los de Buenos Aires. Cada local cobra en SU cuenta de MercadoPago y cada cuenta tiene sus costos. Los porcentajes eran uno solo para todo el sitio, asi que cargar los de Buenos Aires movia los precios en cuotas de Traslasierra, que es la que esta vendiendo, y sin avisar. Ahora la configuracion se guarda con el nombre del local pegado atras (\"mp_planes:bsas\"). La clave sin nombre sigue existiendo y sigue valiendo: es la de Traslasierra y la de conesa.com.ar. Un local solo la pisa si le cargaron lo suyo, asi que esto no mueve ni un precio de los que hay hoy. Lo decide el SUBDOMINIO, no sucursalActual(): en el dominio general no hay una sucursal sino dos, y tomar los numeros de una seria cobrarle a todos con los costos de un local que a lo mejor ni vende. El panel de Configuracion ahora dice de quien son los numeros que estas mirando. Era el peor malentendido posible: creer que tocas los de uno cuando tocas los del otro. Y guardar desde el panel de una sucursal guarda los de esa sucursal y nada mas. Los de Buenos Aires (migracion 36), como los paso Damian el 13/11/2026: 3 cuotas 23%, 6 cuotas 31%, 9 cuotas 42%, 12 cuotas 53%, 18 cuotas 74%. Eso es lo que PAGA DE MAS EL CLIENTE, no el costo que publica MercadoPago: el confirmo cual de las dos cosas era, porque cargados como costo del plan el de 18 cuotas pasaba del 95% y el plan desaparecia solo del sitio. Sobre un articulo de $100.000 queda: 3 -> $123.000, 6 -> $131.000, 9 -> $142.000, 12 -> $153.000, 18 -> $174.000. Verificado uno por uno. Falta el recargo de 1 pago de Buenos Aires: hasta que se cargue usa el general (12% de descuento por contado). Y falta la clave de la cuenta en el servidor (MP_ACCESS_TOKEN_BSAS), que es lo unico que hace falta para que esa tienda pueda cobrar.",
    ],
  },
  {
    version: "V.0.72.3",
    date: "2026-11-13",
    changes: [
      "Gas envasado sin stock, y el codigo del articulo se lee. 1. No hay envasado (Damian, 13/11/2026), asi que un termotanque \"a gas natural o envasado\" deja de preguntar con que gas se va a usar: se vende solo como gas natural y se agrega al carrito de una, sin pasar por la ficha a contestar una pregunta con una sola respuesta. El titulo del articulo sigue diciendo \"o envasado\", asi que callarse no alcanza: la ficha avisa \"Sin stock de envasado\". El que lo quiera para garrafa se entera ANTES de comprar y no cuando se lo entregan. Es una sola perilla en src/lib/etiquetas.ts (HAY_GAS_ENVASADO). Cuando entre mercaderia se pone en true y vuelven solos el cartel y la eleccion. Los articulos que son SOLO envasado no se tocan: eso se pausa desde el panel, que es donde se maneja el stock. 2. En la lista de productos del panel, el codigo que va abajo del titulo estaba en gris claro y fino, y no se leia. Ahora va en negrita y en el color del texto, y adelante aparece el SKU cuando el articulo lo tiene cargado. Es lo que se busca y lo que se dicta por telefono; el SKU ademas es con lo que se emparejan las fotos, asi que de paso se ve cual no lo tiene.",
    ],
  },
  {
    version: "V.0.72.2",
    date: "2026-11-13",
    changes: [
      "Un boton para abrir y cerrar la tienda, arriba de la ficha. La casilla \"Tienda abierta\" estaba al fondo de una ficha larga y solo se guardaba junto con todo lo demas. Damian la destildo, apreto Guardar y el sitio siguio vendiendo igual. Eso es lo peor que puede pasar en un panel: decir una cosa y hacer otra. Ahora es un boton arriba de todo, con el estado al lado en verde o en gris, y toca ese campo y nada mas. Va aparte del Guardar a proposito: guardarSucursal valida media ficha —el CUIT, el subdominio, que alguien cubra el resto del pais— y si algo de eso no cuadra no guarda NADA. La tienda se quedaba abierta por un CUIT mal escrito, que no tiene nada que ver. La casilla se fue. Dos controles para la misma cosa terminan peleandose: el boton cierra la tienda, la casilla sigue tildada porque la pantalla no se recargo, y el proximo Guardar la vuelve a abrir sin que nadie lo pida. Por lo mismo, Guardar ya no manda ese campo. Pregunta antes de hacerlo, porque es lo unico de esa pantalla que se ve desde afuera al instante, y en la pregunta avisa lo que hay que saber: si la sucursal no tiene cargado SU MercadoPago —y entonces lo que venda se cobra en la cuenta de la otra— y, al cerrar, si es la ultima abierta, porque ahi el sitio entero pasa a atender por WhatsApp.",
    ],
  },
  {
    version: "V.0.72.1",
    date: "2026-11-13",
    changes: [
      "Traslasierra cierra su tienda online, y cerrar significa cerrar. Damian pidio apagarla por el momento. Lo intento desde Panel -> Sucursales y no quedo guardado, asi que va por migracion (34). NO cierra el local: la sucursal se sigue publicando con su direccion, su telefono y sus horarios; lo unico que se apaga es la compra online. Para reabrirla alcanza con tildar \"Tienda abierta\" en el panel: la migracion corre una sola vez. Y se tapa lo que la 0.72.0 dejaba a la vista: con la tienda cerrada, /tienda seguia respondiendo. Mostraba un catalogo vacio —feo pero inofensivo— y, eso si, dejaba llegar al checkout. Un carrito guardado de antes podia armar un pedido a nombre de la sucursal que NO vende y cobrarlo en la cuenta de la otra: justo lo que la 0.71.0 vino a evitar. Ahora, sin ninguna tienda abierta, /tienda y todo lo que cuelga mandan a la portada, y el checkout se niega del lado del servidor, que es lo unico que no se puede saltear desde el navegador. Las tres pantallas de vuelta de MercadoPago (exito, pendiente, error) quedan abiertas a proposito: ahi cae alguien que YA pago, y mandarlo a la portada seria dejarlo sin el aviso de que su compra entro. La redireccion va a una ruta relativa y solo para /tienda: mandar el sitio entero a la portada seria un bucle, porque la portada pasa por el mismo layout. La portada y el layout preguntan lo mismo con la misma funcion (hayTiendaAbierta). Dos maneras de averiguar lo mismo terminan contestando distinto el dia menos pensado. Y Buenos Aires queda todo pausado (migracion 35). Lo copiado hasta hoy ya entro pausado; esto lo deja escrito y no depende de que las migraciones 32 y 33 hayan salido como se esperaba. Pausado es que no se muestra ni se puede comprar: el precio, el titulo y las fotos quedan intactos. No toca el stock ni toca a Traslasierra, y corre una sola vez: lo que se publique despues desde el panel queda publicado.",
    ],
  },
  {
    version: "V.0.72.0",
    date: "2026-11-13",
    changes: [
      "Tienda: el precio, la oferta y el stock salen del LOCAL. Hasta hoy todo salia del articulo (\"Product\"). Andaba porque vendia un local solo; con dos, los dos publicarian el precio y el stock del primero. Un cliente de Buenos Aires compraria algo que esta en el deposito de Cordoba, al precio de Cordoba. Ahora todo lo que el cliente ve y paga pasa por src/lib/catalogo.ts: catalogo, portada, ficha, recomendados y checkout. El local sale de sucursalQueVende() —el que cobra, no el que se muestra— porque esto termina en una venta. Un articulo que el local no lleva no aparece en su tienda y no se puede vender ahi: ponerle el precio del otro local seria cobrar el precio de otro negocio. La migracion 31 copia el articulo a la fila de Traslasierra ANTES de que la tienda lea de ahi. Esa tabla se habia llenado una sola vez y podia estar vieja; copiando el articulo, que es exactamente lo que el cliente ve hoy, la tienda lee otra tabla y muestra los mismos numeros. Comprobado contra el sitio en el aire, articulo por articulo, antes y despues. Va contra 'traslasierra' con todas las letras y no contra \"la que vende\": si el dia del cambio la tienda esta cerrada, \"la que vende\" no es nadie y no haria nada, que es justo el caso en el que hace falta.",
    ],
  },
  {
    version: "V.0.71.1",
    date: "2026-11-13",
    changes: [
      "Panel: que siga guardando precios con la tienda cerrada. El espejo —el que copia el precio del articulo a la fila del local— y la \"sucursal principal\" del panel daban los dos por hecho que siempre hay una tienda abierta. Con Traslasierra cerrada un rato no hay ninguna: el espejo actualizaba cero filas y el panel se quedaba sin principal, asi que guardar un precio entrando por conesa.com.ar/admin no grababa nada, sin error y sin aviso. Se veia como cambiar un precio y que el panel siguiera mostrando el viejo. Los dos pasan a mirar a 'traslasierra' con todas las letras. No es lo mismo que \"la que tiene la tienda abierta\": lo que hay guardado en el articulo es el catalogo de Traslasierra, de cuando habia un solo local. Eso es un hecho de la historia, no una regla que cambie al destildar una casilla. Antes de esto, y sin tocar una linea de codigo, entro por migracion el catalogo de arranque de Buenos Aires: Piazza, Pringles, Ferrum y TST. Pausados, sin stock —el stock esta fisicamente en Cordoba— y con el precio de hoy como punto de partida, para editar desde el panel de Buenos Aires. Esa tienda sigue cerrada: esto no la abre. Nada de esto toca el facturador de ARCA, ni MercadoPago, ni lo que ve el cliente: el catalogo publicado quedo identico, comparado articulo por articulo antes y despues.",
    ],
  },
  {
    version: "V.0.71.0",
    date: "2026-11-13",
    changes: [
      "Tienda: cada sucursal cobra en SU cuenta de MercadoPago, y el pedido guarda de que sucursal es. Hasta hoy el servidor tenia UNA sola clave de MercadoPago y la usaba para todo, sin preguntar de que tienda venia la venta. Con una sola tienda abierta no se nota; el dia que abra Buenos Aires, su plata entraria en la cuenta de Traslasierra. Son dos contribuyentes distintos: eso no es un detalle de programacion, es plata que entra a nombre de quien no vendio. Buscandolo aparecio un segundo agujero del que cuelga el primero: el pedido NO guardaba de que sucursal era. El aviso de pago lo manda MercadoPago desde sus servidores, asi que en ese pedido no viene nuestro dominio; y el boton Facturar del panel tampoco sabe por donde entro el cliente. Sin ese dato no hay forma de saber a que cuenta preguntarle por el pago ni con que CUIT facturar. Van los dos juntos. (1) Order.branchId: el pedido guarda el local que cobra y factura, tomado de sucursalQueVende() en el momento del checkout, que es el unico momento en que se sabe. Queda opcional: los pedidos que ya estaban cargados no lo tienen y no hay manera honesta de adivinarselo. (2) La clave de MercadoPago sale de la sucursal: MP_ACCESS_TOKEN_TRASLASIERRA, MP_ACCESS_TOKEN_BSAS. Si una sucursal no tiene la suya cargada, se usa MP_ACCESS_TOKEN, que es la de siempre. Ese respaldo es a proposito: mientras no se carguen las claves por sucursal, la tienda que ya vende cobra exactamente como venia cobrando. Probado con el codigo de verdad: con una sola clave cargada, las tres funciones dan lo mismo que antes. (3) El aviso de pago de MercadoPago lleva la sucursal pegada en la direccion (?suc=). Tiene que ir ahi porque el aviso no lo manda el navegador del cliente: es la unica forma de saber con que clave preguntar por el pago. Los avisos de preferencias viejas no lo traen y caen en la clave de siempre, que es la que las cobro. (4) El cliente vuelve al dominio por el que entro y no a conesa.com.ar. El dominio se toma del pedido HTTP y se acepta solo si termina en conesa.com.ar: viene en un encabezado y un encabezado lo puede escribir cualquiera. (5) El panel muestra el estado de MercadoPago sucursal por sucursal, con el nombre exacto de la variable que falta cargar, y avisa en rojo el caso peligroso: dos tiendas abiertas cobrando con la misma clave. Con una sola abierta no asusta al pedo, porque esa cuenta es la suya. Pendiente a proposito: statement_descriptor sigue diciendo \"SANITARIOS CONESA\" para las dos. Es lo que el cliente ve en el resumen de la tarjeta y tendria que ser el nombre del que cobra, pero cambiarlo a ojo le cambiaria el resumen a los clientes de la tienda que ya vende. Nada de esto toca el facturador de ARCA ni Punto.",
    ],
  },
  {
    version: "V.0.70.0",
    date: "2026-11-12",
    changes: [
      "Punto: lo que encontro la revision de la 0.69.0, y el boton que se le subia encima al campo de al lado. (1) GRAVE, y estuvo arriba unas horas: apretar Enter despues de tocar el Descuento metia en la venta un articulo que nadie habia pedido. Al mudar el descuento adentro del bloque de campos, cambiarlo termina llamando a pintarCamposVenta(), que rehace el bloque entero con innerHTML y destruye el propio <select> que tenia el foco; el foco se cae al <body>, la guarda escribiendo(e) -que mira e.target- deja de frenar el atajo \"Enter suma\", y el Enter siguiente agarra el renglon marcado del buscador y lo carga, con su precio, en la factura y descontado del deposito. Lo reprodujeron dos revisores por separado con teclado de verdad. Se arregla devolviendole el foco al campo que se toco despues de repintar, y vale para TODOS los campos del bloque: desde que abre desplegado, los demas desplegables tambien estan al alcance de la mano. (2) En los renglones de la venta se cortaban Precio, Subtotal y la cruz de sacar el renglon. El codigo entero de los combos mas el nombre estirado a 460 px ensanchaban la tabla: medido en 1366, pedia 1043 contra 861 de caja. Quedaba scroll horizontal, que nadie ve. El codigo entero se queda -es lo que distingue un combo de otro- y cede el nombre, que tiene el globito con el nombre completo. Ahora se pasa 0 px. (3) El boton \"Corregir\" del numero se le subia encima a \"Condicion de venta\" -103 px afuera de su casilla-. La causa era de una linea: la regla que hace encoger lo que esta al lado de un boton decia \".con-mas select\", y el numero es un <input>, asi que no la agarraba. Ahora la regla vale para los input tambien, y el boton se mudo a la linea de ayuda de abajo, que existe igual: al lado no entraba sin comerse el numero o un renglon entero de la fila. Nada de esto toca el facturador de ARCA ni la tienda.",
    ],
  },
  {
    version: "V.0.69.0",
    date: "2026-11-12",
    changes: [
      "Punto: el comprobante acomodado como se mira, y dos agujeros que habia dejado la revision anterior. (1) El vendedor subio arriba, al lado de la sucursal. Las dos contestan la misma pregunta -quien vende y desde donde- y estaban separadas por media pantalla: el vendedor andaba perdido abajo, entre el numero y el deposito. (2) El descuento se mudo al lado de la condicion de venta. Son las dos cosas que se le conceden al cliente. Dejo de vivir afuera de #camposVta: ahora se rellena en cada repintado desde pintarCamposVenta() y el cambio lo agarra el listener delegado de #camposVta, que es lo unico que sobrevive a un innerHTML. La tira de un renglon tambien muestra el descuento, para cuando los campos estan cerrados. (3) El comprobante abre desplegado. Palabras de Damian: \"siempre desplegado eso, no comprimido como arranca\". (4) El cartel de cliente nuevo ya NO se cierra tocando afuera. \"Ojo que no se cierre con foco sino con una X\": se tipea un CUIT de once numeros, se toca al lado sin querer y se perdia todo lo cargado. Se cierra con la X o con Escape. (5) ARREGLO - \"Guardar como borrador\" dejaba el deposito pisado. Despues de guardar un borrador estando en Traslasierra con el deposito puesto en Buenos Aires, TODAS las ventas siguientes descontaban de Buenos Aires sin que nadie lo pidiera. Lo habia encontrado la revision de la 0.68.0 y quedo sin arreglar: era el tercer camino, aparte de cerrar y de guardar presupuesto. Ahora el deposito se guarda adentro del borrador y vuelve al retomarlo. (6) ARREGLO - dos combos distintos se veian como el MISMO renglon. El codigo de un combo es compuesto (\"3480+3641\") y se mostraba solo el primer pedazo, asi que dos combos daban el mismo numero; con el nombre cortado con puntos suspensivos quedaban identicos letra por letra, mismo precio incluido. Uno lleva bidet de un agujero y el otro de tres. Ahora el codigo se muestra entero y el nombre entra 100 px mas largo antes de cortarse. (7) La barra de arriba. Fuera el \"· Sanitarios Conesa\" escrito: el logo de al lado ya lo dice, era lo mismo dos veces. El logo, mas grande. Y la fecha pasa a ser el dato grande de la barra -mas cuerpo, negrita y con segundos- porque en el mostrador se prometen entregas y se cierran cajas por hora. En pantalla angosta ahora se esconde el dolar y NO la fecha, que es al reves de como estaba. (8) El numero del comprobante viene TRABADO, de solo lectura, con un boton \"Corregir\" al lado. Damian: \"que venga para no modificar pero que tenga la opcion de modificarlo\". Es el dato que llega a ARCA y estaba abierto todo el tiempo en el medio de una fila de campos que se tocan en cada venta: alcanzaba con apoyar el dedo. Mientras esta destrabado avisa en negrita que eso cambia la numeracion de los que siguen, y se vuelve a trabar solo apenas se corrige, al cerrar la venta, al guardar un presupuesto o un borrador y al cambiar de documento. (9) ARREGLO de lo que rompieron (7) y (3), medido en una pantalla de 1366x768: la barra se partia en dos renglones -el boton Salir se caia abajo- y el buscador quedaba 195 px por debajo del borde de la pantalla. Lo segundo tenia una causa vieja y tonta: el alto de la grilla se calculaba bien en el codigo y lo pisaba un min-height:250px escrito en el CSS, que en CSS le gana al max-height. Ahora el alto lo pone un solo lugar, ajustarGrilla(), y el piso depende de si hay algo cargado: con la venta vacia el hueco es chico y el buscador queda a la vista, que es lo que se va a tocar. OJO, queda asi a proposito: en una pantalla de 768 de alto, con el comprobante siempre desplegado, apenas se cargan renglones la pagina scrollea. No entran las dos cosas. Nada de esto toca el facturador de ARCA ni la tienda.",
    ],
  },
  {
    version: "V.0.68.0",
    date: "2026-11-12",
    changes: [
      "Punto: el mostrador, como lo pidio el que lo va a usar. Nueve cosas que Damian marco mirando la pantalla, mas la regla de los depositos que conto despues. (1) La sucursal va arriba de todo, sola y en grande. De ella salen el punto de venta, la numeracion y el deposito: no es un dato mas del comprobante, es el marco de toda la venta. Mientras los campos estan abiertos se esconde la tira de arriba, que decia lo mismo dos veces. (2) Todos los datos del comprobante se pueden tocar. El numero y el vendedor estaban de solo lectura; si la numeracion queda desfasada hay que poder corregirla sin entrar al codigo. (3) El descuento se mudo de la columna del total a los datos del cliente. Es una decision sobre el cliente; el total es la consecuencia. Queda fuera de #resumenVta a proposito: ese bloque se redibuja entero y el select perderia el listener. (4) Boton \"+ Cliente\" al lado del desplegable, que es donde la mano ya esta. El alta sumo localidad, provincia, correo y lista de precios; el domicilio del padron se parte en calle y localidad por la ultima coma. (5) El documento dice \"Presupuesto\" y no \"Presupuesto X cnc\". La letra y la sucursal las sabe el sistema. (6) 01-Efectivo pasa a ser la condicion por defecto en mostrador, en lugar de transferencia. (7) Fuera el semaforo de \"Lo que deja\". Del otro lado del mostrador hay un cliente mirando la pantalla, y lo que deja la venta es un numero de gerencia. (8) Entran 20 renglones a la vista sin scrollear, 24 en pantallas altas. Apretar el padding no alcanzaba: lo que comia el lugar era el nombre del articulo, que se partia en tres lineas. Ahora va en una sola, cortado con puntos, con el nombre entero en el globito. El renglon bajo de 68 px a 33. (9) El numero de pedido es propio y correlativo (P-2842), aparte del numero del comprobante: existe aunque todavia no se haya facturado y es con el que se sigue la entrega. (10) El deposito, como funciona de verdad: Traslasierra puede vender mercaderia de Buenos Aires -se la traen en el proximo viaje y se la entregan alla-, pero al reves no pasa nunca, asi que desde Buenos Aires ni se pregunta. Cuando la venta sale del otro galpon, la tira lo avisa y el stock que se busca es el de alla. (11) El puesto ya no se elige a mano: sale del usuario. Nadie se cambia de mostrador en el medio de una venta. (12) Las solapas de arriba pasaron de <button> a <a href>. Con un boton el navegador no ve ningun link y el menu del boton derecho no ofrece \"abrir en una pestana nueva\"; ahora se puede tener la venta en una ventana y Productos en otra, y la direccion recuerda en que solapa estabas. (13) En Creacion de articulos ya no se muestran \"Margen objetivo\" ni \"Solo los que no llegan\": no tienen nada que ver con cargar un articulo. El objetivo se mudo a Rentabilidad, que es la pantalla que lo usa; el otro se fue. (14) Un cartel de ayuda repetido menos: con la venta vacia se veian dos diciendo casi lo mismo. (15) El buscador vuelve abajo de los renglones, y arriba queda el hueco donde caen los articulos. Lo habia puesto arriba y estaba mal: la pantalla es un ticket, la lista crece de arriba para abajo y la mano escribe abajo. Con la venta vacia el hueco se ve, asi se entiende que los articulos van a aparecer ahi. (16) El alto de la grilla se mide en vez de adivinarse. Con el buscador abajo volvio el problema de siempre al reves: con 18 renglones el buscador se iba de la pantalla. Estaba atado a un \"100vh - 330px\" inventado, que deja de servir en cuanto la tira de arriba se parte en dos renglones o cambia el monitor. Ahora se mide donde empieza la grilla y cuanto mide el buscador, y lo que sobra es el alto. El buscador queda siempre a la vista. (17) La tira del comprobante, mas grande y toda en negrita. Tenia tres datos en gris claro -condicion, vendedor, deposito- como si valieran menos. No valen menos: son justamente los que se miran de reojo antes de emitir. (18) La fecha de la barra, entera, con dia de la semana y mes con nombre: en el mostrador se prometen entregas \"para el jueves\" y ese dato tiene que estar a la vista. (19) El dolar oficial al lado de la fecha, solo el numero. Sale de dolarapi.com (a dolarhoy no se le puede pegar desde el navegador: no manda el permiso de CORS). Se mira cada diez minutos y si no hay internet no se muestra nada. NO toca el dolar del formador de precios, que se pone a mano. ---- lo que encontro la revision adversarial antes de subir: (20) Habia DOS numeradores de pedido arrancando los dos en 2842 -S.nroPed y PED.nro- y los dos mostrandose \"P-NNNN\": dos pedidos distintos con el mismo numero, y el choque se repetia en 2843, 2844. Ahora PED.nro es un getter sobre S.nroPed: un solo numerador para todo el sistema. (21) El numero de comprobante escrito a mano agarraba el ULTIMO grupo de digitos: \"48.215\" -como se escriben los miles aca- daba 215 y la numeracion retrocedia sin un solo aviso, o sea comprobantes repetidos en ARCA. Ahora el punto y la coma son separadores, hay tope de 8 digitos, y si el numero BAJA avisa fuerte y dice a que documento y a que sucursal le toco la numeracion. (22) El deposito pisado no se limpiaba: despues de que Traslasierra vendiera una vez de Buenos Aires, TODAS las ventas siguientes salian de Buenos Aires. Ahora se limpia al cerrar, al guardar presupuesto, al retomar un borrador y al cambiar de sucursal desde la barra de arriba (el selector de la barra no lo hacia; el del formulario si). (23) El cartel de cierre nombraba el deposito de la sucursal y no del que salio la mercaderia, y la venta no guardaba de donde habia salido. Ahora se anota dep y traida. (24) Cambiar el usuario desde la barra de arriba no movia el puesto: la caja del dia se le imputaba al mostrador del anterior. (25) Al pasar las solapas a <a> quedo un lugar buscando todavia un <button>: \"Pasarlo al mostrador\" tiraba TypeError, cargaba los renglones y no cambiaba de pantalla. Tambien faltaba escuchar hashchange -pegar un link con #renta con Punto ya abierto no hacia nada- y las solapas se habian quedado sin la barra espaciadora. (26) Los articulos que entran por una lista de proveedor se cargaban siempre con cero en Buenos Aires y todo en Traslasierra. Ahora entran en el deposito de la sucursal desde la que se carga. (27) La venta abre en blanco. Arrancaba con tres articulos puestos y \"termotanque\" escrito en el buscador, de cuando era una demo para mostrar. Damian: \"sino marea\". Y abrir con renglones puestos no solo marea: el dia que alguien no mire bien le suma lo del cliente nuevo arriba de la venta de otro.",
    ],
  },
  {
    version: "V.0.67.0",
    date: "2026-11-12",
    changes: [
      "Punto: la pantalla de venta parece una venta, y la lectura por IA ya no se cuelga para siempre. (1) El panel de venta se rehizo. Damian lo dijo asi: \"necesito que sea mas como un panel de venta de articulo, como la pantalla de un pedido que se esta vendiendo\". El comprobante paso a ser una tira de datos con rotulo -sucursal, cliente, documento, condicion, vendedor, deposito- en vez de un renglon de texto corrido; el buscador subio por encima de los renglones, que es por donde entra todo; y la grilla gano el numero de renglon y el stock de cada articulo, con el mismo color que en el buscador, asi un renglon en rojo se ve antes de emitir y no despues. Con la venta vacia se ven igual los encabezados de la grilla: la pantalla parece una venta recien empezada y no una hoja en blanco. (2) La lectura por IA no tenia tope de tiempo en NINGUN lado. Si Google se colgaba, la pantalla quedaba en \"la IA esta leyendo\" para siempre: sin error, sin boton de reintentar y sin forma de saber si valia la pena esperar. El `maxDuration` del route no servia de nada, porque eso lo respeta Vercel y esto corre con `next start` en la VM de Google. Ahora el servidor corta a los 40 s por intento y 75 s contando los reintentos, la pagina a los 95 s, y los dos explican que paso y ofrecen cargar la lista desde el Excel. (3) El mensaje de \"clave no valida\" decia que la de Google empieza con AIza. Ya no: las de AI Studio ahora empiezan con AQ. y son mas largas. Decia algo falso justo cuando hay que arreglar algo. (4) Lo que se escribia en el buscador volvia al HTML sin escapar: un \"<\" rompia el cartel de \"nada con ...\".",
    ],
  },
  {
    version: "V.0.66.0",
    date: "2026-11-07",
    changes: [
      "Punto: la tabla del adjunto se puede corregir a mano, y nunca se carga el total del renglon como precio de uno. Tres cosas: (1) cada celda de la vista previa es editable, asi un renglon mal leido se arregla escribiendo encima en vez de tener que empezar de nuevo; (2) si la columna que parecia el precio es en realidad cantidad x precio, se toma la del unitario y se avisa -antes, un renglon de 2 unidades entraba al doble y no se veia-; (3) un PDF escaneado ahora lo lee la IA. Eso ultimo estaba anunciado en V.0.65.0 pero no andaba: filasPdf tiraba error antes de llegar a ofrecerlo.",
    ],
  },
  {
    version: "V.0.65.0",
    date: "2026-11-07",
    changes: [
      "Punto: la foto del presupuesto se lee de verdad. Antes, al adjuntar una foto salian seis renglones de ejemplo escritos a mano en el codigo (inodoros FERRUM) que no tenian nada que ver con el archivo; eso se fue. Ahora la pagina encoge la foto, la manda al servidor y la lee la IA de Google, que devuelve los renglones de verdad. Si no lee nada lo dice, y no inventa. Un PDF escaneado -sin texto adentro- tambien ofrece la IA. Hace falta GEMINI_API_KEY en el servidor; sin eso el aviso lo dice.",
    ],
  },
  {
    version: "V.0.64.0",
    date: "2026-11-07",
    changes: [
      "Punto: lo ultimo del modo demo. El pie tenia tres parrafos explicando que esto era una demo; quedan dos lineas, las que no son presentacion. Ya no queda la palabra demo en pantalla.",
    ],
  },
  {
    version: "V.0.63.0",
    date: "2026-11-07",
    changes: [
      "Punto: afuera el modo demo (la banda amarilla y los carteles de numeros simulados). 'Productos y costos' pasa a llamarse 'Creacion de articulos'. Menos texto: once parrafos de ayuda afuera o en una linea. Las tres tarjetas rojas de esa pantalla pasan a comunes, con barrita de color en el titulo.",
    ],
  },
  {
    version: "V.0.62.0",
    date: "2026-11-07",
    changes: [
      "Punto: carga por adjunto, cuando no sale ningun articulo el boton decia solo 'Cargar los articulos' y quedaba apagado. Ahora dice que falta y sale un cartel con dos preguntas (cual columna es la descripcion, cual el precio).",
    ],
  },
  {
    version: "V.0.61.0",
    date: "2026-11-07",
    changes: [
      "Punto: el PDF adjuntado se lee de verdad (texto adentro del archivo, sin servidor). Si es una hoja escaneada lo dice, y si no encuentra columna de precios tambien. Columna de precios detectada por contenido cuando el encabezado no la nombra.",
    ],
  },
  {
    version: "V.0.60.0",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — CREACION POR ADJUNTO, EN PRODUCTOS. Se adjunta la lista del proveedor, una factura o un remito y salen todos los articulos juntos, en vez de cargarlos de a uno.",
      "EL EXCEL (.xlsx) Y EL CSV SE LEEN DE VERDAD, en la misma pagina y sin servidor: un .xlsx es un zip y el navegador sabe descomprimirlo solo. Reconoce las columnas por el encabezado (codigo, descripcion, precio, marca, rubro, cantidad) y se pueden corregir a mano; lee los precios en cualquier formato (118.450,50 o 118450.50) y el separador que venga (; , o tabulacion).",
      "ANTES DE CARGAR SE VE TODO: la tabla con lo que salio, cuantos articulos entran, y una tilde por renglon para sacar los que no van. Lo que el archivo no trae (marca, rubro, los seis descuentos, pago contado, IVA, Lista 1 y 2, moneda) se pone una sola vez y vale para todos.",
      "LA FOTO Y EL PDF DE UNA FACTURA muestran el circuito completo con renglones de ejemplo, y la pantalla lo dice: leer una factura de una foto lo hace la IA del panel, no esta pagina.",
      "No carga dos veces el mismo: si el codigo del proveedor ya esta en ese proveedor, lo saltea y lo avisa.",
    ],
  },
  {
    version: "V.0.59.11",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — AFUERA EL BOTON \"SE SUMAN\". Los descuentos del proveedor se aplican uno sobre otro y punto: tener el boton al lado invitaba a elegir mal y hacia dudar de un numero que no se discute. Se fue tambien la comparacion de las dos cuentas; queda la unica que vale, con el descuento equivalente y el costo.",
    ],
  },
  {
    version: "V.0.59.10",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — LOS SEIS DESCUENTOS DEL PROVEEDOR SE APLICAN UNO SOBRE OTRO, no sumados: es como los hace el proveedor. 50 y 15 no es 65, es 57,5. Arranca asi en la ficha y en el formador de precios; el boton \"Se suman\" sigue estando para el que los cobra sumados.",
    ],
  },
  {
    version: "V.0.59.9",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — EL DESCUENTO POR PAGO CONTADO AHORA BAJA EL COSTO. Era un renglon al costado que no entraba en el total: si el proveedor te hace un 5% mas por pagarle al contado, ese 5% es plata que no pagas.",
      "Y NO SE SUMA A LOS SEIS: SE APLICA SOBRE LO QUE QUEDA despues de ellos. Con 50-15-10-10 y 5% de contado, el 5% sale de lo que sobrevivio a los otros cuatro, no del total.",
      "APARECE EL RENGLON \"COSTO SIN IVA\": el numero con el que se discute con el proveedor. Antes la cuenta saltaba de los descuentos al costo con IVA y ese numero no se veia.",
    ],
  },
  {
    version: "V.0.59.8",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — EL PUNTO DE UN COSTO SE TOMA COMO COMA. Escribir 60000.50 daba 6.000.050: cien veces el costo, y no se notaba hasta vender. Ahora 60000.50, 60000,50 y 60.000,50 son el mismo numero. Sigue siendo punto de miles el de toda la vida (60.000 son sesenta mil, 1.250.000 tambien).",
      "EL CASILLERO DEL COSTO DE LA GRILLA ERA DE NUMEROS Y NO DEJABA ESCRIBIR COMA. Ahora es de texto, se lee igual que la lista del proveedor y muestra los centavos.",
    ],
  },
  {
    version: "V.0.59.7",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — LOS AVISOS DE LA FICHA YA NO SE MONTAN SOBRE EL CAMPO DE ARRIBA. Dos de ellos subian 6px y se pisaban con la moneda de la lista y con la Lista 1.",
      "LAS DOS LISTAS ARRANCAN EN CERO, no en 25%. El markup lo pone el que carga: un 25% puesto solo es un precio inventado.",
      "SIN LISTA 1 NO SE GUARDA EL ARTICULO. El campo queda marcado en rojo, el aviso explica que es, y al querer guardar manda el foco ahi. Sin ese porcentaje el articulo quedaria a precio de costo y el que vende no se enteraria.",
    ],
  },
  {
    version: "V.0.59.6",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — ARREGLADA LA FLECHA DE LA COLUMNA ORDENADA. Un escape mal escrito dejaba un caracter de control y en vez de la flecha se leia \"93\" al lado del titulo (MARGEN 93). Ahora dice MARGEN con la flecha arriba o abajo, segun el orden.",
      "LOS TEXTOS DE AYUDA DE LA FICHA, TODOS DEL MISMO TAMANIO. El tamanio chico estaba atado al contenedor, asi que los avisos sueltos (el de la lista del proveedor y el de las dos listas) salian con la letra del cuerpo y se veian enormes.",
      "EL BLOQUE DEL PRECIO POR MAYOR AHORA SE ESCONDE DE VERDAD cuando la casilla esta destildada: la grilla le ganaba al hidden.",
    ],
  },
  {
    version: "V.0.59.5",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — UN ARTÍCULO NUEVO ARRANCA CON LOS SEIS DESCUENTOS EN CERO. Antes venía con los de un proveedor cualquiera y había que borrarlos a mano.",
      "EL SIGNO DE LA MONEDA, ADENTRO DEL CAMPO: la lista del proveedor se ve con $ (o U$S) adelante, para que no quede duda de qué número es.",
      "LISTAS EN DÓLARES: se elige la moneda de la lista. Pesos siempre por defecto; si el proveedor lista en dólares se pone a cuánto se toma y el costo se pasa a pesos solo. La cotización queda guardada y la cuenta muestra el renglón de la conversión.",
      "PRECIO POR MAYOR: se tilda \"Se ofrece por mayor\" y se habilita un markup aparte sobre el costo y desde cuántas unidades rige. Convive con la Lista 2 y avisa si queda más caro que ella.",
    ],
  },
  {
    version: "V.0.59.4",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — LA PANTALLA DE VENTA, MÁS SIMPLE: los seis campos del comprobante ahora son un renglón (sucursal · cliente · comprobante y número · condición) y se abren con Cambiar. De los seis botones quedan tres a la vista; el resto, atrás de Otras opciones.",
      "PRECIOS CON COMA Y CENTAVOS: la lista del proveedor se escribe 60.000,50 y los centavos dejan de perderse. El costeo entero trabaja al centavo.",
      "LA CUENTA, EN TRES COLUMNAS: cada renglón dice qué es, cuánto suma ese porcentaje en pesos y en cuánto queda. El \"Te cuesta\" aclara que es el costo más el IVA.",
      "ARMADOR DE TÍTULO: se cargan qué es, modelo, medida y detalle, y el título se escribe solo con el orden del catálogo (INODORO PRINGLES ONIX · LARGO). Los tipos salen de los artículos que ya existen.",
      "CÓDIGO DEL PROVEEDOR: el artículo guarda también el código con el que lo factura el proveedor, se ve debajo del código interno y se puede buscar por él.",
      "TILDE DE PROMOCIÓN DEL PROVEEDOR: se marca en la ficha y aparece como etiqueta en el listado y en el mostrador.",
      "LA TABLA DE PRODUCTOS SE ORDENA TOCANDO EL TÍTULO DE LA COLUMNA, y los seis descuentos quedaron alineados parejos.",
    ],
  },
  {
    version: "V.0.59.3",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — LA VERSIÓN QUE SE VE ES LA DE VERDAD: el cartelito de arriba a la izquierda mostraba \"v1.0\" fijo. Ahora sale de la misma versión que muestra el panel, puesta automáticamente al publicar.",
      "LOS SEIS DESCUENTOS, NUMERADOS Y SUMÁNDOSE: se llaman Descuento 1 a 6, sin nombres inventados, y por defecto se suman (33% + 9% + 5% = 47%). Con un botón se pasa a uno sobre otro, y ahí dice cuánto darían sumados.",
      "EL DESCUENTO POR PAGO CONTADO, APARTE: no es uno de los seis del artículo sino una condición de pago. Tiene su propio campo y la ficha muestra cuánto costaría el artículo si se le paga al contado.",
    ],
  },
  {
    version: "V.0.59.2",
    date: "2026-11-05",
    changes: [
      "DEMO \"PUNTO\" — LO QUE SE CARGA, QUEDA: los artículos nuevos y los cambios de costo, IVA o listas sobreviven a recargar la página. Se guardan en el navegador de esa computadora, no viajan a ningún lado. Se guarda sólo lo tocado, así una versión nueva de la demo no se lleva puesto lo cargado, y hay un botón para volver al catálogo original.",
      "LA FICHA DEL ARTÍCULO YA NO MUESTRA EL DESCUENTO POR FORMA DE PAGO: el artículo tiene costo, Lista 1 y Lista 2. Lo que termina pagando el cliente depende de cómo pague, y eso se decide en la pantalla de venta.",
    ],
  },
  {
    version: "V.0.59.1",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — LA LISTA 1 Y LA LISTA 2, AL PESO: antes redondeaban para arriba a los $100 y daban un número distinto al del sistema (72.600 + 25% mostraba 90.800 en vez de 90.750). Ahora dan la cuenta exacta.",
      "EL COSTO, SIEMPRE ACLARADO: donde aparece un costo dice si es con IVA o sin IVA y de cuánto es el IVA. En la tabla de productos, debajo de la alícuota van los pesos de IVA y el costo final con IVA.",
    ],
  },
  {
    version: "V.0.59.0",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — LISTA 1 Y LISTA 2, COMO LAS ARMA EL SISTEMA DE HOY: la Lista 1 es el costo más 25% y la Lista 2 es la Lista 1 más 25%. Los dos porcentajes se editan. La Lista 2 es el precio de 1 pago y el de contado es esa misma menos 12%.",
      "EL COSTO SE MUESTRA SIN IVA, CON LA ALÍCUOTA AL LADO: cada artículo puede ir al 21% o al 10,5%, se cambia desde la misma tabla y el costo con IVA, el margen y el IVA del ticket se recalculan solos. Si en una venta hay artículos de las dos alícuotas, el total lo dice.",
      "LÁPIZ PARA EDITAR CADA ARTÍCULO: abre la misma ficha del alta con todo cargado (título, descripción, código, stock por depósito, lista, descuentos, IVA y las dos listas) y guarda encima. Si nunca se le pusieron las dos listas, deduce la Lista 2 del precio que tiene hoy.",
      "BUSCADOR EN PRODUCTOS: se escribe código, nombre o marca y la tabla se filtra mientras se escribe, sin tener que usar los desplegables.",
    ],
  },
  {
    version: "V.0.58.9",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — FORMADOR DE PRECIOS CON 6 DESCUENTOS: cada artículo puede tener hasta seis descuentos sobre la lista del proveedor (el de siempre, volumen, contado, temporada, negociado y uno extra). Se ve la cuenta entera: lista sin IVA → descuentos → IVA 21% → costo → markup → contado → 1 pago.",
      "EN CASCADA O SUMADOS, AL LADO: 38+8+4+2 no da lo mismo de las dos maneras (46,3% contra 52,0%). Se muestran los dos costos juntos y cuánta plata es la diferencia por unidad, para mirar la factura del proveedor y elegir la que usa.",
      "CAMBIAR PRECIOS POR PROVEEDOR, POR LISTA DE CÓDIGOS O POR UN ARTÍCULO SOLO, y cambiar la lista, los descuentos o el markup. Primero se mira la tabla con lo que pasaría y recién después se aplica: aceptando sólo los costos, o también los precios sugeridos.",
      "MARKUP POR PORCENTAJE: lo que se le pone encima al costo para llegar al precio de contado, editable, con el precio que quedaría mientras se escribe.",
      "ALTA DE ARTÍCULO EN UN SOLO LUGAR: título, descripción, marca, rubro, stock, lista, los seis descuentos y el markup. Sugiere el código libre que sigue y avisa si el que se escribe ya es de otro artículo.",
      "SE MANEJA CON EL TECLADO: flechas para moverse por el listado, Enter para sumar a la venta, / para ir a buscar, Esc para salir y Alt+F/P/B/N para facturar, presupuestar, guardar borrador o cargar un cliente. La franja de abajo muestra los cuatro de siempre y el resto con ?.",
      "MENOS TEXTO REPETIDO: las ayudas que decían dos o tres veces lo mismo quedaron una sola vez, la tabla de precios perdió las dos columnas que repetían lo elegido arriba y los carteles largos de la pantalla de venta se acortaron.",
    ],
  },
  {
    version: "V.0.58.8",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — BOTONES QUE DICEN LO QUE HACEN: \"Emitir Factura B · 0003-00048214\", \"Emitir presupuesto · 0003-00003301\" y \"Guardar como borrador\". El borrador no gasta número ni mueve stock: queda en una fila abajo y se retoma de un toque.",
      "CLIENTE NUEVO SIN SALIR DE LA VENTA: se pone el CUIT y vienen solos la razón social, la condición de IVA y el domicilio. Controla el dígito verificador y avisa si el CUIT no cierra. (Acá sale de un padrón de prueba; en el sistema real se lo pregunta a ARCA.)",
      "LA BÚSQUEDA DEJÓ DE TRAER CUALQUIER COSA: antes \"depósito\" devolvía todas las bachas porque compartían rubro. Ahora busca por lo que dice el artículo — código, nombre, marca, rubro — y sólo si no encuentra nada se abre al rubro, avisando que lo hizo.",
      "Tocar el renglón en cualquier lado lo suma, no hace falta apuntarle al botón.",
      "LA VENTA QUEDA A NOMBRE DEL USUARIO que la hizo. En Caja hay columna de vendedor, barras por vendedor y un filtro para ver sólo las de uno.",
      "La sucursal también se elige desde el panel de venta, y en pantalla angosta la barra ya no esconde el usuario ni la razón social.",
      "Letra más grande y más gruesa en los dos listados que el vendedor mira todo el día.",
    ],
  },
  {
    version: "V.0.58.7",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — TRES RAZONES SOCIALES: CONESA SRL, SANITARIOS CNC y TRASLASIERRA. Cada una con su punto de venta, su propia numeración y su caja. Se elige arriba, al lado del usuario.",
      "DOS DEPÓSITOS DE VERDAD: Buenos Aires y Traslasierra. CONESA SRL y SANITARIOS CNC descuentan del de Buenos Aires; TRASLASIERRA del suyo. En el buscador se ve lo que hay acá y lo que queda en el otro.",
      "El stock va con semáforo: verde si hay más de 10, amarillo si quedan 10 o menos, rojo si no hay. Igual se puede tocar cualquiera para ver el precio.",
      "EL PRESUPUESTO ES EL DOCUMENTO POR DEFECTO: mientras el cliente mira, no se emite nada. El botón dice lo que va a pasar al tocarlo, con el número incluido.",
      "CAJA POR SUCURSAL: solapas arriba para ver la de cada razón social o las tres juntas, con la parte facturada y la no facturada abierta por sucursal.",
      "PANEL NUEVO — RENTABILIDAD: qué deja cada venta, abierto por rubro, marca, artículo, sucursal, vendedor y hora, con lo que se lleva la tarjeta a la vista.",
      "PANEL NUEVO — CONTABLE: libro IVA ventas, notas de crédito, y cuatro archivos CSV para mandarle al contador. Lo no facturado se ve pero queda afuera del archivo, y la pantalla dice por qué.",
      "MANDÁRSELO POR WHATSAPP: arma el texto con el link al presupuesto o a la factura y lo copia, listo para pegar en WhatsApp Web.",
      "El asistente ahora escucha: se le puede preguntar hablando.",
      "Toda la pantalla de punta a punta, recuadro rojo en lo que se está armando, el renglón recién agregado parpadea, y la letra chica gris más oscura y más gruesa para que se lea.",
    ],
  },
  {
    version: "V.0.58.6",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — ENCABEZADO IGUAL AL DEL PANEL: logo, el nombre en rojo con el chip de versión, el reloj, el puesto y Salir; abajo las solapas con ícono y el subrayado rojo, y la franja de contexto como la verde de \"Estás editando\".",
      "Abre en la venta, no en el menú.",
      "MOSTRADOR REHECHO como la pantalla de pedido de GBP: comprobante, número y condición de venta ya puestos. Por defecto Consumidor Final y Contado; si se elige un cliente responsable inscripto, el comprobante pasa solo a Factura A y el número cambia a la serie A.",
      "El número sale solo (0003-00048214) y avanza únicamente cuando se emite de verdad.",
      "Descuento de un toque: 5, 10, 12, 20, 25% o el que se escriba. Se ve en el total y en cuánto margen deja.",
      "La venta sin comprobante se registra igual, marcada como tal, y arriba hay una franja con las dos columnas: lo que entró, cuánto con comprobante y cuánto sin. Es un solo registro, no dos libros.",
      "Sacado el ruido: se fueron los atajos de marcas y los ejemplos de búsqueda; queda escribir, que es lo que se pidió. Y se arregló una pestaña negra que asomaba abajo de la pantalla (era un aviso mal escondido).",
    ],
  },
  {
    version: "V.0.58.5",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" — PANTALLA DE PEDIDO COMO LA DE GBP: tiene los mismos campos que \"Pedidos - Generar y Emitir\" (documento a emitir, condición de venta, lista de precios, entregar por, vendedor, depósito, descuento, número y fecha), pero vienen completos y abajo de cada uno dice por qué se eligió eso. En GBP hay que bajarlos a mano en cada pedido.",
      "El buscador de artículos del pedido ahora busca escribiendo, como se habla: marca, rubro, nombre o código, las palabras en cualquier orden y sin tener que escribirlas enteras. Al lado tiene la cantidad, y debajo las marcas y los rubros para tocar en vez de escribir.",
      "Los totales se desglosan como los de GBP: mercadería, descuento, interés, IVA (que va incluido en el precio, no se suma) e importe. Más observaciones y anotación interna.",
      "SOLAPA INICIO: un escritorio con todas las operaciones del ERP agrupadas por lo que se hace con ellas (vender, cobrar, comprar, mercadería, mirar, administración). Dice cuáles andan en la demo y cuáles están en el plan, sin inventar.",
      "La pantalla de pedido también abre con un pedido a medio tomar, para que se vea funcionando.",
    ],
  },
  {
    version: "V.0.58.4",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\": ahora usa el logo de verdad (el mismo archivo que la tienda y las facturas) en vez de uno dibujado a mano, que no estaba bien.",
      "Le saqué el modo oscuro. El panel y la tienda son siempre claros, así que la demo se veía de otro color en las máquinas que tienen el modo oscuro prendido. Ahora es blanca siempre, igual que el panel.",
      "La pantalla de Mostrador abre con una venta ya empezada: se ve el cliente (con su CUIT, lo que debe y cuánto le queda de cuenta corriente) y tres productos cargados. Antes abría vacía y no se entendía qué mirar.",
      "El selector de mostrador salió de al lado del logo, donde no se entendía qué era, y pasó adentro de la ficha de Venta, que es donde significa algo.",
    ],
  },
  {
    version: "V.0.58.3",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\": ahora tiene la imagen de Conesa. Usa el rojo de la marca, el negro y las dos tipografías de la tienda (Montserrat para los títulos y los números, Inter para el texto), y arriba a la izquierda está el logo SANITARIOS CONESA con la A en rojo.",
      "El logo está dibujado con la tipografía y no con una imagen, así se ve nítido en cualquier pantalla y el nombre no desaparece cuando la pantalla está en modo oscuro.",
      "El rojo de los avisos quedó más oscuro que el rojo de la marca, para que un \"pierde plata\" no se confunda con un botón de vender.",
      "No cambia ningún número ni ninguna pantalla de la demo: es solo cómo se ve.",
    ],
  },
  {
    version: "V.0.58.2",
    date: "2026-11-04",
    changes: [
      "DEMO \"PUNTO\" EN /sistema/demo: una página suelta para mostrarle a un cliente cómo sería un sistema de gestión para un corralón con varios mostradores. Pide una clave propia antes de abrirse (la ventanita del navegador), que sale de DEMO_PASSWORD en el servidor. Si esa variable no está puesta, la dirección /sistema/demo contesta \"no encontrado\": nunca queda abierta sola.",
      "No toca nada de la tienda: no lee la base, no escribe, no comparte la sesión del panel y no la levanta Google. Es una sola dirección que devuelve una página y listo.",
      "La demo usa los artículos, los códigos y los dos precios reales del catálogo. Los costos, el stock y las ventas del día son inventados, y la propia página lo aclara.",
    ],
  },
  {
    version: "V.0.57.0",
    date: "2026-11-03",
    changes: [
      "CREAR ARTÍCULOS POR EXCEL (Productos → Crear por Excel): subís el Excel de GBP tal cual sale del sistema y el panel arma una ficha por cada artículo que todavía no tengas, con el título, la marca, el rubro, el precio de 1 pago, el de transferencia y el stock ya puestos. Revisás, corregís lo que quieras y recién ahí se crean.",
      "El título se arma solo a partir de la descripción de GBP: le saca las abreviaturas (PTA → PUERTA, LAVAT → LAVATORIO, AG → AGUJERO), le pone los acentos, le pasa las medidas al final (50X35X45 → · 50 X 35 X 45 CM) y le pone la marca adelante. No le cambia el orden a las palabras.",
      "El rubro sale de la SUBCATEGORÍA del sistema, que es la que de verdad dice qué es el artículo. La categoría de GBP no sirve para esto: trae el nombre del proveedor.",
      "La descripción original de GBP queda guardada en el ayuda memoria, así el buscador del panel sigue encontrando el artículo como se lo nombra en el mostrador (\"PTA LAVAT\", \"JT103-BD\").",
      "AVISA SI EL MARGEN ESTÁ FLOJO: compara el costo del Excel contra el precio de transferencia y marca en rojo los artículos que dejan menos del 10%. No frena nada, avisa antes de que los publiques.",
      "Los artículos nacen OCULTOS: se ven en el panel pero el cliente no, hasta que les cargues la foto y los publiques. Se cambia con un tilde antes de crearlos.",
      "Los códigos que YA están cargados no se tocan: para cambiarles precio o stock sigue estando Productos → Precios y stock.",
    ],
  },
  {
    version: "V.0.56.0",
    date: "2026-10-31",
    changes: [
      "EL DESCUENTO ES SOLO POR TRANSFERENCIA: en toda la tienda los carteles decían \"10% OFF efectivo o transferencia\". Ahora dicen solo transferencia, y lo mismo en el checkout, en los legales y en el texto que ve Google. El efectivo ya no entra en el descuento.",
      "PRECIOS DESDE EL EXCEL DE GBP (Productos → Precios y stock): subís el archivo tal cual sale del sistema y la tienda hace sola el cambio. Elegís si tocás precios, stock o las dos cosas, y antes de aplicar ves en pantalla qué cambia y qué no.",
      "La Lista 2 de GBP ES el precio de 1 pago (débito o crédito en una cuota). El contado sale 10% menos y las cuotas las calcula MercadoPago sobre ese contado.",
      "COMBOS AL DÍA SOLOS: el precio de un combo es la suma de sus piezas, así que cuando subís la lista se recalcula solo. Si falta alguna pieza en el archivo, ese combo no se toca y te avisa.",
      "CÓDIGOS COMO EN GBP: los artículos pasan a ser el número pelado (HEINEKEN-8354 → 8354) y los combos, las piezas sumadas (3440+3443+3442). Los links viejos que andan por WhatsApp e Instagram siguen funcionando.",
      "Las marcas aparecen de la A a la Z en el filtro del panel, en el de la tienda y en los selectores de la ficha.",
    ],
  },
  {
    version: "V.0.24.0",
    date: "2026-10-07",
    changes: [
      "QUITAR FONDO CON IA: al subir fotos del producto hay una opción nueva que recorta el producto y lo deja sobre fondo blanco. Corre en TU computadora, es gratis y sin límite de fotos, y la imagen no se manda a ningún servicio. La primera vez baja el modelo (~109 MB) y después queda guardado en el navegador.",
      "Si la IA llega a fallar, se sube igual la foto original: nunca te bloquea la carga.",
      "El hero y los textos para buscadores ya no dicen una cantidad fija de productos (había quedado desactualizada): ahora hablan de las ofertas vigentes.",
    ],
  },
  {
    version: "V.0.23.0",
    date: "2026-10-07",
    changes: [
      "BACKUP COMPLETO (Productos → Restaurar): baja un archivo con TODOS los productos y todos sus datos, incluidos los que diste de alta a mano, que no están en el catálogo original. Hay dos versiones: solo datos (liviano) o con fotos (pesado, pero es el único que recupera las imágenes que subiste).",
      "RESTAURAR DESDE BACKUP: subís ese archivo y vuelve todo como estaba, fotos incluidas. Por defecto solo crea los que faltan; hay una opción para pisar también los existentes.",
      "DUPLICAR PUBLICACIÓN: botón nuevo en cada fila. Crea una copia con todo (datos y fotos de la galería), te abre la ficha para editarla y la deja PAUSADA para que no salga sola a la tienda. Ideal para publicar algo parecido sin cargar todo de cero.",
    ],
  },
  {
    version: "V.0.22.0",
    date: "2026-10-07",
    changes: [
      "CANDADO 🔒: cada producto tiene un botón de candado. Un producto bloqueado NO se puede modificar ni eliminar — ni a mano, ni con acciones masivas, ni por error. Los campos quedan grises y el botón de borrar deshabilitado. También hay Bloquear / Desbloquear masivo en la barra de acciones.",
      "Las acciones masivas (activar, pausar, destacar, stock, precio y eliminar) ahora SALTEAN los productos bloqueados en vez de tocarlos.",
      "RESTAURAR PRODUCTOS: nuevo botón en Productos. Vuelve a crear los productos del catálogo original (779) que se hayan borrado, con sus PRECIOS REALES originales. Solo crea los que faltan, nunca pisa los que ya están. Se restauran pausados para revisar antes de publicarlos.",
      "BLINDAJE: el seed ya no corre solo nunca más. Antes, si la base se quedaba sin productos, el siguiente deploy re-importaba los 779 del JSON pisando todo. Ahora exige pedido explícito (SEED_PRODUCTS=1).",
      "El botón Editar pasa a ser solo ícono para que la fila no se corra al costado.",
    ],
  },
  {
    version: "V.0.21.1",
    date: "2026-10-07",
    changes: [
      "La confirmación de eliminar ahora es simple: dice '¿Estás seguro?' con botones SÍ, ELIMINAR y NO. Ya no hay que escribir la palabra ELIMINAR a mano.",
    ],
  },
  {
    version: "V.0.21.0",
    date: "2026-10-07",
    changes: [
      "Nuevo botón ELIMINAR: cada producto tiene su tachito al lado de Editar, y además hay un botón 'Eliminar' en la barra de acciones masivas (sirve también con 'Seleccionar los 781').",
      "Siempre pide confirmación en una ventana, porque NO se puede deshacer. Al eliminar un producto se borran también sus fotos y su historial de precios.",
      "PROTECCIÓN: los productos que ya están en algún pedido NO se eliminan (se omiten y te avisa cuántos), para no romper el historial de ventas. A esos conviene pausarlos o dejarlos en stock 0.",
    ],
  },
  {
    version: "V.0.20.1",
    date: "2026-10-07",
    changes: [
      "La plantilla de importación ahora es SIEMPRE Excel (.xlsx). Se eliminó la plantilla CSV vieja: los dos botones de la pantalla de importar descargan el mismo Excel, con las columnas listas para completar, una fila de ejemplo y una hoja 'Instrucciones' explicando campo por campo.",
      "CORREGIDO: la plantilla decía que la columna 'codigo' era opcional y que se generaba sola. Era falso: el importador rechazaba la fila con 'itemId vacío'. Ahora la plantilla aclara que el código es OBLIGATORIO (si ya existe actualiza el producto, si no lo crea).",
      "CORREGIDO: la tabla de 'formato esperado' decía que 'sku' era lo mismo que 'codigo'. Son campos distintos: 'codigo' identifica la publicación y 'sku' es tu código interno. Se agregó también la columna 'memo' que faltaba documentar.",
    ],
  },
  {
    version: "V.0.20.0",
    date: "2026-10-07",
    changes: [
      "Stock y Precio masivos ahora SÍ se aplican a TODOS los productos que coinciden con el filtro (no solo a los 50 de la página visible). Cuando elegís 'Seleccionar los N productos', el popover de Stock/Precio dice 'Aplicar a N' y afecta a todos. Ejemplo: poner stock 0 a las 781 publicaciones de una sola vez.",
      "Los títulos de la tabla (Producto, Categoría, Precio base, Oferta, Stock, Estado, Destacado) ahora son ordenables: clic para ordenar de mayor a menor / A-Z, otro clic para invertir. El orden se aplica sobre TODOS los productos, no solo la página. Una flechita indica por qué columna y en qué sentido se está ordenando.",
      "Los títulos de Precio base, Oferta y Stock ahora quedan alineados exactamente arriba de su cuadrito de edición (antes el título se corría a la derecha porque la celda reserva lugar para los botones de guardar).",
    ],
  },
  {
    version: "V.0.19.0",
    date: "2026-10-07",
    changes: [
      "Nuevo estado 'SIN STOCK': si un producto queda en stock 0, se muestra visible pero marcado 'Sin stock' y sin botón de compra (solo 'Consultar por WhatsApp'). Es la alternativa a pausar: en vez de ocultar, dejás la publicación con el cartel de sin stock. Aplica en catálogo, home y ficha. (Pausar sigue sirviendo para ocultar del todo.)",
    ],
  },
  {
    version: "V.0.18.1",
    date: "2026-10-07",
    changes: [
      "CAUSA RAÍZ encontrada del 'todo vuelve a activo y a $1.000.000': un script de reset de precios corría en CADA deploy y, si encontraba algún producto pausado, reseteaba TODOS los precios a 1.000.000, borraba las ofertas y re-activaba todo. Ahora el reset es realmente de una sola vez y NUNCA más toca precios, ofertas ni el estado activo/pausado. Tus cambios quedan.",
    ],
  },
  {
    version: "V.0.18.0",
    date: "2026-10-07",
    changes: [
      "Fix del precio que 'revertía': había una condición de carrera donde, justo después de guardar, el servidor mandaba el valor viejo y el editor lo revertía. Ahora ignora ese dato rezagado y respeta lo que guardaste.",
      "Buscador del panel insensible a mayúsculas: buscar 'combo' ahora encuentra 'COMBO PRINGLES...'. Antes distinguía mayúsculas y no traía nada.",
      "Tipo de envío: ahora es multi-selección. Un producto puede ofrecer varias formas a la vez (ej. Retiro en tienda + Envío gratis). Se eligen con tildes en la ficha y se muestran todas en la tienda.",
    ],
  },
  {
    version: "V.0.17.1",
    date: "2026-10-07",
    changes: [
      "Nuevo botón 'Eliminar pedido' en el detalle de cada pedido (con confirmación). Sirve para borrar pedidos de prueba. Borra el pedido y sus items.",
    ],
  },
  {
    version: "V.0.17.0",
    date: "2026-10-07",
    changes: [
      "Fix importante: el panel de productos ya NO queda cacheado. Antes mostraba estados viejos de activo/pausado aunque la base ya estaba actualizada (por eso parecía que pausabas y 'no guardaba'). Ahora siempre muestra el estado real.",
      "Precios/oferta/stock inline: ahora también se guardan al salir del campo (además de Enter o el check verde). Ya no se pierde el cambio si te olvidás de confirmar.",
      "Activo/Pausado y Destacado muestran un ✓ cuando se guardó, para que sepas que quedó.",
      "Tipo de envío EDITABLE por producto: 'Retiro o envío', 'Solo retiro', 'Solo envío' o 'Envío gratis'. Se elige en la ficha y se refleja en la tienda.",
      "Fix: el botón Editar ya no se corta en la lista de productos (tabla más compacta).",
      "Base para pagar con MercadoPago (en preparación, se activa al cargar las credenciales).",
    ],
  },
  {
    version: "V.0.16.1",
    date: "2026-10-07",
    changes: [
      "Zoom de fotos mejorado: flechas ◀ ▶ para pasar las fotos, contador (2/7), miniaturas abajo y navegación con el teclado (←/→ y Esc). Tocar la imagen o las flechas ya no cierra el zoom (solo la X o el fondo).",
    ],
  },
  {
    version: "V.0.16.0",
    date: "2026-10-06",
    changes: [
      "Fotos no se cortan más: se muestran completas (object-contain) sobre fondo blanco en ficha, catálogo, home y panel.",
      "Fix: la foto subida ahora SÍ aparece en el catálogo y la home (antes el optimizador de Next fallaba con la ruta de la imagen).",
      "Fotos más nítidas: al subirlas se auto-rotan, redimensionan a máx 1400px y recomprimen a buena calidad (menos pixelado, menos peso).",
      "Zoom: en la ficha del producto se puede hacer clic en la foto para ampliarla a pantalla completa.",
      "Pausar/activar TODOS: el botón 'Seleccionar los N productos' ahora aparece siempre que haya más resultados que la página, aunque no estén todos tildados.",
      "El panel de productos siempre muestra el estado real (sin caché) de activo/pausado.",
      "Importar Excel ya no re-activa productos pausados si el archivo no trae la columna 'activo'.",
    ],
  },
  {
    version: "V.0.15.1",
    date: "2026-10-06",
    changes: [
      "Galería de fotos: ahora se pueden reordenar arrastrando las miniaturas, y las fotos se suben DE A UNA con barra de progreso (X/N). Antes se subían todas juntas y, si pasaban los 12 MB, algunas se guardaban rotas (se veían azules). Las rotas viejas hay que borrarlas y volver a subir.",
    ],
  },
  {
    version: "V.0.15.0",
    date: "2026-10-06",
    changes: [
      "Galería de fotos: cada producto puede tener hasta 10 fotos. En la ficha del admin subís varias de una, elegís la principal (estrella) y borrás las que quieras. En la tienda, el cliente ve la foto grande + miniaturas para cambiar de imagen.",
      "La carga por carpeta y la subida individual ahora AGREGAN fotos a la galería (no reemplazan).",
      "Se quitó el 'precio por transferencia' de toda la tienda (quedó en standby).",
      "Se cambió '3 cuotas sin interés' por 'Efectivo o transferencia' + 'Consultanos por cuotas', hasta definir el esquema de cuotas con Payway.",
    ],
  },
  {
    version: "V.0.14.1",
    date: "2026-10-06",
    changes: [
      "Fix pausar/activar: los toggles Activo/Pausado (y Destacado) ahora se re-sincronizan con la base cuando hay un cambio del servidor (acción masiva o recarga). Antes quedaban mostrando el valor viejo y parecía que 'no guardaba'.",
      "Nuevo: 'Pausar/activar TODOS'. El seleccionar-todo marcaba solo los 50 de la página; ahora, cuando hay más productos que coinciden con el filtro, aparece un cartel para seleccionar los N totales y aplicar la acción a todos de una vez.",
    ],
  },
  {
    version: "V.0.14.0",
    date: "2026-10-06",
    changes: [
      "Plantilla Excel descargable para carga masiva: botón 'Descargar plantilla Excel' en Importar. Trae las columnas (código, sku, título, categoría, precio, oferta, stock, activo, destacado, descripción, memo, imagen_url) + una hoja de instrucciones y una fila de ejemplo.",
      "Carga de fotos por carpeta (sin necesidad de subirlas a una web): nueva pantalla 'Cargar fotos por carpeta'. Elegís la carpeta de tu PC y cada foto se asigna al producto cuyo SKU o código coincida con el nombre del archivo (ej: GRI-001.jpg → SKU GRI-001). Muestra preview con matches/sin match y sube todas con barra de progreso.",
    ],
  },
  {
    version: "V.0.13.0",
    date: "2026-10-06",
    changes: [
      "Fix subida de fotos: la página ya no crashea. Se subió el límite de Server Actions (1MB→12MB) y las fotos ahora se guardan en la base de datos (tabla ProductImage) en vez del filesystem, así persisten en Railway y no se pierden en cada redeploy. Se sirven por /api/productos/[itemId]/imagen.",
      "Las fotos subidas ahora SÍ se ven en toda la tienda (home, catálogo, ficha de producto y relacionados), no solo en el panel.",
      "Nuevo: 'Publicar artículo' — carga manual de un producto desde el panel (título, SKU, categoría, precio, oferta, stock, descripción, ayuda memoria). Después de crearlo te lleva a la ficha para subir la foto. Botón nuevo en el header de Productos.",
    ],
  },
  {
    version: "V.0.12.1",
    date: "2026-10-06",
    changes: [
      "Pago con tarjeta: mejor mensaje de error. Si la tokenización falla por red/CORS (servicio no disponible o dominio no habilitado todavía en Payway) muestra 'el pago no está disponible, probá por WhatsApp' en vez del confuso 'revisá los datos'. Verificado que el código es correcto; falta activar las credenciales reales de Payway atadas a conesa.com.ar.",
    ],
  },
  {
    version: "V.0.12.0",
    date: "2026-10-06",
    changes: [
      "Pago con tarjeta (Payway) end-to-end en el checkout. El cliente elige 'Coordinar por WhatsApp' o 'Pagar con tarjeta'. La tarjeta lleva a una pantalla segura (decidir.js) con número, vencimiento, CVV, documento y cuotas (1/3/6/12).",
      "Páginas de resultado: /tienda/checkout/exito (pago aprobado, muestra tarjeta y cuotas) y /tienda/checkout/error (rechazo, con botón para reintentar o coordinar por WhatsApp).",
      "Panel admin: el detalle de cada pedido muestra el método de pago, estado Payway (Aprobado/Rechazado/Pendiente), marca de tarjeta, últimos 4, ID de Payway y código de autorización.",
      "Los datos de tarjeta nunca pasan por nuestro servidor: se tokenizan en el navegador del cliente directo contra Payway.",
    ],
  },
  {
    version: "V.0.11.0",
    date: "2026-10-05",
    changes: [
      "Payway: backend listo. Nuevos campos en Order (paywayStatus, paywayPaymentId, cardBrand, last4, installments, errorCode). SDK sdk-node-payway instalado. Wrapper en src/lib/payway.ts. Endpoint POST /api/payway/pay recibe el token desde el frontend y procesa el pago. Datos de tarjeta nunca pasan por el server (tokenización en el navegador contra decidir.js). Falta UI de pago en checkout + páginas éxito/error.",
    ],
  },
  {
    version: "V.0.10.8",
    date: "2026-10-05",
    changes: [
      "Botón 'Agregar al carrito' siempre alineado al fondo en todas las cards (catálogo + destacados + ofertas). Aunque algunos títulos sean más largos que otros, los botones quedan a la misma altura. Más prolijo visualmente.",
    ],
  },
  {
    version: "V.0.10.7",
    date: "2026-10-05",
    changes: [
      "Catálogo: los chips de categoría ya no tienen scroll horizontal. Ahora se acomodan en varias líneas (wrap) y quedan centrados. Mucho más limpio.",
    ],
  },
  {
    version: "V.0.10.6",
    date: "2026-10-05",
    changes: [
      "Las tarjetas de 'NUESTRO RUBRO' en la home ahora son links clickeables. Cada rubro (Sanitarios, Grifería, Equipamiento de baño, Salamandras, Materiales de obra, Accesorios) lleva a /tienda filtrado por esa categoría.",
      "El catálogo /tienda ahora respeta ?cat=<slug> en la URL para que el filtro quede activo al abrir el link.",
    ],
  },
  {
    version: "V.0.10.5",
    date: "2026-10-05",
    changes: [
      "Edición masiva de STOCK y PRECIO desde la lista de productos: seleccioná varios → botones Stock / Precio. Stock: reemplazar o sumar/restar (-1, +1, 0 rápidos). Precio: ajustar % (+10, +20, -10 rápidos) o reemplazar valor. Todo queda registrado en el historial de precios.",
      "Editor inline (precio/oferta/stock) rediseñado: ancho estable, no se mueve la fila al editar. Botones ✓/✗ al costado en slot fijo. Se ocultaron las flechas feas del input number.",
      "Botón 'Volver arriba' ahora aparece en toda la tienda (no solo en la home): catálogo, ficha de producto, carrito. Antes solo estaba en /.",
    ],
  },
  {
    version: "V.0.10.4",
    date: "2026-10-05",
    changes: [
      "Los títulos de productos NO se recortan nunca en storefront (catálogo, home, carrito, checkout, relacionados en ficha). Se muestra el nombre completo del artículo siempre.",
    ],
  },
  {
    version: "V.0.10.3",
    date: "2026-10-05",
    changes: [
      "Precio por transferencia (-10% por defecto) visible en ficha, home y catálogo. Centralizado en src/lib/pricing.ts para ajustar el % en un solo lugar.",
      "Fix: chips de categoría en el catálogo usaban nombres largos y se truncaban ('Bañeras y receptáculos', 'Salamandras y calefacción'). Ahora muestran versiones cortas.",
      "Fix: títulos largos de productos ahora se clipean a 2 líneas con tooltip del título completo al pasar el mouse.",
    ],
  },
  {
    version: "V.0.10.2",
    date: "2026-10-05",
    changes: [
      "Fix: botón 'Volver arriba' ya no se superpone con el de WhatsApp. Ahora se posiciona arriba del WhatsApp y sube más cuando hay items en el carrito.",
    ],
  },
  {
    version: "V.0.10.1",
    date: "2026-10-03",
    changes: [
      "Historial de precios manual (precio + oferta + nota) por producto",
      "Botones Guardar/Cancelar explícitos al editar precio inline",
      "Botón 'Ver en tienda' en cada fila de productos",
      "Export / Sync Stock / Importar Excel en el header",
      "SKU y ayuda memoria por producto",
      "Precio en oferta con leve titilar verde (sin movimiento)",
      "SSL Full (Strict) + Always HTTPS + TLS 1.2 en Cloudflare",
      "Reloj y versión en el topbar del panel",
    ],
  },
];
