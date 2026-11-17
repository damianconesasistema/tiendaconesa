"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { agregarRubro, agregarSubrubro } from "@/lib/rubros-server";

// "+ Agregar rubro / subrubro nuevo" de los desplegables del panel (Crear por
// Excel, la ficha, el alta a mano). Ver src/lib/rubros.ts.

function refrescar() {
  revalidatePath("/tienda");
  revalidatePath("/admin/productos");
}

export async function agregarRubroAMano(nombre: string) {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, error: "Sesión vencida. Entrá de nuevo." };
  const r = await agregarRubro(nombre);
  if (r.ok) refrescar();
  return r;
}

export async function agregarSubrubroAMano(rubro: string, nombre: string) {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, error: "Sesión vencida. Entrá de nuevo." };
  const r = await agregarSubrubro(rubro, nombre);
  if (r.ok) refrescar();
  return r;
}
