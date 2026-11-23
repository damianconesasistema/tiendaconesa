import type { Prisma } from "@prisma/client";
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
//
// V.0.99.82: cada articulo puede tener un flete FIJO en pesos por unidad
// (flete). Damian, 22/11/2026: "un tanque que tiene que ir a buscar le sale
// 50 mil pesos y el costo del producto son 80 mil ... si cambia mañana, pasa
// a salir 100 mil pesos ese tanque, que el costo del envio ... se siga
// manteniendo". Se carga en Punto (PATCH /sistema/articulos) y volver a
// importar el Excel de GBP NUNCA lo pisa. Como el import y el cambio de un
// flete leen y vuelven a escribir el mismo renglon, los dos van en una
// transaccion que lo bloquea (FOR UPDATE): uno espera al otro y ninguno
// pierde lo que guardo el otro.
//
// Tambien V.0.99.82, con la misma regla que el flete (se carga en Punto, el
// import nunca lo pisa):
// - otroCosto / otroNombre: cualquier otro costo por unidad, con IVA, que se
//   suma al precio. Damian: "agregar un campo vacio ... cualquier cosa que
//   quiera agregar como un costo ... para sumar en el precio".
// - bulto: el proveedor lo vende solo en bultos cerrados de N. Daniel: "en
//   Piazza ... ese articulo se vende en combo de 6 unidades ... por mas que
//   yo necesite 2, van a pedir 6". El pedido al proveedor redondea a eso.

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
  /** Flete fijo en pesos por unidad (V.0.99.82). No esta = sin flete. */
  flete?: number;
  /** Otro costo en pesos por unidad, con IVA (V.0.99.82). No esta = nada. */
  otroCosto?: number;
  /** Que es ese otro costo ("embalaje", "seguro"...), hasta 40. */
  otroNombre?: string;
  /** Se compra solo de a N unidades (2 a 10.000). No esta = suelto. */
  bulto?: number;
};

/** Lo que se carga en Punto y el import de GBP no pisa nunca. */
export const CAMPOS_DE_PUNTO = ["flete", "otroCosto", "otroNombre", "bulto"] as const;
type CampoDePunto = (typeof CAMPOS_DE_PUNTO)[number];
/** Lo que se cambia con PATCH: null saca el valor. */
export type CostosArticulo = {
  flete?: number | null;
  otroCosto?: number | null;
  otroNombre?: string | null;
  bulto?: number | null;
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
  const flete = plata(o.flete);
  // Como el flete: solo cuentan para un articulo que todavia no los tiene.
  // Si no tienen forma, se ignoran (no se descarta el articulo por eso).
  const otroCosto = limpiarOtroCosto(o.otroCosto);
  const otroNombre = limpiarOtroNombre(o.otroNombre);
  const bulto = limpiarBulto(o.bulto);
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
    // Solo cuenta para un articulo que todavia no tiene: el que ya tiene lo
    // conserva (guardarArticulos).
    ...(flete > 0 ? { flete } : {}),
    ...(typeof otroCosto === "number" ? { otroCosto } : {}),
    ...(typeof otroNombre === "string" ? { otroNombre } : {}),
    ...(typeof bulto === "number" ? { bulto } : {}),
  };
}

/** Saca del articulo lo que se carga en Punto, para volver a ponerlo como
 *  corresponde. */
function sinLoDePunto(a: ArticuloPunto): Omit<ArticuloPunto, CampoDePunto> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { flete, otroCosto, otroNombre, bulto, ...resto } = a;
  return resto;
}

/** Lo de Punto que tiene que quedar: un valor vacio (0, "", 1 en el bulto)
 *  no se guarda, asi "no esta" quiere decir siempre "no tiene". */
function conLoDePunto(base: Omit<ArticuloPunto, CampoDePunto>, c: CostosArticulo): ArticuloPunto {
  const a: ArticuloPunto = { ...base };
  if (c.flete && c.flete > 0) a.flete = c.flete;
  if (c.otroCosto && c.otroCosto > 0) a.otroCosto = c.otroCosto;
  if (c.otroNombre) a.otroNombre = c.otroNombre;
  if (c.bulto && c.bulto > 1) a.bulto = c.bulto;
  return a;
}

/** Lo que hay en el renglon de la base, tal cual. */
type Crudo = { articulos?: unknown; fecha?: string | null; por?: string | null };

async function leerCrudo(db: Pick<Prisma.TransactionClient, "setting">): Promise<{ d: Crudo; updatedAt: Date } | null> {
  const fila = await db.setting.findUnique({ where: { key: CLAVE_ARTICULOS } });
  if (!fila) return null;
  try {
    return { d: JSON.parse(fila.value) as Crudo, updatedAt: fila.updatedAt };
  } catch {
    return { d: {}, updatedAt: fila.updatedAt };
  }
}

/** Bloquea el renglon de los articulos hasta el COMMIT. Si todavia no
 *  existe no hay nada que bloquear: el primer import lo crea. */
async function bloquearArticulos(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$queryRaw`SELECT "key" FROM "Setting" WHERE "key" = ${CLAVE_ARTICULOS} FOR UPDATE`;
}

/** Leer, cambiar y escribir 30.000 articulos puede pasar los 5 segundos que
 *  Prisma le da a una transaccion. */
