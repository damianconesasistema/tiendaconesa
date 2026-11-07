// Version del panel admin. Subir manualmente en cada tanda de cambios
// significativos. Formato: V.MAYOR.MINOR.PATCH
//
// Changelog resumido (de arriba hacia abajo, mas reciente primero):
// V.0.65.0 - Punto: la foto del presupuesto se lee de verdad. Antes, al
//            adjuntar una foto salian seis renglones de ejemplo escritos a
//            mano en el codigo (inodoros FERRUM) que no tenian nada que ver
//            con el archivo; eso se fue. Ahora la pagina encoge la foto, la
//            manda al servidor y la lee la IA de Google, que devuelve los
//            renglones de verdad. Si no lee nada lo dice, y no inventa. Un
//            PDF escaneado -sin texto adentro- tambien ofrece la IA. Hace
//            falta GEMINI_API_KEY en el servidor; sin eso el aviso lo dice.
// V.0.64.0 - Punto: lo ultimo del modo demo. El pie tenia tres parrafos
//            explicando que esto era una demo; quedan dos lineas, las que
//            no son presentacion. Ya no queda la palabra demo en pantalla.
// V.0.63.0 - Punto: afuera el modo demo (la banda amarilla y los carteles
//            de numeros simulados). 'Productos y costos' pasa a llamarse
//            'Creacion de articulos'. Menos texto: once parrafos de ayuda
//            afuera o en una linea. Las tres tarjetas rojas de esa
//            pantalla pasan a comunes, con barrita de color en el titulo.
// V.0.62.0 - Punto: carga por adjunto, cuando no sale ningun articulo el
//            boton decia solo 'Cargar los articulos' y quedaba apagado.
//            Ahora dice que falta y sale un cartel con dos preguntas
//            (cual columna es la descripcion, cual el precio).
// V.0.61.0 - Punto: el PDF adjuntado se lee de verdad (texto adentro del
//            archivo, sin servidor). Si es una hoja escaneada lo dice, y si
//            no encuentra columna de precios tambien. Columna de precios
//            detectada por contenido cuando el encabezado no la nombra.
export const APP_VERSION = "V.0.65.0";

export type VersionEntry = {
  version: string;
  date: string; // ISO yyyy-mm-dd
  changes: string[];
};

// Historial de versiones visible en el panel (ultimas N entradas)
export const VERSION_HISTORY: VersionEntry[] = [
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
