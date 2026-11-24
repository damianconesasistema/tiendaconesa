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
  { id: "productos", nombre: "Artículos", ayuda: "La lista de artículos con su costo, Lista 1 y Lista 2; crearlos o traerlos de GBP." },
  { id: "listas", nombre: "Listas", ayuda: "Las listas de precios de los proveedores (PDF, Excel, fotos)." },
  { id: "proveedores", nombre: "Proveedores", ayuda: "Los proveedores de GBP y sus datos." },
  { id: "simulador", nombre: "Simulador", ayuda: "El simulador de costo: del costo con descuentos al precio de venta." },
  { id: "caja", nombre: "Caja", ayuda: "La caja del día de cada razón social." },
  { id: "renta", nombre: "Rentabilidad", ayuda: "Qué deja de verdad lo que se vendió. Está adentro de Gerencia." },
  { id: "contable", nombre: "Contable", ayuda: "El libro IVA ventas y los archivos para el contador. Está adentro de Gerencia." },
  // Gerencia, parte 1 (24/11/2026). Damian: "en gerencia necesito que tenga un
  // lugar donde sea los gastos diarios y los gastos mensuales de cada
  // sucursal". El cajero anota lo del efectivo desde Caja con el area "caja";
  // esta es la de gerencia: todas las cuentas, saldos y gastos.
  {
    id: "cuentas",
    nombre: "Cuentas y gastos",
    ayuda: "Las cuentas de cada razón social (efectivo, Mercado Pago, bancos), sus saldos y los gastos. Está adentro de Gerencia.",
  },
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

// Varias sucursales por usuario (V.0.11.233). Damian, 24/11/2026: "aca me
// tendria que dejar elegir sucursales, mas de una". AdminUser.sucursal guarda
// los ids separados por coma ("srl,cnc"), en el orden de SUCURSALES_PUNTO;
// null (o vacio) = cualquiera. Un solo id sigue siendo lo de antes.

/** Lo guardado como lista. null = cualquiera. Lo que no existe se ignora,
 *  pero nunca abre a todas: si no queda ninguna valida, es ninguna. */
export function leerSucursales(guardado: string | null | undefined): string[] | null {
  if (guardado == null || !String(guardado).trim()) return null;
  const ids = new Set(String(guardado).split(",").map((x) => x.trim()));
  return SUCURSALES_PUNTO.map((s) => s.id).filter((id) => ids.has(id));
}

/** Lo que llega de la pantalla (lista, texto o null), para guardar. Las
 *  tres o ninguna = null (cualquiera). "mal" si trae algo que no existe. */
export function guardarSucursales(x: unknown): string | null | "mal" {
  if (x == null || x === "") return null;
  const lista = Array.isArray(x) ? x : typeof x === "string" ? x.split(",") : null;
  if (!lista || !lista.every((v) => typeof v === "string")) return "mal";
  const ids = new Set((lista as string[]).map((v) => v.trim()).filter(Boolean));
  if ([...ids].some((id) => !esSucursalPunto(id))) return "mal";
  const orden = SUCURSALES_PUNTO.map((s) => s.id).filter((id) => ids.has(id));
  return orden.length === 0 || orden.length === SUCURSALES_PUNTO.length ? null : orden.join(",");
}

/** Si esa sucursal no es de las del usuario (null = todas lo son). */
export const fueraDeSucursal = (sucursales: readonly string[] | null, suc: string): boolean =>
  !!sucursales && !sucursales.includes(suc);

/** "CONESA SRL y SANITARIOS CNC", para los avisos. */
export const nombresSucursales = (ids: readonly string[]): string => {
  const n = ids.map(nombreSucursalPunto);
  return n.length > 1 ? n.slice(0, -1).join(", ") + " y " + n[n.length - 1] : n.join("");
};
