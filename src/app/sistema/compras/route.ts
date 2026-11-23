import { registrar } from "@/lib/actividad";
import {
  type AccionEstado,
  cambiarEstadoCompra,
  type CompraGuardada,
  guardarCompra,
  limpiarRenglones,
  listarCompras,
  pendientesPorCodigo,
  recibirCompra,
  type ResultadoCompra,
  sumarACompra,
} from "@/lib/punto-compras";
import { MARCA_COMPRA } from "@/lib/punto-compras-limpiar";
import { esSucursalPunto, nombreSucursalPunto, puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Los pedidos a los proveedores (ordenes de compra, OC-0001) de Punto,
// V.0.99.82. Ver src/lib/punto-compras.ts. Damian, 22/11/2026: "el pedido
// que voy a pedirle al proveedor me lo pongas con los costos y los valores".
//   GET  ?estado=abiertos&suc=tsl   -> {compras} abierto, enviado y recibido
//                                      en parte (lo de siempre; suc es
//                                      opcional)
//   GET  ?estado=todos&suc=tsl      -> {compras} los ultimos 200, el mas nuevo
//                                      primero
//   GET  ?pendientes=1&suc=tsl      -> {pendientes:{<cod>:[{compraId,
//                                      nroTexto, proveedor, estado, enviadoEn,
//                                      falta, sinStockFabrica}]}} lo pedido que
//                                      todavia no llego ("ya pedido")
//   POST {accion:"sumar", proveedorId?, proveedor, sucursal, renglones, marca?}
//        marca: la inventa la pagina por cada envio (8 a 64 letras, numeros,
//        - o _) y la repite si reintenta: el reintento no suma dos veces
//   POST {accion:"guardar", id, version, renglones, nota?} (lo que llego no
//        se toma de aca: queda el guardado; se carga con "recibir")
//   POST {accion:"enviar"|"cerrar"|"anular"|"reabrir", id}
//   POST {accion:"recibir", id, recibidos:{<cod>:n}, sinStock?:{<cod>:bool}}
//   Cada POST devuelve {ok, compra}; guardar con una version vieja,
//   {error, conflicto:true, compra} con el pedido como quedo. Cada POST puede
//   traer "yo": el usuario con el que se abrio la pagina.
// Todo con usuario y permiso de "Sistema Punto" (../clave.ts), y el area
// "proveedores" o la de "pedidos" (el que maneja los pedidos de los clientes
// suma sus faltantes al pedido del proveedor). Errores: 401 sin sesion, 403
// si no le toca, 400 si lo que mando no sirve; los del servidor y lo que no se
// puede ("ese pedido esta anulado") con 200 y {error}, porque Cloudflare tapa
// los 5xx con su propia pagina.

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

const SE_CERRO = "Se cerró tu sesión: entrá de nuevo con tu usuario.";
const SIN_PERMISO = "Tu usuario no tiene Proveedores ni Pedidos. Pedíselo a quien administra los usuarios.";
const ID_VALIDO = /^[A-Za-z0-9_-]{8,40}$/;
/** 500 renglones con todo lo suyo entran de sobra. */
const MAX_CUERPO = 1_000_000;

type Yo = NonNullable<Awaited<ReturnType<typeof yoPunto>>>;

/** Quien entra (../clave.ts) y que puede hacer adentro. Si la base no
 *  contesta, 200 con el aviso: un 5xx lo tapa Cloudflare. */
async function entrar(): Promise<{ yo: Yo } | { error: Response }> {
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    if ((await quienEntra()) !== "ok") return { error: json({ error: SE_CERRO }, 401) };
    yo = await yoPunto();
  } catch {
    return { error: json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." }) };
  }
  if (!yo) return { error: json({ error: SE_CERRO }, 401) };
  if (!puedePunto(yo.permisos, "proveedores") && !puedePunto(yo.permisos, "pedidos"))
    return { error: json({ error: SIN_PERMISO }, 403) };
  return { yo };
}

/** La sucursal del filtro: vacia = todas. */
function sucursalDe(u: URL): string | null | "mal" {
  const suc = u.searchParams.get("suc") ?? "";
  if (!suc) return null;
  return esSucursalPunto(suc) ? suc : "mal";
}

export async function GET(req: Request): Promise<Response> {
  const e = await entrar();
  if ("error" in e) return e.error;
  const u = new URL(req.url);
  const suc = sucursalDe(u);
  if (suc === "mal") return json({ error: "Esa sucursal no existe." }, 400);
  try {
    if (u.searchParams.get("pendientes") === "1")
      return json({ pendientes: await pendientesPorCodigo(suc ?? undefined) });
    const estado = u.searchParams.get("estado") || "abiertos";
    if (estado !== "abiertos" && estado !== "todos")
      return json({ error: "No sé qué lista querés (estado=abiertos o todos)." }, 400);
    return json({ compras: await listarCompras({ estado, sucursal: suc ?? undefined }) });
  } catch {
    return json({ error: "No pude leer los pedidos a proveedores: probá de nuevo en un momento." });
  }
}

const plata = (n: number) => n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** La linea del Registro de cada cambio. */
function paraElRegistro(
  accion: string,
  c: CompraGuardada,
  r: { nuevo?: boolean; sumados?: number; estadoAntes?: string },
): string {
  const de = `${c.nroTexto} de ${c.proveedor}`;
  switch (accion) {
    case "sumar":
      return r.nuevo ? `Punto: armó el pedido ${de}` : `Punto: sumó artículos al pedido ${de}`;
    case "guardar":
      // Al cambiar las cantidades puede quedar todo llegado (o volver a
      // faltar algo): que se lea en el Registro.
      if (r.estadoAntes && r.estadoAntes !== c.estado) {
        if (c.estado === "recibido") return `Punto: cambió el pedido ${de} (con eso llegó todo)`;
        if (c.estado === "parcial") return `Punto: cambió el pedido ${de} (queda recibido en parte)`;
        return `Punto: cambió el pedido ${de} (queda enviado, sin nada llegado)`;
      }
      return `Punto: cambió el pedido ${de}`;
    case "enviar":
      return `Punto: marcó como enviado el pedido ${de}`;
    case "recibir":
      return c.estado === "recibido"
        ? `Punto: llegó todo el pedido ${de}`
        : `Punto: cargó lo que llegó del pedido ${de}`;
    case "cerrar":
      return `Punto: cerró el pedido ${de} (lo que falta no viene)`;
    case "anular":
      return `Punto: anuló el pedido ${de}`;
    case "reabrir":
      return `Punto: reabrió el pedido ${de}`;
    default:
      return `Punto: ${accion} el pedido ${de}`;
  }
}

export async function POST(req: Request): Promise<Response> {
  // Primero quien es: al que no entro no se le lee el cuerpo.
  const e = await entrar();
  if ("error" in e) return e.error;
  const yo = e.yo;
  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await req.text();
    if (crudo.length > MAX_CUERPO) return json({ error: "El pedido es demasiado grande para guardarlo." }, 400);
    cuerpo = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object" || Array.isArray(cuerpo))
    return json({ error: "No entendí lo que me mandaste." }, 400);

  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });

  const accion = typeof cuerpo.accion === "string" ? cuerpo.accion : "";
  const acciones = ["sumar", "guardar", "enviar", "recibir", "cerrar", "anular", "reabrir"];
  if (!acciones.includes(accion)) return json({ error: "No sé qué querés hacer con el pedido." }, 400);

  // Lo que llega, revisado, antes de tocar la base.
  const id = typeof cuerpo.id === "string" ? cuerpo.id.trim() : "";
  if (accion !== "sumar" && !ID_VALIDO.test(id)) return json({ error: "No sé de qué pedido me hablás." }, 400);

  try {
    let res: ResultadoCompra;
    if (accion === "sumar") {
      const sucursal = typeof cuerpo.sucursal === "string" ? cuerpo.sucursal : "";
      if (!esSucursalPunto(sucursal)) return json({ error: "Falta la sucursal del pedido." }, 400);
      let proveedorId: string | null = null;
      if (cuerpo.proveedorId != null && cuerpo.proveedorId !== "") {
        proveedorId = typeof cuerpo.proveedorId === "string" ? cuerpo.proveedorId.trim() : "";
        if (!ID_VALIDO.test(proveedorId)) return json({ error: "No sé cuál es ese proveedor." }, 400);
      }
      // El nombre como se ve en el pedido: sin < > (va a innerHTML), sin
      // caracteres de control, hasta 160 como la razon social.
      const proveedor =
        typeof cuerpo.proveedor === "string"
          ? Array.from(
              cuerpo.proveedor
                .replace(/[<>]/g, "")
                .replace(/[\u0000-\u001f\u007f]/g, " ")
                .replace(/\s+/g, " ")
                .trim(),
            )
              .slice(0, 160)
              .join("")
              .toWellFormed()
              .trim()
          : "";
      if (!proveedor && !proveedorId) return json({ error: "Falta el proveedor del pedido." }, 400);
      // Una marca que no tiene forma es un error de la pagina: mejor que se
      // vea enseguida que sumar sin la proteccion del reintento.
      let marca: string | null = null;
      if (cuerpo.marca != null && cuerpo.marca !== "") {
        if (typeof cuerpo.marca !== "string" || !MARCA_COMPRA.test(cuerpo.marca))
          return json({ error: "La marca del envío no tiene forma: recargá la página." }, 400);
        marca = cuerpo.marca;
      }
      const limpios = limpiarRenglones(cuerpo.renglones);
      if ("error" in limpios) return json({ error: limpios.error }, 400);
      if (!limpios.renglones.length) return json({ error: "No llegó ningún artículo para sumar." }, 400);
      res = await sumarACompra(yo.usuario, { proveedorId, proveedor, sucursal, renglones: limpios.renglones, marca });
    } else if (accion === "guardar") {
      const version = Number(cuerpo.version);
      if (!Number.isInteger(version) || version < 1)
        return json({ error: "Falta la versión del pedido: recargá la página." }, 400);
      const limpios = limpiarRenglones(cuerpo.renglones);
      if ("error" in limpios) return json({ error: limpios.error }, 400);
      let nota: string | undefined;
      if (cuerpo.nota != null) {
        if (typeof cuerpo.nota !== "string") return json({ error: "La nota del pedido es un texto." }, 400);
        nota = Array.from(
          cuerpo.nota
            .replace(/[<>]/g, "")
            .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
            .trim(),
        )
          .slice(0, 500)
          .join("")
          .toWellFormed()
          .trim();
      }
      res = await guardarCompra({ id, version, renglones: limpios.renglones, nota });
    } else if (accion === "recibir") {
      res = await recibirCompra(id, cuerpo.recibidos, cuerpo.sinStock);
    } else {
      res = await cambiarEstadoCompra(id, accion as AccionEstado);
    }

    if (!("ok" in res)) {
      // Lo que mando la pagina no entra en el pedido (un codigo que no esta,
      // mas de lo pedido, pasaria de 500 renglones): 400, como lo demas que
      // no sirve. El resto (anulado, conflicto) con 200.
      if (res.invalido) return json({ error: res.error }, 400);
      return json(res);
    }
    if (res.cambio) {
      const c = res.compra;
      await registrar(
        paraElRegistro(accion, c, res),
        `${nombreSucursalPunto(c.sucursal)} · ${c.renglones.length} renglones · $ ${plata(c.total)} con IVA` +
          (accion === "sumar" && res.sumados ? ` · se sumaron ${res.sumados}` : ""),
        yo.usuario,
      );
    }
    return json({ ok: true, compra: res.compra });
  } catch {
    return json({ error: "No pude guardar el pedido: probá de nuevo en un momento. Lo de la pantalla no se perdió." });
  }
}
