import { Prisma, type PuntoCompra } from "@prisma/client";
import { prisma } from "@/lib/db";
import { siguienteCompra } from "@/lib/punto-documentos";
import {
  aplicarRecibidos,
  conLoQueYaLlego,
  ESTADOS_ABIERTOS,
  estadoPorLoQueLlego,
  faltantesDe,
  juntarRenglones,
  limpiarRenglones,
  nombreEstadoCompra,
  nroCompra,
  type RenglonCompra,
  totalesCompra,
} from "./punto-compras-limpiar";

// Los pedidos a los proveedores (ordenes de compra) de Punto, en la base
// (PuntoCompra, migracion 55, V.0.99.82).
//
// Damian, 22/11/2026: "el pedido que voy a pedirle al proveedor me lo pongas
// con los costos y los valores ... los costos con los descuentos y cuanto es
// el valor de la mercaderia que le estoy pidiendo", y "cuando hago una orden
// de pedido y queda algo como pendiente, si me vuelve la semana que viene a
// sacar faltantes, que quede remarcado que ya esta pedido los articulos que
// quedaron pendientes por sin stock de fabrica".
//
// Los estados:
//   abierto   se esta armando: se le suman articulos (de los pedidos de los
//             clientes, de los faltantes, a mano) y se cambia.
//   enviado   se le mando al proveedor. Lo que todavia no llego es lo que la
//             pagina marca como "ya pedido".
//   parcial   llego una parte. Lo que falta sigue "ya pedido".
//   recibido  llego todo, o se cerro dando por perdido lo que no vino.
//   anulado   no va.
//
// Reglas que salen de aca:
// - El numero (OC-0001) sale de PuntoNumerador ("n2:compra") adentro de la
//   misma transaccion que crea el pedido: dos puestos nunca sacan el mismo.
// - Un solo pedido abierto por proveedor y sucursal: "sumar" busca el abierto
//   y le agrega. Dos que suman a la vez al mismo proveedor esperan uno al
//   otro (un lock de Postgres por proveedor y sucursal, hasta el COMMIT): si
//   no, cada uno creaba el suyo y quedaban dos pedidos abiertos. El lock es
//   por el NOMBRE del proveedor en minuscula (el de la lista si vino el id):
//   uno que suma eligiendolo de la lista y otro que lo tipea esperan el mismo
//   lock y ven el mismo pedido. "reabrir" toma el mismo lock y no reabre si
//   ya hay otro abierto.
// - "sumar" con la misma marca dos veces (se corto la respuesta y la pagina
//   reintenta) no suma dos veces: devuelve el pedido como quedo.
// - Cada cambio bloquea la fila (SELECT ... FOR UPDATE). version sube en cada
//   cambio; guardar con una version vieja no pisa nada y vuelve "conflicto"
//   con el pedido como quedo.
// - Los totales los calcula el servidor (punto-compras-limpiar.ts), nunca los
//   de la pagina.
// - Cargar lo que llego NO toca el stock: el stock todavia no esta en el
//   servidor (vive en el Excel de GBP que se importa). Cuando este, se suma
//   aca, en la misma transaccion.
// - Lo que no se puede vuelve como { error } con el motivo, para que la
//   pantalla lo diga.

export { limpiarRenglones } from "./punto-compras-limpiar";
export type { RenglonCompra } from "./punto-compras-limpiar";

/** Los de "todos": los ultimos 200. Los abiertos tienen un tope mas alto:
 *  son los que hay que ver, y nunca deberian ser tantos. */
export const MAX_COMPRAS = 200;
const MAX_ABIERTAS = 500;
/** Para "ya pedido": los enviados y recibidos en parte que se miran. */
const MAX_PENDIENTES = 1000;

export type CompraGuardada = {
  id: string;
  nro: number;
  /** "OC-0001". */
  nroTexto: string;
  proveedorId: string | null;
  proveedor: string;
  sucursal: string;
  estado: string;
  renglones: RenglonCompra[];
  neto: number;
  iva: number;
  total: number;
  nota: string;
  version: number;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
  enviadoEn: string | null;
  cerradoEn: string | null;
};

