import { Prisma, type PuntoCliente } from "@prisma/client";
import { prisma } from "@/lib/db";

// Los clientes de Punto, en el servidor (migracion 55, V.0.99.82).
//
// Damian, 22/11/2026: "Todo tiene que estar en el servidor, nada de en
// ninguna maquina local, porque se va a leer con varios usuarios en
// diferentes computadoras y en diferentes lugares". Hasta ahora el cliente
// que se daba de alta en un puesto quedaba en esa compu: el de al lado no lo
// encontraba y lo volvia a cargar.
//
// NO van en el codigo de Punto (src/app/sistema/punto.ts): el repositorio es
// publico y son datos de personas (telefono, mail, domicilio). Los entrega
// /sistema/clientes solo a quien entro con usuario y permiso de "Sistema
// Punto".
//
// Reglas que salen de aca:
// - El CUIT no se repite: dar de alta uno que ya esta devuelve el que estaba
//   (yaEstaba). Dos puestos que lo cargan a la vez esperan uno al otro (un
//   lock de Postgres por CUIT, hasta el COMMIT) y el segundo recibe el del
//   primero. Lo mismo con el ID de GBP.
// - Lo que vuelve a la pagina va adentro de innerHTML: sin < ni >.
// - Buscar no mira tildes ni mayusculas ("gomez" encuentra "GÓMEZ").
// - No se borra: se marca inactivo.

export const MAX_BUSQUEDA = 50;
export const MAX_IDS = 200;

export type ClienteGuardado = {
  id: string;
  gbpId: number | null;
  cuit: string;
  dni: string;
  nombre: string;
  condicionIva: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  telefono: string;
  email: string;
  lista: string;
  limite: number;
  inactivo: boolean;
  creadoPor: string;
  creadoEn: string;
  actualizadoEn: string;
};

export type ClienteNuevo = Omit<ClienteGuardado, "id" | "creadoPor" | "creadoEn" | "actualizadoEn">;

const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/;
/** El mayor que entra en una columna INTEGER de Postgres. */
const MAX_INT = 2_147_483_647;

/** Sin < > (va a innerHTML), sin caracteres de control (Postgres no acepta
 *  el 0x00 en un TEXT), espacios repetidos en uno, y cortado por punto de
 *  codigo: un emoji partido al medio hace fallar el guardado. Como en
 *  src/lib/punto-proveedores-limpiar.ts. Del Excel un numero puede llegar
 *  como numero: se toma como texto. */
const texto = (v: unknown, max: number): string => {
  const s = typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "";
  const limpio = s
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(limpio).slice(0, max).join("").toWellFormed().trim();
};

/** Sin tildes y en minuscula, para comparar ("Gómez" con "gomez"). */
const llano = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function aGuardado(c: PuntoCliente): ClienteGuardado {
  return {
    id: c.id,
    gbpId: c.gbpId,
    cuit: c.cuit,
    dni: c.dni,
    nombre: c.nombre,
    condicionIva: c.condicionIva,
    domicilio: c.domicilio,
    localidad: c.localidad,
    provincia: c.provincia,
    telefono: c.telefono,
    email: c.email,
    lista: c.lista,
    limite: c.limite,
    inactivo: c.inactivo,
    creadoPor: c.creadoPor,
    creadoEn: c.creadoEn.toISOString(),
    actualizadoEn: c.actualizadoEn.toISOString(),
  };
}

/** Lo que manda la pagina, revisado. Lo que no tiene forma de cliente se
 *  rechaza con el motivo, para que la pantalla lo diga. */
