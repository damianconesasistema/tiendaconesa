// El buscador de la tienda, que perdona. Damian, 18/11/2026: "porque no busca
// cuando pongo palabras claves, siempre omiti los acentos ... que busque con
// terminos mal escritos o que suenen a lo que esta buscando el cliente, como
// productos, marcas, modelos". Antes buscaba el texto tal cual adentro del
// titulo: "griferia+cocina" no encontraba nada (el titulo dice "GRIFERÍA",
// con tilde, y el "+" no esta).
//
// Ahora:
//   - Sin tildes ni signos: "griferia+cocina" = "grifería cocina".
//   - Cada palabra por separado y en cualquier orden, en el titulo, la marca,
//     el rubro, el subrubro y el codigo.
//   - Mal escritas: una letra de mas o de menos ("inodor", "grifreria"), lo
//     que suena igual (b/v, s/z/c, ll/y, k/qu, la h muda: "cosina",
//     "rotomartiyo", "termotanke") y singular o plural.
//   - Palabras de todos los dias: canilla = griferia, bacha = pileta,
//     tapa = asiento, wc = inodoro...
//   - Si no hay nada con TODAS las palabras, muestra lo que tiene algunas
//     (mejor algo parecido que una pantalla vacia).
//
// Funcion pura: la usa el catalogo en el navegador, sin pedirle nada al
// servidor.

const RELLENO = new Set(["de", "del", "para", "con", "la", "el", "los", "las", "y", "en", "x", "p", "c", "a", "un", "una"]);

/** Palabras de todos los dias -> como se llaman en la tienda. */
const SINONIMOS: Record<string, string[]> = {
  canilla: ["griferia", "grifo", "monocomando"],
  canillas: ["griferia", "grifo", "monocomando"],
  grifo: ["griferia", "canilla"],
  griferia: ["canilla", "grifo"],
  bacha: ["pileta"],
  pileta: ["bacha"],
  lavabo: ["lavatorio"],
  lavamanos: ["lavatorio"],
  tapa: ["asiento"],
  asiento: ["tapa"],
  wc: ["inodoro"],
  water: ["inodoro"],
  toilet: ["inodoro"],
  retrete: ["inodoro"],
  mochila: ["deposito"],
  deposito: ["mochila"],
  regadera: ["ducha", "duchador"],
  flor: ["ducha", "lluvia"],
  termo: ["termotanque"],
  estufa: ["salamandra", "calefactor"],
  salamandra: ["estufa", "calefactor"],
  extractor: ["campana"],
  campana: ["extractor"],
  hornalla: ["anafe"],
  hornallas: ["anafe"],
  anafe: ["hornalla"],
  taladro: ["rotomartillo"],
  pulidora: ["amoladora"],
  amoladora: ["pulidora"],
  mampara: ["box", "cabina"],
  espejo: ["botiquin"],
  mueble: ["vanitory"],
  vanitory: ["mueble"],
  agarradera: ["barral", "minusvalido"],
};

/** Minusculas, sin tildes ni signos. */
export function normal(x: string | null | undefined): string {
  return String(x ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Como suena en castellano: lo que se escribe distinto y se dice igual. */
export function sonido(w: string): string {
  return w
    .replace(/qu/g, "k")
    .replace(/c([ei])/g, "s$1")
    .replace(/c/g, "k")
    .replace(/z/g, "s")
    .replace(/v/g, "b")
    .replace(/ll/g, "y")
    .replace(/g([ei])/g, "j$1")
    .replace(/h/g, "")
    .replace(/(.)\1+/g, "$1");
}

/** Distancia de edicion (una letra de mas, de menos, cambiada o dos letras
 *  dadas vuelta: "pringels" = "pringles"), cortando apenas pasa del tope. */
function distancia(a: string, b: string, tope: number): number {
  if (Math.abs(a.length - b.length) > tope) return tope + 1;
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    let minimo = Infinity;
    for (let j = 1; j <= b.length; j++) {
      let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
      d[i][j] = v;
      if (v < minimo) minimo = v;
    }
    if (minimo > tope) return tope + 1;
  }
  return d[a.length][b.length];
}

export type Indexado = {
  /** Las palabras del producto, normalizadas, y como suenan. */
  palabras: string[];
  sonidos: string[];
  /** Las del titulo valen un poco mas. */
  delTitulo: Set<string>;
  /** Todo junto sin espacios, para codigos ("0207/B1" = "0207b1"). */
  pegado: string;
};

export function indexar(campos: { titulo: string; otros: (string | null | undefined)[] }): Indexado {
  const delTitulo = normal(campos.titulo).split(" ").filter(Boolean);
  const todas = [...new Set([...delTitulo, ...campos.otros.flatMap((o) => normal(o).split(" ").filter(Boolean))])];
  return {
    palabras: todas,
    sonidos: todas.map(sonido),
    delTitulo: new Set(delTitulo),
    pegado: normal([campos.titulo, ...campos.otros].join(" ")).replace(/ /g, ""),
  };
}

/** Que tan bien una palabra buscada encuentra este producto (0 = no). */
function puntaje(t: string, p: Indexado): number {
  // Un codigo o un numero: tiene que estar, sin importar espacios ni signos.
  if (/\d/.test(t)) return p.pegado.includes(t) ? 3 : 0;
  const st = sonido(t);
  const tope = t.length >= 7 ? 2 : t.length >= 4 ? 1 : 0;
  let mejor = 0;
  for (let i = 0; i < p.palabras.length; i++) {
    const w = p.palabras[i];
    const sw = p.sonidos[i];
    let v = 0;
    if (w === t || sw === st) v = 3;
    else if (t.length >= 2 && (w.startsWith(t) || (st.length >= 3 && sw.startsWith(st)))) v = 2;
    else if (
      tope > 0 &&
      (distancia(t, w, tope) <= tope ||
        distancia(st, sw, tope) <= tope ||
        (sw.length > st.length && distancia(st, sw.slice(0, st.length), tope) <= tope))
    )
      v = 1;
    if (v > 0 && p.delTitulo.has(w)) v += 0.5;
    if (v > mejor) mejor = v;
    if (mejor >= 3.5) break;
  }
  return mejor;
}

export type Resultado = {
  /** id -> puntaje, de los que coinciden. */
  puntajes: Map<string, number>;
  /** "todas": tienen todas las palabras. "algunas": ninguno las tenia todas y
   *  van los que tienen alguna. */
  modo: "todas" | "algunas";
};

export function buscar(consulta: string, productos: { id: string; indice: Indexado }[]): Resultado {
  const palabras = normal(consulta)
    .split(" ")
    .filter((w) => w && !RELLENO.has(w));
  if (palabras.length === 0) return { puntajes: new Map(productos.map((p) => [p.id, 0])), modo: "todas" };

  const todas = new Map<string, number>();
  const algunas = new Map<string, number>();
  for (const p of productos) {
    let suma = 0;
    let encontradas = 0;
    for (const t of palabras) {
      let v = puntaje(t, p.indice);
      // Si la palabra no esta, alguno de sus sinonimos (vale un poco menos).
      if (v === 0) for (const s of SINONIMOS[t] ?? []) v = Math.max(v, puntaje(s, p.indice) * 0.9);
      if (v > 0) {
        suma += v;
        encontradas++;
      }
    }
    if (encontradas === palabras.length) todas.set(p.id, suma);
    else if (encontradas > 0) algunas.set(p.id, encontradas * 10 + suma);
  }
  return todas.size > 0 ? { puntajes: todas, modo: "todas" } : { puntajes: algunas, modo: "algunas" };
}
