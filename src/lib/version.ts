// Version del panel admin. Subir manualmente en cada tanda de cambios
// significativos. Formato: V.MAYOR.MINOR.PATCH
//
// Changelog resumido (de arriba hacia abajo, mas reciente primero):
export const APP_VERSION = "V.0.16.0";

export type VersionEntry = {
  version: string;
  date: string; // ISO yyyy-mm-dd
  changes: string[];
};

// Historial de versiones visible en el panel (ultimas N entradas)
export const VERSION_HISTORY: VersionEntry[] = [
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
