// Registro de actividad del panel: quien hizo que y cuando. Damian,
// 19/11/2026: "quiero que cada modificacion o lo que se haga en el panel
// quede asentado con el usuario que toco".
//
// Cada accion del panel (src/app/admin/**/actions.ts) pasa por conRegistro:
// si salio bien, se anota con el usuario de la sesion, la fecha y un resumen
// de sobre que se hizo (codigo del producto, pedido, campo, valor...). Lo que
// solo consulta (buscar, previsualizar) no se anota. Las contrasenas y las
// claves NUNCA se anotan: cualquier dato cuyo nombre suene a clave sale
// tachado. Se ve en Panel -> Registro (src/app/admin/actividad).
//
// Anotar nunca puede romper la accion: si falla, la accion sigue igual.

import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";

/** Lo que hizo, en castellano, por nombre de la accion. */
const QUE_HIZO: Record<string, string> = {
  // Productos
  createProduct: "Creó un producto",
  updateProduct: "Guardó la ficha de un producto",
  quickUpdate: "Cambió un dato de un producto en la tabla",
  addHistoricalPrice: "Cargó un precio en el historial",
  deleteHistoryEntry: "Borró un precio del historial",
  bulkUpdate: "Editó productos en lote",
  bulkUpdateAll: "Editó en lote todos los productos del filtro",
  restoreMissingProducts: "Restauró productos que faltaban",
  restoreFromBackup: "Restauró productos desde un respaldo",
  duplicateProduct: "Duplicó un producto",
  setProductLocked: "Puso o sacó el candado de un producto",
  bulkSetLocked: "Puso o sacó el candado en lote",
  bulkSetLockedAll: "Puso o sacó el candado a todos los del filtro",
  deleteProduct: "Borró un producto",
  bulkDelete: "Borró productos en lote",
  bulkDeleteAll: "Borró todos los productos del filtro",
  bulkSetStock: "Cambió el stock en lote",
  bulkSetStockAll: "Cambió el stock de todos los del filtro",
  bulkAdjustPrice: "Ajustó precios en lote",
  bulkAdjustPriceAll: "Ajustó los precios de todos los del filtro",
  uploadProductImage: "Subió una foto a un producto",
  reemplazarImagen: "Reemplazó una foto de un producto",
  deleteProductImageById: "Borró una foto de un producto",
  reorderProductImages: "Cambió el orden de las fotos de un producto",
  setMainProductImage: "Eligió la foto principal de un producto",
  removeProductImage: "Sacó la foto de un producto",
  asignarMarcasAuto: "Asignó marcas automáticamente",
  setProductBrand: "Cambió la marca de un producto",
  agregarMarcaDesdeAlta: "Agregó una marca desde el alta de artículos",
  traerDeFV: "Trajo datos de FV para el alta",
  crearArticulos: "Dio de alta artículos",
  guardarDescripciones: "Guardó descripciones de productos",
  completarFVEnTanda: "Completó fotos y fichas de FV en tanda",
  terminarFV: "Terminó la carga de FV",
  traerDeUnLink: "Trajo foto o descripción desde un link",
  uploadOneImage: "Subió fotos en lote",
  finishImageBulk: "Terminó la subida de fotos en lote",
  importExcel: "Importó un Excel de productos",
  agregarRubroAMano: "Agregó un rubro",
  agregarSubrubroAMano: "Agregó un subrubro",
  // Pedidos y clientes
  updateOrderStatus: "Cambió el estado de un pedido",
  deleteOrder: "Borró un pedido",
  facturarPedido: "Facturó un pedido",
  actualizarDatosPedido: "Editó los datos de un pedido",
  anularFactura: "Anuló una factura (nota de crédito)",
  borrarCliente: "Borró un cliente",
  // Marcas
  crearMarca: "Creó una marca",
  cambiarWebDeMarca: "Cambió la página web de una marca",
  traerLogo: "Trajo el logo de una marca",
  traerLogosQueFaltan: "Trajo los logos que faltaban",
  subirLogo: "Subió el logo de una marca",
  sacarLogo: "Sacó el logo de una marca",
  borrarMarca: "Borró una marca",
  // Configuracion, Mercado Pago, sucursales
  guardarEnvio: "Cambió la configuración de envíos",
  guardarRecargos: "Cambió los recargos de Mercado Pago",
  probarArca: "Probó la conexión con ARCA",
  guardarCostosMp: "Cargó los costos de Mercado Pago",
  marcarCostosRevisados: "Marcó revisados los costos de Mercado Pago",
  guardarSucursal: "Editó los datos de una sucursal",
  cambiarTiendaAbierta: "Abrió o cerró la tienda de una sucursal",
  chequearAhora: "Corrió el chequeo de novedades",
  // Opiniones, MercadoLibre
  guardarClaveGoogle: "Cargó la clave de Google",
  elegirLocalDeGoogle: "Eligió el local de Google de una sucursal",
  guardarOpcionesOpiniones: "Cambió qué opiniones se muestran",
  guardarAplicacionML: "Cargó la aplicación de MercadoLibre",
  desconectarMercadoLibre: "Desconectó MercadoLibre",
  // Usuarios
  crearUsuario: "Creó un usuario",
  cambiarClave: "Cambió una contraseña",
  resetearClave: "Reseteó la contraseña de un usuario",
  cambiarNombre: "Cambió el nombre de un usuario",
  // Comparador de precios
  agregarPrecioDeLink: "Agregó al comparador el precio de otra tienda (con un link)",
  quitarPrecioDeLink: "Quitó del comparador un precio de otra tienda",
  activarUsuario: "Activó o desactivó un usuario",
  borrarUsuario: "Borró un usuario",
  cambiarPermisos: "Cambió los permisos de un usuario",
};

