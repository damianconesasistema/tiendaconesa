import { Prisma, type PuntoProveedor } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ESTADOS_ABIERTOS, nroCompra } from "./punto-compras-limpiar";
import {
  CAMPOS_GBP,
  type CampoProveedor,
  cuitDeRelleno,
  cuitValido,
  type DatosProveedor,
  type ProveedorNuevo,
} from "./punto-proveedores-limpiar";

// Los proveedores del sistema Punto: los que se traen del Excel de
// proveedores que exporta GlobalBluePoint (razon social, CUIT, clase fiscal,
// domicilio, moneda de la cuenta corriente...). Damian, 22/11/2026: "este es
// el listado de proveedores del sistema tanto de buenos aires como de
// traslasierra". Una sola lista para las dos sucursales.
//
// NO van en el codigo de Punto (src/app/sistema/punto.ts): el repositorio es
// publico. Se guardan en la base, un renglon por proveedor (migracion 52), y
// los entrega /sistema/proveedores solo a quien entro con usuario y permiso
// de "Sistema Punto".
//
// Reglas que salen de aca:
// - Al proveedor se lo reconoce por el ID de GBP (gbpId), no por el CUIT: hay
//   CUIT de relleno ("30-99999999-9") y repetidos. Volver a importar el mismo
//   Excel actualiza, no duplica.
// - Importar pisa los datos que vienen de GBP, pero NUNCA la cadena de
//   descuentos (cadena) ni el flete: esos se cargan en Punto y GBP no los
//   conoce.
// - Importar no borra: el que no vino en el Excel queda como estaba. Para
//   dar de baja, GBP lo marca Inactivo y se importa de nuevo.
//
// Desde la V.0.99.82 (migracion 55) los proveedores tambien se cargan y se
// retocan en Punto. Damian: "dame la posibilidad de editar esos proveedores y
// tambien eliminar y cualquier cosa que quiera retocar". Entonces:
// - El que se da de alta en Punto no tiene gbpId (null): el Excel no lo
//   conoce y nunca lo toca.
// - Un dato de GBP retocado a mano queda en "editados" y el Excel ya no lo
//   pisa: si no, el proximo import deshacia el arreglo sin avisar.
// - contacto, whatsapp, email y notas son de Punto: el Excel no los toca.
// - Eliminar no borra: marca eliminadoEn. El eliminado sale de la lista, el
//   Excel no lo vuelve a cargar (se lo saltea y lo cuenta), y se restaura.
// - El CUIT no se repite entre los que no estan eliminados (en el alta y en
//   los cambios): un lock de Postgres por CUIT, hasta el COMMIT, hace que dos
//   puestos que cargan el mismo a la vez esperen uno al otro.
// - Uno dado de alta en Punto que despues aparece en el Excel de GBP (mismo
//   CUIT valido) no se duplica: el import le pone el gbpId y desde ahi es el
//   mismo proveedor. Lo que se habia escrito a mano queda (va a "editados");
//   el Excel completa lo que estaba vacio.

export { cuitValido, limpiarAltaProveedor, limpiarCambiosProveedor, limpiarFlete, limpiarProveedor } from "./punto-proveedores-limpiar";
export type { DatosProveedor, ProveedorNuevo } from "./punto-proveedores-limpiar";

export const MAX_PROVEEDORES = 5000;

/** De a cuantos se guardan. Cada tanda es una transaccion: los 189 de hoy
 *  entran en una, y un Excel de miles no arma una transaccion gigante. */
const TANDA = 200;
/** Una tanda son hasta 200 escrituras de a una: mas que los 5 segundos que
 *  Prisma le da a una transaccion. */
const TIEMPO_TANDA = { maxWait: 15_000, timeout: 60_000 };
const TIEMPO = { maxWait: 10_000, timeout: 15_000 };

export type ProveedorGuardado = Omit<ProveedorNuevo, "gbpId"> & {
  id: string;
  /** Null en los que se dieron de alta en Punto. */
  gbpId: number | null;
  /** La cadena de descuentos, cuando la tenga. */
  cadena: Prisma.JsonValue | null;
  /** El flete en % sobre el costo (0 a 100), o null si no tiene. */
  flete: number | null;
  contacto: string;
  whatsapp: string;
  email: string;
  notas: string;
  /** Los datos de GBP retocados a mano: el Excel no los pisa. */
  editados: string[];
  /** Quien lo dio de alta en Punto ("" si vino de GBP). */
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  actualizadoPor: string;
  eliminadoEn: string | null;
  eliminadoPor: string | null;
};

