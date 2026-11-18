// El chequeo de todos los dias. Damian, 17/11/2026: "podes hacer que el
// chequeo de las cuotas lo haga automaticamente todos los dias e informe en el
// panel como una leyenda de noticias, asi tambien los productos que se
// pausaron o quedaron bajo en stock etc.".
//
// Que mira, por cada local:
//   - Los productos: se compara con la foto del dia anterior (que se guarda
//     en Setting) y se cuenta cuales se pausaron, cuales se publicaron, cuales
//     quedaron sin stock o con poco, y cuantos se cargaron.
//   - Las cuotas: Mercado Pago no publica su tabla de costos para la tienda,
//     pero si dice cuanto se llevo de cada venta. Se compara lo que se llevo
//     en las ventas con tarjeta de los ultimos 30 dias con lo que calcula la
//     tienda (Panel -> Mercado Pago). Si se llevo mas, avisa.
//   - Si paso un mes sin revisar los costos de Mercado Pago.
//
// Cuando corre: una vez por dia como mucho. Lo dispara el vigia de GitHub
// (POST /api/chequeo-diario, cada 10 minutos, que no hace nada si ya corrio
// en las ultimas 20 horas) y tambien abrir el panel. Asi corre aunque nadie
// entre, y si el vigia se para, igual corre al entrar.
//
// Lo que encuentra va a las novedades (src/lib/novedades.ts), que se leen en
// la leyenda de arriba del panel.

import { prisma } from "@/lib/db";
import { getCostosMpDe, getSetting, setSetting } from "@/lib/settings";
import { costoTotalPct, diasDesdeRevisados, tocaRevisarCostos } from "@/lib/costos-mp";
import { cobrosDeLaTienda, mpConfigurado } from "@/lib/mercadopago";
import { agregarNovedades, leerNovedades, nombrar, type Novedad } from "@/lib/novedades";

const S_ULTIMO = "chequeo_diario_ultimo";
const HORAS_ENTRE = 20;
/** "Poco stock": quedan 1 o 2. */
const POCO = 2;
/** Cuanto mas puede llevarse Mercado Pago que lo calculado antes de avisar
 *  (puntos porcentuales): los redondeos de cada venta no son una novedad. */
const TOLERANCIA = 0.5;

const claveFoto = (slug: string) => `novedades_foto:${slug}`;
/** El ultimo control de cuotas de cada local, para mostrarlo en la pantalla
 *  de Mercado Pago (Damian, 18/11/2026, mirando "Revisados por ultima vez
 *  el 17/11": "esto no deberia preguntar todos los dias?". Si: el control
 *  corre todos los dias, pero esa pantalla solo decia cuando se cargaron los
 *  costos a mano). */
const claveControl = (slug: string) => `cuotas_control:${slug}`;

export type ControlDeCuotas = { fecha: string; texto: string; nivel: "info" | "aviso" };

export async function ultimoControlDeCuotas(slug: string): Promise<ControlDeCuotas | null> {
  try {
    const o = JSON.parse((await getSetting(claveControl(slug))) || "null");
    return o && typeof o.fecha === "string" && typeof o.texto === "string"
      ? { fecha: o.fecha, texto: o.texto, nivel: o.nivel === "aviso" ? "aviso" : "info" }
      : null;
  } catch {
    return null;
  }
}

/** "hoy a las 10:32", "ayer a las 9:05", "el 15/11 a las 8:00" (hora de
 *  Argentina, la del servidor no importa). */
export function cuandoFue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const zona = { timeZone: "America/Argentina/Buenos_Aires" } as const;
  const dia = (x: Date) => x.toLocaleDateString("es-AR", zona);
  const hora = d.toLocaleTimeString("es-AR", { ...zona, hour: "2-digit", minute: "2-digit" });
  const ahora = new Date();
  if (dia(d) === dia(ahora)) return `hoy a las ${hora}`;
  if (dia(d) === dia(new Date(ahora.getTime() - 86_400_000))) return `ayer a las ${hora}`;
  return `el ${d.toLocaleDateString("es-AR", { ...zona, day: "numeric", month: "numeric" })} a las ${hora}`;
}

type NuevaNovedad = Omit<Novedad, "id" | "fecha">;
type Local = { id: string; slug: string; name: string; tiendaActiva: boolean };
type Foto = { fecha: string; p: Record<string, [number, number]> };

export type ResumenChequeo = { corrio: boolean; novedades: number; motivo?: string };

