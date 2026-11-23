// Revisa los renglones de un pedido a proveedor (orden de compra) y calcula
// sus totales. Ver src/lib/punto-compras.ts, que es el que toca la base.
//
// Va en un archivo aparte, sin ningun import, para poder probarlo con node
// solo (sin base y sin Next), como src/lib/punto-proveedores-limpiar.ts.
//
// Damian, 22/11/2026: "el pedido que voy a pedirle al proveedor me lo pongas
// con los costos y los valores ... los costos con los descuentos y cuanto es
// el valor de la mercaderia que le estoy pidiendo". El costo de cada renglon
// lo calcula la pagina (lista del proveedor con su cadena de descuentos y el
// de contado), pero los TOTALES los saca el servidor: el que lee el pedido en
// otra compu tiene que ver la misma cuenta, aunque la pagina que lo guardo
// tuviera un error.
//
// Lo que llega del navegador se revisa entero: un renglon que no tiene forma
// rechaza todo el pedido, con el motivo y el renglon, para que la pantalla lo
// diga. Los textos que son solo para leer (descripcion, cliente) se cortan a
// su tope; lo que se usa para contar (codigo, cantidades, costos) no se
// adivina: si no sirve, se rechaza.
//
// Los errores de lo que mando la pagina vuelven con invalido: true: la ruta
// los contesta con 400 (como cualquier cosa que no sirve). Los demas (el
// pedido esta anulado, otro lo cambio) van con 200.

export const ESTADOS_COMPRA = ["abierto", "enviado", "parcial", "recibido", "anulado"] as const;
export type EstadoCompra = (typeof ESTADOS_COMPRA)[number];
/** Los que todavia esperan algo: se pueden cambiar, anular, y no dejan
 *  eliminar al proveedor. */
export const ESTADOS_ABIERTOS: readonly EstadoCompra[] = ["abierto", "enviado", "parcial"];

export const MAX_RENGLONES_COMPRA = 500;
/** La marca de un "sumar" (la inventa la pagina una vez por envio y la
 *  repite si reintenta), como la de los pedidos de los clientes
 *  (src/lib/punto-ventas.ts). */
export const MARCA_COMPRA = /^[A-Za-z0-9_-]{8,64}$/;
export const MAX_ORIGEN = 20;
export const MAX_CANT = 100_000;
export const MAX_BULTO = 10_000;
const MAX_NETO = 1e9;
/** Lo mas que se acepta como precio de lista: mas que eso es un error de
 *  tipeo, y un numero gigante rompe las cuentas. */
const MAX_LISTA = 1e11;
const IVAS = [0, 10.5, 21, 27];
const TIPOS_ORIGEN = ["pedido", "faltante", "mano"] as const;

export type OrigenCompra = { tipo: (typeof TIPOS_ORIGEN)[number]; ref?: string; cliente?: string };

export type RenglonCompra = {
  cod: string;
  tit: string;
  cant: number;
  /** Lo que ya llego (0 a cant). */
  recibido: number;
  /** El precio de lista del proveedor, sin IVA. */
  lista: number;
  /** La cadena de descuentos (hasta 8, cada uno de 0 a 99,99 %; eran 6 de
   *  hasta 95 % antes de la V.0.99.85: GBP tiene descuentos de 99 % en
   *  unidades sacadas del precio de una caja). */
  cadena: number[];
  /** Los recargos de GBP sobre la lista (V.0.99.85), en %: sin ellos el
   *  renglon no da el neto. No esta = no tiene. */
  recs?: number[];
  /** El descuento de contado, en %. */
  cont: number;
  /** El costo unitario sin IVA, ya con los descuentos: lo calcula la pagina. */
  neto: number;
  iva: number;
  /** El proveedor dijo que no tiene: queda pendiente. */
  sinStockFabrica: boolean;
  /** De donde salio: el pedido de un cliente, un faltante, a mano. */
  origen: OrigenCompra[];
  /** Se vende solo en bultos cerrados de N (Daniel: "ese articulo se vende
   *  en combo de 6 unidades ... por mas que yo necesite 2, van a pedir 6").
   *  Lo que se necesitaba de verdad, antes de redondear al bulto, va en
   *  necesita. El servidor no redondea: lo guarda como lo manda la pagina. */
  bulto?: number;
  necesita?: number;
};

