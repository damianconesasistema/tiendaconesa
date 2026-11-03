// Dar de alta un articulo con lo que trae el Excel de GBP.
//
// El sistema exporta la descripcion como la escribio quien cargo el articulo
// hace anios: todo en mayuscula, abreviado y con el codigo del fabricante
// pegado al final.
//
//   MUEBLE COLGAR 1 PTA LAVAT 1 AG TRAFUL  50X35X45  JT103-BD
//
// Eso sirve para buscar en el mostrador, no para publicarlo. Aca se arma el
// titulo que va a ver el cliente y se adivina el rubro, que es el trabajo que
// hasta ahora habia que hacer a mano articulo por articulo.
//
// Todo lo de este archivo es una PROPUESTA: la pantalla la muestra y se puede
// corregir antes de crear nada. Por eso se prefiere equivocarse de menos
// (dejar una palabra como vino) que de mas (inventar algo que no decia).

/** Sin acentos y en minuscula, para comparar. */
function plano(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// ---------------------------------------------------------------- el rubro

/** Los rubros de la tienda y las palabras que los delatan.
 *
 *  EL ORDEN MANDA: se devuelve el primero que pega. "COCINA A LENA" tiene que
 *  caer en salamandras y no en cocina, y "MUEBLE PARA LAVATORIO" en
 *  equipamiento de bano y no en sanitarios. Por eso lo especifico va arriba. */
const REGLAS: { slug: string; palabras: string[] }[] = [
  {
    slug: "salamandras",
    palabras: ["salamandra", "calefactor", "estufa", "lena", "hogar a "],
  },
  {
    slug: "calefones",
    palabras: [
      "termotanque",
      "termo tanque",
      "calefon",
      "caldera",
      "calefaccion",
      "radiador",
    ],
  },
  {
    slug: "cocina",
    palabras: [
      "campana",
      "extractor",
      "anafe",
      "horno",
      "purificador",
      "cocina",
    ],
  },
  {
    slug: "banera",
    palabras: [
      "vanitor",
      "mueble",
      "botiquin",
      "espejo",
      "banera",
      "tina",
      "receptaculo",
      "mampara",
      "box de ducha",
      "toallero",
      "jabonera",
      "portarrollo",
      "percha",
    ],
  },
  { slug: "piletas", palabras: ["pileta", "bacha", "lavadero", "pileton"] },
  {
    slug: "sanitarios",
    palabras: [
      "inodoro",
      "bidet",
      "lavatorio",
      "mingitorio",
      "deposito",
      "pedestal",
      "sanitario",
      "porcelana",
      "loza",
    ],
  },
  {
    slug: "griferia",
    palabras: [
      "griferia",
      "grifer",
      "monocomando",
      "canilla",
      "mezclador",
      "duchador",
      "ducha",
      "llave de paso",
      "grifo",
    ],
  },
  {
    slug: "herramientas",
    palabras: [
      "taladro",
      "amoladora",
      "herramienta",
      "soldadora",
      "sierra",
      "pinza",
      "destornillador",
      "morsa",
      "hidrolavadora",
      "atornillador",
    ],
  },
  {
    slug: "materiales",
    palabras: [
      "tanque",
      "cisterna",
      "camara septica",
      "biodigestor",
      "cano",
      "tubo",
      "codo",
      "curva",
      "pvc",
      "cloacal",
      "termofusion",
      "awaduct",
    ],
  },
  {
    slug: "accesorios",
    palabras: [
      "flexible",
      "sifon",
      "valvula",
      "repuesto",
      "cadena",
      "flotante",
      "asiento",
      "rejilla",
      "tapa",
      "accesorio",
    ],
  },
];

export type RubroSugerido = {
  /** El slug de la tienda. "otros" cuando no se pudo deducir. */
  slug: string;
  /** En castellano, para mostrar de donde salio debajo del desplegable. */
  motivo: string;
};

function buscarRubro(texto: string): string | null {
  const t = plano(texto);
  if (!t) return null;
  for (const r of REGLAS) {
    if (r.palabras.some((p) => t.includes(p))) return r.slug;
  }
  return null;
}

/** De que rubro es el articulo, mirando primero lo que mas sabe.
 *
 *  La subcategoria del sistema es la que de verdad dice que es la cosa
 *  ("FERRUM VANITORIS/MUEBLES"). La categoria, en cambio, suele traer el
 *  PROVEEDOR ("FERRUM SA CERAMICA Y METALURGICA"), asi que se mira ultima y
 *  casi nunca aporta. */
export function rubroSugerido(
  titulo: string,
  subcategoria: string | null,
  categoria: string | null,
): RubroSugerido {
  const porSub = subcategoria ? buscarRubro(subcategoria) : null;
  if (porSub)
    return { slug: porSub, motivo: "de la subcategoría: " + subcategoria };

  const porTitulo = buscarRubro(titulo);
  if (porTitulo)
    return { slug: porTitulo, motivo: "de las palabras del título" };

  const porCat = categoria ? buscarRubro(categoria) : null;
  if (porCat) return { slug: porCat, motivo: "de la categoría: " + categoria };

  return { slug: "otros", motivo: "no se pudo deducir: elegilo vos" };
}

// --------------------------------------------------------------- el titulo

/** Abreviaturas del sistema. Se cambia la palabra ENTERA, nunca un pedazo:
 *  "AG" es agujero, pero "AGUA" no es "AGUJEROUA". */
const ABREVIATURAS: Record<string, string> = {
  PTA: "PUERTA",
  PTAS: "PUERTAS",
  PTS: "PUERTAS",
  LAVAT: "LAVATORIO",
  AG: "AGUJERO",
  AGJ: "AGUJERO",
  AGS: "AGUJEROS",
  INOD: "INODORO",
  DEP: "DEPÓSITO",
  DEPOS: "DEPÓSITO",
  BID: "BIDET",
  MESAD: "MESADA",
  MONOC: "MONOCOMANDO",
  GRIF: "GRIFERÍA",
  TERMOT: "TERMOTANQUE",
  CJON: "CAJÓN",
  CJONES: "CAJONES",
  BCO: "BLANCO",
  BLCO: "BLANCO",
  CROM: "CROMO",
  INOX: "INOXIDABLE",
  UNID: "UNIDAD",
  IZQ: "IZQUIERDA",
  DER: "DERECHA",
  FLEX: "FLEXIBLE",
  VALV: "VÁLVULA",
  SOP: "SOPORTE",
  "C/": "CON",
  "S/": "SIN",
};

/** Palabras que el sistema escribe sin acento. */
const ACENTOS: Record<string, string> = {
  DEPOSITO: "DEPÓSITO",
  GRIFERIA: "GRIFERÍA",
  CAJON: "CAJÓN",
  CAJONES: "CAJONES",
  BANO: "BAÑO",
  VALVULA: "VÁLVULA",
  SIFON: "SIFÓN",
  RINCON: "RINCÓN",
  ANGULO: "ÁNGULO",
  ELECTRICO: "ELÉCTRICO",
  ELECTRICA: "ELÉCTRICA",
  PLASTICO: "PLÁSTICO",
  CERAMICA: "CERÁMICA",
  CERAMICO: "CERÁMICO",
  HIDRAULICO: "HIDRÁULICO",
  AUTOMATICO: "AUTOMÁTICO",
  ACRILICO: "ACRÍLICO",
  MARMOL: "MÁRMOL",
  LENA: "LEÑA",
  BANERA: "BAÑERA",
};

export type TituloSugerido = {
  /** El titulo listo para publicar. */
  titulo: string;
  /** Las medidas que se encontraron, ya separadas del texto ("50 X 35 X 45").
   *  Null si la descripcion no traia. */
  medidas: string | null;
  /** El codigo del fabricante que venia pegado al final ("JT103-BD"). No va
   *  en el titulo, pero se guarda en el ayuda memoria para poder buscarlo. */
  codigoFabricante: string | null;
};

/** Las medidas pegadas: "50X35X45", "50 X 35", "1,20X0,70".
 *
 *  Se pide que algun numero tenga dos cifras para no confundir un pack ("2X1")
 *  con una medida. */
const MEDIDAS =
  /\b(\d+(?:[.,]\d+)?)\s*[xX]\s*(\d+(?:[.,]\d+)?)(?:\s*[xX]\s*(\d+(?:[.,]\d+)?))?\b/;

/** Una palabra del sistema, ya desabreviada. Devuelve varias porque el
 *  sistema pega el "con" y el "sin" a la palabra que sigue, sin espacio:
 *  "C/DEP" es "CON DEPOSITO" y "S/PIE" es "SIN PIE". */
function expandir(p: string): string[] {
  const limpia = p.replace(/[.,;]+$/, "");
  const barra = limpia.match(/^([CS])\/(.+)$/);
  if (barra) return [barra[1] === "C" ? "CON" : "SIN", ...expandir(barra[2])];
  return [ABREVIATURAS[limpia] ?? ACENTOS[limpia] ?? limpia];
}

/** El codigo del fabricante del final: mezcla letras y numeros ("JT103-BD"). */
function esCodigoFabricante(t: string): boolean {
  if (t.length < 4) return false;
  if (!/^[A-Z0-9]+(?:[-/][A-Z0-9]+)*$/.test(t)) return false;
  return /[A-Z]/.test(t) && /\d/.test(t);
}

/** El titulo que va a ver el cliente, a partir de la descripcion del sistema.
 *
 *  NO se reordenan las palabras: la descripcion se respeta tal cual venia y
 *  solo se la desabrevia. Reordenar queda lindo en un ejemplo y arruina los
 *  otros nueve mil, porque no hay dos descripciones armadas igual. */
export function tituloSugerido(
  descripcion: string,
  nombreMarca: string | null,
): TituloSugerido {
  let texto = String(descripcion || "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();

  // Las medidas salen del medio y se vuelven a pegar al final.
  let medidas: string | null = null;
  const m = texto.match(MEDIDAS);
  if (
    m &&
    [m[1], m[2], m[3]].some((n) => n && n.replace(/\D/g, "").length >= 2)
  ) {
    medidas = [m[1], m[2], m[3]]
      .filter((n): n is string => Boolean(n))
      .join(" X ");
    texto = texto.replace(m[0], " ").replace(/\s+/g, " ").trim();
  }

  // El codigo del fabricante, si quedo colgado al final.
  let codigoFabricante: string | null = null;
  const partes = texto.split(" ");
  if (partes.length > 1 && esCodigoFabricante(partes[partes.length - 1])) {
    codigoFabricante = partes.pop() as string;
    texto = partes.join(" ");
  }

  texto = texto
    .split(" ")
    .flatMap(expandir)
    .filter((p) => p !== "")
    .join(" ");

  // La marca adelante, salvo que la descripcion ya la nombre.
  const marca = (nombreMarca ?? "").toUpperCase().trim();
  if (marca && !plano(texto).includes(plano(marca))) texto = marca + " " + texto;

  if (medidas) texto = texto + " · " + medidas + " CM";

  return {
    titulo: texto.replace(/\s+/g, " ").trim(),
    medidas,
    codigoFabricante,
  };
}
