import { registrar } from "@/lib/actividad";
import {
  contadores,
  ajustarStockDe,
  crearDocumento,
  documentoPorId,
  documentoPorMarca,
  editarPresupuesto,
  ID_VALIDO,
  limpiarDocumento,
  limpiarEdicion,
  listarDocumentos,
} from "@/lib/punto-documentos";
import { motivoParaLaPantalla } from "@/lib/punto-error";
import { nombreSucursalPunto, puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Lo que se emite en el sistema Punto (presupuestos, facturas sin CAE,
// remitos, ventas sin comprobante). Ver src/lib/punto-documentos.ts.
//   GET  ?dias=30&tipo=&suc=   -> lo emitido, de todos los puestos
//   GET  ?solo=contadores      -> el ultimo numero de cada serie
//   GET  ?idLocal=...          -> si ese comprobante quedo guardado (para
//                                 cuando se corto la respuesta al emitir)
//   POST {documento}           -> lo guarda y le pone el numero
//   POST {documento, edita}    -> cambia un presupuesto ya emitido (mismo
//                                 numero; edita = {id, base})
//   ventaId (en el documento o al lado): la venta del servidor de la que
//                                 sale; queda "cobrada" en la misma
//                                 transaccion (src/lib/punto-ventas.ts)
//   documento.actualizaDe      -> presupuesto nuevo que pone uno viejo a
//                                 precios de hoy (el viejo no se toca)
//   GET  ./pdf?id=...          -> el PDF (./pdf/route.ts)
//   POST ./despachar {id}      -> quien despacho en el deposito
//                                 (./despachar/route.ts)
// Cada documento que vuelve trae vendedor (el que atendio), usuario y
// cobroNombre (el que lo emitio: en una venta, el que cobro) y, si salio del
// deposito, datos.despacho {por, nombre, en, nota} (V.0.99.82).
// Todo solo con usuario y permiso de "Sistema Punto" (../clave.ts). Los
// errores del servidor van con 200 y {error}: Cloudflare tapa los 5xx.
//
// Desde la V.0.99.81 (src/lib/punto-permisos.ts), al emitir:
// - El que tiene sucursal fija solo emite (y edita) como esa.
// - El que no tiene el permiso "numeros" no corrige el numero a mano: se
//   ignora el que manda la pantalla y sale el que sigue.
// Desde la V.0.99.82, el que no tiene "cobrar" solo emite presupuestos.

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

export async function GET(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const u = new URL(req.url);
  try {
    if (u.searchParams.get("solo") === "contadores") return json({ contadores: await contadores() });
    const marca = u.searchParams.get("idLocal");
    if (marca) return json({ documento: await documentoPorMarca(marca) });
    const dias = Math.min(366, Math.max(1, Math.round(Number(u.searchParams.get("dias")) || 30)));
    const [lista, numeros] = await Promise.all([
      listarDocumentos({
        dias,
        tipo: u.searchParams.get("tipo") || undefined,
        sucursal: u.searchParams.get("suc") || undefined,
      }),
      contadores(),
    ]);
    return json({ ...lista, contadores: numeros, dias });
  } catch {
    return json({ error: "No pude leer los comprobantes guardados." });
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok")
    return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario. La venta queda en pantalla." }, 401);

  let cuerpo: { documento?: unknown; edita?: unknown; yo?: unknown; ventaId?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  const limpio = limpiarDocumento(cuerpo.documento);
  if ("error" in limpio) return json({ error: limpio.error }, 400);
  // La venta del servidor de la que sale (V.0.99.82): puede venir adentro
  // del documento o al lado. Se revisa igual que la de adentro.
  if (!limpio.doc.ventaId && cuerpo.ventaId != null && cuerpo.ventaId !== "") {
    const ventaId = typeof cuerpo.ventaId === "string" ? cuerpo.ventaId.trim() : "";
    if (!ID_VALIDO.test(ventaId)) return json({ error: "No sé de qué venta sale este comprobante." }, 400);
    limpio.doc.ventaId = ventaId;
  }

  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo)
    return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario. La venta queda en pantalla." }, 401);
  const quien = yo.usuario;
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });
  // V.0.99.82: el cajero ("cobrar") emite aunque no tenga la solapa Venta:
  // cobra el ticket que le manda el vendedor.
  if (!puedePunto(yo.permisos, "venta") && !puedePunto(yo.permisos, "cobrar"))
    return json({ error: "Tu usuario no tiene permiso para vender. Pedíselo a quien administra los usuarios." }, 403);
  // V.0.99.82: el que no cobra solo presupuesta (letra X); lo demas lo emite
  // el cajero, desde el ticket que le manda el vendedor (/sistema/ventas).
  if (limpio.doc.letra !== "X" && !puedePunto(yo.permisos, "cobrar"))
    return json({ error: "Tu usuario no cobra: mandá la venta a caja." }, 403);
  // La pagina ya fija la sucursal del que la tiene; esto es por si igual
  // llega otra (una pestaña vieja, alguien que la cambia a mano).
  const otraSucursal = (suc: string) =>
    yo.sucursal && suc !== yo.sucursal
      ? `Tu usuario es de ${nombreSucursalPunto(yo.sucursal)}: no puede emitir como otra sucursal.`
      : null;
  const malSucursal = otraSucursal(limpio.doc.sucursal);
  if (malSucursal) return json({ error: malSucursal }, 400);
  if (cuerpo.edita != null) {
    const ed = limpiarEdicion(cuerpo.edita);
    if (!ed) return json({ error: "No sé qué presupuesto querés cambiar." }, 400);
    try {
      // Al editar, el presupuesto conserva la sucursal con la que se emitio
      // (editarPresupuesto no la cambia): esa tambien tiene que ser la suya.
      if (yo.sucursal) {
        const original = await documentoPorId(ed.id);
        const mal = original && otraSucursal(original.sucursal);
        if (mal) return json({ error: mal }, 400);
      }
      const r = await editarPresupuesto(ed, limpio.doc, quien);
      if ("error" in r) return json({ error: r.error });
      if (!r.repetido) {
        const total = r.doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        await registrar(
          `Punto: cambió el Presupuesto ${r.doc.nroTexto}`,
          `${r.doc.cliente} · $ ${total} · ${limpio.doc.renglones.length} renglones`,
          quien,
        );
      }
      return json({ ok: true, documento: r.doc, repetido: r.repetido, editado: true });
    } catch (e) {
      // Sin lo de adentro de la base (ver src/lib/punto-error.ts).
      return json({ error: "No se pudo guardar el cambio: " + motivoParaLaPantalla(e, "error del servidor") + "." });
    }
  }
  // Sin permiso para corregir la numeracion: desde 1, y siguiente() (en
  // src/lib/punto-documentos.ts) usa el ultimo + 1; una serie nueva arranca
  // en 1. Asi el numero que se haya tipeado en la pantalla no cuenta.
  if (!puedePunto(yo.permisos, "numeros")) limpio.doc.desdeNumero = 1;
  try {
    const r = await crearDocumento(limpio.doc, quien);
    if ("error" in r) return json({ error: r.error });
    const { doc, repetido } = r;
    // El stock sale al cobrar. Tambien en el repetido: si el primero se
    // corto antes de moverlo, lo hace este; si ya salio, no hace nada.
    const stock = await ajustarStockDe(doc.id, true);
    if (!repetido) {
      const total = doc.total.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      await registrar(
        `Punto: emitió ${doc.comp.replace(/^\d+\./, "")} ${doc.nroTexto}`,
        `${doc.cliente} · $ ${total} · ${limpio.doc.renglones.length} renglones · vendedor ${doc.vendedor}`,
        quien,
      );
    }
    return json({ ok: true, documento: doc, repetido, stock });
  } catch (e) {
    return json({ error: "No se pudo guardar el comprobante: " + motivoParaLaPantalla(e, "error del servidor") + "." });
  }
}
