// Lo que piden los clientes y no tenemos (V.0.11.260): las reglas, sin base.
//
// Daniel, 25/11/2026: "en la parte de vender o presupuestar se puede agregar
// un boton que diga notas donde yo pueda ingresar una nota de texto o voz
// donde sugiera algun producto que me piden los clientes, eso deberia despues
// mandarse al panel articulos como una notificacion arriba o gerencia ... o
// agruparlos a todos que aparezcan en algun lado donde la gerencia hace los
// pedidos".
//
// La base esta en src/lib/punto-notas.ts y la ruta en src/app/sistema/notas.
// Sin ningun import a proposito: lo usan la ruta, el servidor de prueba y las
// pruebas con node solo.

export type EstadoNota = "nueva" | "pedida" | "descartada";
export const ESTADOS_NOTA: readonly EstadoNota[] = ["nueva", "pedida", "descartada"];
export const SUCURSALES_NOTA = ["srl", "cnc", "tsl"] as const;

export type NotaCliente = {
  id: string;
  texto: string;
  porVoz: boolean;
  cantidad: number | null;
  cliente: string;
  sucursal: string;
  usuario: string;
  /** ISO. */
  creadoEn: string;
  estado: EstadoNota;
  resueltoEn: string | null;
  resueltoPor: string | null;
  motivo: string;
};

export type PedidoNota = {
  idLocal: string;
  texto: string;
  porVoz: boolean;
  cantidad: number | null;
  cliente: string;
  sucursal: string;
};

/** Texto para la pagina: va adentro de innerHTML, sin < ni >. */
const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Lo que llega de la pagina para anotar una nota. String = el error. */
export function limpiarPedidoNota(x: unknown): PedidoNota | string {
  if (!x || typeof x !== "object") return "No entendí la nota.";
  const o = x as Record<string, unknown>;
  const idLocal = typeof o.idLocal === "string" ? o.idLocal : "";
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(idLocal)) return "Falta la marca de la nota: recargá la página.";
  const t = texto(o.texto, 500);
  if (t.length < 3) return "Escribí (o dictá) qué pidió el cliente.";
  let cantidad: number | null = null;
  if (o.cantidad != null && o.cantidad !== "") {
    const n = Number(o.cantidad);
    if (!Number.isInteger(n) || n < 1 || n > 100000) return "La cantidad tiene que ser un número entero, de 1 para arriba.";
    cantidad = n;
  }
  const sucursal = String(o.sucursal ?? "");
  if (!(SUCURSALES_NOTA as readonly string[]).includes(sucursal)) return "No sé de qué sucursal es la nota: recargá la página.";
  return { idLocal, texto: t, porVoz: o.porVoz === true, cantidad, cliente: texto(o.cliente, 120), sucursal };
}

/** Palabras que no dicen que producto es ("me pidieron una ..."). */
const RELLENO = new Set(
  (
    "a al algo alguien algun alguna alguno buscaba busca buscan cliente clientes con de del el en es esta este hay la las " +
    "le les lo los me mas muy no nos o para pedia pedian pidio pidieron pide piden por que quería queria quiere quieren " +
    "se si sin su sus tenemos tienen tiene un una uno unos unas vino vinieron y ya otra otro otros otras tambien nota"
  ).split(" "),
);

/** Sin acentos, en minusculas, sin signos. */
export const plano = (s: string): string =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ/.\- ]/g, " ").replace(/\s+/g, " ").trim();

/** La clave para juntar notas que piden lo mismo: las palabras que importan,
 *  sin repetir y en orden alfabetico ("griferia cocina FV Allegro" y "me
 *  pidieron allegro de cocina, FV" caen juntas). Los plurales se juntan con
 *  el singular sacando la "s" y la "e" del final (tanques/tanque -> tanqu,
 *  tapones/tapon -> tapon, llaves/llave -> llav). */
