import { registrar } from "@/lib/actividad";
import {
  cambiarCostosArticulo,
  type CostosArticulo,
  guardarArticulos,
  leerArticulos,
  limpiarArticulo,
  limpiarBulto,
  limpiarFleteArticulo,
  limpiarOtroCosto,
  limpiarOtroNombre,
  MAXIMO_ARTICULOS,
} from "@/lib/punto-articulos";
import { motivoParaLaPantalla } from "@/lib/punto-error";
import { puedePunto } from "@/lib/punto-permisos";
import { yoPunto } from "@/lib/punto-yo";
import { quienEntra } from "../clave";

// Los articulos de verdad del sistema Punto (los del Excel de GBP). Ver
// src/lib/punto-articulos.ts: no van en el codigo porque el repositorio es
// publico. Los pide la pagina al abrir (GET) y los manda al importar (POST).
// Las dos cosas solo con usuario y permiso de "Sistema Punto" (../clave.ts),
// e importar ademas con el permiso "importar" de Punto
// (src/lib/punto-permisos.ts): pisa la lista que usan todos los puestos.
//
// PATCH {cod, flete?, otroCosto?, otroNombre?, bulto?} (V.0.99.82): lo que
// se carga en Punto de un articulo. flete = flete fijo en pesos por unidad;
// otroCosto = otro costo en pesos por unidad, con IVA, y otroNombre lo que
// es; bulto = se compra solo de a N unidades. Cambia solo lo que vino (lo
// que no vino queda); 0 o vacio lo saca (y el bulto, tambien 1). Con el
// permiso "productos". Devuelve {ok, articulo}. Importar de nuevo el Excel
// no pisa nada de esto.

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

export async function GET(): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  try {
    return json(await leerArticulos());
  } catch {
    // Con 200, como todo lo de /sistema: un 5xx lo tapa Cloudflare con su
    // propia pagina y la pantalla no puede decir que paso.
    return json({ error: "No pude leer los artículos guardados: probá de nuevo en un momento." });
  }
}

export async function POST(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  if (!puedePunto(yo.permisos, "importar"))
    return json({ error: "Tu usuario no tiene permiso para importar. Pedíselo a quien administra los usuarios." }, 403);

  let cuerpo: { articulos?: unknown; archivo?: unknown; yo?: unknown };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  // Un cuerpo "null" (o un numero) es JSON valido: sin esto, leerle
  // .articulos tiraba un error que salia como 500.
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });
  const crudos = Array.isArray(cuerpo.articulos) ? cuerpo.articulos : [];
  if (!crudos.length) return json({ error: "No llegó ningún artículo." }, 400);
  if (crudos.length > MAXIMO_ARTICULOS) return json({ error: `Son más de ${MAXIMO_ARTICULOS} artículos.` }, 413);

  const buenos = crudos.map(limpiarArticulo).filter((a) => a !== null);
  if (!buenos.length) return json({ error: "Ningún renglón tenía código, descripción, Lista 1 y Lista 2." }, 400);

  const quien = yo.usuario;
  try {
    const r = await guardarArticulos(buenos, quien);
    const archivo = typeof cuerpo.archivo === "string" ? cuerpo.archivo.slice(0, 120) : "";
    const marcas = [...new Set(buenos.map((a) => a.prov))].slice(0, 8).join(", ");
    await registrar(
      "Punto: importó artículos de GBP",
      `${buenos.length} artículos (${marcas})${archivo ? ` desde ${archivo}` : ""}: ${r.nuevos} nuevos, ${r.actualizados} actualizados. Quedan ${r.total} guardados.`,
      quien,
    );
    return json({ ok: true, ...r, descartados: crudos.length - buenos.length });
  } catch (e) {
    // Con 200: un 5xx lo tapa Cloudflare con su propia pagina y la pantalla
    // no puede decir que paso. El texto, sin lo de adentro de la base (ver
    // src/lib/punto-error.ts).
    return json({ error: motivoParaLaPantalla(e, "No pude guardar los artículos: probá de nuevo en un momento.") });
  }
}

/** La pagina se abrio con otro usuario que el de la sesion de ahora. */
function deOtroUsuario(yo: unknown, quien: string): string | null {
  if (typeof yo !== "string" || !yo || yo === quien) return null;
  return `En esta compu ahora entró ${quien}: recargá la página para seguir con tu usuario. No se guardó nada.`;
}