/** Solo consultan: no se anotan. */
const SOLO_CONSULTA = new Set([
  "compararPrecios",
  "previewRestore",
  "listProductImages",
  "previsualizarAlta",
  "leerLinkParaAlta",
  "buscarDescripcionesEnTanda",
  "traerFotoFV",
  "descripcionDeFV",
  "fvIncompletos",
  "marcasSinWebConFaltantes",
  "matchImageFilenames",
  "previewExcel",
  "buscarLocalEnGoogle",
  "linkDelComprobante",
  "redactarDescripcionIA",
]);

/** Reciben una clave o contrasena como dato: se anota que se hizo, sin datos. */
const SIN_DATOS = new Set(["guardarClaveGoogle", "cambiarClave", "guardarAplicacionML"]);

/** Nombres de datos que nunca se anotan. */
const ES_SECRETO = /clave|password|pass|secret|secreto|token|key|api/i;
/** De un formulario, solo estos (los que dicen sobre que se hizo). */
const DEL_FORMULARIO = ["itemId", "sku", "title", "price", "salePrice", "stock", "active", "brand", "category", "nombre", "name", "slug", "status"];

function texto(x: unknown, nivel = 0): string {
  if (x === null || x === undefined) return "";
  if (typeof x === "string") return x.length > 80 ? `${x.slice(0, 77)}…` : x;
  if (typeof x === "number" || typeof x === "boolean") return String(x);
  if (typeof File !== "undefined" && x instanceof File) return "(archivo)";
  if (typeof FormData !== "undefined" && x instanceof FormData) {
    const partes: string[] = [];
    for (const k of DEL_FORMULARIO) {
      const v = x.get(k);
      if (typeof v === "string" && v.trim()) partes.push(`${k}: ${texto(v)}`);
    }
    return partes.join(", ");
  }
  if (nivel > 2) return "…";
  if (Array.isArray(x)) {
    const primeros = x.slice(0, 5).map((y) => texto(y, nivel + 1)).filter(Boolean);
    return x.length > 5 ? `${primeros.join(", ")} y ${x.length - 5} más` : primeros.join(", ");
  }
  if (typeof x === "object") {
    return Object.entries(x as Record<string, unknown>)
      .filter(([k]) => !ES_SECRETO.test(k))
      .map(([k, v]) => {
        const t = texto(v, nivel + 1);
        return t ? `${k}: ${t}` : "";
      })
      .filter(Boolean)
      .slice(0, 8)
      .join(", ");
  }
  return "";
}

/** Si la accion contesto con un error (no se anota: no paso nada). */
function salioMal(r: unknown): boolean {
  if (!r || typeof r !== "object") return false;
  const o = r as { error?: unknown; ok?: unknown };
  return !!o.error || o.ok === false;
}

/** Anota algo hecho por el usuario de la sesion (o el que se pasa). */
export async function registrar(accion: string, detalle?: string | null, usuario?: string): Promise<void> {
  try {
    const quien = usuario ?? (await getAdminSession())?.username;
    if (!quien) return;
    await prisma.actividad.create({
      data: { usuario: quien, accion: accion.slice(0, 200), detalle: detalle ? detalle.slice(0, 1000) : null },
    });
  } catch {
    /* anotar nunca rompe nada */
  }
}

/** Corre la accion y, si salio bien, la anota. Lo usan las acciones del
 *  panel: cada una exportada pasa por aca con su nombre y sus datos. */
export async function conRegistro<T>(nombre: string, datos: unknown[], accion: () => Promise<T>): Promise<T> {
  const r = await accion();
  if (!SOLO_CONSULTA.has(nombre) && !salioMal(r)) {
    // Las que reciben una clave como texto suelto (sin nombre que la delate):
    // de esas no se anota ningun dato.
    const sinSecretos = SIN_DATOS.has(nombre) ? [] : datos;
    await registrar(QUE_HIZO[nombre] ?? nombre, texto(sinSecretos) || null);
  }
  return r;
}
