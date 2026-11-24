import { Prisma, type PuntoVenta } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ID_VALIDO, siguientePedido } from "@/lib/punto-documentos";
import { fueraDeSucursal, nombreSucursalPunto } from "@/lib/punto-permisos";

// La venta de Punto, en el servidor (migracion 55, V.0.99.82).
//
// Damian, 22/11/2026: "Todo tiene que estar en el servidor, nada de en
// ninguna maquina local, porque se va a leer con varios usuarios en
// diferentes computadoras y en diferentes lugares". Y: "que el comprobante
// pase a un estado de al cajero ... los vendedores no puedan cobrar, sino que
// el cajero es el encargado de cobrar y emitir". Hasta ahora la venta que se
// armaba vivia en la memoria de la pestaña: se perdia al cambiar de compu y
// el cajero no la podia ver.
//
// Una sola tabla (PuntoVenta) para todo lo que todavia no es comprobante:
//   armando   la venta que se esta armando: una por usuario y pestaña
//             ("lugar"). La pagina la guarda sola mientras se arma.
//   borrador  la que se dejo para despues (hasta 50 por usuario).
//   en-caja   el ticket que el vendedor mando a la caja de una sucursal.
//   cobrando  el que tomo un cajero: pasa a ser la venta de su pestaña.
//   cobrada   ya tiene comprobante (lo pone src/lib/punto-documentos.ts al
//             emitir, en la misma transaccion que lo crea).
//   anulada   no se cobra.
//   pedido    un pedido tomado (entrega, seña, estado del pedido en
//             datos.ped), con numero de la serie "pedido" de los comprobantes.
//
// Reglas que salen de aca:
// - Cada cambio va en una transaccion que bloquea la fila (SELECT ... FOR
//   UPDATE): dos cajeros que toman el mismo ticket, o dos pestañas que
//   guardan la misma venta, esperan uno al otro y el segundo ve como quedo.
// - version sube en cada cambio. La pagina manda la que tenia: si se movio,
//   no se pisa nada y vuelve "conflicto" con la venta como esta.
// - Una venta abierta por usuario y pestaña: el unico (usuario, lugar) de la
//   base lo garantiza. Lo que deja de estar abierto suelta el lugar.
// - El vendedor queda en la venta aunque la cobre el cajero: el comprobante
//   sale a su nombre y la comision es suya.
// - datos es de la pagina: el servidor solo le pone limites (tamaño, cantidad
//   de renglones) y le saca los < > a los textos, porque la caja de otro
//   usuario los muestra.
// - Lo que no se puede (otro la esta cobrando, ya se cobro) vuelve como
//   { error } con el motivo, para que la pantalla lo diga.

export const ESTADOS_VENTA = ["armando", "borrador", "en-caja", "cobrando", "cobrada", "anulada", "pedido"] as const;
export type EstadoVenta = (typeof ESTADOS_VENTA)[number];

export const MAX_DATOS_BYTES = 200 * 1024;
export const MAX_LINEAS = 300;
export const MAX_MANUALES = 300;
export const MAX_BORRADORES = 50;
export const MAX_LISTA = 200;
/** Lo que dura "la esta cobrando X": despues de 10 minutos sin tocarla, otro
 *  cajero la puede tomar (el primero se fue a almorzar, se le colgo la
 *  compu). Cada guardado del cajero la renueva. */
export const TOMADA_VENCE_MS = 10 * 60 * 1000;

const SUCURSALES = ["srl", "cnc", "tsl"];
/** El id de la pestaña: lo inventa la pagina. */
export const LUGAR_VALIDO = /^[A-Za-z0-9_-]{4,64}$/;

export type VentaGuardada = {
  id: string;
  creadoEn: string;
  actualizadoEn: string;
  version: number;
  estado: string;
  usuario: string;
  vendedor: string;
  vendedorUsuario: string;
  sucursal: string;
  lugar: string | null;
  tomadoPor: string | null;
  tomadoEn: string | null;
  documentoId: string | null;
  origenId: string | null;
  cliente: string;
  total: number;
  datos: unknown;
};

export function aGuardada(v: PuntoVenta): VentaGuardada {
  return {
    id: v.id,
    creadoEn: v.creadoEn.toISOString(),
    actualizadoEn: v.actualizadoEn.toISOString(),
    version: v.version,
    estado: v.estado,
    usuario: v.usuario,
    vendedor: v.vendedor,
    vendedorUsuario: v.vendedorUsuario,
    sucursal: v.sucursal,
    lugar: v.lugar,
    tomadoPor: v.tomadoPor,
    tomadoEn: v.tomadoEn ? v.tomadoEn.toISOString() : null,
    documentoId: v.documentoId,
    origenId: v.origenId,
    cliente: v.cliente,
    total: v.total,
    datos: v.datos,
  };
}

// ------------------------------------------------------------ LO QUE LLEGA

/** Lo que manda la pagina en "venta", revisado. */
export type VentaNueva = {
  datos: Record<string, unknown>;
  cliente: string;
  total: number;
  sucursal: string;
  /** El nombre del vendedor (VENDEDOR_LOGIN de la pagina). Null = no vino. */
  vendedor: string | null;
  /** undefined = no vino (se deja el que estaba). */
  origenId: string | null | undefined;
  /** Sin renglones ni articulos a mano. */
  vacia: boolean;
};