export type ResultadoCompra =
  | { ok: true; compra: CompraGuardada; cambio: boolean; nuevo?: boolean; sumados?: number; estadoAntes?: string }
  /** invalido: lo que mando la pagina no sirve (la ruta contesta 400). */
  | { error: string; conflicto?: true; compra?: CompraGuardada; invalido?: true };

/** Las ultimas marcas de "sumar" que se guardan en cada pedido: alcanza de
 *  sobra para un reintento, que llega a los segundos. */
const MAX_MARCAS = 30;

/** Los renglones como estan en la base. Se escribieron ya revisados; si
 *  alguno no pasara la revision de hoy (cambio una regla), se dejan como
 *  estan antes que perderlos. */
function renglonesDe(json: Prisma.JsonValue): RenglonCompra[] {
  const r = limpiarRenglones(json);
  if (!("error" in r)) return r.renglones;
  return Array.isArray(json) ? (json as unknown as RenglonCompra[]) : [];
}

export function aGuardada(c: PuntoCompra): CompraGuardada {
  return {
    id: c.id,
    nro: c.nro,
    nroTexto: nroCompra(c.nro),
    proveedorId: c.proveedorId,
    proveedor: c.proveedor,
    sucursal: c.sucursal,
    estado: c.estado,
    renglones: renglonesDe(c.renglones),
    neto: c.neto,
    iva: c.iva,
    total: c.total,
    nota: c.nota,
    version: c.version,
    creadoPor: c.creadoPor,
    creadoEn: c.creadoEn.toISOString(),
    actualizadoEn: c.actualizadoEn.toISOString(),
    enviadoEn: c.enviadoEn ? c.enviadoEn.toISOString() : null,
    cerradoEn: c.cerradoEn ? c.cerradoEn.toISOString() : null,
  };
}

/** Lo que sale de una transaccion que se trabo con otra: se prueba una vez
 *  mas, como en src/lib/punto-ventas.ts. */
function esChoque(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2034";
}

async function enTransaccion<T>(f: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let intento = 0; ; intento++) {
    try {
      return await prisma.$transaction(f, { maxWait: 10_000, timeout: 15_000 });
    } catch (e) {
      if (intento < 1 && esChoque(e)) continue;
      throw e;
    }
  }
}

/** Bloquea el pedido hasta el COMMIT y lo devuelve. */
async function bloquear(tx: Prisma.TransactionClient, id: string): Promise<PuntoCompra | null> {
  const filas = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "PuntoCompra" WHERE "id" = ${id} FOR UPDATE`;
  return filas.length ? tx.puntoCompra.findUnique({ where: { id } }) : null;
}

const renglonesJson = (r: RenglonCompra[]) => r as unknown as Prisma.InputJsonValue;
const noSePuede = (c: PuntoCompra, que: string) => ({
  error: `Ese pedido está ${nombreEstadoCompra(c.estado)}: no se puede ${que}.`,
});

/** El lock de "un solo pedido abierto por proveedor y sucursal", hasta el
 *  COMMIT. Lo toman sumar y reabrir, siempre ANTES de bloquear un pedido
 *  (FOR UPDATE): con el mismo orden en todos lados, dos transacciones no se
 *  traban esperando cada una lo que tiene la otra. */
async function bloquearProveedorYSucursal(tx: Prisma.TransactionClient, sucursal: string, nombre: string): Promise<void> {
  const clave = "punto-compra:" + sucursal + ":" + nombre.toLowerCase();
  await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${clave}))`;
}

/** El pedido abierto de ese proveedor en esa sucursal (el mas viejo, si por
 *  algo hubiera dos), menos el que se esta reabriendo. Con el id de la lista:
 *  los suyos, y tambien los que se armaron con el nombre tipeado (sin id).
 *  Sin id: por el nombre, sin mirar mayusculas. El nombre se compara con
 *  lower() = lower() en SQL y no con el "insensitive" de Prisma, que en
 *  Postgres usa ILIKE: un "%" o un "_" en el nombre ("100% Plast") hacia
 *  de comodin y podia sumarle a otro proveedor. */