export function limpiarCliente(x: unknown): { cliente: ClienteNuevo } | { error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return { error: "No llegó el cliente." };
  const o = x as Record<string, unknown>;
  const nombre = texto(o.nombre, 120);
  if (!nombre) return { error: "Falta el nombre del cliente." };
  // Con guiones o sin, se guardan solo los numeros.
  const cuit = texto(o.cuit, 40).replace(/\D/g, "");
  if (cuit && cuit.length !== 11) return { error: "El CUIT tiene que tener 11 números." };
  const dni = texto(o.dni, 40).replace(/\D/g, "");
  if (dni.length > 11) return { error: "El DNI tiene demasiados números." };
  const gbp = Number(o.gbpId);
  const limite = Number(o.limite);
  return {
    cliente: {
      gbpId: o.gbpId != null && o.gbpId !== "" && Number.isInteger(gbp) && gbp > 0 && gbp <= MAX_INT ? gbp : null,
      cuit,
      dni,
      nombre,
      condicionIva: texto(o.condicionIva, 60),
      domicilio: texto(o.domicilio, 160),
      localidad: texto(o.localidad, 80),
      provincia: texto(o.provincia, 80),
      telefono: texto(o.telefono, 60),
      email: texto(o.email, 120),
      lista: texto(o.lista, 40),
      limite: Number.isFinite(limite) && limite > 0 && limite < 1e11 ? Math.round(limite * 100) / 100 : 0,
      inactivo: o.inactivo === true,
    },
  };
}

/** Da de alta un cliente. Si ya hay uno con ese CUIT (o ese ID de GBP),
 *  devuelve ese y no crea otro. */
export async function crearCliente(
  c: ClienteNuevo,
  por: string,
): Promise<{ cliente: ClienteGuardado; yaEstaba: boolean }> {
  return prisma.$transaction(
    async (tx) => {
      // El lock dura hasta el COMMIT: el otro puesto que da de alta el mismo
      // CUIT espera, y despues lo encuentra. FROM pg_advisory_xact_lock(): la
      // funcion no devuelve nada (void) y asi no hay columna que leer.
      if (c.cuit)
        await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-cliente:cuit:" + c.cuit}))`;
      if (c.gbpId != null)
        await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-cliente:gbp:" + c.gbpId}))`;
      if (c.cuit) {
        const ya = await tx.puntoCliente.findFirst({ where: { cuit: c.cuit }, orderBy: { creadoEn: "asc" } });
        if (ya) return { cliente: aGuardado(ya), yaEstaba: true };
      }
      if (c.gbpId != null) {
        const ya = await tx.puntoCliente.findUnique({ where: { gbpId: c.gbpId } });
        if (ya) return { cliente: aGuardado(ya), yaEstaba: true };
      }
      const nuevo = await tx.puntoCliente.create({ data: { ...c, creadoPor: por } });
      return { cliente: aGuardado(nuevo), yaEstaba: false };
    },
    { maxWait: 10_000, timeout: 15_000 },
  );
}

/** Busca por nombre, CUIT, DNI o localidad, sin mirar tildes ni mayusculas.
 *  Cada palabra tiene que estar (en cualquier orden). Los activos primero.
 *  Sin texto: los ultimos que se cargaron o cambiaron. */
export async function buscarClientes(q: string): Promise<ClienteGuardado[]> {
  const palabras = llano(q.slice(0, 120))
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    // "20-12345678-9" o "12.345.678": el CUIT y el DNI se guardan sin guiones.
    .map((w) => (/^[\d.\-/]+$/.test(w) ? w.replace(/\D/g, "") : w))
    .filter(Boolean);
  if (!palabras.length) {
    const filas = await prisma.puntoCliente.findMany({ orderBy: { actualizadoEn: "desc" }, take: MAX_BUSQUEDA });
    return filas.map(aGuardado);
  }
  // % y _ son comodines de LIKE: si los escribe el usuario, van literales.
  const patrones = palabras.map((w) => `%${w.replace(/[\\%_]/g, (m) => "\\" + m)}%`);
  // translate() saca las tildes del lado de la base, tambien en mayuscula
  // (lower() no las baja si la base no tiene la configuracion regional).
  const filas = await prisma.$queryRaw<{ id: string }[]>`
    SELECT "id" FROM "PuntoCliente"
     WHERE translate(
             lower("nombre" || ' ' || "cuit" || ' ' || "dni" || ' ' || "localidad"),
             'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
             'aaaaaeeeeiiiiooooouuuuncaaaaaeeeeiiiiooooouuuunc'
           ) LIKE ALL (${patrones}::text[])
     ORDER BY "inactivo" ASC, "nombre" ASC, "id" ASC
     LIMIT ${Prisma.raw(String(MAX_BUSQUEDA))}`;
  return clientesPorIds(filas.map((f) => f.id));
}