const pct = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString("es-AR")}%`;

let corriendo: Promise<ResumenChequeo> | null = null;

/** Corre el chequeo si no corrio en las ultimas 20 horas. */
export async function chequeoDiarioSiToca(): Promise<ResumenChequeo> {
  const ultimo = await getSetting(S_ULTIMO);
  if (ultimo && Date.now() - new Date(ultimo).getTime() < HORAS_ENTRE * 3_600_000)
    return { corrio: false, novedades: 0, motivo: "ya corrió en las últimas horas" };
  return chequeoDiario();
}

/** Corre el chequeo ya. Si ya esta corriendo, espera ese. */
export function chequeoDiario(): Promise<ResumenChequeo> {
  if (!corriendo)
    corriendo = (async () => {
      try {
        // Se anota antes de empezar: si dos lo piden a la vez, corre uno.
        await setSetting(S_ULTIMO, new Date().toISOString());
        const locales = await prisma.branch.findMany({
          where: { active: true },
          orderBy: { orden: "asc" },
          select: { id: true, slug: true, name: true, tiendaActiva: true },
        });
        const nuevas: NuevaNovedad[] = [];
        for (const l of locales) {
          nuevas.push(...(await cambiosDeProductos(l)));
          if (l.tiendaActiva) {
            const cuotas = await chequeoDeCuotas(l);
            const c = cuotas[0];
            await setSetting(
              claveControl(l.slug),
              JSON.stringify({
                fecha: new Date().toISOString(),
                // Sin el nombre del local adelante: la pantalla ya es de ese local.
                texto: c
                  ? c.texto.replace(`${l.name}: `, "").replace(/^./, (x) => x.toUpperCase())
                  : "La cuenta de Mercado Pago de este local no está conectada: no hay cobros para controlar.",
                nivel: c?.nivel === "aviso" ? "aviso" : "info",
              } satisfies ControlDeCuotas),
            );
            nuevas.push(...cuotas);
            nuevas.push(...(await recordatorioDeCostos(l)));
          }
        }
        await agregarNovedades(nuevas);
        return { corrio: true, novedades: nuevas.length };
      } finally {
        setTimeout(() => (corriendo = null), 0);
      }
    })();
  return corriendo;
}

// ------------------------------------------------------------ productos

async function cambiosDeProductos(l: Local): Promise<NuevaNovedad[]> {
  const filas = await prisma.branchProduct.findMany({
    where: { branchId: l.id },
    select: { stock: true, active: true, product: { select: { itemId: true, title: true } } },
  });
  const hoy: Foto = { fecha: new Date().toISOString(), p: {} };
  const titulo = new Map<string, string>();
  for (const f of filas) {
    hoy.p[f.product.itemId] = [f.stock, f.active ? 1 : 0];
    titulo.set(f.product.itemId, f.product.title);
  }

  let antes: Foto | null = null;
  try {
    const raw = await getSetting(claveFoto(l.slug));
    const o = raw ? JSON.parse(raw) : null;
    if (o && typeof o.fecha === "string" && o.p && typeof o.p === "object") antes = o as Foto;
  } catch {
    antes = null;
  }
  await setSetting(claveFoto(l.slug), JSON.stringify(hoy));

  const publicados = Object.entries(hoy.p).filter(([, [, a]]) => a === 1);
  const nombres = (ids: string[]) => nombrar(ids.map((i) => titulo.get(i) ?? i));

  // La primera vez no hay con que comparar: se cuenta como esta hoy.
  if (!antes) {
    const sin = publicados.filter(([, [s]]) => s <= 0).map(([i]) => i);
    const poco = publicados.filter(([, [s]]) => s > 0 && s <= POCO).map(([i]) => i);
    const salida: NuevaNovedad[] = [];
    if (sin.length)
      salida.push({
        tipo: "sin-stock",
        nivel: "aviso",
        sucursal: l.slug,
        texto: `${l.name}: ${sin.length} publicados sin stock: ${nombres(sin)}`,
        link: "/admin/productos?filter=low-stock",
        items: sin,
      });
    if (poco.length)
      salida.push({
        tipo: "poco-stock",
        sucursal: l.slug,
        texto: `${l.name}: ${poco.length} con poco stock (1 o 2): ${nombres(poco)}`,
        link: "/admin/productos?filter=low-stock",
        items: poco,
      });
    return salida;
  }

  // Lo que ya se conto con su causa desde la foto anterior (por ejemplo, los
  // combos que pauso una carga de stock) no se cuenta otra vez.
  const desde = new Date(antes.fecha).getTime();
  const yaContados = new Set(
    (await leerNovedades())
      .filter(
        (n) =>
          (n.tipo === "combos" || n.tipo === "pausados-sin-stock") &&
          n.sucursal === l.slug &&
          new Date(n.fecha).getTime() >= desde,
      )
      .flatMap((n) => n.items ?? []),
  );

  const pausados: string[] = [];
  const activados: string[] = [];
  const sinStock: string[] = [];
  const pocoStock: string[] = [];
  const nuevos: string[] = [];
  for (const [id, [s, a]] of Object.entries(hoy.p)) {
    const v = antes.p[id];
    if (!v) {
      nuevos.push(id);
      continue;
    }
    if (yaContados.has(id)) continue;
    const [sAntes, aAntes] = v;
    if (aAntes === 1 && a === 0) pausados.push(id);
    if (aAntes === 0 && a === 1) activados.push(id);
    if (a === 1 && s <= 0 && sAntes > 0) sinStock.push(id);
    if (a === 1 && s > 0 && s <= POCO && sAntes > POCO) pocoStock.push(id);
  }

  const salida: NuevaNovedad[] = [];
  if (sinStock.length)
    salida.push({
      tipo: "sin-stock",
      nivel: "aviso",
      sucursal: l.slug,
      texto: `${l.name}: quedaron sin stock y siguen publicados: ${nombres(sinStock)}`,
      link: "/admin/productos?filter=low-stock",
      items: sinStock,
    });
  if (pocoStock.length)
    salida.push({
      tipo: "poco-stock",
      sucursal: l.slug,
      texto: `${l.name}: quedan 1 o 2 de ${nombres(pocoStock)}`,
      link: "/admin/productos?filter=low-stock",
      items: pocoStock,
    });
  if (pausados.length)
    salida.push({
      tipo: "pausados",
      sucursal: l.slug,
      texto: `${l.name}: se pausaron ${pausados.length === 1 ? "" : `${pausados.length}: `}${nombres(pausados)}`,
      link: "/admin/productos?filter=inactive",
      items: pausados,
    });
  if (activados.length)
    salida.push({
      tipo: "activados",
      sucursal: l.slug,
      texto: `${l.name}: se publicaron ${activados.length === 1 ? "" : `${activados.length}: `}${nombres(activados)}`,
      link: "/admin/productos",
      items: activados,
    });
  if (nuevos.length)
    salida.push({
      tipo: "nuevos",
      sucursal: l.slug,
      texto: `${l.name}: se cargaron ${nuevos.length} ${nuevos.length === 1 ? "producto nuevo" : "productos nuevos"}: ${nombres(nuevos)}`,
      link: "/admin/productos",
      items: nuevos,
    });
  return salida;
}

// --------------------------------------------------------------- cuotas

async function chequeoDeCuotas(l: Local): Promise<NuevaNovedad[]> {
  if (!mpConfigurado(l.slug)) return [];
  const cobros = await cobrosDeLaTienda(l.slug, 30);
  const clave = `cuotas:${l.slug}`;
  if (cobros === null)
    return [
      {
        tipo: "cuotas",
        clave,
        sucursal: l.slug,
        texto: `${l.name}: hoy no se pudo consultar a Mercado Pago para controlar las cuotas`,
        link: "/admin/mercadopago",
      },
    ];
  const costos = await getCostosMpDe(l.slug);

  const porCuotas = new Map<number, { monto: number; costo: number; ventas: number }>();
  for (const c of cobros) {
    if (c.costo <= 0) continue;
    const g = porCuotas.get(c.cuotas) ?? { monto: 0, costo: 0, ventas: 0 };
    g.monto += c.monto;
    g.costo += c.costo;
    g.ventas++;
    porCuotas.set(c.cuotas, g);
  }
  if (porCuotas.size === 0)
    return [
      {
        tipo: "cuotas",
        clave,
        sucursal: l.slug,
        texto: `${l.name}: cuotas sin novedad (no hubo ventas con tarjeta en los últimos 30 días para controlar)`,
        link: "/admin/mercadopago",
      },
    ];

  const avisos: string[] = [];
  const bien: string[] = [];
  for (const [n, g] of [...porCuotas.entries()].sort((a, b) => a[0] - b[0])) {
    const real = (g.costo / g.monto) * 100;
    const nombre = n === 1 ? "1 pago" : `${n} cuotas`;
    const plan = n === 1 ? 0 : costos.planes.find((p) => p.cuotas === n)?.costo;
    if (plan === undefined) {
      avisos.push(`en ${nombre} (un plan que la tienda no tiene cargado) se llevó ${pct(real)}`);
      continue;
    }
    const calculado = costoTotalPct(costos.cobro, plan, costos.iva);
    if (real > calculado + TOLERANCIA)
      avisos.push(`en ${nombre} se llevó ${pct(real)} y la tienda calcula ${pct(calculado)}`);
    else bien.push(`${nombre} ${pct(real)}`);
  }
  if (avisos.length)
    return [
      {
        tipo: "cuotas",
        clave,
        nivel: "aviso",
        sucursal: l.slug,
        texto: `${l.name}: Mercado Pago cobra más de lo cargado: ${avisos.join("; ")}. Actualizá los costos`,
        link: "/admin/mercadopago",
      },
    ];
  return [
    {
      tipo: "cuotas",
      clave,
      sucursal: l.slug,
      texto: `${l.name}: cuotas al día (lo que se llevó Mercado Pago: ${bien.join(", ")})`,
      link: "/admin/mercadopago",
    },
  ];
}

async function recordatorioDeCostos(l: Local): Promise<NuevaNovedad[]> {
  const { revisados } = await getCostosMpDe(l.slug);
  if (!tocaRevisarCostos(revisados)) return [];
  const dias = diasDesdeRevisados(revisados);
  return [
    {
      tipo: "costos",
      clave: `costos:${l.slug}`,
      nivel: "aviso",
      sucursal: l.slug,
      texto:
        dias === null
          ? `${l.name}: cargá los costos de Mercado Pago de este mes (los de ahora son de octubre)`
          : `${l.name}: hace ${dias} días que no se revisan los costos de Mercado Pago (cambian mes a mes)`,
      link: "/admin/mercadopago",
    },
  ];
}