/** Texto que vuelve a la pagina adentro de innerHTML: sin < ni >, sin
 *  caracteres de control (Postgres no acepta el 0x00) y cortado por punto de
 *  codigo (un emoji partido al medio hace fallar el guardado). */
const texto = (v: unknown, max: number): string => {
  const s = typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "";
  const limpio = s
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return Array.from(limpio).slice(0, max).join("").toWellFormed().trim();
};

/** Un numero como numero o como texto ("12", "12.5"). Lo demas no es un
 *  numero (NaN): vacio, "12a", true. */
const num = (v: unknown): number => {
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v === "string" && /^\s*-?\d+(\.\d+)?\s*$/.test(v)) return Number(v);
  return NaN;
};

export const round2 = (n: number): number => Math.round(n * 100) / 100;

const miles = (n: number) => n.toLocaleString("es-AR");

/** Revisa los renglones que manda la pagina. No junta los repetidos: eso lo
 *  hace juntarRenglones. */
export function limpiarRenglones(x: unknown): { renglones: RenglonCompra[] } | { error: string } {
  if (!Array.isArray(x)) return { error: "Los renglones del pedido no tienen forma." };
  if (x.length > MAX_RENGLONES_COMPRA)
    return { error: `Son más de ${MAX_RENGLONES_COMPRA} renglones: partilo en dos pedidos.` };
  const renglones: RenglonCompra[] = [];
  for (let i = 0; i < x.length; i++) {
    const r = renglon(x[i], i + 1);
    if ("error" in r) return r;
    renglones.push(r.renglon);
  }
  return { renglones };
}