export type ResultadoProveedor =
  | { ok: true; proveedor: ProveedorGuardado; cambio: boolean; cambiados?: string[] }
  | { error: string; id?: string };

const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/;

/** El lock de un CUIT hasta el COMMIT. FROM pg_advisory_xact_lock(): la
 *  funcion no devuelve nada (void) y asi no hay columna que leer. */
async function bloquearCuit(tx: Prisma.TransactionClient, cuit: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-proveedor:cuit:" + cuit}))`;
}

/** Bloquea la fila del proveedor hasta el COMMIT y la devuelve. */
async function bloquearProveedor(tx: Prisma.TransactionClient, id: string): Promise<PuntoProveedor | null> {
  const filas = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "PuntoProveedor" WHERE "id" = ${id} FOR UPDATE`;
  return filas.length ? tx.puntoProveedor.findUnique({ where: { id } }) : null;
}

/** Otro proveedor no eliminado con ese CUIT, si hay. */
function otroConCuit(tx: Prisma.TransactionClient, cuit: string, menos: string | null) {
  return tx.puntoProveedor.findFirst({
    where: { cuit, eliminadoEn: null, ...(menos ? { id: { not: menos } } : {}) },
    orderBy: { creadoEn: "asc" },
    select: { id: true, razonSocial: true },
  });
}

/** Los datos de GBP que son texto: los que, en uno dado de alta a mano, se
 *  escribieron en el formulario. */
const TEXTOS_GBP = CAMPOS_GBP.filter((k) => k !== "moneda" && k !== "inactivo");

/** Guarda los que llegan, por ID de GBP: el que ya estaba se actualiza, el
 *  que no, se crea (o, si ya estaba dado de alta a mano con ese CUIT, se le
 *  pone el gbpId: vinculados). Si el mismo ID viene dos veces, vale el
 *  ultimo. */
export async function importarProveedores(
  filas: ProveedorNuevo[],
  usuario: string,
): Promise<{ nuevos: number; actualizados: number; vinculados: number; eliminados: number; total: number }> {
  const porId = new Map<number, ProveedorNuevo>();
  for (const p of filas) porId.set(p.gbpId, p);
  const llegan = [...porId.values()];

  let nuevos = 0;
  let actualizados = 0;
  let vinculados = 0;
  let eliminados = 0;
  for (let i = 0; i < llegan.length; i += TANDA) {
    const tanda = llegan.slice(i, i + TANDA);
    // Si una tanda falla, las anteriores quedan guardadas. No hace mal:
    // importar de nuevo el mismo Excel termina de guardar lo que falto y no
    // duplica nada. La cuenta solo suma cuando la tanda entro.
    const r = await prisma.$transaction(async (tx) => {
      const ids = tanda.map((p) => p.gbpId);
      // Bloquear antes de leer "editados": un cambio a mano que entra a la
      // vez (PUT, que bloquea la misma fila) espera, o espera este import,
      // y ninguno pisa al otro.
      await tx.$queryRaw`
        SELECT "id" FROM "PuntoProveedor" WHERE "gbpId" = ANY(${ids}::int[]) ORDER BY "id" FOR UPDATE`;
      const ya = await tx.puntoProveedor.findMany({
        where: { gbpId: { in: ids } },
        select: { id: true, gbpId: true, editados: true, eliminadoEn: true },
      });
      const porGbp = new Map(ya.map((p) => [p.gbpId, p]));
      // Los CUIT de los que entran por primera vez, con el mismo lock que el
      // alta a mano: un alta con ese CUIT que entra justo ahora espera, y
      // despues ve a este (o este la ve a ella y se vincula). Todos juntos,
      // al principio y en orden: dos imports a la vez los piden en el mismo
      // orden y no se traban.
      const cuits = [
        ...new Set(tanda.filter((p) => !porGbp.has(p.gbpId) && cuitValido(p.cuit)).map((p) => p.cuit)),
      ].sort();
      for (const c of cuits) await bloquearCuit(tx, c);
      const cuenta = { nuevos: 0, actualizados: 0, vinculados: 0, eliminados: 0 };
      for (const p of tanda) {
        // Solo lo que viene de GBP: ni "cadena" ni "flete" ni el contacto,
        // el WhatsApp, el mail o las notas se tocan.
        const datos: Record<string, unknown> = {
          cuit: p.cuit,
          razonSocial: p.razonSocial,
          claseFiscal: p.claseFiscal,
          domicilio: p.domicilio,
          localidad: p.localidad,
          provincia: p.provincia,
          pais: p.pais,
          telefono: p.telefono,
          condicionCompra: p.condicionCompra,
          moneda: p.moneda,
          inactivo: p.inactivo,
        };
        const fila = porGbp.get(p.gbpId);
        if (!fila) {
          if (cuitValido(p.cuit) && (await vincular(tx, p, datos, usuario))) {
            cuenta.vinculados++;
            continue;
          }
          // upsert y no create: si otro import lo creo recien, se actualiza
          // en vez de fallar toda la tanda por el unico de gbpId.
          await tx.puntoProveedor.upsert({
            where: { gbpId: p.gbpId },
            create: { gbpId: p.gbpId, ...(datos as Omit<ProveedorNuevo, "gbpId">), actualizadoPor: usuario },
            update: { ...datos, actualizadoPor: usuario },
          });
          cuenta.nuevos++;
          continue;
        }
        // Eliminado en Punto: el Excel no lo resucita.
        if (fila.eliminadoEn) {
          cuenta.eliminados++;
          continue;
        }
        for (const k of fila.editados ?? []) delete datos[k];
        await tx.puntoProveedor.update({ where: { id: fila.id }, data: { ...datos, actualizadoPor: usuario } });
        cuenta.actualizados++;
      }
      return cuenta;
    }, TIEMPO_TANDA);
    nuevos += r.nuevos;
    actualizados += r.actualizados;
    vinculados += r.vinculados;
    eliminados += r.eliminados;
  }

  return {
    nuevos,
    actualizados,
    vinculados,
    eliminados,
    total: await prisma.puntoProveedor.count({ where: { eliminadoEn: null } }),
  };
}

/** Uno que llega del Excel por primera vez y ya estaba dado de alta a mano
 *  en Punto con el mismo CUIT (sin gbpId, no eliminado): es el mismo
 *  proveedor. Si no, quedaban dos (uno con el contacto y el WhatsApp que se
 *  cargaron, otro con los datos de GBP) y los pedidos se repartian entre los
 *  dos. Se le pone el gbpId; lo que se escribio a mano y GBP trae distinto
 *  queda (pasa a "editados", que el Excel ya no pisa) y lo que estaba vacio
 *  lo completa el Excel. SKIP LOCKED: si alguien lo esta cambiando justo
 *  ahora, el import no lo espera (esperarlo, con los locks de CUIT tomados,
 *  podia trabarse con ese cambio) y lo carga como uno nuevo, como antes.
 *  false = no habia con quien vincularlo. */
async function vincular(
  tx: Prisma.TransactionClient,
  p: ProveedorNuevo,
  datos: Record<string, unknown>,
  usuario: string,
): Promise<boolean> {
  const libres = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PuntoProveedor"
     WHERE "cuit" = ${p.cuit} AND "gbpId" IS NULL AND "eliminadoEn" IS NULL
     ORDER BY "creadoEn" ASC, "id" ASC
     LIMIT 1
     FOR UPDATE SKIP LOCKED`;
  const pu = libres.length ? await tx.puntoProveedor.findUnique({ where: { id: libres[0].id } }) : null;
  if (!pu || pu.gbpId != null || pu.eliminadoEn) return false;
  const protegidos = new Set<string>(pu.editados ?? []);
  for (const k of TEXTOS_GBP) {
    const aMano = pu[k];
    if (typeof aMano === "string" && aMano && aMano !== datos[k]) protegidos.add(k);
  }
  const data: Record<string, unknown> = { ...datos };
  for (const k of protegidos) delete data[k];
  await tx.puntoProveedor.update({
    where: { id: pu.id },
    data: { ...data, gbpId: p.gbpId, editados: [...protegidos], actualizadoPor: usuario },
  });
  return true;
}

