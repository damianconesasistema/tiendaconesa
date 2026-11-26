import { prisma } from "@/lib/db";
import { type Asociaciones, VACIAS } from "@/lib/punto-asociar-reglas";

// Las asociaciones de los artículos con los proveedores de la lista
// (V.0.11.288; reglas en src/lib/punto-asociar-reglas.ts). Un renglón de
// Setting: son unas decenas de nombres y marcas.

export const CLAVE_ASOCIAR = "punto.proveedores.asociar";

export async function leerAsociaciones(): Promise<Asociaciones> {
  const fila = await prisma.setting.findUnique({ where: { key: CLAVE_ASOCIAR } });
  try {
    const d = fila ? (JSON.parse(fila.value) as Partial<Asociaciones>) : {};
    return {
      porNombre: d.porNombre && typeof d.porNombre === "object" ? d.porNombre : {},
      porMarca: d.porMarca && typeof d.porMarca === "object" ? d.porMarca : {},
    };
  } catch {
    return { ...VACIAS };
  }
}

/** Reemplaza todas (la ventana manda cómo quedan). */
export async function guardarAsociaciones(a: Asociaciones): Promise<void> {
  const value = JSON.stringify(a);
  await prisma.setting.upsert({ where: { key: CLAVE_ASOCIAR }, update: { value }, create: { key: CLAVE_ASOCIAR, value } });
}