async function abiertoDe(
  tx: Prisma.TransactionClient,
  f: { sucursal: string; proveedorId: string | null; nombre: string; menos?: string },
): Promise<{ id: string; nro: number; proveedorId: string | null } | null> {
  const quien = f.proveedorId
    ? Prisma.sql`("proveedorId" = ${f.proveedorId} OR ("proveedorId" IS NULL AND lower("proveedor") = lower(${f.nombre})))`
    : Prisma.sql`lower("proveedor") = lower(${f.nombre})`;
  // "" no es un id: asi la misma consulta sirve sin "menos".
  const filas = await tx.$queryRaw<{ id: string; nro: number; proveedorId: string | null }[]>`
    SELECT "id", "nro", "proveedorId" FROM "PuntoCompra"
     WHERE "estado" = 'abierto' AND "sucursal" = ${f.sucursal} AND "id" <> ${f.menos ?? ""} AND ${quien}
     ORDER BY "creadoEn" ASC, "id" ASC
     LIMIT 1`;
  return filas[0] ?? null;
}

// ------------------------------------------------------------ LISTAS

/** abiertos = abierto, enviado y recibido en parte (todos, el mas nuevo
 *  primero); todos = los ultimos 200 de cualquier estado. */
export async function listarCompras(f: { estado: "abiertos" | "todos"; sucursal?: string }): Promise<CompraGuardada[]> {
  const filas = await prisma.puntoCompra.findMany({
    where: {
      ...(f.estado === "abiertos" ? { estado: { in: [...ESTADOS_ABIERTOS] } } : {}),
      ...(f.sucursal ? { sucursal: f.sucursal } : {}),
    },
    orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
    take: f.estado === "abiertos" ? MAX_ABIERTAS : MAX_COMPRAS,
  });
  return filas.map(aGuardada);
}

export type Pendiente = {
  compraId: string;
  nroTexto: string;
  proveedor: string;
  estado: string;
  enviadoEn: string | null;
  falta: number;
  sinStockFabrica: boolean;
};

/** Lo que ya se le pidio a un proveedor y todavia no llego, por codigo de
 *  articulo: de los pedidos enviados y de los recibidos en parte. Con esto la
 *  pagina marca "ya pedido en OC-0002 el 15/11 · faltan llegar 3" al volver a
 *  sacar faltantes, y no se pide dos veces lo mismo. Los abiertos no cuentan:
 *  todavia no se le pidio nada al proveedor. El mas viejo primero. */
export async function pendientesPorCodigo(sucursal?: string): Promise<Record<string, Pendiente[]>> {
  const filas = await prisma.puntoCompra.findMany({
    where: { estado: { in: ["enviado", "parcial"] }, ...(sucursal ? { sucursal } : {}) },
    orderBy: [{ enviadoEn: "asc" }, { nro: "asc" }],
    take: MAX_PENDIENTES,
  });
  // Un Map y no un objeto: un codigo como "__proto__" o "constructor" no
  // se mezcla con lo que tiene cualquier objeto de JavaScript.
  const porCod = new Map<string, Pendiente[]>();
  for (const c of filas) {
    for (const f of faltantesDe(renglonesDe(c.renglones))) {
      const lista = porCod.get(f.cod) ?? [];
      lista.push({
        compraId: c.id,
        nroTexto: nroCompra(c.nro),
        proveedor: c.proveedor,
        estado: c.estado,
        enviadoEn: c.enviadoEn ? c.enviadoEn.toISOString() : null,
        falta: f.falta,
        sinStockFabrica: f.sinStockFabrica,
      });
      porCod.set(f.cod, lista);
    }
  }
  return Object.fromEntries(porCod);
}

// ------------------------------------------------------------ SUMAR

/** Suma articulos al pedido ABIERTO de ese proveedor en esa sucursal, o lo
 *  crea (con numero nuevo) si no hay. El proveedor se reconoce por su id si
 *  vino de la lista de proveedores, si no por el nombre sin mirar
 *  mayusculas. El mismo articulo suma la cantidad (juntarRenglones).
 *  marca: la del envio (ver arriba); null = sin la proteccion del
 *  reintento. */