/** Todos los que no estan eliminados, por razon social. Con eliminados:
 *  solo los eliminados (para restaurarlos), el ultimo eliminado primero. */
export async function listarProveedores(eliminados = false): Promise<ProveedorGuardado[]> {
  const filas = await prisma.puntoProveedor.findMany({
    where: { eliminadoEn: eliminados ? { not: null } : null },
    orderBy: eliminados
      ? [{ eliminadoEn: "desc" }, { id: "asc" }]
      : [{ razonSocial: "asc" }, { gbpId: "asc" }, { id: "asc" }],
  });
  return filas.map(aGuardado);
}

function aGuardado(p: PuntoProveedor): ProveedorGuardado {
  return {
    id: p.id,
    gbpId: p.gbpId,
    cuit: p.cuit,
    razonSocial: p.razonSocial,
    claseFiscal: p.claseFiscal,
    domicilio: p.domicilio,
    localidad: p.localidad,
    provincia: p.provincia,
    pais: p.pais,
    telefono: p.telefono,
    condicionCompra: p.condicionCompra,
    // En la base es texto: cualquier otra cosa que hubiera se toma como pesos.
    moneda: p.moneda === "USD" ? "USD" : "ARS",
    inactivo: p.inactivo,
    cadena: p.cadena,
    flete: p.flete ?? null,
    contacto: p.contacto,
    whatsapp: p.whatsapp,
    email: p.email,
    notas: p.notas,
    editados: p.editados ?? [],
    creadoPor: p.creadoPor,
    creadoEn: p.creadoEn.toISOString(),
    actualizadoEn: p.actualizadoEn.toISOString(),
    actualizadoPor: p.actualizadoPor,
    eliminadoEn: p.eliminadoEn ? p.eliminadoEn.toISOString() : null,
    eliminadoPor: p.eliminadoPor ?? null,
  };
}

