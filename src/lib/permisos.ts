// Las partes del panel y quien puede ver cada una.
//
// Damian, 19/11/2026: "poneme status de los usuarios, o partes del panel que
// puede ver o no para tildar seria permisos". Y como se agrupan: "lo que es
// atencion del cliente junto los links, y lo que es produccion o mejora del
// panel junto" / "seria DASHBOARD, PEDIDOS, CLIENTES eso junto al principio".
//
// Esta lista arma las pestañas del panel (src/components/admin/AdminShell.tsx)
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
  | "configuracion";

export type DatosSeccion = { id: Seccion; nombre: string; href: string; ayuda: string; pestana: boolean };

export const GRUPOS: readonly { nombre: string; secciones: readonly DatosSeccion[] }[] = [
  {
    nombre: "Atención al cliente",
    secciones: [
      { id: "dashboard", nombre: "Dashboard", href: "/admin", ayuda: "El resumen: ventas y pedidos recientes", pestana: true },
      { id: "pedidos", nombre: "Pedidos", href: "/admin/pedidos", ayuda: "Ver los pedidos, cambiarles el estado y avisar el envío", pestana: true },
      { id: "clientes", nombre: "Clientes", href: "/admin/clientes", ayuda: "Los datos de los que compraron", pestana: true },
    ],
  },
  {
    nombre: "Producción y mejora del panel",
    secciones: [
      { id: "productos", nombre: "Productos", href: "/admin/productos", ayuda: "Cargar, editar, precios, stock y fotos", pestana: true },
      { id: "marcas", nombre: "Marcas", href: "/admin/marcas", ayuda: "Las marcas y sus logos", pestana: true },
      { id: "comparador", nombre: "Comparador", href: "/admin/comparador", ayuda: "Nuestros precios contra otras tiendas", pestana: true },
      { id: "visitas", nombre: "Qué miran", href: "/admin/visitas", ayuda: "Lo que miran y buscan en la tienda", pestana: true },
      { id: "novedades", nombre: "Novedades", href: "/admin/novedades", ayuda: "El chequeo diario de productos y cuotas", pestana: true },
      { id: "mercadopago", nombre: "Mercado Pago", href: "/admin/mercadopago", ayuda: "Lo que cobra en cuotas y los recargos", pestana: true },
      { id: "sucursales", nombre: "Sucursales", href: "/admin/sucursales", ayuda: "Datos de los locales, horarios, CUIT", pestana: true },
      { id: "configuracion", nombre: "Configuración", href: "/admin/configuracion", ayuda: "Ajustes generales de la tienda", pestana: false },
    ],
  },
];

export const SECCIONES: readonly DatosSeccion[] = GRUPOS.flatMap((g) => g.secciones);
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