function renglon(x: unknown, n: number): { renglon: RenglonCompra } | { error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return { error: `El renglón ${n} está vacío.` };
  const o = x as Record<string, unknown>;
  // El codigo tal cual, sin juntar espacios: tiene que ser igual al del
  // articulo (src/lib/punto-articulos.ts solo le saca los de los costados),
  // si no la pagina no lo encuentra al marcar "ya pedido".
  const crudo = typeof o.cod === "string" ? o.cod : typeof o.cod === "number" ? String(o.cod) : "";
  const cod = crudo
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .toWellFormed();
  if (!cod) return { error: `El renglón ${n} no tiene código.` };
  // El codigo no se corta: es con lo que se juntan los renglones y se carga
  // lo que llego. Cortado, dos articulos distintos podian quedar iguales.
  if (cod.length > 60) return { error: `El renglón ${n}: el código es demasiado largo (más de 60).` };
  const de = `El renglón ${n} (${cod})`;
  // La descripcion puede venir vacia (un articulo cargado a mano solo con el
  // codigo): es para leer, el pedido se arma con el codigo.
  const tit = texto(o.tit, 200);

  const cant = num(o.cant);
  if (!Number.isInteger(cant) || cant < 1 || cant > MAX_CANT)
    return { error: `${de}: la cantidad tiene que ser un número entero de 1 a ${miles(MAX_CANT)}.` };
  const recibido = o.recibido == null || o.recibido === "" ? 0 : num(o.recibido);
  if (!Number.isInteger(recibido) || recibido < 0 || recibido > cant)
    return { error: `${de}: lo que llegó tiene que ser un número entero de 0 a ${miles(cant)}.` };

  const lista = o.lista == null || o.lista === "" ? 0 : num(o.lista);
  if (!Number.isFinite(lista) || lista < 0 || lista >= MAX_LISTA)
    return { error: `${de}: el precio de lista no es un monto.` };

  let cadena: number[] = [];
  if (o.cadena != null) {
    if (!Array.isArray(o.cadena) || o.cadena.length > 8)
      return { error: `${de}: la cadena de descuentos es una lista de hasta 8 porcentajes.` };
    cadena = o.cadena.map(num);
    if (cadena.some((d) => !Number.isFinite(d) || d < 0 || d > 99.99))
      return { error: `${de}: cada descuento de la cadena va de 0 a 99,99 %.` };
  }
  let recs: number[] = [];
  if (o.recs != null) {
    if (!Array.isArray(o.recs) || o.recs.length > 8)
      return { error: `${de}: los recargos son una lista de hasta 8 porcentajes.` };
    recs = o.recs.map(num);
    if (recs.some((r) => !Number.isFinite(r) || r < 0 || r > 1000))
      return { error: `${de}: cada recargo va de 0 a 1.000 %.` };
    recs = recs.filter((r) => r > 0);
  }
  const cont = o.cont == null || o.cont === "" ? 0 : num(o.cont);
  if (!Number.isFinite(cont) || cont < 0 || cont > 99.99)
    return { error: `${de}: el descuento de contado va de 0 a 99,99 %.` };

  const neto = num(o.neto);
  if (!Number.isFinite(neto) || neto < 0 || neto > MAX_NETO)
    return { error: `${de}: el costo sin IVA no es un monto.` };
  const iva = num(o.iva);
  if (!IVAS.includes(iva)) return { error: `${de}: el IVA es 0, 10,5, 21 o 27 %.` };

  if (o.sinStockFabrica != null && typeof o.sinStockFabrica !== "boolean")
    return { error: `${de}: "sin stock de fábrica" es sí o no.` };
  const sinStockFabrica = o.sinStockFabrica === true;

  const origen: OrigenCompra[] = [];
  if (o.origen != null) {
    if (!Array.isArray(o.origen) || o.origen.length > MAX_ORIGEN)
      return { error: `${de}: el origen es una lista de hasta ${MAX_ORIGEN}.` };
    for (const og of o.origen) {
      const oo = (og && typeof og === "object" && !Array.isArray(og) ? og : {}) as Record<string, unknown>;
      const tipo = TIPOS_ORIGEN.find((t) => t === oo.tipo);
      if (!tipo) return { error: `${de}: no sé de dónde sale (pedido, faltante o a mano).` };
      const uno: OrigenCompra = { tipo };
      const ref = texto(oo.ref, 40);
      const cliente = texto(oo.cliente, 80);
      if (ref) uno.ref = ref;
      if (cliente) uno.cliente = cliente;
      origen.push(uno);
    }
  }

  const r: RenglonCompra = { cod, tit, cant, recibido, lista, cadena, cont, neto, iva, sinStockFabrica, origen };
  if (recs.length) r.recs = recs;
  if (o.bulto != null && o.bulto !== "") {
    const bulto = num(o.bulto);
    if (!Number.isInteger(bulto) || bulto < 1 || bulto > MAX_BULTO)
      return { error: `${de}: el bulto es un número entero de 1 a ${miles(MAX_BULTO)} unidades.` };
    r.bulto = bulto;
  }
  if (o.necesita != null && o.necesita !== "") {
    const necesita = num(o.necesita);
    if (!Number.isInteger(necesita) || necesita < 0 || necesita > MAX_CANT)
      return { error: `${de}: lo que se necesitaba es un número entero de 0 a ${miles(MAX_CANT)}.` };
    r.necesita = necesita;
  }
  return { renglon: r };
}

/** Junta los que llegan con los que ya estaban, por codigo: el mismo
 *  articulo suma la cantidad (y lo que llego), junta los origenes (los
 *  ultimos 20) y toma la lista, la cadena, el contado, el costo y el IVA que
 *  llegan, que son los de hoy. La descripcion queda la primera. El orden es
 *  el de antes y los nuevos al final. Tambien junta los repetidos de una
 *  misma lista (la pagina puede mandar el mismo articulo de dos pedidos de
 *  clientes distintos). */
