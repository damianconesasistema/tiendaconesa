// Los rubros de la tienda: UNA sola lista para el panel, el alta por Excel,
// la ficha y el catalogo. Antes cada pantalla tenia la suya y el mismo rubro
// se llamaba "Bañeras" en una y "Equipamiento de baño" en otra.
//
// Ademas de estos, Damian agrega rubros y subrubros a mano desde el panel
// (17/11/2026: "agregame la posibilidad de agregar a mano cualquier rubro o
// subrubro"). Esos viven en la tabla Setting (src/lib/rubros-server.ts) y
// llegan a cada pantalla como RubrosExtra. En la base se guarda el slug.
//
// Este archivo no toca la base: lo usan la tienda, el panel y el alta.

export type Rubro = { slug: string; name: string };

/** Lo agregado a mano desde el panel. */
export type RubrosExtra = {
  rubros: Rubro[];
  /** Por rubro: sus subrubros agregados a mano. */
  subrubros: Record<string, Rubro[]>;
};

export const SIN_EXTRAS: RubrosExtra = { rubros: [], subrubros: {} };

/** Los de siempre, en el orden en que se muestran. "Otros" va al final. */
export const RUBROS_BASE: readonly Rubro[] = [
  // Damian, 17/11/2026: "piletas seria BACHA DE COCINA y SANITARIOS seria
  // LOZA SANITARIA". El slug no cambia: los links y lo guardado siguen igual.
  { slug: "sanitarios", name: "Loza sanitaria" },
  { slug: "griferia", name: "Grifería" },
  { slug: "banera", name: "Equipamiento de Baño" },
  { slug: "accesorios", name: "Accesorios" },
  { slug: "salamandras", name: "Salamandras" },
  { slug: "calefones", name: "Termotanques y Calefones" },
  { slug: "materiales", name: "Tanques" },
  { slug: "piletas", name: "Bacha de cocina" },
  { slug: "herramientas", name: "Herramientas" },
  { slug: "cocina", name: "Cocina y Ventilación" },
  { slug: "otros", name: "Otros" },
];

/** De la A a la Z, con "Otros" siempre al final. Damian, 18/11/2026:
 *  "ordename eso alfabeticamente siempre". Solo para mostrar: no cambia en
 *  que orden se reconocen los subrubros en los titulos. */
export function alfabetico<T extends { name: string; slug: string }>(lista: readonly T[]): T[] {
  return [...lista].sort((a, b) =>
    a.slug === "otros" ? 1 : b.slug === "otros" ? -1 : a.name.localeCompare(b.name, "es"),
  );
}

/** Los de siempre mas los agregados a mano, de la A a la Z y con "Otros" al
 *  final. */
export function todosLosRubros(extra: RubrosExtra = SIN_EXTRAS): Rubro[] {
  const ids = new Set(RUBROS_BASE.map((r) => r.slug));
  const nuevos = extra.rubros.filter((r) => !ids.has(r.slug));
  return alfabetico([...RUBROS_BASE.filter((r) => r.slug !== "otros"), ...nuevos, { slug: "otros", name: "Otros" }]);
}

/** El nombre para mostrar. Si el slug no esta en ninguna lista, el slug. */
export function nombreRubro(
  slug: string | null | undefined,
  extra: RubrosExtra = SIN_EXTRAS,
): string {
  if (!slug) return "";
  return todosLosRubros(extra).find((r) => r.slug === slug)?.name ?? slug;
}

/** "Jardín y Riego" -> "jardin-y-riego": lo que se guarda en la base. */
export function slugDeNombre(nombre: string): string {
  return String(nombre ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** La opcion "+ Agregar..." de los desplegables: no es un rubro. */
export const OPCION_NUEVO = "__nuevo__";
