// Que puede usar cada usuario adentro del sistema Punto.
//
// Damian, 22/11/2026: "me falta el panel de usuarios donde ahi yo seleccione
// que area puede ver cada usuario o a que tiene acceso". Entrar a Punto o no
// lo sigue decidiendo el permiso "Sistema Punto" del panel
// (src/lib/permisos.ts, src/app/sistema/clave.ts). Esto es lo de adentro:
// que solapas ve y que puede hacer.
//
// Se guarda en AdminUser.punto (migracion 54): los ids separados por coma, o
// null = todo. Con null los que ya existian siguen como hasta hoy, y el que
// tiene todo tambien ve lo que se agregue mas adelante (igual que
// AdminUser.permisos en el panel).
//
// La pagina esconde lo que no se puede usar, pero la garantia es el servidor:
// cada direccion de /sistema que importa, elimina o numera lo vuelve a mirar.
//
// Sin ningun import a proposito: lo usan la ruta de la pagina, las de
// /sistema y las pruebas con node solo (sin base y sin Next).

export type DatosPermisoPunto = { id: string; nombre: string; ayuda: string };

/** Las solapas de la pagina. "venta" es la del mostrador. */
export const AREAS_PUNTO: readonly DatosPermisoPunto[] = [
  { id: "venta", nombre: "Venta", ayuda: "El mostrador: armar la venta, presupuestar, facturar y remitir." },
  { id: "comprobantes", nombre: "Comprobantes", ayuda: "Lo emitido por todos: ver, imprimir, el PDF y editar presupuestos." },
  { id: "pedidos", nombre: "Pedidos", ayuda: "Los pedidos que toman los vendedores y lo que falta." },
  { id: "web", nombre: "Pedidos web", ayuda: "Lo que entra por la tienda, al mismo stock que el mostrador." },
  { id: "productos", nombre: "Productos", ayuda: "La creación de artículos." },
  { id: "listas", nombre: "Listas", ayuda: "Las listas de precios de los proveedores (PDF, Excel, fotos)." },
  { id: "proveedores", nombre: "Proveedores", ayuda: "Los proveedores de GBP y sus datos." },
  { id: "simulador", nombre: "Simulador", ayuda: "El simulador de costo: del costo con descuentos al precio de venta." },
  { id: "caja", nombre: "Caja", ayuda: "La caja del día de cada razón social." },
  { id: "renta", nombre: "Rentabilidad", ayuda: "Qué deja de verdad lo que se vendió." },
  { id: "contable", nombre: "Contable", ayuda: "El libro IVA ventas y los archivos para el contador." },
  { id: "gerencia", nombre: "Gerencia", ayuda: "Todos los vendedores y la web en una pantalla." },
  { id: "asistente", nombre: "Asistente", ayuda: "Preguntarle al sistema en castellano en vez de sacar un reporte." },
];

/** Lo que se puede hacer adentro de las solapas y conviene que no haga
 *  cualquiera. */
export const ACCIONES_PUNTO: readonly DatosPermisoPunto[] = [
  { id: "importar", nombre: "Importar de GBP", ayuda: "Cargar los artículos y los proveedores desde los Excel de GBP." },
  { id: "eliminar", nombre: "Eliminar comprobantes", ayuda: "Eliminar o recuperar lo emitido." },
  { id: "numeros", nombre: "Corregir la numeración", ayuda: "Cambiar a mano el número del comprobante (para seguir el de GBP)." },
  // V.0.99.82. Damian, 22/11/2026: "los vendedores no puedan cobrar, sino
  // que el cajero es el encargado de cobrar y emitir una factura o un
  // comprobante". El que no lo tiene presupuesta y manda la venta a caja
  // (src/lib/punto-ventas.ts); /sistema/documentos le rechaza todo lo que no
  // sea presupuesto. El que tiene todo (null en la base) lo tiene, como
  // hasta hoy; al que tiene una lista de permisos hay que tildarselo.
  // A proposito NO se le agrega solo al que ya tenia una lista (por ejemplo
  // "venta"): esos son los vendedores, y los vendedores no cobran. Si se lo
  // agregaramos, al subir esta version todos podrian emitir facturas.
  {
    id: "cobrar",
    nombre: "Cobrar y emitir",
    ayuda: "Cobra en caja y emite facturas, remitos y ventas sin comprobante. Sin esto, arma la venta y la manda a caja.",
  },
  // V.0.99.82. Damian, 22/11/2026: "si va a depósito a buscar caños o
  // mercadería de depósito, que figure quien lo despacha". El que lo tiene
  // marca en el comprobante que la mercaderia salio y queda su nombre
  // (POST /sistema/documentos/despachar). Como "cobrar": el que tiene todo
  // (null en la base) lo tiene; al que tiene una lista hay que tildarselo.
  {
    id: "despachar",
    nombre: "Despachar en el depósito",
    ayuda: "Marca que la mercadería de una venta salió del depósito y quién la entregó.",
  },
];

const TODOS = [...AREAS_PUNTO, ...ACCIONES_PUNTO].map((p) => p.id);
const IDS = new Set<string>(TODOS);

export const esPermisoPunto = (x: string): boolean => IDS.has(x);

/** Lo guardado (texto o null) como lista. null = todo. Lo que no se conoce
 *  (un permiso que se saco) se ignora. */
export function leerPunto(guardado: string | null | undefined): string[] | null {
  if (guardado == null) return null;
  return guardado
    .split(",")
    .map((s) => s.trim())
    .filter(esPermisoPunto);
}

/** La lista a guardar: si tiene todo, null (asi tambien ve lo que se
 *  agregue). Vacia = nada (texto vacio, no null). */
export function guardarPunto(lista: readonly string[]): string | null {
  const validas = new Set(lista.map((x) => String(x).trim()).filter(esPermisoPunto));
  if (TODOS.every((id) => validas.has(id))) return null;
  return TODOS.filter((id) => validas.has(id)).join(",");
}

export function puedePunto(lista: readonly string[] | null, id: string): boolean {
  return lista === null || lista.includes(id);
}

/** La lista de verdad: null (todo) pasa a todos los ids. Es lo que recibe la
 *  pagina, que no tiene que saber que null quiere decir todo. */
export function permisosEfectivos(lista: readonly string[] | null): string[] {
  return lista === null ? [...TODOS] : TODOS.filter((id) => lista.includes(id));
}

// Las sucursales con las que se emite (las mismas de
// src/lib/punto-documentos.ts). El nombre es el de la razon social, como lo
// muestra la pagina.
export const SUCURSALES_PUNTO: readonly { id: string; nombre: string }[] = [
  { id: "srl", nombre: "CONESA SRL" },
  { id: "cnc", nombre: "SANITARIOS CNC" },
  { id: "tsl", nombre: "TRASLASIERRA" },
];

export const esSucursalPunto = (x: unknown): x is string =>
  typeof x === "string" && SUCURSALES_PUNTO.some((s) => s.id === x);

export function nombreSucursalPunto(id: string): string {
  return SUCURSALES_PUNTO.find((s) => s.id === id)?.nombre ?? id;
}