// ------------------------------------------------------- ALTA A MANO
// Damian: "dar de alta un nuevo proveedor ... que yo ponga el CUIT y me
// levante todos los datos solo". Los datos de ARCA los trae la pagina
// (/sistema/padron); aca se guarda lo que quedo en el formulario.

/** Da de alta un proveedor que no viene de GBP. Si ya hay uno (no
 *  eliminado) con ese CUIT, no crea otro: devuelve el error con el id del
 *  que esta, para que la pantalla ofrezca abrirlo.
 *
 *  El reintento (se corto la respuesta y la pagina lo vuelve a mandar, o un
 *  doble clic): si este mismo usuario dio de alta recien, hace menos de 2
 *  minutos, uno con la misma razon social y el mismo CUIT (o los dos sin
 *  CUIT), se devuelve ese y no se crea otro. Sin CUIT no habia nada que
 *  frenara el segundo, y con CUIT el reintento volvia "Ya está cargado"
 *  por algo que salio bien. El lock (usuario y razon social, hasta el
 *  COMMIT) hace esperar al que llega a la vez, que despues lo encuentra. */
export async function crearProveedor(d: DatosProveedor, usuario: string): Promise<ResultadoProveedor> {
  return prisma.$transaction(async (tx): Promise<ResultadoProveedor> => {
    const clave = "punto-proveedor:alta:" + usuario + ":" + d.razonSocial.toLowerCase();
    await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${clave}))`;
    // La hora se compara en la base y en UTC, como guarda Prisma las fechas
    // (ver src/lib/punto-ventas.ts).
    const recien = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "PuntoProveedor"
       WHERE "gbpId" IS NULL AND "eliminadoEn" IS NULL AND "creadoPor" = ${usuario}
         AND lower("razonSocial") = lower(${d.razonSocial}) AND "cuit" = ${d.cuit}
         AND "creadoEn" > (now() AT TIME ZONE 'UTC') - interval '2 minutes'
       ORDER BY "creadoEn" DESC
       LIMIT 1`;
    const ese = recien.length ? await tx.puntoProveedor.findUnique({ where: { id: recien[0].id } }) : null;
    if (ese) return { ok: true, proveedor: aGuardado(ese), cambio: false };

    if (d.cuit) {
      await bloquearCuit(tx, d.cuit);
      const ya = await otroConCuit(tx, d.cuit, null);
      if (ya) return { error: `Ya está cargado: ${ya.razonSocial}.`, id: ya.id };
    }
    const nuevo = await tx.puntoProveedor.create({
      data: { ...d, gbpId: null, editados: [], creadoPor: usuario, actualizadoPor: usuario },
    });
    return { ok: true, proveedor: aGuardado(nuevo), cambio: true };
  }, TIEMPO);
}

