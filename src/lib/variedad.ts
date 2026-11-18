// Una seleccion variada para la vitrina. Damian, 18/11/2026: "reformulame lo
// que muestra destacados, hace un variete de los productos". Antes eran los
// primeros 8 marcados, por orden alfabetico: casi siempre la misma familia
// (ocho griferias FV seguidas).
//
// Se reparte por categoria (una de cada una, de a turnos) y, dentro de cada
// turno, se evita repetir la marca del anterior. La mezcla cambia cada dia y
// es la misma durante el dia: no salta en cada recarga.

/** La fecha de hoy en Argentina: con eso la mezcla cambia una vez por dia. */
export function semillaDeHoy(): string {
  return new Date().toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" });
}

/** Numeros al azar pero repetibles a partir de un texto. */
function azar(semilla: string): () => number {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function mezclar<T>(lista: T[], r: () => number): T[] {
  const l = [...lista];
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

export function conVariedad<T extends { category: string; brand: string | null }>(
  lista: T[],
  cuantos: number,
  semilla: string,
): T[] {
  const r = azar(semilla);
  const porCategoria = new Map<string, T[]>();
  for (const p of mezclar(lista, r)) {
    const l = porCategoria.get(p.category) ?? [];
    l.push(p);
    porCategoria.set(p.category, l);
  }
  const grupos = mezclar([...porCategoria.values()], r);
  const salida: T[] = [];
  let marcaAnterior: string | null | undefined;
  while (salida.length < cuantos && grupos.some((g) => g.length > 0)) {
    for (const g of grupos) {
      if (salida.length >= cuantos) break;
      if (g.length === 0) continue;
      // Dentro de la categoria, uno de otra marca que el anterior, si hay.
      const i = Math.max(0, g.findIndex((p) => p.brand !== marcaAnterior));
      const [p] = g.splice(i, 1);
      salida.push(p);
      marcaAnterior = p.brand;
    }
  }
  return salida;
}
