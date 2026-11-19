"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { agregarRubro, agregarSubrubro } from "@/lib/rubros-server";
import { conRegistro } from "@/lib/actividad";

// "+ Agregar rubro / subrubro nuevo" de los desplegables del panel (Crear por
// Excel, la ficha, el alta a mano). Ver src/lib/rubros.ts.

function refrescar() {
  revalidatePath("/tienda");
  revalidatePath("/admin/productos");
}

async function agregarRubroAMano__(nombre: string) {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, error: "Sesión vencida. Entrá de nuevo." };
  const r = await agregarRubro(nombre);
  if (r.ok) refrescar();
  return r;
}

async function agregarSubrubroAMano__(rubro: string, nombre: string) {
  const session = await getAdminSession();
  if (!session) return { ok: false as const, error: "Sesión vencida. Entrá de nuevo." };
  const r = await agregarSubrubro(rubro, nombre);
  if (r.ok) refrescar();
  return r;
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function agregarRubroAMano(...a: Parameters<typeof agregarRubroAMano__>): ReturnType<typeof agregarRubroAMano__> {
  return conRegistro("agregarRubroAMano", a, () => agregarRubroAMano__(...a));
}
export async function agregarSubrubroAMano(...a: Parameters<typeof agregarSubrubroAMano__>): ReturnType<typeof agregarSubrubroAMano__> {
  return conRegistro("agregarSubrubroAMano", a, () => agregarSubrubroAMano__(...a));
}
