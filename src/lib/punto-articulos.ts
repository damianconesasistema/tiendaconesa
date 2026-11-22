import { prisma } from "@/lib/db";

// Los articulos de verdad del sistema Punto: los que se traen del Excel que
// exporta GlobalBluePoint (codigo, descripcion, costo, Lista 1, Lista 2,
// stock). Damian, 21/11/2026: "en el sistema que estamos armando me podes
// agregar todos los productos de PIAZZA, te mando el Excel de GBP con los
// costos, Lista 1 y Lista 2".
//
// NO van en el codigo de Punto (src/app/sistema/punto.ts): el
// repositorio es publico y ahi cualquiera leeria los costos. Se guardan en la
// base, en la tabla Setting, y los entrega /sistema/articulos solo a quien
// entro con usuario y permiso de "Sistema Punto". Asi los ve cualquier puesto.
//
// Un solo renglon con todos (JSON). Alcanza de sobra para el catalogo entero
// de GBP; si algun dia no alcanza, se pasa a una tabla propia.

export const CLAVE_ARTICULOS = "punto.articulos.v1";
export const MAXIMO_ARTICULOS = 30000;

export type ArticuloPunto = {
  /** El codigo de GBP (item_code). */
  cod: string;
  tit: string;
  /** La marca (PIAZZA, HYDROS...). */
  prov: string;
  /** El rubro y el subrubro como estan en GBP (cat_desc, subcat_desc). */
  cat: string;
  subrub: string;
  /** La columna "Costo" de GBP: es la LISTA del proveedor, sin IVA (en
   *  Piazza, el "Precio de lista" del papel). El costo de verdad sale de la
   *  Lista 1. */
  lista: number;
  lista1: number;
  lista2: number;
  iva: number;
  stockBA: number;
  /** "Dep Cordoba" tal cual viene: el stock de Traslasierra. Hay muchos en
   *  150 y parecen raros, pero son reales (Damian, 21/11/2026: "Si, son
   *  reales"). */
  stockTS: number;
  /** El ID interno de GBP. */
  gbpId: number | null;
};

export type Guardados = {
  articulos: ArticuloPunto[];
  fecha: string | null;
  por: string | null;
};

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const plata = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e12 ? Math.round(n * 100) / 100 : NaN;
};
const entero = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(-1e7, Math.min(1e7, Math.round(n))) : 0;
};

/** Solo pasa lo que tiene forma de articulo. Lo demas se descarta. */
export function limpiarArticulo(x: unknown): ArticuloPunto | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const cod = texto(o.cod, 40);
  const tit = texto(o.tit, 200);
  const lista1 = plata(o.lista1);
  const lista2 = plata(o.lista2);
  if (!cod || !tit || !(lista1 > 0) || !(lista2 > 0)) return null;
  const lista = plata(o.lista);
  const iva = Number(o.iva);
  const gbpId = Number(o.gbpId);
  return {
    cod,
    tit,
    prov: texto(o.prov, 40).toUpperCase() || "VARIOS",
    cat: texto(o.cat, 80),
    subrub: texto(o.subrub, 80),
    lista: lista >= 0 ? lista : 0,
    lista1,
    lista2,
    iva: iva === 10.5 || iva === 21 || iva === 27 || iva === 0 ? iva : 21,
    stockBA: entero(o.stockBA),
    stockTS: entero(o.stockTS),
    gbpId: Number.isInteger(gbpId) ? gbpId : null,
  };
}

export async function leerArticulos(): Promise<Guardados> {
  const fila = await prisma.setting.findUnique({ where: { key: CLAVE_ARTICULOS } });
  if (!fila) return { articulos: [], fecha: null, por: null };
  try {
    const d = JSON.parse(fila.value) as Partial<Guardados>;
    return {
      articulos: Array.isArray(d.articulos) ? d.articulos : [],
      fecha: d.fecha ?? fila.updatedAt.toISOString(),
      por: d.por ?? null,
    };
  } catch {
    return { articulos: [], fecha: null, por: null };
  }
}

/** Suma los que llegan a los guardados: el mismo codigo se reemplaza, los
 *  demas quedan como estaban (importar Piazza no borra FV). */
export async function guardarArticulos(
  llegan: ArticuloPunto[],
  por: string,
): Promise<{ nuevos: number; actualizados: number; total: number }> {
  const antes = await leerArticulos();
  const porCodigo = new Map(antes.articulos.map((a) => [a.cod, a]));
  let nuevos = 0;
  let actualizados = 0;
  for (const a of llegan) {
    if (porCodigo.has(a.cod)) actualizados++;
    else nuevos++;
    porCodigo.set(a.cod, a);
  }
  const articulos = [...porCodigo.values()];
  if (articulos.length > MAXIMO_ARTICULOS)
    throw new Error(`Son más de ${MAXIMO_ARTICULOS} artículos: no entran en un solo guardado.`);
  const value = JSON.stringify({ articulos, fecha: new Date().toISOString(), por });
  await prisma.setting.upsert({
    where: { key: CLAVE_ARTICULOS },
    update: { value },
    create: { key: CLAVE_ARTICULOS, value },
  });
  return { nuevos, actualizados, total: articulos.length };
}
