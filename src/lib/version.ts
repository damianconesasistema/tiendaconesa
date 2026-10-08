// Version del panel admin. Subir manualmente en cada tanda de cambios
// significativos. Formato: V.MAYOR.MINOR.PATCH
//
// Changelog resumido (de arriba hacia abajo, mas reciente primero):
export const APP_VERSION = "V.0.41.0";

export type VersionEntry = {
  version: string;
  date: string; // ISO yyyy-mm-dd
  changes: string[];
};

// Historial de versiones visible en el panel (ultimas N entradas)
export const VERSION_HISTORY: VersionEntry[] = [
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