export async function sumarACompra(
  usuario: string,
  p: {
    proveedorId: string | null;
    proveedor: string;
    sucursal: string;
    renglones: RenglonCompra[];
    marca?: string | null;
  },
): Promise<ResultadoCompra> {
  return enTransaccion(async (tx): Promise<ResultadoCompra> => {
    const marca = p.marca || null;
    if (marca) {
      // Se corto la respuesta y la pagina lo vuelve a mandar: sin esto la
      // cantidad se sumaba dos veces y el pedido le llegaba al proveedor
      // con el doble. El lock (hasta el COMMIT) hace esperar al envio que
      // llega a la vez, que despues encuentra la marca. Va primero de todos
      // los locks de aca, siempre en el mismo orden.
      await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-compra-marca:" + marca}))`;
      const ya = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "PuntoCompra" WHERE ${marca} = ANY("marcas") ORDER BY "creadoEn" ASC LIMIT 1`;
      const fila = ya.length ? await tx.puntoCompra.findUnique({ where: { id: ya[0].id } }) : null;
      if (fila) return { ok: true, compra: aGuardada(fila), cambio: false };
    }

    let nombre = p.proveedor;
    if (p.proveedorId) {
      // FOR SHARE: eliminar el proveedor (FOR UPDATE de la misma fila)
      // espera a que este pedido quede guardado, y entonces lo ve.
      const prov = await tx.$queryRaw<{ razonSocial: string; eliminado: boolean }[]>`
        SELECT "razonSocial", ("eliminadoEn" IS NOT NULL) AS "eliminado"
          FROM "PuntoProveedor" WHERE "id" = ${p.proveedorId} FOR SHARE`;
      if (!prov.length || prov[0].eliminado)
        return { error: "Ese proveedor ya no está en la lista (o se eliminó): recargá la página." };
      // El nombre como esta en la lista, no como lo tenia la pantalla.
      nombre = prov[0].razonSocial;
    }

    // Uno a la vez por proveedor y sucursal, hasta el COMMIT: el segundo
    // encuentra el pedido que abrio el primero y le suma.
    await bloquearProveedorYSucursal(tx, p.sucursal, nombre);

    // Nada llego todavia de un pedido que se esta armando: lo que diga la
    // pantalla de "recibido" no cuenta (eso se carga con "recibir").
    const llegan = p.renglones.map((r) => ({ ...r, recibido: 0 }));
    const marcas = (antes: string[]) => (marca ? [...antes, marca].slice(-MAX_MARCAS) : antes);

    const candidato = await abiertoDe(tx, { sucursal: p.sucursal, proveedorId: p.proveedorId, nombre });
    // Se bloquea y se vuelve a leer: entre que se busco y se bloqueo, otro
    // lo pudo haber mandado al proveedor. Si ya no esta abierto, va a uno
    // nuevo.
    const abierto = candidato ? await bloquear(tx, candidato.id) : null;
    if (abierto && abierto.estado === "abierto") {
      const j = juntarRenglones(renglonesDe(abierto.renglones), llegan);
      if ("error" in j) return j;
      const nueva = await tx.puntoCompra.update({
        where: { id: abierto.id },
        data: {
          renglones: renglonesJson(j.renglones),
          ...totalesCompra(j.renglones),
          marcas: marcas(abierto.marcas ?? []),
          // Uno que se armo con el nombre tipeado queda atado al proveedor
          // de la lista: asi eliminar al proveedor lo ve.
          ...(p.proveedorId && !abierto.proveedorId ? { proveedorId: p.proveedorId } : {}),
          version: { increment: 1 },
        },
      });
      return { ok: true, compra: aGuardada(nueva), cambio: true, sumados: p.renglones.length };
    }

    const j = juntarRenglones([], llegan);
    if ("error" in j) return j;
    const nro = await siguienteCompra(tx);
    const nueva = await tx.puntoCompra.create({
      data: {
        nro,
        proveedorId: p.proveedorId,
        proveedor: nombre,
        sucursal: p.sucursal,
        estado: "abierto",
        renglones: renglonesJson(j.renglones),
        ...totalesCompra(j.renglones),
        marcas: marcas([]),
        creadoPor: usuario,
      },
    });
    return { ok: true, compra: aGuardada(nueva), cambio: true, nuevo: true, sumados: p.renglones.length };
  });
}

// ------------------------------------------------------------ GUARDAR

/** Reemplaza los renglones (y la nota, si vino) de un pedido que todavia
 *  no se cerro. Con la version de la que partio la pantalla: si otro lo
 *  cambio mientras tanto, no se pisa y vuelve como quedo. Lo que ya llego
 *  queda el guardado (conLoQueYaLlego) y, en uno ya mandado, el estado se
 *  vuelve a sacar de ahi: bajar la cantidad de lo que faltaba a lo que ya
 *  llego deja el pedido "recibido", no "recibido en parte" para siempre.
 *  estadoAntes: el que tenia, para el Registro. */
export async function guardarCompra(p: {
  id: string;
  version: number;
  renglones: RenglonCompra[];
  nota: string | undefined;
}): Promise<ResultadoCompra> {
  return enTransaccion(async (tx): Promise<ResultadoCompra> => {
    const c = await bloquear(tx, p.id);
    if (!c) return { error: "Ese pedido ya no está." };
    if (!(ESTADOS_ABIERTOS as readonly string[]).includes(c.estado)) return noSePuede(c, "cambiar");
    if (c.version !== p.version)
      return { error: "Otro lo cambió recién: te muestro cómo quedó.", conflicto: true, compra: aGuardada(c) };
    const j = juntarRenglones([], p.renglones);
    if ("error" in j) return j;
    const renglones = conLoQueYaLlego(renglonesDe(c.renglones), j.renglones);
    // Uno abierto no tiene nada recibido (se manda recien al marcarlo
    // enviado): sigue abierto.
    const estado = c.estado === "abierto" ? "abierto" : estadoPorLoQueLlego(renglones);
    const nueva = await tx.puntoCompra.update({
      where: { id: c.id },
      data: {
        renglones: renglonesJson(renglones),
        ...totalesCompra(renglones),
        ...(p.nota !== undefined ? { nota: p.nota } : {}),
        ...(estado !== c.estado ? { estado } : {}),
        ...(estado === "recibido" ? { cerradoEn: new Date() } : {}),
        version: { increment: 1 },
      },
    });
    return { ok: true, compra: aGuardada(nueva), cambio: true, estadoAntes: c.estado };
  });
}

// ------------------------------------------------------------ ESTADOS

export type AccionEstado = "enviar" | "cerrar" | "anular" | "reabrir";

/** Los pasos de un estado a otro. Pedir lo que ya esta (doble clic, otro
 *  puesto) no es un error: vuelve el pedido sin tocarlo. */
export async function cambiarEstadoCompra(id: string, accion: AccionEstado): Promise<ResultadoCompra> {
  if (accion === "reabrir") return reabrirCompra(id);
  return enTransaccion(async (tx): Promise<ResultadoCompra> => {
    const c = await bloquear(tx, id);
    if (!c) return { error: "Ese pedido ya no está." };
    const igual = (): ResultadoCompra => ({ ok: true, compra: aGuardada(c), cambio: false });
    let data: Prisma.PuntoCompraUpdateInput;
    switch (accion) {
      case "enviar":
        if (c.estado === "enviado") return igual();
        if (c.estado !== "abierto") return noSePuede(c, "mandar al proveedor");
        if (!renglonesDe(c.renglones).length)
          return { error: "Ese pedido no tiene artículos: no hay nada para mandar." };
        data = { estado: "enviado", enviadoEn: new Date() };
        break;
      case "cerrar":
        // Lo que no llego se da por perdido: deja de figurar como "ya pedido".
        if (c.estado === "recibido") return igual();
        if (c.estado !== "parcial") return noSePuede(c, "cerrar");
        data = { estado: "recibido", cerradoEn: new Date() };
        break;
      case "anular":
        if (c.estado === "anulado") return igual();
        if (!(ESTADOS_ABIERTOS as readonly string[]).includes(c.estado)) return noSePuede(c, "anular");
        data = { estado: "anulado", cerradoEn: new Date() };
        break;
    }
    const nueva = await tx.puntoCompra.update({ where: { id: c.id }, data: { ...data, version: { increment: 1 } } });
    return { ok: true, compra: aGuardada(nueva), cambio: true };
  });
}

/** Un enviado vuelve a armarse: todavia no se le mando nada al proveedor
 *  (o hay que mandarlo de nuevo), asi que tampoco tiene fecha de enviado (lo
 *  que tenia no esta "ya pedido" hasta que se mande otra vez). No si ya hay
 *  otro pedido abierto a ese proveedor en esa sucursal (se armo uno nuevo
 *  despues de mandar este): quedarian dos abiertos y "sumar" le seguiria
 *  sumando a uno solo. Toma el mismo lock que "sumar", antes de bloquear el
 *  pedido (el mismo orden), asi un "sumar" que entra a la vez no abre otro. */
async function reabrirCompra(id: string): Promise<ResultadoCompra> {
  return enTransaccion(async (tx): Promise<ResultadoCompra> => {
    // Primero sin bloquear, para saber de que proveedor es: el proveedor y
    // la sucursal de un pedido no cambian despues de crearlo.
    const antes = await tx.puntoCompra.findUnique({
      where: { id },
      select: { proveedorId: true, proveedor: true, sucursal: true },
    });
    if (!antes) return { error: "Ese pedido ya no está." };
    // El nombre del lock como lo arma "sumar": el de la lista si tiene id.
    let nombre = antes.proveedor;
    if (antes.proveedorId) {
      const prov = await tx.puntoProveedor.findUnique({
        where: { id: antes.proveedorId },
        select: { razonSocial: true },
      });
      if (prov) nombre = prov.razonSocial;
    }
    await bloquearProveedorYSucursal(tx, antes.sucursal, nombre);

    const c = await bloquear(tx, id);
    if (!c) return { error: "Ese pedido ya no está." };
    if (c.estado === "abierto") return { ok: true, compra: aGuardada(c), cambio: false };
    if (c.estado !== "enviado") return noSePuede(c, "reabrir");
    const otro = await abiertoDe(tx, { sucursal: c.sucursal, proveedorId: c.proveedorId, nombre, menos: c.id });
    if (otro)
      return { error: `No lo puedo reabrir: ya hay otro pedido abierto a ese proveedor (${nroCompra(otro.nro)}).` };
    const nueva = await tx.puntoCompra.update({
      where: { id: c.id },
      data: { estado: "abierto", enviadoEn: null, version: { increment: 1 } },
    });
    return { ok: true, compra: aGuardada(nueva), cambio: true };
  });
}

/** Lo que llego del proveedor (cuanto llego en total de cada articulo, no
 *  cuanto mas). Con todo lo pedido recibido queda "recibido"; si llego algo
 *  pero no todo, "parcial". Si no llego nada (solo se marco "sin stock de
 *  fabrica", o se corrigio a 0 lo que se habia cargado de mas) queda
 *  "enviado": "llego una parte" diria algo que no paso. NO toca el stock
 *  (ver arriba). */
export async function recibirCompra(id: string, recibidos: unknown, sinStock: unknown): Promise<ResultadoCompra> {
  return enTransaccion(async (tx): Promise<ResultadoCompra> => {
    const c = await bloquear(tx, id);
    if (!c) return { error: "Ese pedido ya no está." };
    if (c.estado !== "enviado" && c.estado !== "parcial") return noSePuede(c, "cargar lo que llegó");
    const r = aplicarRecibidos(renglonesDe(c.renglones), recibidos, sinStock);
    if ("error" in r) return r;
    const estado = r.completo ? "recibido" : r.algo ? "parcial" : "enviado";
    const nueva = await tx.puntoCompra.update({
      where: { id: c.id },
      data: {
        renglones: renglonesJson(r.renglones),
        estado,
        ...(estado === "recibido" ? { cerradoEn: new Date() } : {}),
        version: { increment: 1 },
      },
    });
    return { ok: true, compra: aGuardada(nueva), cambio: true };
  });
}