// Se corta ANTES de toWellFormed: si el corte cae en la mitad de un emoji,
// toWellFormed arregla la mitad que quedo suelta. Al reves (arreglar y
// despues cortar) la mitad queda y Postgres no la acepta en un JSONB.
const texto = (v: unknown, max: number) =>
  typeof v === "string"
    ? v.replace(/[<>]/g, "").replace(/\u0000/g, "").trim().slice(0, max).toWellFormed()
    : "";
const plata = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 && n < 1e11 ? Math.round(n * 100) / 100 : NaN;
};

class FueraDeForma extends Error {}

/** Copia de lo que mando la pagina, con los textos sin < > ni el caracter 0
 *  (Postgres no lo acepta en un JSONB y tiraria abajo el guardado) y sin
 *  mitades de emoji. Numeros que no son numeros pasan a null. */
function limpiarJson(v: unknown, hondo: number): unknown {
  if (hondo > 12) throw new FueraDeForma("La venta tiene datos con demasiados niveles.");
  if (typeof v === "string") return v.replace(/[<>]/g, "").replace(/\u0000/g, "").toWellFormed();
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean" || v === null) return v;
  if (Array.isArray(v)) return v.map((x) => limpiarJson(x, hondo + 1));
  if (typeof v === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (x === undefined) continue;
      // Cortar y despues toWellFormed, como en texto().
      const clave = k.replace(/[<>]/g, "").replace(/\u0000/g, "").slice(0, 80).toWellFormed();
      // "__proto__" se mira ya limpia: "__pro<to__" queda "__proto__" al
      // sacarle el <, y asignada cambiaba el prototipo del objeto en vez de
      // guardar un dato (una venta vacia parecia tener renglones).
      if (clave === "__proto__") continue;
      o[clave] = limpiarJson(x, hondo + 1);
    }
    return o;
  }
  return null;
}

/** Sin renglones de la lista ni articulos a mano. */
export function datosVacios(datos: unknown): boolean {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return true;
  const d = datos as Record<string, unknown>;
  const n = (x: unknown) => (Array.isArray(x) ? x.length : 0);
  return n(d.linea) === 0 && n(d.manuales) === 0;
}

export function limpiarVenta(x: unknown): { venta: VentaNueva } | { error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return { error: "No llegó la venta." };
  const o = x as Record<string, unknown>;
  const crudos = o.datos;
  if (!crudos || typeof crudos !== "object" || Array.isArray(crudos)) return { error: "La venta llegó sin datos." };
  const c = crudos as Record<string, unknown>;
  if (c.linea != null && !Array.isArray(c.linea)) return { error: "Los renglones de la venta no tienen forma." };
  if (c.manuales != null && !Array.isArray(c.manuales))
    return { error: "Los artículos a mano de la venta no tienen forma." };
  if (Array.isArray(c.linea) && c.linea.length > MAX_LINEAS) return { error: `Son más de ${MAX_LINEAS} renglones.` };
  if (Array.isArray(c.manuales) && c.manuales.length > MAX_MANUALES)
    return { error: `Son más de ${MAX_MANUALES} artículos a mano.` };

  let datos: Record<string, unknown>;
  try {
    datos = limpiarJson(c, 0) as Record<string, unknown>;
  } catch (e) {
    if (e instanceof FueraDeForma) return { error: e.message };
    throw e;
  }
  if (Buffer.byteLength(JSON.stringify(datos), "utf8") > MAX_DATOS_BYTES)
    return { error: "La venta es demasiado grande para guardarla (más de 200 KB)." };

  const sucursal = texto(o.sucursal, 8);
  if (!SUCURSALES.includes(sucursal)) return { error: "Falta la sucursal de la venta." };
  const total = plata(o.total);
  if (!Number.isFinite(total)) return { error: "El total de la venta no es un número." };

  let origenId: string | null | undefined = undefined;
  if (o.origenId === null || o.origenId === "") origenId = null;
  else if (o.origenId !== undefined) {
    origenId = texto(o.origenId, 40);
    if (!ID_VALIDO.test(origenId)) return { error: "No sé de qué presupuesto sale la venta." };
  }

  return {
    venta: {
      datos,
      cliente: texto(o.cliente, 120) || "Consumidor final",
      total,
      sucursal,
      vendedor: texto(o.vendedor, 60) || null,
      origenId,
      vacia: datosVacios(datos),
    },
  };
}

// ------------------------------------------------------------ RESULTADOS

export type Quien = {
  usuario: string;
  /** Para el vendedor de una venta nueva cuando la pagina no lo manda. */
  nombre: string;
  /** V.0.11.233: sus sucursales ("srl", "cnc", "tsl"); null = cualquiera. */
  sucursales: string[] | null;
  puedeCobrar: boolean;
  puedePedidos: boolean;
};