export async function PATCH(req: Request): Promise<Response> {
  if ((await quienEntra()) !== "ok") return json({ error: "Tenés que entrar con tu usuario." }, 401);
  let cuerpo: {
    cod?: unknown;
    flete?: unknown;
    otroCosto?: unknown;
    otroNombre?: unknown;
    bulto?: unknown;
    yo?: unknown;
  };
  try {
    cuerpo = (await req.json()) as typeof cuerpo;
  } catch {
    return json({ error: "No entendí lo que me mandaste." }, 400);
  }
  if (!cuerpo || typeof cuerpo !== "object") return json({ error: "No entendí lo que me mandaste." }, 400);
  let yo: Awaited<ReturnType<typeof yoPunto>>;
  try {
    yo = await yoPunto();
  } catch {
    return json({ error: "No pude leer los permisos de tu usuario: probá de nuevo en un momento." });
  }
  if (!yo) return json({ error: "Tenés que entrar con tu usuario." }, 401);
  const otro = deOtroUsuario(cuerpo.yo, yo.usuario);
  if (otro) return json({ error: otro });
  if (!puedePunto(yo.permisos, "productos"))
    return json({ error: "Tu usuario no tiene permiso para cambiar artículos. Pedíselo a quien administra los usuarios." }, 403);

  // El codigo tal cual se guardo al importar (limpiarArticulo: sin espacios
  // de los costados, hasta 40).
  const cod = typeof cuerpo.cod === "string" ? cuerpo.cod.trim().slice(0, 40) : "";
  if (!cod) return json({ error: "Falta el código del artículo." }, 400);

  // Solo lo que vino: un campo que no esta en el cuerpo no se toca (asi la
  // pagina que todavia manda solo {cod, flete} sigue andando).
  const cambios: CostosArticulo = {};
  const vino = (k: string) => Object.prototype.hasOwnProperty.call(cuerpo, k);
  if (vino("flete")) {
    const flete = limpiarFleteArticulo(cuerpo.flete);
    if (flete === "mal") return json({ error: "El flete es un monto en pesos por unidad." }, 400);
    cambios.flete = flete;
  }
  if (vino("otroCosto")) {
    const otroCosto = limpiarOtroCosto(cuerpo.otroCosto);
    if (otroCosto === "mal") return json({ error: "El otro costo es un monto en pesos por unidad." }, 400);
    cambios.otroCosto = otroCosto;
  }
  if (vino("otroNombre")) {
    if (cuerpo.otroNombre != null && typeof cuerpo.otroNombre !== "string")
      return json({ error: "El nombre del otro costo es un texto." }, 400);
    cambios.otroNombre = limpiarOtroNombre(cuerpo.otroNombre);
  }
  if (vino("bulto")) {
    const bulto = limpiarBulto(cuerpo.bulto);
    if (bulto === "mal") return json({ error: "El bulto es un número entero de 1 a 10.000 unidades." }, 400);
    cambios.bulto = bulto;
  }
  if (!Object.keys(cambios).length) return json({ error: "No llegó nada para cambiar del artículo." }, 400);

  try {
    const articulo = await cambiarCostosArticulo(cod, cambios);
    if (!articulo) return json({ error: "Ese artículo no está entre los guardados: importalo primero." });
    const pesos = (n: number) => `$ ${n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    // Lo que quedo, de lo que se cambio: asi el Registro dice el valor nuevo.
    const partes: string[] = [];
    if ("flete" in cambios) partes.push(articulo.flete ? `flete ${pesos(articulo.flete)} por unidad` : "sin flete");
    if ("otroCosto" in cambios || "otroNombre" in cambios)
      partes.push(
        articulo.otroCosto
          ? `${articulo.otroNombre || "otro costo"} ${pesos(articulo.otroCosto)} por unidad`
          : `sin otro costo${articulo.otroNombre ? ` (${articulo.otroNombre})` : ""}`,
      );
    if ("bulto" in cambios) partes.push(articulo.bulto ? `se compra de a ${articulo.bulto}` : "se compra suelto");
    const soloFlete = Object.keys(cambios).length === 1 && "flete" in cambios;
    await registrar(
      soloFlete ? `Punto: cambió el flete del artículo ${cod}` : `Punto: cambió los costos del artículo ${cod}`,
      `${articulo.tit} · ${partes.join(" · ")}`,
      yo.usuario,
    );
    return json({ ok: true, articulo });
  } catch {
    return json({ error: "No pude guardar el cambio del artículo: probá de nuevo en un momento." });
  }
}
