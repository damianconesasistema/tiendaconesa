import { registrar } from "@/lib/actividad";
import { ID_VALIDO } from "@/lib/punto-documentos";
import { esSucursalPunto, fueraDeSucursal, nombreSucursalPunto, nombresSucursales, puedePunto } from "@/lib/punto-permisos";
import {
  anular,
  aBorrador,
  guardarPedido,
  guardarVenta,
  limpiarVenta,
  listarCaja,
  listarMias,
  listarPedidos,
  LUGAR_VALIDO,
  mandarACaja,
  numeroDePedido,
  retomar,
  soltar,
  tomar,
  type Quien,
  type Resultado,
  type VentaGuardada,
} from "@/lib/punto-ventas";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// La venta de Punto en el servidor: la que se arma, los borradores, la caja
// y los pedidos tomados (V.0.99.82). Ver src/lib/punto-ventas.ts.
//   GET  ?vista=mias              -> { ventas } mi venta de cada pestaña, mis
//                                    borradores y mis pedidos
//   GET  ?vista=caja&suc=tsl      -> { ventas } la caja de esa sucursal: lo
//                                    que espera y lo que se esta cobrando, lo
//                                    mas viejo primero (permiso "cobrar")
//   GET  ?vista=pedidos           -> { ventas } todos los pedidos tomados
//   POST {accion:"guardar", lugar, id?, version?, venta}
//   POST {accion:"borrador", id}  {accion:"retomar", id, lugar}
//   POST {accion:"mandar", id, sucursal}  {accion:"tomar", id, lugar}
//   POST {accion:"soltar", id}    {accion:"anular", id}
//   POST {accion:"pedido", id?, version?, venta}
// venta = {datos, cliente, total, sucursal, vendedor?, origenId?}. Cada POST
// puede traer "yo": el usuario con el que se abrio la pagina.
//
// Todo solo con usuario y permiso de "Sistema Punto" (../clave.ts). Errores:
// 401 sin sesion, 403 si no le toca, 400 si lo que mando no sirve; los del
// servidor y lo que no se puede ("la esta cobrando X") con 200 y {error},
// porque Cloudflare tapa los 5xx con su propia pagina. El que choca con un
// cambio de otra pestaña recibe {error, conflicto:true, venta}.

export const dynamic = "force-dynamic";

function json(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

const SIN_PERMISO_VENTA = "Tu usuario no tiene permiso para vender. Pedíselo a quien administra los usuarios.";
const NO_COBRA = "Tu usuario no cobra: la caja la atiende el cajero.";
const SIN_PERMISO_PEDIDOS = "Tu usuario no tiene permiso para tomar pedidos. Pedíselo a quien administra los usuarios.";
const SE_CERRO = "Se cerró tu sesión: entrá de nuevo con tu usuario. La venta queda en pantalla.";
/** Lo que entra de sobra en una venta de 200 KB de datos. */
const MAX_CUERPO = 600_000;

async function quienSoy(): Promise<{ yo: Awaited<ReturnType<typeof yoPunto>> } | { error: Response }> {
  try {
    return { yo: await yoPunto() };
  } catch {
    return { error: json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." }) };
  }
}

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const r = await quienSoy();
  if ("error" in r) return r.error;
  const yo = r.yo;
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);

  const u = new URL(req.url);
  const vista = u.searchParams.get("vista");
  try {
    if (vista === "mias") return json({ ventas: await listarMias(yo.usuario) });
    if (vista === "caja") {
      if (!puedePunto(yo.permisos, "cobrar")) return json({ error: NO_COBRA }, 403);
      const suc = u.searchParams.get("suc") ?? "";
      if (!esSucursalPunto(suc)) return json({ error: "Falta la sucursal de la caja." }, 400);
      if (yo.sucursales && fueraDeSucursal(yo.sucursales, suc))
        return json(
          { error: `Tu usuario es de ${nombresSucursales(yo.sucursales)}: no ve la caja de otra sucursal.` },
          403,
        );
      return json({ ventas: await listarCaja(suc) });
    }
    if (vista === "pedidos") {
      if (!puedePunto(yo.permisos, "pedidos")) return json({ error: SIN_PERMISO_PEDIDOS }, 403);
      return json({ ventas: await listarPedidos() });
    }
    return json({ error: "No sé qué lista querés (vista=mias, caja o pedidos)." }, 400);
  } catch {
    return json({ error: "No pude leer las ventas guardadas: probá de nuevo en un momento." });
  }
}

const plata = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** La linea del Registro de cada cambio de estado. Sin plata de mas: el
 *  cliente y el total alcanzan. */
function paraElRegistro(accion: string, v: VentaGuardada, creado: boolean): { que: string; detalle: string } {
  const detalle = `${v.cliente} · $ ${plata(v.total)} · vendedor ${v.vendedor}`;
  const caja = nombreSucursalPunto(v.sucursal);
  const nro = numeroDePedido(v);
  switch (accion) {
    case "borrador":
      return { que: "Punto: dejó una venta como borrador", detalle };
    case "retomar":
      return { que: "Punto: retomó una venta", detalle };
    case "mandar":
      return { que: `Punto: mandó una venta a la caja de ${caja}`, detalle };
    case "tomar":
      return { que: `Punto: tomó en la caja de ${caja} la venta de ${v.vendedor}`, detalle };
    case "soltar":
      return { que: `Punto: devolvió a la caja de ${caja} la venta de ${v.vendedor}`, detalle };
    case "anular":
      return { que: nro ? `Punto: anuló el pedido N° ${nro}` : "Punto: anuló una venta", detalle };
    case "pedido":
      return { que: `Punto: ${creado ? "tomó" : "cambió"} el pedido N° ${nro ?? "?"}`, detalle };
    default:
      return { que: `Punto: ${accion}`, detalle };
  }
}