/** Todos, para la solapa Clientes (V.0.11.241): tambien los dados de baja.
 *  Damian, 24/11/2026: "tendrias que hacerme una seccion clientes donde estan
 *  todos los datos de ellos". La pagina los filtra (3.800 son ~1 MB). */
export async function listarClientes(): Promise<ClienteGuardado[]> {
  const filas = await prisma.puntoCliente.findMany({ orderBy: [{ nombre: "asc" }, { id: "asc" }] });
  return filas.map(aGuardado);
}

/** Lo que se puede cambiar desde la ficha. El ID de GBP no. */
const CAMBIABLES = [
  "cuit",
  "dni",
  "nombre",
  "condicionIva",
  "domicilio",
  "localidad",
  "provincia",
  "telefono",
  "email",
  "lista",
  "limite",
  "inactivo",
] as const;

/** Cambia solo lo que vino, con las mismas reglas del alta. El CUIT no se
 *  repite: si ya lo tiene otro, no guarda y devuelve el id de ese. */
export async function cambiarCliente(
  id: string,
  cambios: unknown,
): Promise<{ cliente: ClienteGuardado; antes: ClienteGuardado } | { error: string; id?: string }> {
  if (!ID_VALIDO.test(id)) return { error: "No sé qué cliente es." };
  if (!cambios || typeof cambios !== "object" || Array.isArray(cambios)) return { error: "No llegaron los cambios." };
  const c = cambios as Record<string, unknown>;
  if (!CAMBIABLES.some((k) => k in c)) return { error: "No llegaron los cambios." };
  return prisma.$transaction(
    async (tx) => {
      const actual = await tx.puntoCliente.findUnique({ where: { id } });
      if (!actual) return { error: "Ese cliente ya no está." };
      const antes = aGuardado(actual);
      const mezcla: Record<string, unknown> = { ...antes };
      for (const k of CAMBIABLES) if (k in c) mezcla[k] = c[k];
      const limpio = limpiarCliente(mezcla);
      if ("error" in limpio) return { error: limpio.error };
      const n = limpio.cliente;
      if (n.cuit && n.cuit !== actual.cuit) {
        // Como el alta: dos puestos que ponen el mismo CUIT esperan uno al otro.
        await tx.$queryRaw`SELECT 1 AS "ok" FROM pg_advisory_xact_lock(hashtext(${"punto-cliente:cuit:" + n.cuit}))`;
        const otro = await tx.puntoCliente.findFirst({ where: { cuit: n.cuit, id: { not: id } } });
        if (otro) return { error: `Ese CUIT ya lo tiene ${otro.nombre}.`, id: otro.id };
      }
      const nuevo = await tx.puntoCliente.update({
        where: { id },
        data: {
          cuit: n.cuit,
          dni: n.dni,
          nombre: n.nombre,
          condicionIva: n.condicionIva,
          domicilio: n.domicilio,
          localidad: n.localidad,
          provincia: n.provincia,
          telefono: n.telefono,
          email: n.email,
          lista: n.lista,
          limite: n.limite,
          inactivo: n.inactivo,
        },
      });
      return { cliente: aGuardado(nuevo), antes };
    },
    { maxWait: 10_000, timeout: 15_000 },
  );
}

/** Los clientes con esos ids, en el mismo orden. Los que no estan, no. */
export async function clientesPorIds(ids: string[]): Promise<ClienteGuardado[]> {
  const validos = [...new Set(ids.filter((id) => ID_VALIDO.test(id)))].slice(0, MAX_IDS);
  if (!validos.length) return [];
  const filas = await prisma.puntoCliente.findMany({ where: { id: { in: validos } } });
  const porId = new Map(filas.map((f) => [f.id, f]));
  return validos.flatMap((id) => {
    const f = porId.get(id);
    return f ? [aGuardado(f)] : [];
  });
}
