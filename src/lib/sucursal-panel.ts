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
   *  abierta. Es la unica cuyos precios hoy ve el cliente. */
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

  const idPrincipal = filas.find((f) => f.tiendaActiva)?.id;
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
