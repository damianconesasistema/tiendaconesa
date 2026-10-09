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

/** Lo que sabemos de una griferia leyendo su texto. */
type TipoGriferia = "mono" | "tres" | "desconocida";

function tipoGriferia(t: string): TipoGriferia {
  if (MONOCOMANDO.test(t)) return "mono";
  if (TRES_AGUJEROS.test(t)) return "tres";
  return "desconocida";
}

// Dejamos lugar para el vanitory: si las griferias llenan las 4, el mueble
// no aparece nunca y es justo lo que mas suma al ticket.
const TOPE_GRIFERIA = 2;

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
  const tipo = (p: ProductoRec) => tipoGriferia(txt.get(p.itemId)!);
  const out: Sugerencia[] = [];
  const usados = new Set<string>();

  function sumar(lista: ProductoRec[], motivo: string, max = tope) {
    let puestos = 0;
    for (const p of lista) {
      if (out.length >= tope || puestos >= max) return;
      if (usados.has(p.itemId)) continue;
      usados.add(p.itemId);
      out.push({ producto: p, motivo });
      puestos++;
    }
  }

  // 1) Griferia que combine con los agujeros del bidet que se lleva.
  //    Solo las que lo dicen: de una griferia que no aclara el tipo no
  //    podemos afirmar que sirve para 3 agujeros.
  if (!senales.yaTieneGriferia) {
    if (senales.quiere1Agujero) {
      sumar(
        candidatos.filter((p) => esGriferia(p) && tipo(p) === "mono"),
        "Para tu bidet de 1 agujero",
        TOPE_GRIFERIA,
      );
    }
    if (senales.quiere3Agujeros) {
      sumar(
        candidatos.filter((p) => esGriferia(p) && tipo(p) === "tres"),
        "Para tu bidet de 3 agujeros",
        TOPE_GRIFERIA,
      );
    }
  }

  // 2) El mueble, que va con cualquier juego de baño
  if (senales.tieneJuegoBano && !senales.yaTieneVanitory) {
    sumar(
      candidatos.filter((p) => VANITORY.test(txt.get(p.itemId)!)),
      "Completá con vanitory y espejo",
      2,
    );
  }

  // 3) Si quedo lugar, las demas griferias, descartando las que seguro no
  //    le entran. Las que no aclaran el tipo van con un texto neutro: mejor
  //    "para completar el baño" que prometerle algo que capaz no encaja.
  if (senales.tieneJuegoBano && !senales.yaTieneGriferia) {
    const sirve = (p: ProductoRec) => {
      if (!esGriferia(p)) return false;
      const t = tipo(p);
      if (t === "desconocida") return true;
      if (senales.quiere1Agujero && !senales.quiere3Agujeros) return t === "mono";
      if (senales.quiere3Agujeros && !senales.quiere1Agujero) return t === "tres";
      return true;
    };
    sumar(candidatos.filter(sirve), "Para completar el baño");
  }

  return out;
}
