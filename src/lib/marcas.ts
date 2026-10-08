// Catálogo de marcas. Es la única fuente: el grid del home, el filtro del
// catálogo y el select de la ficha salen todos de acá.
//
// `id` es el slug que se guarda en Product.brand y viaja en la URL
// (/tienda?marca=fv). `alias` son las formas en que la marca aparece escrita
// en los títulos, para poder etiquetar lo que ya está cargado sin tener que
// tocar producto por producto.

export type Marca = {
  id: string;
  name: string;
  /** Si no tiene logo no aparece en el grid del home, pero sí como filtro. */
  logo?: string;
  /** El logo viene en color y lo queremos monocromo. */
  invert?: boolean;
  /** Logo casi cuadrado o de baja resolución: necesita mas alto para leerse. */
  grande?: boolean;
  /** Variantes de escritura que buscamos en el título. */
  alias?: string[];
};

export const MARCAS: readonly Marca[] = [
  { id: "ferrum", name: "Ferrum", logo: "/brand/marcas/ferrum.png" },
  { id: "fv", name: "FV", logo: "/brand/marcas/fv.png", invert: true },
  { id: "piazza", name: "Piazza", logo: "/brand/marcas/piazza.png" },
  { id: "hydros", name: "Hydros", logo: "/brand/marcas/hydros.png" },
  { id: "flowater", name: "Flowater", logo: "/brand/marcas/flowater.png", alias: ["flow water"] },
  { id: "tst", name: "TST", logo: "/brand/marcas/tst.png", invert: true },
  { id: "pringles", name: "Pringles", logo: "/brand/marcas/pringles.jpg", grande: true },
  { id: "bosca", name: "Bosca", logo: "/brand/marcas/bosca.png" },
  { id: "gulliart", name: "Gulliart", logo: "/brand/marcas/gulliart.png", invert: true },
  { id: "masecor", name: "Masecor", logo: "/brand/marcas/masecor.webp" },
  { id: "precons", name: "Precons", logo: "/brand/marcas/precons.png", invert: true },
  { id: "rot-ar", name: "ROT-AR", logo: "/brand/marcas/rot-ar.jpg", alias: ["rotar", "rot ar"] },
  { id: "acindar", name: "Acindar", logo: "/brand/marcas/acindar.webp", grande: true },
  { id: "tromen", name: "Tromen", logo: "/brand/marcas/tromen.png" },
  { id: "fusiogas", name: "Fusiogas", logo: "/brand/marcas/fusiogas.jpg", alias: ["fusio gas"] },
  { id: "awaduct", name: "Awaduct", logo: "/brand/marcas/awaduct.jpg" },
  { id: "saladillo", name: "Saladillo", logo: "/brand/marcas/saladillo.png", grande: true },
  { id: "dema", name: "Grupo DEMA", logo: "/brand/marcas/dema.png", alias: ["dema"] },
  { id: "redeco", name: "Redeco", logo: "/brand/marcas/redeco.avif" },
  { id: "heineken", name: "Heineken", logo: "/brand/marcas/heineken.png" },

  // Sin logo todavía: sirven igual para etiquetar y filtrar
  { id: "johnson", name: "Johnson", alias: ["johnson acero"] },
  { id: "roca", name: "Roca" },
  { id: "nuke", name: "Ñuke", alias: ["nuke"] },
  { id: "peirano", name: "Peirano" },
  { id: "genrod", name: "Genrod" },
  { id: "sanitarios-conesa", name: "Conesa" },
] as const;

export const MARCAS_CON_LOGO = MARCAS.filter((m) => m.logo);

const POR_ID = new Map(MARCAS.map((m) => [m.id, m]));

export function marcaPorId(id: string | null | undefined): Marca | null {
  if (!id) return null;
  return POR_ID.get(id) ?? null;
}

export function nombreMarca(id: string | null | undefined): string {
  return marcaPorId(id)?.name ?? "";
}

/** Saca tildes y pasa a minúscula, así "Ñuke" y "nuke" son lo mismo. */
function normalizar(txt: string) {
  return txt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Cada marca con sus términos partidos en palabras y ya normalizados. De más
// largo a más corto: "johnson acero" tiene que ganarle a "johnson", y una
// marca de dos palabras a una de una.
const TERMINOS = MARCAS.map((m) => ({
  id: m.id,
  terminos: [m.name, ...(m.alias ?? [])]
    .map((t) => palabras(t))
    .sort((a, b) => b.length - a.length),
})).sort((a, b) => b.terminos[0].length - a.terminos[0].length);

/** Parte en palabras: todo lo que no sea letra o número separa. */
function palabras(txt: string): string[] {
  return normalizar(txt)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Busca la marca dentro del título, comparando palabras enteras: si no, "fv"
 * aparecería dentro de cualquier código y "roca" dentro de "rocallosa".
 * Devuelve el slug o null si no reconoce ninguna.
 */
export function detectarMarca(titulo: string): string | null {
  const tokens = palabras(titulo);
  for (const { id, terminos } of TERMINOS) {
    for (const termino of terminos) {
      for (let i = 0; i + termino.length <= tokens.length; i++) {
        if (termino.every((w, j) => tokens[i + j] === w)) return id;
      }
    }
  }
  return null;
}
