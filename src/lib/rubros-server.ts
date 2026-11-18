// Los rubros y subrubros agregados a mano desde el panel. Viven en la tabla
// Setting como JSON, igual que las marcas agregadas (src/lib/marcas-server.ts):
// son un punado, no tienen relaciones y Product.category / subcategory ya
// guardan el slug suelto. Ver src/lib/rubros.ts.

import { getSetting, setSetting } from "@/lib/settings";
import { slugDeNombre, todosLosRubros, type Rubro, type RubrosExtra } from "@/lib/rubros";
import { subrubrosDe } from "@/lib/subrubros";

const S_RUBROS = "rubros_extra";
const S_SUBRUBROS = "subrubros_extra";

function lista(x: unknown): Rubro[] {
  if (!Array.isArray(x)) return [];
  return x
    .filter(
      (r): r is Rubro =>
        !!r && typeof r.slug === "string" && typeof r.name === "string" && !!r.slug && !!r.name,
    )
    .map((r) => ({ slug: r.slug, name: r.name }));
}

export async function getRubrosExtra(): Promise<RubrosExtra> {
  const [a, b] = await Promise.all([getSetting(S_RUBROS), getSetting(S_SUBRUBROS)]);
  let rubros: Rubro[] = [];
  const subrubros: Record<string, Rubro[]> = {};
  try {
    rubros = lista(JSON.parse(a || "[]"));
  } catch {
    /* si quedo algo raro, sin agregados: la tienda sigue andando */
  }
  try {
    const o = JSON.parse(b || "{}");
    if (o && typeof o === "object" && !Array.isArray(o))
      for (const [rubro, v] of Object.entries(o)) {
        const l = lista(v);
        if (l.length) subrubros[rubro] = l;
      }
  } catch {
    /* idem */
  }
  return { rubros, subrubros };
}

type Agregado =
  | { ok: true; item: Rubro; extra: RubrosExtra }
  | { ok: false; error: string };

function nombreLimpio(nombre: string): string | null {
  const n = String(nombre ?? "").replace(/\s+/g, " ").trim();
  return n.length >= 2 && n.length <= 40 && slugDeNombre(n) ? n : null;
}

const igual = (a: string, b: string) => slugDeNombre(a) === slugDeNombre(b);

/** Un rubro nuevo. Si ya hay uno con ese nombre, devuelve ese. */
export async function agregarRubro(nombre: string): Promise<Agregado> {
  const name = nombreLimpio(nombre);
  if (!name) return { ok: false, error: "El nombre tiene que tener entre 2 y 40 letras." };
  const extra = await getRubrosExtra();
  const ya = todosLosRubros(extra).find((r) => r.slug === slugDeNombre(name) || igual(r.name, name));
  if (ya) return { ok: true, item: ya, extra };
  const item = { slug: slugDeNombre(name), name };
  const nuevo = { ...extra, rubros: [...extra.rubros, item] };
  await setSetting(S_RUBROS, JSON.stringify(nuevo.rubros));
  return { ok: true, item, extra: nuevo };
}

/** Un subrubro nuevo dentro de un rubro. Si ya hay uno con ese nombre en ese
 *  rubro, devuelve ese. */
export async function agregarSubrubro(rubro: string, nombre: string): Promise<Agregado> {
  const name = nombreLimpio(nombre);
  if (!name) return { ok: false, error: "El nombre tiene que tener entre 2 y 40 letras." };
  const extra = await getRubrosExtra();
  if (!todosLosRubros(extra).some((r) => r.slug === rubro))
    return { ok: false, error: "Ese rubro no existe." };
  const ya = subrubrosDe(rubro, extra).find((s) => s.slug === slugDeNombre(name) || igual(s.name, name));
  if (ya) return { ok: true, item: { slug: ya.slug, name: ya.name }, extra };
  const item = { slug: slugDeNombre(name), name };
  const nuevo: RubrosExtra = {
    ...extra,
    subrubros: { ...extra.subrubros, [rubro]: [...(extra.subrubros[rubro] ?? []), item] },
  };
  await setSetting(S_SUBRUBROS, JSON.stringify(nuevo.subrubros));
  return { ok: true, item, extra: nuevo };
}

/** Saca un rubro agregado a mano (y sus subrubros). Lo usa el reordenamiento
 *  de herramientas: "Bombas de Agua" paso a ser subrubro. Los productos se
 *  mueven antes: aca solo se lo saca de la lista. */
export async function quitarRubroAMano(slug: string): Promise<void> {
  const extra = await getRubrosExtra();
  const rubros = extra.rubros.filter((r) => r.slug !== slug);
  const subrubros = { ...extra.subrubros };
  delete subrubros[slug];
  await setSetting(S_RUBROS, JSON.stringify(rubros));
  await setSetting(S_SUBRUBROS, JSON.stringify(subrubros));
}

/** Saca de un rubro subrubros agregados a mano (los repetidos de uno de
 *  fabrica). Los productos se mueven antes. */
export async function quitarSubrubrosAMano(rubro: string, slugs: string[]): Promise<void> {
  const extra = await getRubrosExtra();
  const quedan = (extra.subrubros[rubro] ?? []).filter((s) => !slugs.includes(s.slug));
  const subrubros = { ...extra.subrubros };
  if (quedan.length) subrubros[rubro] = quedan;
  else delete subrubros[rubro];
  await setSetting(S_SUBRUBROS, JSON.stringify(subrubros));
}
