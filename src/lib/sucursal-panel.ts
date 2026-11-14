import { cache } from "react";
import { prisma } from "@/lib/db";
import { subdominioActual } from "@/lib/sucursal";

// De que sucursal es este panel.
//
// Lo decide el DOMINIO, igual que en la tienda:
//
//   traslasierra.conesa.com.ar/admin  ->  solo Traslasierra
//   buenosaires.conesa.com.ar/admin   ->  solo Buenos Aires
//   conesa.com.ar/admin               ->  pregunta a cual entrar
//
// Son dos paneles separados, no uno con una perilla. Damian lo pidio asi y el
// motivo es el correcto: "si unis todo es un lio por el tema de facturacion".
// Con la perilla alcanzaba un click al descuido para estar tocando los precios
// del otro local; con el dominio no hay manera.
//
// Lo que SI es compartido es el articulo: el titulo, las fotos, la categoria y
// la marca. El inodoro se carga una vez y despues cada local decide si lo
// lleva, a cuanto y con cuanto stock. Duplicarlo obligaria a subir cada foto
// dos veces y a corregir cada descripcion dos veces.

/** Colores de la banda de arriba. Se reparten por el orden de las sucursales,
 *  asi no hay nombres de sucursal escritos en el codigo. La banda SIEMPRE
 *  escribe el nombre: el color ayuda de un vistazo, el que manda es el nombre. */
const COLORES = [
  { fondo: "#1D4ED8", texto: "#FFFFFF" }, // azul
  { fondo: "#047857", texto: "#FFFFFF" }, // verde
  { fondo: "#B45309", texto: "#FFFFFF" }, // ambar
  { fondo: "#6D28D9", texto: "#FFFFFF" }, // violeta
] as const;

export type SucursalPanel = {
  id: string;
  slug: string;
  subdominio: string | null;
  nombre: string;
  /** La que atiende el dominio principal: la de menor orden con tienda
   *  abierta, y con todas cerradas la de `SLUG_PRINCIPAL`.
   *
   *  De esto cuelgan tres cosas, y las tres son plata: a que sucursal le
   *  escribe los precios el panel de conesa.com.ar, a quien le copia el
   *  espejo lo que se guardo en el articulo, y que pantallas en lote estan
   *  habilitadas en cada panel. Las tres tienen que apuntar al mismo local:
   *  si dos discrepan, guardar un precio en uno se lo cambia al otro. */
  principal: boolean;
  tiendaActiva: boolean;
  productos: number;
  /** A donde queda su panel: https://<subdominio>.<dominio> */
  base: string;
  color: (typeof COLORES)[number];
};

/** El dominio del sitio, sin protocolo. De ahi se arman las direcciones de
 *  cada panel, para que en una prueba local no salgan apuntando a produccion. */
function dominioBase(): string {
  const url = process.env.SITE_URL || "https://conesa.com.ar";
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

/** Con que local se queda el dominio principal cuando NINGUNA tienda esta
 *  abierta.
 *
 *  Es Buenos Aires: Damian decidio que la tienda online pasa a ser de la
 *  S.R.L. y que ese va a ser el unico local que venda. Antes decia
 *  "traslasierra", de cuando ese era el local que tenia el catalogo y la
 *  unica tienda que vendia.
 *
 *  Esta escrito con el nombre puesto, y no como "la primera de la lista", a
 *  proposito. El orden se cambia arrastrando una fila en la pantalla de
 *  Sucursales, y se cambia por como queda el sitio A LA VISTA: el 29/10
 *  Buenos Aires quedo primera para que se viera primero, y eso solo ya le
 *  mando la venta al local equivocado. De la principal cuelgan los precios
 *  de dos contribuyentes distintos, asi que no puede moverse porque alguien
 *  acomodo una lista. Para cambiarla hay que venir aca. */
export const SLUG_PRINCIPAL = "bsas";

/** La regla de quien manda en el dominio principal, en un solo lugar.
 *
 *  La primera CON LA TIENDA ABIERTA; y si no hay ninguna abierta, la de
 *  `SLUG_PRINCIPAL`. Esta aparte porque la usan dos lugares —la lista del
 *  panel y el espejo— y la unica manera de que no discrepen es que no haya
 *  dos copias de la regla. */
function elegirPrincipal(
  filas: { id: string; slug: string; tiendaActiva: boolean }[],
): string | undefined {
  return (
    filas.find((f) => f.tiendaActiva)?.id ??
    filas.find((f) => f.slug === SLUG_PRINCIPAL)?.id
  );
}

/** Solo el id de la principal.
 *
 *  Lo usa el espejo, que corre despues de CADA guardado de productos: traer
 *  la lista entera con el conteo de productos de cada local en cada cambio
 *  seria una consulta de mas, en un servidor que es el mas chico que vende
 *  Google. */
export const idSucursalPrincipal = cache(async (): Promise<string | null> => {
  try {
    const filas = await prisma.branch.findMany({
      where: { active: true },
      orderBy: { orden: "asc" },
      select: { id: true, slug: true, tiendaActiva: true },
    });
    return elegirPrincipal(filas) ?? null;
  } catch {
    return null;
  }
});

/** Todas las sucursales, con la direccion de su panel. Sirve para la pantalla
 *  que pregunta a cual entrar y para el link al otro panel. */
export const sucursalesDelPanel = cache(async (): Promise<SucursalPanel[]> => {
  const filas = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { orden: "asc" },
    select: {
      id: true,
      slug: true,
      subdominio: true,
      name: true,
      tiendaActiva: true,
      _count: { select: { productos: true } },
    },
  });

  // Con todas las tiendas cerradas no habria principal, y de la principal
  // cuelga a que sucursal le escribe el panel cuando se entra por
  // conesa.com.ar/admin: sin ella, guardar un precio ahi no graba nada y no
  // avisa. El respaldo esta en SLUG_PRINCIPAL, arriba.
  const idPrincipal = elegirPrincipal(filas);
  const dominio = dominioBase();

  return filas.map((f, i) => ({
    id: f.id,
    slug: f.slug,
    subdominio: f.subdominio,
    nombre: f.name,
    principal: f.id === idPrincipal,
    tiendaActiva: f.tiendaActiva,
    productos: f._count.productos,
    base: f.subdominio ? `https://${f.subdominio}.${dominio}` : `https://${dominio}`,
    color: COLORES[i % COLORES.length],
  }));
});

/** La sucursal de este panel, sacada del subdominio.
 *
 *  Devuelve null en conesa.com.ar y en www: ahi no hay una sucursal, hay dos,
 *  y el panel pregunta a cual entrar en vez de elegir una por su cuenta.
 *  Elegir una seria lo peligroso: entrarias creyendo que es la otra. */
export const sucursalDelPanel = cache(
  async (): Promise<SucursalPanel | null> => {
    const sub = await subdominioActual();
    if (!sub) return null;
    const todas = await sucursalesDelPanel();
    return todas.find((s) => s.subdominio === sub) ?? null;
  },
);

/** Para el titulo de la pestaña: "Productos · Traslasierra · Panel". Con los
 *  dos paneles abiertos en dos pestañas, el titulo es lo unico que los
 *  distingue en la barra del navegador. */
export async function tituloConSucursal(pantalla: string): Promise<string> {
  const s = await sucursalDelPanel();
  return s ? `${pantalla} · ${s.nombre} · Panel` : `${pantalla} · Panel`;
}
