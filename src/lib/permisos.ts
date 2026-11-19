// Las partes del panel y quien puede ver cada una.
//
// Damian, 19/11/2026: "poneme status de los usuarios, o partes del panel que
// puede ver o no para tildar seria permisos". Y como se agrupan: "lo que es
// atencion del cliente junto los links, y lo que es produccion o mejora del
// panel junto" / "seria DASHBOARD, PEDIDOS, CLIENTES eso junto al principio".
//
// La lista de abajo arma las pestañas del panel (src/components/admin/AdminShell.tsx)
// y las casillas de cada usuario (src/components/admin/UsuariosAdmin.tsx).
//
// "admin" ve todo siempre. Los demas: AdminUser.permisos, las partes separadas
// por coma, o null = todo (incluidas las partes que se agreguen mas adelante).
// Usuarios (cambiar la propia contraseña) y Version los ven todos.
//
// Lo que alguien no tiene tildado no le aparece en las pestañas, y si escribe
// la direccion, el panel lo manda a una parte que si puede ver.

export type Seccion =
  | "dashboard"
  | "pedidos"
  | "clientes"
  | "productos"
  | "marcas"
  | "comparador"
  | "visitas"
  | "novedades"
  | "mercadopago"
  | "sucursales"
  | "opiniones"
  | "configuracion";

export type DatosSeccion = { id: Seccion; nombre: string; href: string; ayuda: string; pestana: boolean };

/** La ayuda memoria de cada pantalla: el renglon que sale arriba de todo
 *  (Damian, 19/11/2026: "PODES PONERLE UN LABEL EXPLICANDO QUE HACE CADA COSA
 *  DE AYUDA MEMORIA? A TODO EL PANEL"). */
export const EXPLICACION: Readonly<Record<Seccion, string>> = {
  dashboard: "El resumen: ventas, pedidos recientes (con fecha, pago y productos) y productos activos de esta sucursal. Tocá un pedido para ver el detalle.",
  pedidos: "Todos los pedidos de la tienda. Abrí uno para ver qué compró, cómo pagó y adónde va. Cambiale el estado y, cuando sale, avisale al cliente por mail con el número de seguimiento.",
  clientes: "Los que compraron en la tienda, con sus datos de contacto y sus pedidos.",
  productos: "El catálogo de esta sucursal. Precio = el normal (sale tachado si hay oferta). Oferta = el rebajado, menor que el Precio. Los números se guardan con Enter o al salir del campo. La (i) de cada columna explica qué es.",
  marcas: "Las marcas de la tienda: nombre, logo y página web (de ahí se traen fotos y fichas de los productos).",
  comparador: "Nuestros precios contra Easy, Blaisten y MercadoLibre, solo cuando es el mismo producto (mismo código y marca). Tocá los títulos de las columnas para ordenar.",
  visitas: "Qué productos abren y qué buscan los que entran a la tienda, y lo que buscan y no encuentran. Lo que miran ustedes no cuenta.",
  novedades: "Lo que encontró el chequeo de todos los días: productos pausados, sin stock o con poco, los cargados, y si Mercado Pago cobra las cuotas como calcula la tienda.",
  mercadopago: "Lo que cobra Mercado Pago por cada plan de cuotas y el recargo que se le pasa al cliente. Si cambian los costos, desde acá se actualizan los precios en cuotas.",
  sucursales: "Los datos de cada local: dirección, horarios, WhatsApp, CUIT, si tiene la tienda abierta y en qué orden aparece.",
  opiniones: "Las opiniones de Google que se muestran en la portada de la tienda: se traen solas de Google cada 12 horas. Acá se carga la clave de Google, se elige el local de cada sucursal y desde cuántas estrellas se muestran.",
  configuracion: "Ajustes generales de la tienda.",
};

// El orden de las pestañas. Damian, 19/11/2026: "ESO DE ATENCION AL CLIENTE Y
// PRODUCCION NO LO PONGAS SINO PONE LOS 3 PRIMEROS Y LUEGO EL RESTO COMO
// ESTABA ANTES PERO REORDENALO NADA MAS". Sin titulos de grupo.
export const SECCIONES: readonly DatosSeccion[] = [
  { id: "dashboard", nombre: "Dashboard", href: "/admin", ayuda: "El resumen: ventas y pedidos recientes", pestana: true },
  { id: "pedidos", nombre: "Pedidos", href: "/admin/pedidos", ayuda: "Ver los pedidos, cambiarles el estado y avisar el envío", pestana: true },
  { id: "clientes", nombre: "Clientes", href: "/admin/clientes", ayuda: "Los datos de los que compraron", pestana: true },
  { id: "productos", nombre: "Productos", href: "/admin/productos", ayuda: "Cargar, editar, precios, stock y fotos", pestana: true },
  { id: "marcas", nombre: "Marcas", href: "/admin/marcas", ayuda: "Las marcas y sus logos", pestana: true },
  { id: "visitas", nombre: "Qué miran", href: "/admin/visitas", ayuda: "Lo que miran y buscan en la tienda", pestana: true },
  { id: "sucursales", nombre: "Sucursales", href: "/admin/sucursales", ayuda: "Datos de los locales, horarios, CUIT", pestana: true },
  { id: "mercadopago", nombre: "Mercado Pago", href: "/admin/mercadopago", ayuda: "Lo que cobra en cuotas y los recargos", pestana: true },
  { id: "comparador", nombre: "Comparador", href: "/admin/comparador", ayuda: "Nuestros precios contra otras tiendas", pestana: true },
  { id: "novedades", nombre: "Novedades", href: "/admin/novedades", ayuda: "El chequeo diario de productos y cuotas", pestana: true },
  // Sin pestaña (Damian, 19/11/2026: "LAS OPINIONES NO TIENEN QUE ESTAR EN EL
  // PANEL SOLO QUE ESTEN EN LA WEB PRINCIPAL"): la pantalla queda solo para
  // cargar la clave una vez, entrando por la direccion.
  { id: "opiniones", nombre: "Opiniones", href: "/admin/opiniones", ayuda: "Las opiniones de Google en la portada", pestana: false },
  { id: "configuracion", nombre: "Configuración", href: "/admin/configuracion", ayuda: "Ajustes generales de la tienda", pestana: false },
];
const IDS = new Set<string>(SECCIONES.map((s) => s.id));

export const esSeccion = (x: string): x is Seccion => IDS.has(x);

/** Lo guardado (texto o null) como lista. null = todo. */
export function leerPermisos(guardado: string | null | undefined): Seccion[] | null {
  if (guardado == null) return null;
  return guardado
    .split(",")
    .map((s) => s.trim())
    .filter(esSeccion);
}

/** La lista a guardar: si tiene todo, null (asi tambien ve lo que se agregue). */
export function guardarPermisos(lista: readonly string[]): string | null {
  const validas = [...new Set(lista.filter(esSeccion))];
  if (SECCIONES.every((s) => validas.includes(s.id))) return null;
  return SECCIONES.map((s) => s.id)
    .filter((id) => validas.includes(id))
    .join(",");
}

export function puedeVer(permisos: Seccion[] | null, seccion: string): boolean {
  if (!esSeccion(seccion)) return true; // usuarios, version: todos
  return permisos === null || permisos.includes(seccion);
}

/** A donde va alguien que entro a una parte que no puede ver. */
export function primeraPermitida(permisos: Seccion[] | null): string {
  const s = SECCIONES.find((x) => x.pestana && puedeVer(permisos, x.id));
  return s?.href ?? "/admin/usuarios";
}