/** Un numero de version que manda la pagina, o null si no vino. */
function versionDe(x: unknown): number | null | "mal" {
  if (x == null || x === "") return null;
  const n = Number(x);
  return Number.isInteger(n) && n >= 1 && n <= 1e9 ? n : "mal";
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: SE_CERRO }, 401);

  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await req.text();
    if (crudo.length > MAX_CUERPO)
      return json({ error: "La venta es demasiado grande para guardarla (más de 200 KB)." }, 400);
    cuerpo = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo))
    return json({ error: "No entendí lo que me mandaste." }, 400);

  const r = await quienSoy();
  if ("error" in r) return r.error;
  const yo = r.yo;
  if (!yo) return json({ error: SE_CERRO }, 401);
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });

  const puede = (id: string) => puedePunto(yo.permisos, id);
  const quien: Quien = {
    usuario: yo.usuario,
    nombre: yo.nombre,
    sucursales: yo.sucursales,
    puedeCobrar: puede("cobrar"),
    puedePedidos: puede("pedidos"),
  };

  const accion = typeof cuerpo.accion === "string" ? cuerpo.accion : "";
  // Lo que pide cada accion, antes de tocar la base.
  const permiso: Record<string, () => string | null> = {
    guardar: () => (puede("venta") || puede("cobrar") ? null : SIN_PERMISO_VENTA),
    borrador: () => (puede("venta") ? null : SIN_PERMISO_VENTA),
    retomar: () => (puede("venta") ? null : SIN_PERMISO_VENTA),
    mandar: () => (puede("venta") || puede("cobrar") ? null : SIN_PERMISO_VENTA),
    tomar: () => (puede("cobrar") ? null : NO_COBRA),
    soltar: () => (puede("venta") || puede("cobrar") ? null : SIN_PERMISO_VENTA),
    anular: () => (puede("venta") || puede("cobrar") || puede("pedidos") ? null : SIN_PERMISO_VENTA),
    pedido: () => (puede("pedidos") ? null : SIN_PERMISO_PEDIDOS),
  };
  // Object.hasOwn y no permiso[accion]: "hasOwnProperty", "isPrototypeOf" y
  // los demas que todo objeto hereda tambien son funciones. Con esos pasaba
  // de largo el control de permisos (y "__defineGetter__" tiraba un 500).
  if (!Object.hasOwn(permiso, accion)) return json({ error: "No sé qué querés hacer con la venta." }, 400);
  const falta = permiso[accion]();
  if (falta) return json({ error: falta }, 403);

  // Lo que llega, revisado.
  const id = cuerpo.id == null || cuerpo.id === "" ? null : typeof cuerpo.id === "string" ? cuerpo.id.trim() : "";
  if (id !== null && !ID_VALIDO.test(id)) return json({ error: "No sé de qué venta me hablás." }, 400);
  if (id === null && accion !== "guardar" && accion !== "pedido")
    return json({ error: "No sé de qué venta me hablás." }, 400);
  const lugar = typeof cuerpo.lugar === "string" ? cuerpo.lugar.trim() : "";
  if ((accion === "guardar" || accion === "retomar" || accion === "tomar") && !LUGAR_VALIDO.test(lugar))
    return json({ error: "Falta la pestaña de la venta (lugar): recargá la página." }, 400);
  const version = versionDe(cuerpo.version);
  if (version === "mal") return json({ error: "La versión de la venta no es un número." }, 400);

  try {
    if (accion === "guardar" || accion === "pedido") {
      const limpia = limpiarVenta(cuerpo.venta);
      if ("error" in limpia) return json({ error: limpia.error }, 400);
      if (accion === "guardar") {
        // El guardado de todos los dias (cada cambio en la pantalla): no va
        // al Registro.
        const g = await guardarVenta(quien, { lugar, id, version, venta: limpia.venta });
        return json(g);
      }
      const p = await guardarPedido(quien, { id, version, venta: limpia.venta });
      return await responder(accion, p, yo.usuario);
    }

    let res: Resultado;
    if (accion === "borrador") res = await aBorrador(quien, id!, version);
    else if (accion === "retomar") res = await retomar(quien, id!, lugar);
    else if (accion === "mandar") {
      const sucursal = typeof cuerpo.sucursal === "string" ? cuerpo.sucursal : "";
      if (!esSucursalPunto(sucursal)) return json({ error: "Elegí a qué caja la mandás." }, 400);
      res = await mandarACaja(quien, id!, sucursal, version);
    } else if (accion === "tomar") res = await tomar(quien, id!, lugar);
    else if (accion === "soltar") res = await soltar(quien, id!);
    else if (accion === "anular") res = await anular(quien, id!);
    // Cada accion de la tabla de permisos tiene su rama: una nueva que se
    // olvide aca no cae en anular.
    else return json({ error: "No sé qué querés hacer con la venta." }, 400);
    return await responder(accion, res, yo.usuario);
  } catch {
    return json({ error: "No pude guardar la venta: probá de nuevo en un momento. Lo de la pantalla no se perdió." });
  }
}

/** {ok, venta} o el error; si cambio algo, queda en el Registro. */
async function responder(accion: string, res: Resultado, usuario: string): Promise<Response> {
  if (!("ok" in res)) return json(res);
  if (res.cambio) {
    const { que, detalle } = paraElRegistro(accion, res.venta, res.nuevo === true);
    await registrar(que, detalle, usuario);
  }
  return json({ ok: true, venta: res.venta });
}
