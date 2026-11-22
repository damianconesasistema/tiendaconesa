import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ProveedorNuevo } from "./punto-proveedores-limpiar";

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
//   descuentos (cadena): esa se carga en Punto y GBP no la conoce.
// - Importar no borra: el que no vino en el Excel queda como estaba. Para
//   dar de baja, GBP lo marca Inactivo y se importa de nuevo.

export { limpiarProveedor } from "./punto-proveedores-limpiar";
export type { ProveedorNuevo } from "./punto-proveedores-limpiar";

export const MAX_PROVEEDORES = 5000;

/** De a cuantos se guardan. Cada tanda es una transaccion: los 189 de hoy
 *  entran en una, y un Excel de miles no arma una transaccion gigante. */
const TANDA = 200;

export type ProveedorGuardado = ProveedorNuevo & {
  id: string;
  /** La cadena de descuentos, cuando la tenga. */
  cadena: Prisma.JsonValue | null;
  creadoEn: string;
  actualizadoEn: string;
  actualizadoPor: string;
};

/** Guarda los que llegan, por ID de GBP: el que ya estaba se actualiza, el
 *  que no, se crea. Si el mismo ID viene dos veces, vale el ultimo. */
export async function importarProveedores(
  filas: ProveedorNuevo[],
  usuario: string,
): Promise<{ nuevos: number; actualizados: number; total: number }> {
  const porId = new Map<number, ProveedorNuevo>();
  for (const p of filas) porId.set(p.gbpId, p);
  const llegan = [...porId.values()];

  const ids = llegan.map((p) => p.gbpId);
  const antes = new Set(
    (await prisma.puntoProveedor.findMany({ where: { gbpId: { in: ids } }, select: { gbpId: true } })).map(
      (p) => p.gbpId,
    ),
  );

  for (let i = 0; i < llegan.length; i += TANDA) {
    const tanda = llegan.slice(i, i + TANDA);
    // Si una tanda falla, las anteriores quedan guardadas. No hace mal:
    // importar de nuevo el mismo Excel termina de guardar lo que falto y no
    // duplica nada.
    await prisma.$transaction(
      tanda.map((p) => {
        // Solo lo que viene de GBP: ni "cadena" ni "creadoEn" se tocan.
        const datos = {
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
          actualizadoPor: usuario,
        };
        return prisma.puntoProveedor.upsert({
          where: { gbpId: p.gbpId },
          create: { gbpId: p.gbpId, ...datos },
          update: datos,
        });
      }),
    );
  }

  const actualizados = llegan.filter((p) => antes.has(p.gbpId)).length;
  return {
    nuevos: llegan.length - actualizados,
    actualizados,
    total: await prisma.puntoProveedor.count(),
  };
}

/** Todos, por razon social. */
export async function listarProveedores(): Promise<ProveedorGuardado[]> {
  const filas = await prisma.puntoProveedor.findMany({ orderBy: [{ razonSocial: "asc" }, { gbpId: "asc" }] });
  return filas.map((p) => ({
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
    creadoEn: p.creadoEn.toISOString(),
    actualizadoEn: p.actualizadoEn.toISOString(),
    actualizadoPor: p.actualizadoPor,
  }));
}