const TIEMPO = { maxWait: 15_000, timeout: 60_000 };

export async function leerArticulos(): Promise<Guardados> {
  const c = await leerCrudo(prisma);
  if (!c) return { articulos: [], fecha: null, por: null };
  return {
    articulos: Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [],
    fecha: c.d.fecha ?? c.updatedAt.toISOString(),
    por: c.d.por ?? null,
  };
}

/** Suma los que llegan a los guardados: el mismo codigo se reemplaza, los
 *  demas quedan como estaban (importar Piazza no borra FV). El flete fijo
 *  del que ya estaba se conserva siempre: GBP no lo conoce. */
export async function guardarArticulos(
  llegan: ArticuloPunto[],
  por: string,
): Promise<{ nuevos: number; actualizados: number; total: number }> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    const c = await leerCrudo(tx);
    const antes: ArticuloPunto[] = c && Array.isArray(c.d.articulos) ? (c.d.articulos as ArticuloPunto[]) : [];
    const porCodigo = new Map(antes.map((a) => [a.cod, a]));
    let nuevos = 0;
    let actualizados = 0;
    for (const a of llegan) {
      const ya = porCodigo.get(a.cod);
      if (ya) actualizados++;
      else nuevos++;
      // Lo que se cargo en Punto queda el que estaba; lo del Excel solo
      // cuenta si el articulo no tenia.
      porCodigo.set(
        a.cod,
        conLoDePunto(sinLoDePunto(a), {
          flete: ya?.flete ?? a.flete,
          otroCosto: ya?.otroCosto ?? a.otroCosto,
          otroNombre: ya?.otroNombre ?? a.otroNombre,
          bulto: ya?.bulto ?? a.bulto,
        }),
      );
    }
    const articulos = [...porCodigo.values()];
    if (articulos.length > MAXIMO_ARTICULOS)
      throw new Error(`Son más de ${MAXIMO_ARTICULOS} artículos: no entran en un solo guardado.`);
    const value = JSON.stringify({ articulos, fecha: new Date().toISOString(), por });
    await tx.setting.upsert({
      where: { key: CLAVE_ARTICULOS },
      update: { value },
      create: { key: CLAVE_ARTICULOS, value },
    });
    return { nuevos, actualizados, total: articulos.length };
  }, TIEMPO);
}

/** El flete fijo de un articulo, en pesos por unidad, con centavos. Vacio o
 *  0 = sin flete (null). "mal" = no es un monto. */
export function limpiarFleteArticulo(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = plata(typeof v === "string" ? v.replace(",", ".") : v);
  if (!Number.isFinite(n)) return "mal";
  return n === 0 ? null : n;
}

/** Otro costo en pesos por unidad, con centavos, hasta 1.000 millones.
 *  Vacio o 0 = no tiene (null). "mal" = no es un monto. */
export function limpiarOtroCosto(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = plata(typeof v === "string" ? v.replace(",", ".") : v);
  if (!Number.isFinite(n) || n > 1e9) return "mal";
  return n === 0 ? null : n;
}

/** El nombre del otro costo: sin < > (va a innerHTML), sin caracteres de
 *  control, hasta 40 y sin mitades de emoji. Vacio = no tiene (null). */
export function limpiarOtroNombre(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = Array.from(
    v
      .replace(/[<>]/g, "")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  )
    .slice(0, 40)
    .join("")
    .toWellFormed()
    .trim();
  return s || null;
}

/** De a cuantas unidades se compra: entero de 1 a 10.000. Vacio, 0 o 1 =
 *  suelto (null): el 0 es lo que manda la pagina cuando se borra el numero
 *  del campo, y quiere decir "sacalo", como en el flete. "mal" = no es eso. */
export function limpiarBulto(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (n === 0 || n === 1) return null;
  if (!Number.isInteger(n) || n < 1 || n > 10_000) return "mal";
  return n;
}

/** Cambia solo lo que vino de lo que se carga en Punto (flete, otro costo,
 *  su nombre, bulto): lo que no vino queda como estaba, y lo demas del
 *  articulo (y la fecha y el usuario del ultimo import) tambien. null en un
 *  campo lo saca. Null si ese codigo no esta. */
export async function cambiarCostosArticulo(cod: string, cambios: CostosArticulo): Promise<ArticuloPunto | null> {
  return prisma.$transaction(async (tx) => {
    await bloquearArticulos(tx);
    const c = await leerCrudo(tx);
    if (!c || !Array.isArray(c.d.articulos)) return null;
    const articulos = c.d.articulos as ArticuloPunto[];
    const i = articulos.findIndex((a) => a && a.cod === cod);
    if (i < 0) return null;
    const antes = articulos[i];
    const valor = <K extends CampoDePunto>(k: K) => (k in cambios ? cambios[k] : antes[k]);
    const nuevo = conLoDePunto(sinLoDePunto(antes), {
      flete: valor("flete"),
      otroCosto: valor("otroCosto"),
      otroNombre: valor("otroNombre"),
      bulto: valor("bulto"),
    });
    articulos[i] = nuevo;
    const value = JSON.stringify({ ...c.d, articulos });
    await tx.setting.update({ where: { key: CLAVE_ARTICULOS }, data: { value } });
    return nuevo;
  }, TIEMPO);
}