export function juntarRenglones(
  antes: RenglonCompra[],
  llegan: RenglonCompra[],
): { renglones: RenglonCompra[] } | { error: string; invalido: true } {
  const porCod = new Map<string, RenglonCompra>();
  for (const r of [...antes, ...llegan]) {
    const ya = porCod.get(r.cod);
    if (!ya) {
      porCod.set(r.cod, { ...r, cadena: [...r.cadena], origen: [...r.origen], ...(r.recs ? { recs: [...r.recs] } : {}) });
      continue;
    }
    const cant = ya.cant + r.cant;
    if (cant > MAX_CANT)
      return { error: `El artículo ${r.cod} pasaría de ${miles(MAX_CANT)} unidades en el pedido.`, invalido: true };
    const junto: RenglonCompra = {
      cod: ya.cod,
      tit: ya.tit,
      cant,
      recibido: Math.min(cant, ya.recibido + r.recibido),
      lista: r.lista,
      cadena: [...r.cadena],
      cont: r.cont,
      neto: r.neto,
      iva: r.iva,
      sinStockFabrica: ya.sinStockFabrica || r.sinStockFabrica,
      origen: [...ya.origen, ...r.origen].slice(-MAX_ORIGEN),
    };
    // Los recargos, como la cadena: los de hoy (los que llegan).
    if (r.recs && r.recs.length) junto.recs = [...r.recs];
    const bulto = r.bulto ?? ya.bulto;
    if (bulto != null) junto.bulto = bulto;
    // Lo que se necesitaba de verdad: si alguno lo dijo, se suma (el que no
    // lo dijo necesitaba lo que pidio).
    if (ya.necesita != null || r.necesita != null)
      junto.necesita = Math.min(MAX_CANT, (ya.necesita ?? ya.cant) + (r.necesita ?? r.cant));
    porCod.set(r.cod, junto);
  }
  const renglones = [...porCod.values()];
  if (renglones.length > MAX_RENGLONES_COMPRA)
    return { error: `El pedido pasaría de ${MAX_RENGLONES_COMPRA} renglones: mandá este y empezá otro.`, invalido: true };
  return { renglones };
}

/** Lo que ya llego de cada articulo, como esta guardado, puesto en los
 *  renglones nuevos que manda la pagina al guardar (cortado a la cantidad
 *  nueva; un articulo que no estaba, 0). Lo que llego se carga solo con
 *  "recibir": si guardar tomara el "recibido" de la pantalla, un pedido
 *  abierto o enviado podia quedar con mercaderia recibida sin que nadie la
 *  cargara, y una pestaña vieja deshacia lo que otro cargo. */
export function conLoQueYaLlego(guardados: readonly RenglonCompra[], nuevos: readonly RenglonCompra[]): RenglonCompra[] {
  const llego = new Map<string, number>();
  for (const r of guardados) llego.set(r.cod, (llego.get(r.cod) ?? 0) + r.recibido);
  return nuevos.map((r) => ({ ...r, recibido: Math.min(r.cant, llego.get(r.cod) ?? 0) }));
}

/** El estado de un pedido ya mandado segun lo que llego: todo = "recibido";
 *  algo = "parcial"; nada = "enviado" (solo se marco "sin stock de fabrica",
 *  o se corrigio a 0 lo cargado de mas: "llego una parte" diria algo que no
 *  paso). Lo usan recibir y guardar, asi un pedido nunca queda "recibido en
 *  parte" con todo adentro, ni al reves. */
export function estadoPorLoQueLlego(renglones: readonly RenglonCompra[]): "recibido" | "parcial" | "enviado" {
  if (renglones.length > 0 && renglones.every((r) => r.recibido === r.cant)) return "recibido";
  return renglones.some((r) => r.recibido > 0) ? "parcial" : "enviado";
}