// ------------------------------------------------------- CAMBIOS
// Se cambia solo lo que vino, en una transaccion que bloquea la fila: dos
// puestos que retocan el mismo proveedor a la vez esperan uno al otro, y un
// import del Excel que entra a la vez tambien (bloquea las mismas filas).

/** Cambia lo que vino y anota en "editados" los datos de GBP que de verdad
 *  cambiaron. Tambien en uno dado de alta en Punto: si despues aparece en el
 *  Excel de GBP y se vincula (importarProveedores), lo retocado ya esta
 *  anotado y el Excel no lo pisa. */
export async function cambiarProveedor(
  id: string,
  cambios: Partial<DatosProveedor>,
  usuario: string,
): Promise<ResultadoProveedor> {
  if (!ID_VALIDO.test(id)) return { error: "No sé de qué proveedor me hablás." };
  return prisma.$transaction(async (tx): Promise<ResultadoProveedor> => {
    const fila = await bloquearProveedor(tx, id);
    if (!fila) return { error: "Ese proveedor no está: recargá la lista." };
    if (fila.eliminadoEn) return { error: "Ese proveedor está eliminado: restauralo antes de cambiarlo." };

    const data: Record<string, unknown> = {};
    const cambiados: CampoProveedor[] = [];
    for (const [k, v] of Object.entries(cambios) as [CampoProveedor, unknown][]) {
      const antes = (fila as unknown as Record<string, unknown>)[k] ?? null;
      if (antes === (v ?? null)) continue;
      data[k] = v;
      cambiados.push(k);
    }
    if (!cambiados.length) return { ok: true, proveedor: aGuardado(fila), cambio: false, cambiados: [] };

    // El CUIT nuevo no puede ser el de otro (el mismo, sin cambiar, no se
    // vuelve a mirar: en GBP hay CUIT repetidos y no es culpa de este cambio).
    if (typeof data.cuit === "string" && data.cuit) {
      await bloquearCuit(tx, data.cuit);
      const otro = await otroConCuit(tx, data.cuit, id);
      if (otro) return { error: `Ya está cargado: ${otro.razonSocial}.`, id: otro.id };
    }

    const deGbp = cambiados.filter((k) => (CAMPOS_GBP as readonly string[]).includes(k));
    if (deGbp.length) data.editados = [...new Set([...(fila.editados ?? []), ...deGbp])];
    const nuevo = await tx.puntoProveedor.update({ where: { id }, data: { ...data, actualizadoPor: usuario } });
    return { ok: true, proveedor: aGuardado(nuevo), cambio: true, cambiados };
  }, TIEMPO);
}

// ------------------------------------------------------- ELIMINAR
// Como los comprobantes: no se borra la fila, se marca con quien y cuando.
// Sale de la lista y de los pedidos nuevos; queda en "eliminados" y se
// restaura.

/** Elimina (marca). No si tiene un pedido a proveedor abierto, enviado o
 *  recibido en parte: ese pedido quedaria colgado de un proveedor que no se
 *  ve. Sumar a un pedido bloquea la fila del proveedor (FOR SHARE, ver
 *  src/lib/punto-compras.ts), asi un pedido que se arma justo ahora espera
 *  a este, o este lo ve. */
