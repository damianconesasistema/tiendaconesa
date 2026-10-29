import { cache } from "react";
import { prisma } from "@/lib/db";

// Que sucursal esta mirando el panel.
//
// El panel es uno solo y maneja las dos: el titulo, las fotos, la categoria y
// la marca son del articulo y valen para los dos locales, pero el PRECIO, la
// OFERTA, el STOCK y si se muestra o no son de cada sucursal.
//
// Por eso la sucursal elegida tiene que estar siempre a la vista: tocar el
// precio de un local creyendo que estas en el otro es publicar plata mal.
// Va en la direccion (?sucursal=), en una banda de color con el nombre y en
// el titulo de la pestana del navegador.

/** Colores de la banda. Se reparten por el orden en que estan las sucursales,
 *  asi no hay nombres de sucursal escritos en el codigo. Si se cambia el
 *  orden los colores se mueven con el, y por eso la banda SIEMPRE escribe el
 *  nombre: el color ayuda, el que manda es el nombre. */
const COLORES = [
  { fondo: "#1D4ED8", texto: "#FFFFFF", suave: "#DBEAFE" }, // azul
  { fondo: "#047857", texto: "#FFFFFF", suave: "#D1FAE5" }, // verde
  { fondo: "#B45309", texto: "#FFFFFF", suave: "#FEF3C7" }, // ambar
  { fondo: "#6D28D9", texto: "#FFFFFF", suave: "#EDE9FE" }, // violeta
] as const;

export type SucursalPanel = {
  id: string;
  slug: string;
  nombre: string;
  /** La que atiende el dominio principal: la de menor orden con tienda
   *  abierta. Es la unica cuyos precios hoy ve el cliente. */
  principal: boolean;
  tiendaActiva: boolean;
  productos: number;
  color: (typeof COLORES)[number];
};

/** Las sucursales que se pueden elegir en el panel, en su orden. */
export const sucursalesDelPanel = cache(async (): Promise<SucursalPanel[]> => {
  const filas = await prisma.branch.findMany({
    where: { active: true },
    orderBy: { orden: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tiendaActiva: true,
      _count: { select: { productos: true } },
    },
  });

  const idPrincipal = filas.find((f) => f.tiendaActiva)?.id;

  return filas.map((f, i) => ({
    id: f.id,
    slug: f.slug,
    nombre: f.name,
    principal: f.id === idPrincipal,
    tiendaActiva: f.tiendaActiva,
    productos: f._count.productos,
    color: COLORES[i % COLORES.length],
  }));
});

/** La sucursal que se esta editando. Sale de ?sucursal=; si no viene, o viene
 *  una que no existe, se usa la principal (la que hoy ve el cliente). */
export async function sucursalDelPanel(
  slug?: string,
): Promise<SucursalPanel | null> {
  const todas = await sucursalesDelPanel();
  if (todas.length === 0) return null;
  const elegida = slug ? todas.find((s) => s.slug === slug) : undefined;
  return elegida ?? todas.find((s) => s.principal) ?? todas[0];
}

/** Para el titulo de la pestana: "Productos · Traslasierra". Con dos locales
 *  abiertos en dos pestanas, el titulo es lo unico que las distingue en la
 *  barra del navegador. */
export async function tituloConSucursal(
  pantalla: string,
  slug?: string,
): Promise<string> {
  const s = await sucursalDelPanel(slug);
  return s ? `${pantalla} · ${s.nombre} · Panel` : `${pantalla} · Panel`;
}