const raiz = (w: string): string => {
  if (w.length <= 3 || /[0-9]/.test(w)) return w;
  const sinS = w.endsWith("s") ? w.slice(0, -1) : w;
  return sinS.length > 3 && sinS.endsWith("e") ? sinS.slice(0, -1) : sinS;
};
export function claveNota(t: string): string {
  const palabras = plano(t)
    .split(" ")
    .map((w) => w.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    .filter((w) => w && !RELLENO.has(w))
    .map(raiz);
  return [...new Set(palabras)].sort().join(" ");
}

export type GrupoNotas = {
  clave: string;
  /** El texto de la nota mas nueva del grupo. */
  texto: string;
  /** Cuantas veces lo pidieron (cada nota es una vez). */
  veces: number;
  /** La suma de las cantidades que se anotaron. */
  unidades: number;
  sucursales: string[];
  usuarios: string[];
  ultima: string;
  nuevas: number;
  notas: NotaCliente[];
};

/** Junta las notas por lo que piden; primero lo mas pedido y lo mas nuevo. */
export function agruparNotas(notas: readonly NotaCliente[]): GrupoNotas[] {
  const g = new Map<string, GrupoNotas>();
  for (const n of [...notas].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn))) {
    const k = claveNota(n.texto) || plano(n.texto);
    let x = g.get(k);
    if (!x) {
      x = { clave: k, texto: n.texto, veces: 0, unidades: 0, sucursales: [], usuarios: [], ultima: n.creadoEn, nuevas: 0, notas: [] };
      g.set(k, x);
    }
    x.veces++;
    x.unidades += n.cantidad ?? 0;
    if (!x.sucursales.includes(n.sucursal)) x.sucursales.push(n.sucursal);
    if (!x.usuarios.includes(n.usuario)) x.usuarios.push(n.usuario);
    if (n.estado === "nueva") x.nuevas++;
    x.notas.push(n);
  }
  // Lo dicho con menos palabras va con lo mismo dicho con mas ("allegro
  // cocina fv" con "griferia fv allegro de cocina"), si tiene al menos 2
  // palabras y hay UN solo grupo que las contiene a todas (si hay varios, no
  // se sabe cual es y queda aparte).
  const grupos = [...g.values()].sort((a, b) => a.clave.split(" ").length - b.clave.split(" ").length);
  const fuera = new Set<GrupoNotas>();
  for (const chico of grupos) {
    const ps = chico.clave.split(" ").filter(Boolean);
    if (ps.length < 2) continue;
    const grandes = grupos.filter((o) => o !== chico && !fuera.has(o) && o.clave.split(" ").length > ps.length && ps.every((w) => o.clave.split(" ").includes(w)));
    if (grandes.length !== 1) continue;
    const gr = grandes[0];
    gr.veces += chico.veces;
    gr.unidades += chico.unidades;
    gr.nuevas += chico.nuevas;
    for (const s of chico.sucursales) if (!gr.sucursales.includes(s)) gr.sucursales.push(s);
    for (const u of chico.usuarios) if (!gr.usuarios.includes(u)) gr.usuarios.push(u);
    gr.notas = [...gr.notas, ...chico.notas].sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
    if (chico.ultima > gr.ultima) {
      gr.ultima = chico.ultima;
      gr.texto = chico.texto;
    }
    fuera.add(chico);
  }
  return grupos.filter((x) => !fuera.has(x)).sort((a, b) => b.veces - a.veces || b.ultima.localeCompare(a.ultima));
}

/** Lo que llega para resolver varias notas juntas. String = el error. */
export function limpiarResolver(x: unknown): { ids: string[]; estado: EstadoNota; motivo: string } | string {
  if (!x || typeof x !== "object") return "No entendí qué resolver.";
  const o = x as Record<string, unknown>;
  const ids = Array.isArray(o.ids)
    ? [...new Set(o.ids.filter((v): v is string => typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v)))].slice(0, 500)
    : [];
  if (!ids.length) return "Falta qué notas resolver.";
  const estado = String(o.estado ?? "") as EstadoNota;
  if (!ESTADOS_NOTA.includes(estado)) return "No sé cómo quedan esas notas.";
  return { ids, estado, motivo: texto(o.motivo, 200) };
}