/** Los totales del pedido, como los muestra la pagina: cada renglon
 *  redondeado a centavos y despues sumado. Nunca los que manda la pagina. */
export function totalesCompra(renglones: readonly RenglonCompra[]): { neto: number; iva: number; total: number } {
  let neto = 0;
  let iva = 0;
  for (const r of renglones) {
    neto += round2(r.neto * r.cant);
    iva += round2((r.neto * r.cant * r.iva) / 100);
  }
  neto = round2(neto);
  iva = round2(iva);
  return { neto, iva, total: round2(neto + iva) };
}

/** "OC-0001". */
export const nroCompra = (nro: number): string => `OC-${String(nro).padStart(4, "0")}`;

/** Como se dice el estado en un mensaje: "Ese pedido está <esto>". */
export function nombreEstadoCompra(estado: string): string {
  switch (estado) {
    case "parcial":
      return "recibido en parte";
    case "abierto":
    case "enviado":
    case "recibido":
    case "anulado":
      return estado;
    default:
      return "en un estado que no conozco";
  }
}

/** Lo que llego (POST {accion:"recibir"}): recibidos = {<cod>: cuantos
 *  llegaron en total}, sinStock = {<cod>: true/false}. Revisado contra los
 *  renglones del pedido: un codigo que no esta, o una cantidad que no
 *  entra, rechaza todo. Devuelve los renglones nuevos y si llego todo. */
export function aplicarRecibidos(
  renglones: readonly RenglonCompra[],
  recibidos: unknown,
  sinStock: unknown,
): { renglones: RenglonCompra[]; completo: boolean; algo: boolean } | { error: string; invalido: true } {
  const mal = (error: string) => ({ error, invalido: true as const });
  if (!recibidos || typeof recibidos !== "object" || Array.isArray(recibidos)) return mal("No llegó qué mercadería vino.");
  if (sinStock != null && (typeof sinStock !== "object" || Array.isArray(sinStock)))
    return mal("Lo de \"sin stock de fábrica\" no tiene forma.");
  const porCod = new Map(renglones.map((r) => [r.cod, { ...r }]));
  for (const [cod, v] of Object.entries(recibidos as Record<string, unknown>)) {
    const r = porCod.get(cod);
    if (!r) return mal(`El artículo ${texto(cod, 60)} no está en el pedido.`);
    const n = num(v);
    if (!Number.isInteger(n) || n < 0 || n > r.cant)
      return mal(`Lo que llegó de ${r.cod} tiene que ser un número entero de 0 a ${miles(r.cant)}.`);
    r.recibido = n;
  }
  for (const [cod, v] of Object.entries((sinStock ?? {}) as Record<string, unknown>)) {
    const r = porCod.get(cod);
    if (!r) return mal(`El artículo ${texto(cod, 60)} no está en el pedido.`);
    if (typeof v !== "boolean") return mal(`Lo de "sin stock de fábrica" de ${r.cod} es sí o no.`);
    r.sinStockFabrica = v;
  }
  const nuevos = renglones.map((r) => porCod.get(r.cod)!);
  const estado = estadoPorLoQueLlego(nuevos);
  return { renglones: nuevos, completo: estado === "recibido", algo: estado !== "enviado" };
}

/** Lo que falta llegar de cada articulo en un pedido enviado o recibido en
 *  parte: lo que usa la pagina para marcar "ya pedido" al volver a sacar
 *  faltantes. */
export function faltantesDe(renglones: readonly RenglonCompra[]): { cod: string; falta: number; sinStockFabrica: boolean }[] {
  return renglones
    .filter((r) => r.recibido < r.cant)
    .map((r) => ({ cod: r.cod, falta: r.cant - r.recibido, sinStockFabrica: r.sinStockFabrica }));
}
