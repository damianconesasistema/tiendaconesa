import { registrar } from "@/lib/actividad";
import {
  aplicarCambiosExcel,
  deshacerCambiosExcel,
  guardarColumnasProveedor,
  leerHistorialCambios,
  MAXIMO_ARTICULOS,
} from "@/lib/punto-articulos";
import { type CambioExcel, limpiarCambioExcel, limpiarColumnas } from "@/lib/punto-cambios-excel";
import { motivoParaLaPantalla } from "@/lib/punto-error";
import { puedePunto } from "@/lib/punto-permisos";
import { type YoPunto, yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../../clave";

// Cambios de precios por Excel (V.0.11.258; reglas en
// src/lib/punto-cambios-excel.ts). Damian, 24/11/2026: "si yo hago una
// modificacion de este Excel, que despues se pueda subir para que tome los
// cambios" y, con la lista de FV, "solo tenemos que modificar los que tenemos
// cargados ... no cargar nuevos ... si hay algun error me lo tenes que hacer
// saber". La pagina lee el Excel y arma la revision; aca llega solo lo que se
// tildo. Con el permiso "importar" (el mismo de los Excel de GBP).
//
// GET -> {historial (las ultimas subidas, sin renglones), columnas (las de la
//   lista de cada proveedor, por marca)}
// POST {yo, accion}:
//   - "aplicar" {origen: "excel"|"proveedor"|"masivo", marca, archivo, columnas?,
//     cambios: [{cod, antes: {lista, lista1, lista2}, despues: {...}}]}:
//     solo los articulos que ya estan; nunca crea. Devuelve {ok, id,
//     actualizados, noEstan, cambiados, malos}.
//   - "deshacer" {id}: vuelve atras esa subida (menos lo tocado despues).
//   - "columnas" {marca, columnas}: recuerda como se lee su lista.
// Los errores van con 200 y {error}: Cloudflare tapa los 5xx.

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

const texto = (x: unknown, max: number) =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

async function quienSoy(): Promise<YoPunto | Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  let yo: YoPunto | null;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Se cerró tu sesión: entrá de nuevo con tu usuario." }, 401);
  if (!puedePunto(yo.permisos, "importar"))
    return json({ error: "Tu usuario no puede cambiar precios por Excel (hace falta el permiso Importar). Pedíselo a quien administra los usuarios." });
  return yo;
}

export async function GET(): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  try {
    return json(await leerHistorialCambios());
  } catch {
    return json({ error: "No pude leer el historial de subidas: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  const yo = await quienSoy();
  if (yo instanceof Response) return yo;
  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "No entendí lo que me mandaste." });
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." });
  const quien = yo.usuario;
  const otro = deOtroUsuario(cuerpo.yo, quien);
  if (otro) return json({ error: otro });

  try {
    if (cuerpo.accion === "aplicar") {
      // V.0.11.259: "masivo" = el cambio de margen o de precios de lo filtrado en
      // Articulos (marca = los filtros, archivo = que se hizo).
      const origen = cuerpo.origen === "proveedor" ? "proveedor" : cuerpo.origen === "masivo" ? "masivo" : "excel";
      const marca = texto(cuerpo.marca, 60);
      const archivo = texto(cuerpo.archivo, 120);
      if (origen === "proveedor" && !marca) return json({ error: "Falta de qué marca es la lista." });
      const crudos = Array.isArray(cuerpo.cambios) ? cuerpo.cambios : [];
      if (!crudos.length) return json({ error: "No llegó ningún cambio." });
      if (crudos.length > MAXIMO_ARTICULOS) return json({ error: `Son más de ${MAXIMO_ARTICULOS} renglones.` });
      const cambios: CambioExcel[] = [];
      for (const x of crudos) {
        const c = limpiarCambioExcel(x);
        // Uno mal frena todo: la revision de la pagina ya los filtra, asi
        // que si llega uno mal algo no cierra y es mejor no aplicar a medias.
        if (typeof c === "string") return json({ error: c + " No se cambió nada." });
        cambios.push(c);
      }
      const columnas = origen === "proveedor" ? limpiarColumnas(cuerpo.columnas) : null;
      const r = await aplicarCambiosExcel(cambios, { origen, marca, archivo, columnas }, quien);
      if (r.actualizados)
        await registrar(
          origen === "proveedor"
            ? `Punto: actualizó costos con la lista de ${marca}`
            : origen === "masivo"
              ? "Punto: cambió precios en masa"
              : "Punto: subió cambios de artículos por Excel",
          `${r.actualizados} artículos${origen === "masivo" ? ` · ${archivo}${marca ? ` · ${marca}` : ""}` : archivo ? ` desde ${archivo}` : ""}` +
            `${r.cambiados.length ? ` · ${r.cambiados.length} no se pisaron (cambiaron en el medio)` : ""}` +
            `${r.malos.length ? ` · ${r.malos.length} no se pudieron` : ""}` +
            `${r.noEstan.length ? ` · ${r.noEstan.length} no están cargados (no se crean)` : ""}`,
          quien,
        );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "deshacer") {
      const id = texto(cuerpo.id, 40);
      if (!id) return json({ error: "Falta qué subida deshacer." });
      const r = await deshacerCambiosExcel(id, quien);
      if (typeof r === "string") return json({ error: r });
      await registrar(
        "Punto: deshizo una subida de precios por Excel",
        `${r.subida.origen === "proveedor" ? `lista de ${r.subida.marca}` : r.subida.origen === "masivo" ? "cambio masivo" : "Excel de artículos"}${r.subida.archivo ? ` (${r.subida.archivo})` : ""}` +
          ` · ${r.deshechos} artículos volvieron a como estaban` +
          `${r.tocadosDespues.length ? ` · ${r.tocadosDespues.length} quedaron (se cambiaron después)` : ""}`,
        quien,
      );
      return json({ ok: true, ...r });
    }

    if (cuerpo.accion === "columnas") {
      const marca = texto(cuerpo.marca, 60);
      const columnas = limpiarColumnas(cuerpo.columnas);
      if (!marca || !columnas) return json({ error: "No entendí las columnas." });
      await guardarColumnasProveedor(marca, columnas);
      return json({ ok: true });
    }

    return json({ error: "No entendí qué hacer." });
  } catch (e) {
    return json({ error: motivoParaLaPantalla(e, "No pude guardar: probá de nuevo en un momento.") + " No se cambió nada." });
  }
}
