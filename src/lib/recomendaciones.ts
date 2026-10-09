// Que ofrecerle a alguien segun lo que ya tiene en el carrito.
//
// La idea es que arme el baño completo: si se lleva un juego con bidet de 1
// agujero necesita griferia monocomando, y si es de 3 agujeros necesita una
// de 3. Ofrecerle la que no le sirve es peor que no ofrecerle nada.
//
// Las reglas miran el titulo y la descripcion porque los combos listan sus
// piezas ahi ("LINK BIDET MONOCOMANDO HYDROS"). No hay un campo "agujeros"
// en la base; si algun dia lo hay, se cambia solo este archivo.

export type ProductoRec = {
  itemId: string;
  title: string;
  description: string | null;
  category: string;
};

function texto(p: ProductoRec) {
  return (p.title + " " + (p.description ?? ""))
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const UN_AGUJERO = /\b1\s*(AG|AGUJERO)/;
const TRES_AGUJEROS = /\b3\s*(AG|AGUJEROS?)/;
const MONOCOMANDO = /MONOCOMANDO/;
const VANITORY = /VANITORY|BAJO\s*MESADA/;
const LOZA = /INODORO|BIDET|DEPOSITO/;

export type Senales = {
  tieneJuegoBano: boolean;
  quiere1Agujero: boolean;
  quiere3Agujeros: boolean;
  yaTieneGriferia: boolean;
  yaTieneVanitory: boolean;
};

export function leerCarrito(items: ProductoRec[]): Senales {
  const t = items.map(texto);
  return {
    tieneJuegoBano: items.some((p, i) => p.category === "sanitarios" && LOZA.test(t[i])),
    quiere1Agujero: t.some((x) => UN_AGUJERO.test(x)),
    quiere3Agujeros: t.some((x) => TRES_AGUJEROS.test(x)),
    yaTieneGriferia: items.some((p) => p.category === "griferia"),
    yaTieneVanitory: t.some((x) => VANITORY.test(x)),
  };
}

export type Sugerencia = { producto: ProductoRec; motivo: string };

/**
 * Elige que ofrecer. `candidatos` son los productos publicados con stock que
 * NO estan en el carrito. Devuelve como mucho `tope` sugerencias, sin repetir.
 */
export function elegirSugerencias(
  senales: Senales,
  candidatos: ProductoRec[],
  tope = 4,
): Sugerencia[] {
  const txt = new Map(candidatos.map((p) => [p.itemId, texto(p)]));
  const esGriferia = (p: ProductoRec) => p.category === "griferia";
  const out: Sugerencia[] = [];
  const usados = new Set<string>();

  function sumar(lista: ProductoRec[], motivo: string) {
    for (const p of lista) {
      if (out.length >= tope) return;
      if (usados.has(p.itemId)) continue;
      usados.add(p.itemId);
      out.push({ producto: p, motivo });
    }
  }

  // 1) Griferia que combine con los agujeros del bidet que se lleva
  if (!senales.yaTieneGriferia) {
    if (senales.quiere1Agujero) {
      sumar(
        candidatos.filter((p) => esGriferia(p) && MONOCOMANDO.test(txt.get(p.itemId)!)),
        "Para tu bidet de 1 agujero",
      );
    }
    if (senales.quiere3Agujeros) {
      const exactas = candidatos.filter(
        (p) => esGriferia(p) && TRES_AGUJEROS.test(txt.get(p.itemId)!),
      );
      // Si ninguna lo dice con todas las letras, al menos descartamos las
      // monocomando: esas seguro no entran en un bidet de 3 agujeros.
      const cuales = exactas.length
        ? exactas
        : candidatos.filter((p) => esGriferia(p) && !MONOCOMANDO.test(txt.get(p.itemId)!));
      sumar(cuales, "Para tu bidet de 3 agujeros");
    }
  }

  // 2) El mueble, que va con cualquier juego de baño
  if (senales.tieneJuegoBano && !senales.yaTieneVanitory) {
    sumar(
      candidatos.filter((p) => VANITORY.test(txt.get(p.itemId)!)),
      "Completá con vanitory y espejo",
    );
  }

  // 3) Si quedo lugar, otra griferia, pero solo si le sirve: ofrecerle una
  //    monocomando a quien se lleva un bidet de 3 agujeros es venderle algo
  //    que no le entra.
  if (senales.tieneJuegoBano && !senales.yaTieneGriferia) {
    const compatible = (p: ProductoRec) => {
      if (!esGriferia(p)) return false;
      const t = txt.get(p.itemId)!;
      if (senales.quiere1Agujero && !senales.quiere3Agujeros) return MONOCOMANDO.test(t);
      if (senales.quiere3Agujeros && !senales.quiere1Agujero) return !MONOCOMANDO.test(t);
      return true;
    };
    sumar(candidatos.filter(compatible), "Para completar el baño");
  }

  return out;
}
