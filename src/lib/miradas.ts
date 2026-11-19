// Que miran y que buscan los que entran a la tienda.
//
// Damian, 19/11/2026: "me podes tagear cada producto para saber que miran o
// buscan los que entran?". Se cuenta en la base, dia por dia (tablas
// VistaDiaria y BusquedaDiaria, migracion 45), y se ve en Panel -> Que miran.
// Ademas va a Google Analytics y al pixel de Meta (src/lib/ga.ts), pero esos
// reportes son dificiles de leer; esta es la version que se entiende de un
// vistazo.
//
// LO DE ELLOS NO CUENTA. Damian: "en lo que es el panel de productos no
// cuentes ahi porque somos nosotros". Un navegador es "de los nuestros" si
// tiene la sesion del panel abierta o si alguna vez entro al panel (la marca
// `conesa_equipo`, que pone el login y dura mas que la sesion). Asi la compu
// del local sigue sin contar aunque la sesion se venza. Ver `esDeLosNuestros`.

import { cookies } from "next/headers";
import { getAdminSession, MARCA_EQUIPO } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

/** Si el que esta mirando es alguien de Conesa: no se cuenta ni en la base ni
 *  en Analytics. */
export async function esDeLosNuestros(): Promise<boolean> {
  try {
    const jar = await cookies();
    if (jar.get(MARCA_EQUIPO)?.value) return true;
    return !!(await getAdminSession());
  } catch {
    return false;
  }
}

/** El dia de hoy en Argentina, como fecha sola (para las columnas DATE). */
export function hoyEnArgentina(ahora = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
  return new Date(`${ymd}T00:00:00Z`);
}

/** Desde que dia cuentan los ultimos `dias` dias, hoy incluido. */
export function desdeHaceDias(dias: number, ahora = new Date()): Date {
  const hoy = hoyEnArgentina(ahora);
  return new Date(hoy.getTime() - (dias - 1) * 24 * 60 * 60 * 1000);
}

/** "  Inodoro   Ferrum " -> "inodoro ferrum". Nada mas: las tildes se
 *  respetan para que el panel muestre lo que escribio la persona. */
export function terminoLimpio(x: unknown): string {
  return String(x ?? "")
    .toLowerCase()
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Una visita a la ficha de un producto. Devuelve false si el producto no
 *  existe (y entonces no se guarda nada). */
export async function sumarVista(itemId: string): Promise<boolean> {
  const p = await prisma.product
    .update({ where: { itemId }, data: { views: { increment: 1 } }, select: { itemId: true } })
    .catch(() => null);
  if (!p) return false;
  const dia = hoyEnArgentina();
  await prisma.vistaDiaria
    .upsert({
      where: { itemId_dia: { itemId: p.itemId, dia } },
      create: { itemId: p.itemId, dia, cantidad: 1 },
      update: { cantidad: { increment: 1 } },
    })
    .catch(() => {});
  return true;
}

/** Alguien busco `termino` en la tienda y encontro `resultados` productos. */
export async function sumarBusqueda(termino: string, resultados: number) {
  const t = terminoLimpio(termino);
  if (t.length < 2) return;
  const r = Math.max(0, Math.min(100_000, Math.round(Number(resultados) || 0)));
  const dia = hoyEnArgentina();
  await prisma.busquedaDiaria
    .upsert({
      where: { termino_dia: { termino: t, dia } },
      create: { termino: t, dia, cantidad: 1, resultados: r },
      update: { cantidad: { increment: 1 }, resultados: r },
    })
    .catch(() => {});
}

export type ProductoMirado = {
  itemId: string;
  vistas: number;
  title: string;
  sku: string | null;
  brand: string | null;
  category: string;
  imageUrl: string | null;
  stock: number;
  active: boolean;
};

/** Los productos mas mirados desde `desde`, con lo del articulo al lado. */
export async function masMirados(desde: Date, cuantos = 50): Promise<ProductoMirado[]> {
  const filas = await prisma.vistaDiaria.groupBy({
    by: ["itemId"],
    where: { dia: { gte: desde } },
    _sum: { cantidad: true },
    orderBy: { _sum: { cantidad: "desc" } },
    take: cuantos,
  });
  if (filas.length === 0) return [];
  const productos = await prisma.product.findMany({
    where: { itemId: { in: filas.map((f) => f.itemId) } },
    select: { itemId: true, title: true, sku: true, brand: true, category: true, imageUrl: true, stock: true, active: true },
  });
  const por = new Map(productos.map((p) => [p.itemId, p]));
  return filas.flatMap((f) => {
    const p = por.get(f.itemId);
    return p ? [{ ...p, vistas: f._sum.cantidad ?? 0 }] : [];
  });
}

export type Buscado = { termino: string; veces: number; resultados: number };

/** Lo mas buscado desde `desde`. `resultados` es lo que encontro la ultima
 *  vez que alguien lo busco. */
export async function masBuscados(desde: Date, cuantos = 50, soloSinResultados = false): Promise<Buscado[]> {
  const filas = await prisma.busquedaDiaria.findMany({
    where: { dia: { gte: desde } },
    orderBy: { dia: "asc" },
  });
  const por = new Map<string, Buscado>();
  for (const f of filas) {
    const ya = por.get(f.termino);
    if (ya) {
      ya.veces += f.cantidad;
      ya.resultados = f.resultados; // las filas vienen de la mas vieja a la mas nueva
    } else por.set(f.termino, { termino: f.termino, veces: f.cantidad, resultados: f.resultados });
  }
  return [...por.values()]
    .filter((b) => !soloSinResultados || b.resultados === 0)
    .sort((a, b) => b.veces - a.veces || a.termino.localeCompare(b.termino, "es"))
    .slice(0, cuantos);
}

/** Los totales del periodo, para el resumen de arriba. */
export async function totalesDesde(desde: Date) {
  const [vistas, productos, busquedas, sinResultados] = await Promise.all([
    prisma.vistaDiaria.aggregate({ where: { dia: { gte: desde } }, _sum: { cantidad: true } }),
    prisma.vistaDiaria.groupBy({ by: ["itemId"], where: { dia: { gte: desde } } }),
    prisma.busquedaDiaria.aggregate({ where: { dia: { gte: desde } }, _sum: { cantidad: true } }),
    masBuscados(desde, 100_000, true),
  ]);
  return {
    vistas: vistas._sum.cantidad ?? 0,
    productosVistos: productos.length,
    busquedas: busquedas._sum.cantidad ?? 0,
    sinResultados: sinResultados.length,
  };
}