export type Conflicto = { error: string; conflicto: true; venta: VentaGuardada | null };
export type Cambio = {
  ok: true;
  venta: VentaGuardada;
  /** false = ya estaba asi (doble clic, otra pestaña): no va al Registro. */
  cambio: boolean;
  /** Pedido recien tomado (con numero nuevo). */
  nuevo?: boolean;
};
export type Resultado = Cambio | Conflicto | { error: string };

/** La venta del conflicto vuelve solo a quien ya la podia ver: el que la
 *  tiene, su vendedor o el cajero que la tomo. Un id ajeno (una pestaña
 *  vieja, alguien que lo cambia a mano) no le muestra a otro el cliente, los
 *  renglones y los precios de una venta que no es suya. Un pedido lo ve igual
 *  todo el que maneja los pedidos (la lista de pedidos se los muestra a
 *  todos): a ese tambien le vuelve, asi puede tomar la version y reintentar. */
const conflicto = (error: string, v: PuntoVenta | null | undefined, yo: Quien): Conflicto => ({
  error,
  conflicto: true,
  venta:
    v &&
    (v.usuario === yo.usuario ||
      v.vendedorUsuario === yo.usuario ||
      v.tomadoPor === yo.usuario ||
      (v.estado === "pedido" && yo.puedePedidos))
      ? aGuardada(v)
      : null,
});

/** Por que esa venta ya no es la que esta pestaña puede guardar. Null = es
 *  suya: la armando de este usuario en esta pestaña, o el ticket que este
 *  cajero tomo en esta pestaña. */
function porQueNoEsTuya(v: PuntoVenta | null | undefined, usuario: string, lugar: string): string | null {
  if (!v) return "Esta venta ya no está: se cerró o se vació en otra pestaña.";
  switch (v.estado) {
    case "armando":
      if (v.usuario !== usuario) return "Esta venta es de otro usuario.";
      return v.lugar === lugar ? null : "Esta venta está abierta en otra pestaña.";
    case "cobrando":
      if (v.tomadoPor !== usuario || v.usuario !== usuario) return `La está cobrando ${v.tomadoPor || "otro cajero"}.`;
      return v.lugar === lugar ? null : "Esta venta está abierta en otra pestaña.";
    case "en-caja":
      return "Esta venta ya se mandó a la caja.";
    case "borrador":
      return "Esta venta quedó como borrador.";
    case "cobrada":
      return "Esta venta ya se cobró.";
    case "anulada":
      return "Esta venta se anuló.";
    case "pedido":
      return "Esta venta se pasó a pedido.";
    default:
      return "Esta venta no se puede cambiar.";
  }
}

// ------------------------------------------------------------ TRANSACCIONES

/** Dos que crean a la vez la venta de la misma pestaña chocan contra el
 *  unico (usuario, lugar); dos transacciones que se cruzan pueden trabarse.
 *  En los dos casos se prueba una vez mas: la segunda vuelta ya encuentra la
 *  fila y la bloquea. */