export async function eliminarProveedor(id: string, usuario: string): Promise<ResultadoProveedor> {
  if (!ID_VALIDO.test(id)) return { error: "No sé de qué proveedor me hablás." };
  return prisma.$transaction(async (tx): Promise<ResultadoProveedor> => {
    const fila = await bloquearProveedor(tx, id);
    if (!fila) return { error: "Ese proveedor no está: recargá la lista." };
    // Ya estaba eliminado (doble clic, otro puesto): no se toca de nuevo.
    if (fila.eliminadoEn) return { ok: true, proveedor: aGuardado(fila), cambio: false };
    // Los suyos y tambien los que se armaron con su nombre tipeado (sin el
    // id de la lista): son pedidos a este proveedor igual. El nombre con
    // lower() y no con el "insensitive" de Prisma (ILIKE: un "%" o un "_"
    // haria de comodin, ver src/lib/punto-compras.ts).
    const abierto = await tx.$queryRaw<{ nro: number }[]>`
      SELECT "nro" FROM "PuntoCompra"
       WHERE "estado" = ANY(${[...ESTADOS_ABIERTOS]}::text[])
         AND ("proveedorId" = ${id} OR ("proveedorId" IS NULL AND lower("proveedor") = lower(${fila.razonSocial})))
       ORDER BY "nro" ASC
       LIMIT 1`;
    if (abierto.length)
      return { error: `Tiene un pedido abierto (${nroCompra(abierto[0].nro)}): cerralo o anulalo primero.` };
    const nuevo = await tx.puntoProveedor.update({
      where: { id },
      data: { eliminadoEn: new Date(), eliminadoPor: usuario },
    });
    return { ok: true, proveedor: aGuardado(nuevo), cambio: true };
  }, TIEMPO);
}

/** Lo vuelve a la lista. No si mientras tanto alguien tomo su CUIT: se dio
 *  de alta otro con ese CUIT (en Punto o en el Excel) despues de eliminarlo,
 *  o a otro se le puso a mano. Quedarian dos, y el alta y los cambios no lo
 *  dejan. Un repetido que ya venia de GBP (los dos del Excel, con el mismo
 *  CUIT de siempre, como uno por sucursal) no frena nada: ya convivian antes
 *  de eliminarlo, y si frenara, un eliminado por error no se podia restaurar
 *  nunca (cambiarlo tampoco: esta eliminado; y el Excel no lo vuelve a
 *  cargar). Un CUIT de relleno de GBP no se mira: no dice quien es. */
export async function restaurarProveedor(id: string): Promise<ResultadoProveedor> {
  if (!ID_VALIDO.test(id)) return { error: "No sé de qué proveedor me hablás." };
  return prisma.$transaction(async (tx): Promise<ResultadoProveedor> => {
    const fila = await bloquearProveedor(tx, id);
    if (!fila) return { error: "Ese proveedor no está: recargá la lista." };
    if (!fila.eliminadoEn) return { ok: true, proveedor: aGuardado(fila), cambio: false };
    if (fila.cuit && !cuitDeRelleno(fila.cuit)) {
      await bloquearCuit(tx, fila.cuit);
      const otro = await tx.puntoProveedor.findFirst({
        where: {
          cuit: fila.cuit,
          eliminadoEn: null,
          id: { not: id },
          OR: [{ gbpId: null }, { editados: { has: "cuit" } }, { creadoEn: { gt: fila.eliminadoEn } }],
        },
        orderBy: { creadoEn: "asc" },
        select: { razonSocial: true },
      });
      if (otro) return { error: `No lo puedo restaurar: ya hay otro con ese CUIT (${otro.razonSocial}).` };
    }
    const nuevo = await tx.puntoProveedor.update({
      where: { id },
      data: { eliminadoEn: null, eliminadoPor: null },
    });
    return { ok: true, proveedor: aGuardado(nuevo), cambio: true };
  }, TIEMPO);
}

// ------------------------------------------------------------- FLETE
// Damian, 22/11/2026: "el costo del flete ... no salir del margen de
// ganancia". El flete de cada proveedor, en % sobre el costo: la pagina lo
// suma al costo en Listas, el Simulador y el precio sugerido. Se carga en
// Punto (GBP no lo tiene) y volver a importar el Excel no lo toca
// (importarProveedores no lo nombra). Un articulo con flete fijo en pesos
// (src/lib/punto-articulos.ts) usa ese en vez de este. Desde la V.0.99.82 se
// cambia con cambiarProveedor(id, {flete}); limpiarFlete esta en
// punto-proveedores-limpiar.ts (sin base, para probarlo con node solo).
