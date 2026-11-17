// Subrubros: la division de adentro de un rubro.
//
// Los 121 FV de noviembre van todos a Griferia, y una lista de 121 griferias
// no se recorre. Damian pidio separarlos como venian en las pestañas de su
// Excel: duchas, lavatorio, bidet, accesorios (16/11/2026). Los accesorios
// (jaboneras, toalleros, perchas) quedan en Griferia por decision suya.
//
// La lista vive aca, en el codigo, y no se escribe a mano en cada producto:
// con un texto libre aparecerian "Ducha", "Duchas" y "DUCHA" como tres
// botones distintos en la tienda. En la base se guarda el slug.
//
// Este archivo no toca la base: lo usan la tienda, el panel y el alta.
// Los subrubros agregados a mano desde el panel llegan como `extra` (ver
// src/lib/rubros.ts): se suman a los de aca.

import { SIN_EXTRAS, type RubrosExtra } from "@/lib/rubros";

export type Subrubro = {
  slug: string;
  name: string;
  /** Palabras que lo delatan, sin acentos y en minuscula. Se buscan en el
   *  nombre de la pestaña del Excel y en el titulo. */
  palabras: readonly string[];
};

/** Por rubro, en el orden en que se muestran en la tienda. */
export const SUBRUBROS: Readonly<Record<string, readonly Subrubro[]>> = {
  griferia: [
    {
      slug: "ducha-banera",
      name: "Ducha y bañera",
      palabras: ["ducha", "banera", "lluvia", "duchador", "duchamatic", "teleducha"],
    },
    { slug: "lavatorio", name: "Lavatorio", palabras: ["lavatorio", "lavat"] },
    { slug: "bidet", name: "Bidet", palabras: ["bidet", "bide"] },
    { slug: "cocina", name: "Cocina", palabras: ["cocina", "mesada"] },
    { slug: "kit-bano", name: "Kit de baño", palabras: ["kit bano"] },
    { slug: "lavarropas", name: "Lavarropas", palabras: ["lavarropas"] },
    {
      slug: "accesorios",
      name: "Accesorios",
      palabras: [
        "accesorio",
        "acces",
        "jabonera",
        "toallero",
        "percha",
        "portarrollo",
        "portavaso",
      ],
    },
  ],
  // Equipamiento de baño. Damian, 17/11/2026, cargando Daccord: "aca faltara
  // en equipamiento de baño subrubro asientos". GBP los abrevia "ASIUREA"
  // (asiento de urea): "asiu" engancha el comienzo de esa palabra.
  banera: [
    {
      slug: "asientos",
      name: "Asientos",
      palabras: ["asiento", "asiu", "tapa inodoro", "tapa de inodoro"],
    },
    // Damian, 17/11/2026: "en equipamiento de baño tambien agregame subrubro
    // accesorios". Los accesorios de FV siguen en Griferia (decision suya).
    {
      slug: "accesorios",
      name: "Accesorios",
      palabras: [
        "accesorio",
        "acces",
        "toallero",
        "jabonera",
        "percha",
        "portarrollo",
        "porta rollo",
        "portavaso",
        "repisa",
        "barral",
      ],
    },
  ],
};

/** En que orden se prueban, que no es el de la tienda.
 *
 *  Un kit de baño dice "BAÑ/LAVAT/BIDE": nombra el lavatorio y el bidet, y es
 *  un kit. Una griferia de cocina para "MESADA" no es de lavatorio. Por eso
 *  van primero los que se nombran con una palabra que no se presta a
 *  confusion, y al final ducha, que aparece de costado en muchos titulos. */
const PRIORIDAD: Readonly<Record<string, readonly string[]>> = {
  griferia: [
    "kit-bano",
    "lavarropas",
    "cocina",
    "accesorios",
    "bidet",
    "lavatorio",
    "ducha-banera",
  ],
};

const plano = (s: string) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export function subrubrosDe(
  rubro: string | null | undefined,
  extra: RubrosExtra = SIN_EXTRAS,
): readonly Subrubro[] {
  const base = (rubro && SUBRUBROS[rubro]) || [];
  const aMano = (rubro && extra.subrubros[rubro]) || [];
  if (aMano.length === 0) return base;
  const ids = new Set(base.map((s) => s.slug));
  return [
    ...base,
    // Uno agregado a mano se reconoce por su propio nombre en el titulo.
    ...aMano
      .filter((s) => !ids.has(s.slug))
      .map((s) => ({ slug: s.slug, name: s.name, palabras: [plano(s.name)] })),
  ];
}

export function nombreSubrubro(
  rubro: string | null | undefined,
  slug: string | null | undefined,
  extra: RubrosExtra = SIN_EXTRAS,
): string | null {
  if (!slug) return null;
  return subrubrosDe(rubro, extra).find((s) => s.slug === slug)?.name ?? null;
}

/** El slug si existe en ese rubro; null si no. Para no guardar un subrubro de
 *  otro rubro cuando alguien cambia el rubro y deja el subrubro viejo. */
export function subrubroValido(
  rubro: string | null | undefined,
  slug: string | null | undefined,
  extra: RubrosExtra = SIN_EXTRAS,
): string | null {
  return nombreSubrubro(rubro, slug, extra) ? (slug as string) : null;
}

function buscar(rubro: string, texto: string, extra: RubrosExtra): string | null {
  const t = ` ${plano(texto)} `;
  if (t.trim() === "") return null;
  const lista = subrubrosDe(rubro, extra);
  // Los de PRIORIDAD primero; los demas (y los agregados a mano), despues.
  const primero = PRIORIDAD[rubro] ?? [];
  const orden = [...primero, ...lista.map((s) => s.slug).filter((s) => !primero.includes(s))];
  for (const slug of orden) {
    const s = lista.find((x) => x.slug === slug);
    if (!s) continue;
    // Palabra entera o comienzo de palabra: "lavat" engancha "lavatorio",
    // pero "cocina" no engancha "cocinero" de casualidad en el medio.
    if (s.palabras.some((p) => t.includes(` ${p}`))) return s.slug;
  }
  return null;
}

export type SubrubroSugerido = { slug: string | null; motivo: string };

/** Que subrubro le toca, mirando primero la pestaña del Excel.
 *
 *  La pestaña la armo Damian a mano y es la que mas sabe: en "ACCESORIOS FV"
 *  hay un "KIT 5 ACCESORIOS" que por el titulo seria un kit de baño. Si la
 *  pestaña no dice nada ("Hoja1"), se mira el titulo. */
export function subrubroSugerido(
  rubro: string,
  hoja: string | null,
  titulo: string,
  extra: RubrosExtra = SIN_EXTRAS,
): SubrubroSugerido {
  if (subrubrosDe(rubro, extra).length === 0) return { slug: null, motivo: "" };
  const porHoja = hoja ? buscar(rubro, hoja, extra) : null;
  if (porHoja) return { slug: porHoja, motivo: `de la pestaña "${hoja?.trim()}"` };
  const porTitulo = buscar(rubro, titulo, extra);
  if (porTitulo) return { slug: porTitulo, motivo: "de las palabras del título" };
  return { slug: null, motivo: "no se pudo deducir: elegilo vos" };
}