function esChoque(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034");
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

/** Bloquea, hasta el COMMIT, la venta con ese id y la que ocupa la pestaña
 *  (usuario, lugar), en orden de id para que dos transacciones que piden las
 *  mismas dos no se traben. Devuelve las dos (pueden ser la misma, o faltar). */
async function bloquear(
  tx: Prisma.TransactionClient,
  id: string | null,
  usuario: string,
  lugar: string | null,
): Promise<{ venta: PuntoVenta | null; ocupa: PuntoVenta | null }> {
  // "" no es un id ni un lugar validos: asi una sola consulta sirve para
  // los dos casos.
  const filas = await tx.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PuntoVenta"
     WHERE "id" = ${id ?? ""} OR ("usuario" = ${usuario} AND "lugar" = ${lugar ?? ""})
     ORDER BY "id"
     FOR UPDATE`;
  if (!filas.length) return { venta: null, ocupa: null };
  const filasVenta = await tx.puntoVenta.findMany({ where: { id: { in: filas.map((f) => f.id) } } });
  return {
    venta: (id && filasVenta.find((f) => f.id === id)) || null,
    ocupa: (lugar && filasVenta.find((f) => f.usuario === usuario && f.lugar === lugar)) || null,
  };
}

/** Deja libre la pestaña: la venta que se estaba armando ahi queda como
 *  borrador; el ticket que el cajero tenia ahi vuelve a la caja.
 *  podar = false cuando despues, en la misma transaccion, se va a cambiar
 *  otra venta del mismo usuario (retomar, tomar): podar en ese momento
 *  podia borrar justo el borrador que se esta retomando (si era el mas
 *  viejo de los 50) y el cambio de despues fallaba siempre, o borrar otro
 *  que no tenia nada que ver. Ahi se poda al final. */
async function soltarLugar(tx: Prisma.TransactionClient, v: PuntoVenta, podar = true): Promise<void> {
  if (v.estado === "cobrando") {
    await tx.puntoVenta.update({
      where: { id: v.id },
      data: {
        estado: "en-caja",
        usuario: v.vendedorUsuario,
        lugar: null,
        tomadoPor: null,
        tomadoEn: null,
        version: { increment: 1 },
      },
    });
    return;
  }
  // Una venta en blanco no vale un borrador.
  if (datosVacios(v.datos)) {
    await tx.puntoVenta.delete({ where: { id: v.id } });
    return;
  }
  await tx.puntoVenta.update({
    where: { id: v.id },
    data: { estado: "borrador", lugar: null, version: { increment: 1 } },
  });
  if (podar) await podarBorradores(tx, v.usuario);
}

/** Hasta 50 borradores por usuario: los mas viejos se borran. Una fila que
 *  otra transaccion esta retomando espera y, si ya no es borrador, no se
 *  toca (el DELETE vuelve a mirar el estado). */
async function podarBorradores(tx: Prisma.TransactionClient, usuario: string): Promise<void> {
  const sobran = await tx.puntoVenta.findMany({
    where: { usuario, estado: "borrador" },
    orderBy: [{ actualizadoEn: "desc" }, { id: "desc" }],
    skip: MAX_BORRADORES,
    select: { id: true },
  });
  if (sobran.length)
    await tx.puntoVenta.deleteMany({ where: { id: { in: sobran.map((s) => s.id) }, estado: "borrador" } });
}

const versionMovida = (v: PuntoVenta, version: number | null) => version != null && v.version !== version;
/** Cobra en la caja de esa venta: tiene "cobrar" y la sucursal es de las
 *  suyas (o puede cualquiera). */
const cajeroDe = (yo: Quien, v: PuntoVenta) => yo.puedeCobrar && !fueraDeSucursal(yo.sucursales, v.sucursal);
const MOVIDA = "Esta venta se cambió en otra pestaña o en otra compu: te traigo cómo quedó.";

// ------------------------------------------------------------ GUARDAR

export type Guardado =
  | { ok: true; venta: { id: string; version: number; actualizadoEn: string } | null }
  | Conflicto
  | { error: string };

/** El guardado solo de la venta que se esta armando en esta pestaña (o del
 *  ticket que el cajero tomo en ella). La primera vez la crea. Vacia (sin
 *  renglones ni articulos a mano) se borra: no queda una venta en blanco
 *  ocupando la pestaña. */
export async function guardarVenta(
  yo: Quien,
  p: { lugar: string; id: string | null; version: number | null; venta: VentaNueva },
): Promise<Guardado> {
  return enTransaccion(async (tx): Promise<Guardado> => {
    const { venta: porId, ocupa } = await bloquear(tx, p.id, yo.usuario, p.lugar);
    let fila: PuntoVenta | null;
    if (p.id) {
      const motivo = porQueNoEsTuya(porId, yo.usuario, p.lugar);
      if (motivo) return conflicto(motivo, porId, yo);
      if (versionMovida(porId!, p.version)) return conflicto(MOVIDA, porId, yo);
      fila = porId;
    } else {
      // Sin id no se pisa el ticket que un cajero esta cobrando en esta
      // pestaña: la pagina tiene que mandar su id (si no lo tiene, es que se
      // perdio una respuesta y lo de la pantalla no es ese ticket).
      if (ocupa && ocupa.estado === "cobrando")
        return conflicto("En esta pestaña estás cobrando un ticket: recargá la página para seguir.", ocupa, yo);
      fila = ocupa;
    }

    const v = p.venta;
    if (v.vacia) {
      if (!fila) return { ok: true, venta: null };
      if (fila.estado === "armando") {
        await tx.puntoVenta.delete({ where: { id: fila.id } });
        return { ok: true, venta: null };
      }
      // Un ticket de caja vaciado por el cajero no se borra: es del vendedor.
      // Se guarda como quedo.
    }

    const comunes = {
      datos: v.datos as Prisma.InputJsonValue,
      cliente: v.cliente,
      total: v.total,
      ...(v.origenId !== undefined ? { origenId: v.origenId } : {}),
    };
    let guardada: PuntoVenta;
    if (fila) {
      guardada = await tx.puntoVenta.update({
        where: { id: fila.id },
        data:
          fila.estado === "cobrando"
            ? // El ticket conserva su caja y su vendedor. Guardar renueva el
              // "la esta cobrando": el cajero sigue ahi.
              { ...comunes, tomadoEn: new Date(), version: { increment: 1 } }
            : {
                ...comunes,
                sucursal: v.sucursal,
                vendedor: v.vendedor || fila.vendedor,
                version: { increment: 1 },
              },
      });
    } else {
      // Cada pestaña tiene su lugar: las que se cerraron sin terminar dejan
      // su venta "armando" para siempre, y se van juntando. Al empezar una
      // venta nueva, las mias de otras pestañas que nadie toco en 12 horas
      // pasan a borrador (siguen en la lista, se pueden retomar). SKIP
      // LOCKED: la que otra pestaña esta guardando justo en este momento no
      // se espera ni se toca (y asi esta transaccion no se traba con esa).
      // La hora se compara en la base y en UTC, que es como Prisma guarda
      // las fechas: un Date mandado desde aca se podia leer con la zona del
      // servidor y correrse tres horas.
      const viejas = await tx.$queryRaw<{ id: string }[]>`
        SELECT "id" FROM "PuntoVenta"
         WHERE "usuario" = ${yo.usuario} AND "estado" = 'armando'
           AND "lugar" IS NOT NULL AND "lugar" <> ${p.lugar}
           AND "actualizadoEn" < (now() AT TIME ZONE 'UTC') - interval '12 hours'
         ORDER BY "id"
         LIMIT ${Prisma.raw(String(MAX_BORRADORES))}
         FOR UPDATE SKIP LOCKED`;
      if (viejas.length) {
        const filasViejas = await tx.puntoVenta.findMany({ where: { id: { in: viejas.map((f) => f.id) } } });
        for (const vieja of filasViejas) if (vieja.estado === "armando") await soltarLugar(tx, vieja, false);
        await podarBorradores(tx, yo.usuario);
      }
      guardada = await tx.puntoVenta.create({
        data: {
          ...comunes,
          estado: "armando",
          usuario: yo.usuario,
          vendedor: v.vendedor || yo.nombre,
          vendedorUsuario: yo.usuario,
          sucursal: v.sucursal,
          lugar: p.lugar,
        },
      });
    }
    return {
      ok: true,
      venta: { id: guardada.id, version: guardada.version, actualizadoEn: guardada.actualizadoEn.toISOString() },
    };
  });
}

// ------------------------------------------------------------ CAMBIOS DE ESTADO

/** La venta armandose pasa a borrador y suelta la pestaña. */
export async function aBorrador(yo: Quien, id: string, version: number | null): Promise<Resultado> {
  return enTransaccion(async (tx): Promise<Resultado> => {
    const { venta: v } = await bloquear(tx, id, yo.usuario, null);
    if (!v) return { error: "Esa venta ya no está." };
    if (v.estado === "borrador" && v.usuario === yo.usuario) return { ok: true, venta: aGuardada(v), cambio: false };
    if (v.estado !== "armando" || v.usuario !== yo.usuario)
      return { error: porQueNoEsTuya(v, yo.usuario, v.lugar ?? "") ?? "Esa venta no se puede pasar a borrador." };
    if (versionMovida(v, version)) return conflicto(MOVIDA, v, yo);
    const nueva = await tx.puntoVenta.update({
      where: { id },
      data: { estado: "borrador", lugar: null, version: { increment: 1 } },
    });
    await podarBorradores(tx, yo.usuario);
    return { ok: true, venta: aGuardada(nueva), cambio: true };
  });
}

/** Un borrador suyo vuelve a ser la venta de esta pestaña. Tambien un ticket
 *  suyo que todavia espera en la caja (el cliente se acordo de algo) y su
 *  venta abierta en otra pestaña (la que se cerro sin terminar). Lo que
 *  hubiera abierto en esta pestaña queda como borrador. */
export async function retomar(yo: Quien, id: string, lugar: string): Promise<Resultado> {
  return enTransaccion(async (tx): Promise<Resultado> => {
    const { venta: v, ocupa } = await bloquear(tx, id, yo.usuario, lugar);
    if (!v) return { error: "Esa venta ya no está." };
    if (v.estado === "armando" && v.usuario === yo.usuario && v.lugar === lugar)
      return { ok: true, venta: aGuardada(v), cambio: false };
    const suya = v.usuario === yo.usuario;
    if (!suya) {
      if (v.estado === "cobrando") return { error: `La está cobrando ${v.tomadoPor || "otro cajero"}.` };
      return { error: "Esa venta es de otro usuario." };
    }
    if (v.estado !== "borrador" && v.estado !== "en-caja" && v.estado !== "armando")
      return { error: porQueNoEsTuya(v, yo.usuario, lugar) ?? "Esa venta no se puede retomar." };
    // Se poda recien al final, con la retomada ya fuera de los borradores:
    // podar antes la podia borrar a ella misma (ver soltarLugar).
    if (ocupa && ocupa.id !== v.id) await soltarLugar(tx, ocupa, false);
    const nueva = await tx.puntoVenta.update({
      where: { id },
      data: { estado: "armando", lugar, tomadoPor: null, tomadoEn: null, version: { increment: 1 } },
    });
    await podarBorradores(tx, yo.usuario);
    return { ok: true, venta: aGuardada(nueva), cambio: true };
  });
}

/** A la caja de una sucursal: cualquiera, tambien la de otra (es "pasar a
 *  otra sucursal"). La venta sigue siendo del vendedor. */
export async function mandarACaja(
  yo: Quien,
  id: string,
  sucursal: string,
  version: number | null,
): Promise<Resultado> {
  return enTransaccion(async (tx): Promise<Resultado> => {
    const { venta: v } = await bloquear(tx, id, yo.usuario, null);
    if (!v) return { error: "Esa venta ya no está." };
    // El reintento (se corto la respuesta, doble clic): ya esta en esa caja.
    // Sin esto el segundo envio chocaba con la version (el primero ya la
    // subio) y la pantalla recibia un conflicto por algo que salio bien.
    // La venta vuelve entera al vendedor y a un cajero de esa caja (los que
    // la ven en su lista); a un cajero de otra sucursal (el que la paso para
    // alla) solo se le dice donde quedo: el cliente, los renglones y los
    // precios de otra caja no son para el.
    if (v.estado === "en-caja" && v.sucursal === sucursal) {
      if (v.vendedorUsuario === yo.usuario || cajeroDe(yo, v)) return { ok: true, venta: aGuardada(v), cambio: false };
      if (yo.puedeCobrar) return { error: `Esa venta ya está en la caja de ${nombreSucursalPunto(sucursal)}.` };
    }
    const puede =
      ((v.estado === "armando" || v.estado === "borrador") && v.usuario === yo.usuario) ||
      // Un ticket que ya esta en una caja lo pasa a otra el vendedor o un
      // cajero de esa caja; el que se esta cobrando, el cajero que lo tiene.
      (v.estado === "en-caja" && (v.usuario === yo.usuario || cajeroDe(yo, v))) ||
      (v.estado === "cobrando" && v.tomadoPor === yo.usuario);
    if (!puede) {
      if (v.estado === "cobrando") return { error: `La está cobrando ${v.tomadoPor || "otro cajero"}.` };
      if (v.usuario !== yo.usuario && (v.estado === "armando" || v.estado === "borrador" || v.estado === "en-caja"))
        return { error: "Esa venta es de otro usuario." };
      return { error: porQueNoEsTuya(v, yo.usuario, v.lugar ?? "") ?? "Esa venta no se puede mandar a la caja." };
    }
    if (versionMovida(v, version)) return conflicto(MOVIDA, v, yo);
    if (datosVacios(v.datos)) return { error: "La venta no tiene artículos: no hay nada para cobrar." };
    const nueva = await tx.puntoVenta.update({
      where: { id },
      data: {
        estado: "en-caja",
        sucursal,
        usuario: v.vendedorUsuario,
        lugar: null,
        tomadoPor: null,
        tomadoEn: null,
        version: { increment: 1 },
      },
    });
    return { ok: true, venta: aGuardada(nueva), cambio: true };
  });
}

/** El cajero toma un ticket de su caja: pasa a "cobrando" y es la venta de su
 *  pestaña. Si otro cajero lo tomo hace menos de 10 minutos, no. */
export async function tomar(yo: Quien, id: string, lugar: string): Promise<Resultado> {
  return enTransaccion(async (tx): Promise<Resultado> => {
    const { venta: v, ocupa } = await bloquear(tx, id, yo.usuario, lugar);
    if (!v) return { error: "Ese ticket ya no está en la caja." };
    if (fueraDeSucursal(yo.sucursales, v.sucursal))
      return { error: `Ese ticket es de la caja de ${nombreSucursalPunto(v.sucursal)}.` };
    switch (v.estado) {
      case "en-caja":
        break;
      case "cobrando": {
        if (v.tomadoPor === yo.usuario) {
          if (v.lugar === lugar) return { ok: true, venta: aGuardada(v), cambio: false };
          break; // la vuelve a tomar desde otra pestaña
        }
        const hace = v.tomadoEn ? Date.now() - v.tomadoEn.getTime() : Infinity;
        if (hace < TOMADA_VENCE_MS) return { error: `La está cobrando ${v.tomadoPor || "otro cajero"}.` };
        break; // la dejo hace rato: la toma este
      }
      case "cobrada":
        return { error: "Ese ticket ya se cobró." };
      case "anulada":
        return { error: "Ese ticket se anuló." };
      case "pedido":
        return { error: "Eso es un pedido tomado, no un ticket de caja." };
      default:
        return { error: "Ese ticket ya no está en la caja: lo retomó el vendedor." };
    }
    // Lo que el cajero tenia en esta pestaña se suelta sin podar, y se poda
    // al final (ver soltarLugar).
    const soltada = ocupa && ocupa.id !== v.id ? ocupa : null;
    if (soltada) await soltarLugar(tx, soltada, false);
    const nueva = await tx.puntoVenta.update({
      where: { id },
      data: {
        estado: "cobrando",
        usuario: yo.usuario,
        lugar,
        tomadoPor: yo.usuario,
        tomadoEn: new Date(),
        version: { increment: 1 },
      },
    });
    if (soltada) await podarBorradores(tx, soltada.usuario);
    return { ok: true, venta: aGuardada(nueva), cambio: true };
  });
}

/** El cajero lo devuelve a la caja sin cobrarlo: vuelve a ser del vendedor. */
export async function soltar(yo: Quien, id: string): Promise<Resultado> {
  return enTransaccion(async (tx): Promise<Resultado> => {
    const { venta: v } = await bloquear(tx, id, yo.usuario, null);
    if (!v) return { error: "Ese ticket ya no está." };
    if (v.estado === "en-caja") return { ok: true, venta: aGuardada(v), cambio: false };
    if (v.estado !== "cobrando") return { error: porQueNoEsTuya(v, yo.usuario, "") ?? "Ese ticket no se puede soltar." };
    if (v.tomadoPor !== yo.usuario) return { error: `La está cobrando ${v.tomadoPor || "otro cajero"}.` };
    const nueva = await tx.puntoVenta.update({
      where: { id },
      data: {
        estado: "en-caja",
        usuario: v.vendedorUsuario,
        lugar: null,
        tomadoPor: null,
        tomadoEn: null,
        version: { increment: 1 },
      },
    });
    return { ok: true, venta: aGuardada(nueva), cambio: true };
  });
}

/** No se cobra. La anula el que la tiene; un ticket que espera en la caja,
 *  tambien un cajero; un pedido, tambien el que maneja los pedidos. Lo
 *  cobrado no: ya tiene comprobante. */
export async function anular(yo: Quien, id: string): Promise<Resultado> {
  return enTransaccion(async (tx): Promise<Resultado> => {
    const { venta: v } = await bloquear(tx, id, yo.usuario, null);
    if (!v) return { error: "Esa venta ya no está." };
    if (v.estado === "anulada") return { ok: true, venta: aGuardada(v), cambio: false };
    if (v.estado === "cobrada") return { error: "Esa venta ya se cobró: tiene comprobante, no se anula desde acá." };
    if (v.estado === "cobrando" && v.tomadoPor !== yo.usuario)
      return { error: `La está cobrando ${v.tomadoPor || "otro cajero"}.` };
    const puede =
      v.usuario === yo.usuario ||
      (v.estado === "en-caja" && cajeroDe(yo, v)) ||
      (v.estado === "pedido" && yo.puedePedidos);
    if (!puede) return { error: "Esa venta es de otro usuario: no la podés anular." };
    const nueva = await tx.puntoVenta.update({
      where: { id },
      data: { estado: "anulada", lugar: null, version: { increment: 1 } },
    });
    return { ok: true, venta: aGuardada(nueva), cambio: true };
  });
}

// ------------------------------------------------------------ PEDIDOS

/** El numero que ya tiene el pedido (datos.ped.nro), si tiene. */
function nroDe(datos: unknown): number | null {
  const ped = datos && typeof datos === "object" && !Array.isArray(datos) ? (datos as Record<string, unknown>).ped : null;
  const nro = ped && typeof ped === "object" && !Array.isArray(ped) ? Number((ped as Record<string, unknown>).nro) : NaN;
  return Number.isInteger(nro) && nro > 0 ? nro : null;
}

/** La marca del pedido nuevo (datos.ped.marca): la inventa la pagina una vez
 *  por pedido y la repite si reintenta. Una que no tiene forma no cuenta (el
 *  pedido se toma igual, sin la proteccion del reintento). */
export const MARCA_PEDIDO = /^[A-Za-z0-9_-]{8,64}$/;
export function marcaDe(datos: unknown): string | null {
  const ped = datos && typeof datos === "object" && !Array.isArray(datos) ? (datos as Record<string, unknown>).ped : null;
  const marca = ped && typeof ped === "object" && !Array.isArray(ped) ? (ped as Record<string, unknown>).marca : null;
  return typeof marca === "string" && MARCA_PEDIDO.test(marca) ? marca : null;
}

/** datos con datos.ped.nro = nro (el que da el servidor, no la pagina). */
function conNro(datos: Record<string, unknown>, nro: number): Record<string, unknown> {
  const ped = datos.ped && typeof datos.ped === "object" && !Array.isArray(datos.ped) ? datos.ped : {};
  return { ...datos, ped: { ...(ped as Record<string, unknown>), nro } };
}

/** Toma un pedido (sin id), lo cambia (id de un pedido) o pasa a pedido la
 *  venta que se estaba armando (id de una venta suya). El numero sale al
 *  crearlo, de la misma serie "pedido" que los comprobantes, adentro de la
 *  misma transaccion: dos puestos nunca sacan el mismo. Despues no cambia. */
export async function guardarPedido(
  yo: Quien,
  p: { id: string | null; version: number | null; venta: VentaNueva },
): Promise<Resultado> {
  const v = p.venta;
  return enTransaccion(async (tx): Promise<Resultado> => {
    if (!p.id) {
      // Se corto la respuesta y la pagina lo vuelve a mandar: sin esto salia
      // un segundo pedido con otro numero. Con la marca, el reintento
      // devuelve el que ya se tomo. El lock (hasta el COMMIT) hace esperar
      // al envio que llega a la vez, que despues lo encuentra.
      const marca = marcaDe(v.datos);
      if (marca) {
        await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-pedido:" + yo.usuario + ":" + marca}))`;
        const ya = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "PuntoVenta"
           WHERE "usuario" = ${yo.usuario} AND "datos"->'ped'->>'marca' = ${marca}
           ORDER BY "creadoEn" ASC
           LIMIT 1`;
        const fila = ya.length ? await tx.puntoVenta.findUnique({ where: { id: ya[0].id } }) : null;
        if (fila) return { ok: true, venta: aGuardada(fila), cambio: false };
      }
      const nro = await siguientePedido(tx);
      const nueva = await tx.puntoVenta.create({
        data: {
          estado: "pedido",
          usuario: yo.usuario,
          vendedor: v.vendedor || yo.nombre,
          vendedorUsuario: yo.usuario,
          sucursal: v.sucursal,
          lugar: null,
          cliente: v.cliente,
          total: v.total,
          origenId: v.origenId ?? null,
          datos: conNro(v.datos, nro) as Prisma.InputJsonValue,
        },
      });
      return { ok: true, venta: aGuardada(nueva), cambio: true, nuevo: true };
    }

    const { venta: fila } = await bloquear(tx, p.id, yo.usuario, null);
    if (!fila) return { error: "Ese pedido ya no está." };
    if (fila.estado === "pedido") {
      if (versionMovida(fila, p.version)) return conflicto(MOVIDA, fila, yo);
      // El que lo tomo y su vendedor quedan: cambiarlo no se lo lleva.
      const nro = nroDe(fila.datos) ?? (await siguientePedido(tx));
      const nueva = await tx.puntoVenta.update({
        where: { id: fila.id },
        data: {
          datos: conNro(v.datos, nro) as Prisma.InputJsonValue,
          cliente: v.cliente,
          total: v.total,
          sucursal: v.sucursal,
          ...(v.origenId !== undefined ? { origenId: v.origenId } : {}),
          version: { increment: 1 },
        },
      });
      return { ok: true, venta: aGuardada(nueva), cambio: true };
    }
    if ((fila.estado === "armando" || fila.estado === "borrador") && fila.usuario === yo.usuario) {
      if (versionMovida(fila, p.version)) return conflicto(MOVIDA, fila, yo);
      const nro = await siguientePedido(tx);
      const nueva = await tx.puntoVenta.update({
        where: { id: fila.id },
        data: {
          estado: "pedido",
          lugar: null,
          datos: conNro(v.datos, nro) as Prisma.InputJsonValue,
          cliente: v.cliente,
          total: v.total,
          sucursal: v.sucursal,
          vendedor: v.vendedor || fila.vendedor,
          ...(v.origenId !== undefined ? { origenId: v.origenId } : {}),
          version: { increment: 1 },
        },
      });
      return { ok: true, venta: aGuardada(nueva), cambio: true, nuevo: true };
    }
    return { error: porQueNoEsTuya(fila, yo.usuario, fila.lugar ?? "") ?? "Eso no se puede pasar a pedido." };
  });
}

/** El numero del pedido, para el Registro. */
export function numeroDePedido(v: VentaGuardada): number | null {
  return nroDe(v.datos);
}

// ------------------------------------------------------------ LISTAS

/** Lo de este usuario: la venta de cada pestaña (armandose, o el ticket que
 *  esta cobrando), sus borradores y sus pedidos. Lo mas nuevo primero. */
export async function listarMias(usuario: string): Promise<VentaGuardada[]> {
  const [abiertas, pedidos] = await Promise.all([
    prisma.puntoVenta.findMany({
      where: { usuario, estado: { in: ["armando", "cobrando", "borrador"] } },
      orderBy: { actualizadoEn: "desc" },
      take: MAX_LISTA,
    }),
    pedidosPrimeroLosAbiertos(usuario),
  ]);
  return [...abiertas.map(aGuardada), ...pedidos];
}

/** Los pedidos, hasta 200: primero los que todavia no se entregaron y,
 *  dentro de cada grupo, lo mas nuevo primero. Ordenados solo por fecha, los
 *  entregados (que se juntan para siempre) dejaban afuera del tope de 200 a
 *  los que siguen abiertos, que son los que hay que mirar. El estado lo
 *  escribe la pagina en datos.ped.est ("preparando", "entregado"...): sin
 *  estado cuenta como abierto (NULLS FIRST). Se ordena en la base y despues
 *  se traen las filas por id, en ese orden. */
async function pedidosPrimeroLosAbiertos(usuario: string | null): Promise<VentaGuardada[]> {
  const ids = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PuntoVenta"
     WHERE "estado" = 'pedido'
       ${usuario === null ? Prisma.empty : Prisma.sql`AND "usuario" = ${usuario}`}
     ORDER BY ("datos"->'ped'->>'est' = 'entregado') ASC NULLS FIRST, "creadoEn" DESC, "id" DESC
     LIMIT ${Prisma.raw(String(MAX_LISTA))}`;
  if (!ids.length) return [];
  const filas = await prisma.puntoVenta.findMany({ where: { id: { in: ids.map((f) => f.id) } } });
  const porId = new Map(filas.map((f) => [f.id, f]));
  return ids.flatMap((f) => {
    const fila = porId.get(f.id);
    return fila ? [aGuardada(fila)] : [];
  });
}

/** La caja de una sucursal: lo que espera y lo que se esta cobrando. El que
 *  llego primero, primero (actualizadoEn: el momento en que se mando a la
 *  caja o se devolvio). */
export async function listarCaja(sucursal: string): Promise<VentaGuardada[]> {
  const filas = await prisma.puntoVenta.findMany({
    where: { sucursal, estado: { in: ["en-caja", "cobrando"] } },
    orderBy: [{ actualizadoEn: "asc" }, { id: "asc" }],
    take: MAX_LISTA,
  });
  return filas.map(aGuardada);
}

/** Todos los pedidos tomados, de cualquiera: los abiertos primero, y lo mas
 *  nuevo primero (ver pedidosPrimeroLosAbiertos). */
export async function listarPedidos(): Promise<VentaGuardada[]> {
  return pedidosPrimeroLosAbiertos(null);
}
