"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { agregarMarca, getMarcas, marcasConWeb } from "@/lib/marcas-server";
import { detectarMarca, slugMarca } from "@/lib/marcas";
import { guardarComercial, sucursalDeEdicion } from "@/lib/precios-sucursal";
import { sincronizarSucursalPrincipal } from "@/lib/espejo-sucursal";
import { leerExportDelSistema } from "@/lib/excel-sistema";
import { getRecargosMp } from "@/lib/settings";
import { descuentoDelRecargo } from "@/lib/precios";
import { rubroSugerido, tituloSugerido } from "@/lib/alta-articulos";
import { subrubroSugerido, subrubroValido } from "@/lib/subrubros";
import { tituloEnLinea } from "@/lib/titulo-en-linea";
import { todosLosRubros, type RubrosExtra } from "@/lib/rubros";
import { getRubrosExtra } from "@/lib/rubros-server";
import { armarTitulo, armarTituloDeFabricante, tituloFVDesdeGBP } from "@/lib/fv-ficha";
import { buscarEnPiazza, rubroDePiazza } from "@/lib/piazza";
import { buscarArticuloDeLaMarca, codigosDelArticulo, leerLink } from "@/lib/web-de-marca";
import { buscarEnMercadoLibre, mlConectado } from "@/lib/mercadolibre";
import { buscarEnFV, guardarFotoDeFV } from "@/lib/fv";
import { conRegistro } from "@/lib/actividad";

// Alta de articulos nuevos desde el Excel de GBP.
//
// La pantalla de "Precios y stock" tambien da de alta, pero lo hace de
// costado: el articulo nace sin marca y en el rubro "otros", y despues hay
// que entrar a arreglarlo uno por uno. Con 108 articulos se aguanta; con los
// 10.000 del sistema, no.
//
// Aca el alta es lo unico que se hace, y se hace completa: titulo armado,
// marca, rubro, los dos precios y el stock, todo a la vista y corregible
// ANTES de crear nada. Lo que no se toca es lo que ya existe: para eso esta
// la otra pantalla. Dos cosas distintas, dos pantallas distintas.

export type ArticuloNuevo = {
  /** El codigo de GBP ("5135"). Va de codigo del articulo en la tienda. */
  itemCode: string;
  /** La descripcion cruda del sistema, para poder compararla. */
  descripcionGBP: string;
  titulo: string;
  /** Slug de la marca, o null si no se reconocio. */
  marca: string | null;
  /** Como la escribe GBP ("FERRUM"), para mostrarla si no se reconocio. */
  marcaGBP: string | null;
  categoria: string;
  motivoCategoria: string;
  /** Slug del subrubro (src/lib/subrubros.ts), o null. */
  subrubro: string | null;
  motivoSubrubro: string;
  /** La pestaña del Excel de donde salio. */
  hoja: string;
  /** Lo que va a mostrar la tienda con tarjeta. Sale de Lista 2. */
  unPago: number;
  /** Lo que se guarda: transferencia. */
  contado: number;
  stock: number;
  costo: number | null;
  /** Lo que deja el articulo sobre el costo, con el precio de transferencia.
   *  Null cuando el archivo no trae costo. */
  margenPct: number | null;
  codigoFabricante: string | null;
  fila: number;
};

export type PreviewAltaResult = {
  ok: boolean;
  error?: string;
  /** Que columna se leyo como precio, en castellano. */
  regla?: string;
  avisos?: string[];
  nuevos?: ArticuloNuevo[];
  /** Los que el archivo trae y la tienda YA tiene. No se tocan. */
  yaCargados?: { itemCode: string; titulo: string }[];
  stats?: {
    total: number;
    yaEstan: number;
    nuevos: number;
    sinMarca: number;
    sinRubro: number;
    margenFlojo: number;
  };
  /** Para los textos: "el contado sale X% menos". */
  descuentoContado?: number;
  /** El recargo de 1 pago con el que se hizo la cuenta. La pantalla usa este
   *  y no el descuento redondeado, asi el contado que se ve es el que se
   *  guarda. */
  recargoUnPago?: number;
  marcas?: { id: string; name: string; web?: boolean }[];
  /** MercadoLibre conectado: se busca tambien en su catalogo. */
  mercadoLibre?: boolean;
  rubros?: { slug: string; name: string }[];
  /** Los rubros y subrubros agregados a mano, para los desplegables. */
  rubrosExtra?: RubrosExtra;
  sucursal?: string;
};

/** Por debajo de esto el articulo se marca en rojo. No frena nada: avisa. */
const MARGEN_FLOJO = 10;

function rubrosDeLaTienda(extra: RubrosExtra): { slug: string; name: string }[] {
  // Una sola lista para todo, con los agregados a mano (src/lib/rubros.ts).
  return todosLosRubros(extra);
}

/** Lee el Excel y arma la ficha de cada articulo que todavia no esta. */
async function previsualizarAlta__(
  formData: FormData,
): Promise<PreviewAltaResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión vencida. Entrá de nuevo." };
  const extraR = await getRubrosExtra();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No llegó ningún archivo." };

  let lectura;
  try {
    const wb = XLSX.read(Buffer.from(await file.arrayBuffer()), {
      type: "buffer",
    });
    lectura = leerExportDelSistema(wb);
  } catch {
    return {
      ok: false,
      error: "No pude abrir el archivo. ¿Es el Excel que exporta GBP?",
    };
  }

  if (!lectura)
    return {
      ok: false,
      error:
        "Este archivo no parece una exportación de GBP: no encontré las columnas item_code e item_desc. Exportá la grilla desde el sistema y subila tal cual.",
    };

  // Un listado de solo stock ("Dep BS AS") no alcanza para dar de alta: sin
  // precio no hay nada que publicar. Va a la otra pantalla.
  if (!lectura.traePrecio)
    return {
      ok: false,
      error:
        "Este archivo trae solo el stock, sin precio. Para dar de alta hace falta el precio; para actualizar el stock usá \"Precios y stock por Excel\" con la opción Solo stock.",
    };

  // Lo que la tienda ya tiene. Se engancha igual que en la importacion de
  // precios: por el codigo del sistema, por el codigo del sitio y por la
  // cola de los codigos viejos (MARCA-1234).
  const yaEnLaTienda = await prisma.product.findMany({
    select: { itemId: true, sku: true, title: true, codigoSistema: true },
  });
  const porCodigo = new Map<string, (typeof yaEnLaTienda)[number]>();
  for (const p of yaEnLaTienda) {
    if (p.codigoSistema) porCodigo.set(p.codigoSistema.trim(), p);
    if (p.sku) porCodigo.set(p.sku.trim(), p);
    porCodigo.set(p.itemId.trim(), p);
    const cola = p.itemId.split("-").pop();
    if (cola && !porCodigo.has(cola)) porCodigo.set(cola, p);
  }

  const marcas = await getMarcas();
  const recargo = (await getRecargosMp()).unPago;
  const suc = await sucursalDeEdicion();

  const nuevos: ArticuloNuevo[] = [];
  const yaCargados: { itemCode: string; titulo: string }[] = [];

  for (const f of lectura.filas) {
    const ya = porCodigo.get(f.itemCode.trim());
    if (ya) {
      yaCargados.push({ itemCode: f.itemCode, titulo: ya.title });
      continue;
    }

    // La marca: primero la columna del sistema, que es la que sabe. Si ahi
    // viene algo que no esta en la lista de la tienda, se prueba leerla del
    // titulo, que es de donde sale en el resto del panel.
    let marca: string | null = null;
    if (f.marca) {
      const slug = slugMarca(f.marca);
      if (marcas.some((m) => m.id === slug)) marca = slug;
      else marca = detectarMarca(f.marca, marcas);
    }
    if (!marca) marca = detectarMarca(f.descripcion, marcas);

    const laMarca = marca ? (marcas.find((m) => m.id === marca) ?? null) : null;
    const nombreMarca = laMarca?.name ?? null;
    const t = tituloSugerido(f.descripcion, nombreMarca);
    // El rubro se busca sobre el titulo YA desabreviado, no sobre lo que vino
    // del sistema: "TERMOT ELECTRICO 80 LTS" no tiene ninguna palabra que se
    // reconozca, y "TERMOTANQUE ELÉCTRICO 80 LTS" si. Antes que eso, la
    // marca, si hace una sola cosa (FV: griferia).
    const r = rubroSugerido(t.titulo, f.subcategoria, f.categoria, laMarca);
    const sr = subrubroSugerido(r.slug, f.hoja, t.titulo, extraR);

    // FV: el titulo arranca ya con el formato de siempre (rubro, subrubro y
    // el codigo completo), armado con lo que dice GBP. Antes quedaba
    // "ALLEGRO LAVARROPAS FV", sin el codigo ni "Grifería", hasta que se
    // apretaba "Traer de FV" y solo si FV lo encontraba. Ver fv-ficha.ts.
    const titulo =
      marca === "fv"
        ? armarTitulo({
            rubroNombre: rubrosDeLaTienda(extraR).find((x) => x.slug === r.slug)?.name ?? "",
            rubro: r.slug,
            subrubro: sr.slug,
            fv: tituloFVDesdeGBP(f.descripcion, f.itemCode, r.slug, sr.slug),
            codigo: f.itemCode,
            descripcionGBP: f.descripcion,
          })
        : t.titulo;

    // Un renglon sin precio no se puede dar de alta (en un archivo con
    // precios, es un codigo que vino solo con stock).
    if (f.precio === null) continue;
    const unPago = Math.round(f.precio);
    const contado = Math.round(unPago / (1 + recargo / 100));
    const margenPct =
      f.costo && f.costo > 0
        ? Math.round(((contado - f.costo) / f.costo) * 1000) / 10
        : null;

    nuevos.push({
      itemCode: f.itemCode,
      descripcionGBP: f.descripcion,
      titulo,
      marca,
      marcaGBP: f.marca,
      categoria: r.slug,
      motivoCategoria: r.motivo,
      subrubro: sr.slug,
      motivoSubrubro: sr.motivo,
      hoja: f.hoja,
      unPago,
      contado,
      stock: f.stock ?? 0,
      costo: f.costo,
      margenPct,
      codigoFabricante: t.codigoFabricante,
      fila: f.fila,
    });
  }

  return {
    ok: true,
    regla: lectura.regla,
    avisos: lectura.avisos,
    nuevos,
    yaCargados,
    stats: {
      total: lectura.filas.length,
      yaEstan: yaCargados.length,
      nuevos: nuevos.length,
      sinMarca: nuevos.filter((n) => !n.marca).length,
      sinRubro: nuevos.filter((n) => n.categoria === "otros").length,
      margenFlojo: nuevos.filter(
        (n) => n.margenPct !== null && n.margenPct < MARGEN_FLOJO,
      ).length,
    },
    descuentoContado: descuentoDelRecargo(recargo),
    recargoUnPago: recargo,
    marcas: marcas.map((m) => ({ id: m.id, name: m.name, web: !!m.web })),
    mercadoLibre: await mlConectado(),
    rubros: rubrosDeLaTienda(extraR),
    rubrosExtra: extraR,
    sucursal: suc?.nombre,
  };
}

/** Un articulo tal como quedo despues de que lo revisaron en pantalla. */
export type AltaElegida = {
  itemCode: string;
  titulo: string;
  marca: string | null;
  categoria: string;
  subrubro: string | null;
  /** El precio de 1 pago. De aca sale el de contado, que es el que se guarda. */
  unPago: number;
  stock: number;
  /** La descripcion cruda de GBP. Va al ayuda memoria. */
  descripcionGBP: string;
  /** La foto de FV que se eligio en pantalla. Se vuelve a validar que sea de
   *  fvsa.com antes de bajarla (ver src/lib/fv.ts). */
  fotoFV?: string | null;
  /** Las otras fotos del modelo de la misma pagina, si se dejo tildada la
   *  principal. Se validan igual que esa. */
  fotosExtraFV?: string[] | null;
  /** Si las fotos salieron de un link pegado a mano: esa pagina. Sus fotos
   *  se validan contra ella (y contra que sea un sitio publico). */
  origenFotos?: string | null;
  /** La descripcion de la ficha de FV, si se dejo tildada. */
  descripcion?: string | null;
  /** El codigo con que la marca nombra al producto, si se lo encontro en su
   *  pagina. Si no, se saca de la descripcion de GBP al crear. */
  codigoFabricante?: string | null;
};

export type AltaResult = {
  ok: boolean;
  error?: string;
  creados?: number;
  /** Cuantas fotos de FV quedaron guardadas, y cuantas no bajaron. */
  fotos?: number;
  fotosFallidas?: number;
  /** Las fotos que se eligieron en la compu. Las sube la pantalla despues
   *  de crear cada tanda (ver AltaArticulosFlow), asi que estos dos los
   *  completa ella, no el servidor. */
  fotosPropias?: number;
  fotosPropiasFallidas?: number;
  omitidos?: { itemCode: string; motivo: string }[];
};

// ------------------------------------------------------- marca nueva

/** Suma una marca a la lista sin salir de la carga.
 *
 *  Damian, 17/11/2026, con un Excel de bachas sin marca: "esa marca no la
 *  tengo, deberia poder agregarse la misma manualmente". Es la misma lista de
 *  la pantalla Marcas (src/lib/marcas-server.ts): ahi despues se le puede
 *  poner el logo. Si ya estaba (mismo nombre o mismo identificador), se
 *  devuelve esa en vez de dar error: lo que se quiere es elegirla. */
async function agregarMarcaDesdeAlta__(
  nombre: string,
): Promise<{ ok: true; marca: { id: string; name: string } } | { ok: false; error: string }> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión vencida. Entrá de nuevo." };

  const name = String(nombre || "").trim().replace(/\s+/g, " ");
  if (!name) return { ok: false, error: "Escribí el nombre de la marca" };

  const id = slugMarca(name);
  const ya = (await getMarcas()).find(
    (m) => m.id === id || m.name.toLowerCase() === name.toLowerCase(),
  );
  if (ya) return { ok: true, marca: { id: ya.id, name: ya.name } };

  const r = await agregarMarca(name);
  if (r.error || !r.id) return { ok: false, error: r.error ?? "No se pudo agregar la marca" };

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { ok: true, marca: { id: r.id, name } };
}

// ------------------------------------------------------------- traer de FV

export type PedidoFV = {
  itemCode: string;
  descripcionGBP: string;
  marca: string | null;
  categoria: string;
  subrubro: string | null;
};

export type RespuestaFV = {
  itemCode: string;
  encontrado: boolean;
  motivo?: string;
  /** El titulo armado: rubro, subrubro y lo que dice la ficha de FV. */
  titulo?: string;
  /** Como lo titula FV, para mostrarlo al lado. */
  nombreFV?: string;
  /** El link era directo a una foto: trae solo la foto. */
  soloFoto?: boolean;
  foto?: string | null;
  /** Todas las fotos del modelo, la principal primero. */
  fotos?: string[];
  fotoDeOtraTerminacion?: boolean;
  /** FV ya no lo fabrica. */
  discontinuado?: boolean;
  ficha?: string;
  /** La descripcion armada con la ficha de FV. */
  descripcion?: string | null;
  /** De que pagina salio: "FV" o "Piazza". */
  fabricante?: string;
  /** El rubro y subrubro que dice la pagina del fabricante, cuando lo dice
   *  claro (Piazza: "Inodoros" es Sanitarios). La pantalla los aplica. */
  categoria?: string;
  subrubro?: string | null;
  /** El codigo de fabrica con que se lo encontro. */
  codigoFabricante?: string | null;
};

/** De a pocos por vez: la pantalla los va pidiendo y muestra el avance. Asi
 *  ningun pedido queda colgado minutos, y a la pagina de la marca no le
 *  llegan cien de golpe. De a 2: una pagina lenta puede llevar 40 segundos
 *  por articulo (src/lib/web-de-marca.ts) y el servidor corta a los 120. */
const FV_POR_TANDA = 2;

async function traerDeFV__(pedidos: PedidoFV[]): Promise<RespuestaFV[]> {
  const session = await getAdminSession();
  if (!session) return [];
  const extraR = await getRubrosExtra();
  const rubros = rubrosDeLaTienda(extraR);
  const conWeb = await marcasConWeb();
  const todas = await getMarcas();
  const ml = await mlConectado();
  const salida: RespuestaFV[] = [];

  /** El catalogo de MercadoLibre, exacto (src/lib/mercadolibre.ts): para las
   *  marcas sin pagina y cuando la pagina de la marca no lo tiene. */
  async function porMercadoLibre(p: PedidoFV, motivoAntes?: string): Promise<RespuestaFV | null> {
    const nombre = todas.find((m) => m.id === p.marca)?.name;
    if (!ml || !nombre) return null;
    const d = await buscarEnMercadoLibre({
      marca: nombre,
      codigos: codigosDelArticulo(p.descripcionGBP, p.itemCode),
    });
    if (!d.encontrado || !d.nombre)
      return motivoAntes
        ? { itemCode: p.itemCode, encontrado: false, motivo: `${motivoAntes}; ${d.motivo}`, fabricante: nombre }
        : null;
    const subrubro = subrubroValido(
      p.categoria,
      p.subrubro ?? subrubroSugerido(p.categoria, null, d.nombre, extraR).slug ?? null,
      extraR,
    );
    return {
      itemCode: p.itemCode,
      encontrado: true,
      fabricante: "MercadoLibre",
      titulo: armarTituloDeFabricante({
        rubroNombre: rubros.find((r) => r.slug === p.categoria)?.name ?? "",
        rubro: p.categoria,
        subrubro,
        nombre: d.nombre,
        marca: nombre,
        codigo: d.codigo ?? p.itemCode,
      }),
      nombreFV: d.nombre,
      foto: d.foto ?? null,
      fotos: d.fotos,
      ficha: d.ficha,
      descripcion: d.descripcion ?? null,
    };
  }

  for (const p of pedidos.slice(0, FV_POR_TANDA)) {
    const laMarca = p.marca ? conWeb.get(p.marca) : undefined;
    if (!p.marca || !laMarca) {
      const r = await porMercadoLibre(p, "esta marca no tiene su página web cargada");
      salida.push(
        r ?? {
          itemCode: p.itemCode,
          encontrado: false,
          motivo: "esta marca no tiene su página web cargada (se carga en Marcas)",
        },
      );
      continue;
    }

    // Cualquier marca que no sea FV ni Piazza: su pagina web, con el lector
    // general, y si ahi no esta, Google (src/lib/web-de-marca.ts). Damian,
    // 17/11/2026: "podes buscar en la web de la marca que buscamos con el
    // modelo, hacelo mas generico".
    if (p.marca !== "fv" && p.marca !== "piazza") {
      const d = await buscarArticuloDeLaMarca({
        web: laMarca.web,
        marca: laMarca.name,
        codigos: codigosDelArticulo(p.descripcionGBP, p.itemCode),
        titulo: p.descripcionGBP,
      });
      if (!d.encontrado || !d.nombre) {
        salida.push({ itemCode: p.itemCode, encontrado: false, motivo: d.motivo, fabricante: laMarca.name });
        continue;
      }
      const subrubro = subrubroValido(
        p.categoria,
        p.subrubro ?? subrubroSugerido(p.categoria, null, d.nombre, extraR).slug ?? null,
        extraR,
      );
      salida.push({
        itemCode: p.itemCode,
        encontrado: true,
        fabricante: d.fuente === "mercadolibre" ? "MercadoLibre" : laMarca.name,
        titulo: armarTituloDeFabricante({
          rubroNombre: rubros.find((r) => r.slug === p.categoria)?.name ?? "",
          rubro: p.categoria,
          subrubro,
          nombre: d.nombre,
          marca: laMarca.name,
          codigo: d.codigo ?? p.itemCode,
        }),
        nombreFV: d.codigo ? `${d.codigo} – ${d.nombre}` : d.nombre,
        foto: d.foto ?? null,
        fotos: d.fotos,
        ficha: d.ficha,
        descripcion: d.descripcion ?? null,
        codigoFabricante: d.codigo && d.codigo.toUpperCase() !== p.itemCode.toUpperCase() ? d.codigo : null,
      });
      continue;
    }

    // Piazza: el codigo del fabricante sale de la descripcion de GBP
    // (src/lib/piazza.ts). Trae nombre, foto, descripcion y el rubro.
    if (p.marca === "piazza") {
      const d = await buscarEnPiazza(p.descripcionGBP, p.itemCode);
      if (!d.encontrado || !d.nombre || !d.codigo) {
        const r = await porMercadoLibre(p, d.motivo);
        if (r?.encontrado) {
          salida.push(r);
          continue;
        }
        salida.push({
          itemCode: p.itemCode,
          encontrado: false,
          motivo: d.motivo,
          fabricante: "Piazza",
        });
        continue;
      }
      const sug = rubroDePiazza(d.categoria, d.codigo, d.nombre);
      const categoria = sug?.rubro ?? p.categoria;
      const subrubro = subrubroValido(
        categoria,
        sug ? sug.subrubro : subrubroSugerido(categoria, null, d.nombre, extraR).slug ?? p.subrubro,
        extraR,
      );
      salida.push({
        itemCode: p.itemCode,
        encontrado: true,
        fabricante: "Piazza",
        titulo: armarTituloDeFabricante({
          rubroNombre: rubros.find((r) => r.slug === categoria)?.name ?? "",
          rubro: categoria,
          subrubro,
          nombre: d.nombre,
          marca: "Piazza",
          codigo: d.codigo,
        }),
        nombreFV: `${d.codigo} – ${d.nombre}`,
        foto: d.foto ?? null,
        fotos: d.fotos,
        ficha: d.ficha,
        descripcion: d.descripcion ?? null,
        categoria,
        subrubro,
      });
      continue;
    }

    const d = await buscarEnFV(p.itemCode);
    if (!d.encontrado || !d.fv) {
      const r = await porMercadoLibre(p, d.motivo);
      salida.push(
        r?.encontrado ? r : { itemCode: p.itemCode, encontrado: false, motivo: d.motivo, fabricante: "FV" },
      );
      continue;
    }
    const rubroNombre =
      rubros.find((r) => r.slug === p.categoria)?.name ?? "";
    salida.push({
      itemCode: p.itemCode,
      encontrado: true,
      titulo: armarTitulo({
        rubroNombre,
        rubro: p.categoria,
        subrubro: subrubroValido(p.categoria, p.subrubro, extraR),
        fv: d.fv,
        codigo: p.itemCode,
        descripcionGBP: p.descripcionGBP,
      }),
      nombreFV: [d.fv.codigo, d.fv.linea, d.fv.tipo].filter(Boolean).join(" – "),
      foto: d.foto ?? null,
      fotoDeOtraTerminacion: d.fotoDeOtraTerminacion,
      discontinuado: d.discontinuado,
      ficha: d.ficha,
      descripcion: d.descripcion ?? null,
      fabricante: "FV",
    });
  }
  return salida;
}

async function crearArticulos__(
  items: AltaElegida[],
  opciones: { publicar: boolean },
): Promise<AltaResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión vencida. Entrá de nuevo." };
  if (items.length === 0)
    return { ok: false, error: "No elegiste ningún artículo." };

  const recargo = (await getRecargosMp()).unPago;
  const suc = await sucursalDeEdicion();
  const extraR = await getRubrosExtra();
  const rubros = new Set(rubrosDeLaTienda(extraR).map((r) => r.slug));
  const marcas = await getMarcas();

  let creados = 0;
  let fotos = 0;
  let fotosFallidas = 0;
  const omitidos: { itemCode: string; motivo: string }[] = [];

  for (const it of items) {
    const titulo = it.titulo.trim();
    if (!titulo) {
      omitidos.push({ itemCode: it.itemCode, motivo: "quedó sin título" });
      continue;
    }
    if (!(it.unPago > 0)) {
      omitidos.push({ itemCode: it.itemCode, motivo: "quedó sin precio" });
      continue;
    }

    const categoria = rubros.has(it.categoria) ? it.categoria : "otros";
    const marca =
      it.marca && marcas.some((m) => m.id === it.marca) ? it.marca : null;
    const contado = Math.round(it.unPago / (1 + recargo / 100));
    const stock = Math.max(0, Math.floor(it.stock));

    // La tienda que vende hoy lee el catalogo del articulo. Un articulo que
    // se carga para OTRO local nace pausado si o si, para no publicarlo en la
    // tienda equivocada; en su propio local se muestra igual, porque eso lo
    // dice su fila y no el articulo.
    const activo = opciones.publicar && suc?.esPrincipal !== false;

    try {
      await prisma.product.create({
        data: {
          itemId: it.itemCode,
          codigoSistema: it.itemCode,
          sku: it.itemCode,
          title: tituloEnLinea(titulo),
          category: categoria,
          subcategory: subrubroValido(categoria, it.subrubro, extraR),
          brand: marca,
          price: contado,
          salePrice: null,
          stock,
          active: activo,
          featured: false,
          // La descripcion cruda de GBP queda de ayuda memoria. No se ve en
          // la tienda, pero el buscador del panel la mira: asi el articulo
          // sigue apareciendo buscandolo como se lo nombra en el mostrador
          // ("PTA LAVAT", "JT103-BD"), que es como se lo busco siempre.
          memo: it.descripcionGBP,
          // El de la pagina de la marca, si se lo encontro ahi; si no, el que
          // se lee en la descripcion de GBP. FV: su codigo es el del sistema.
          codigoFabricante:
            it.codigoFabricante?.trim() ||
            (marca === "fv"
              ? it.itemCode
              : codigosDelArticulo(it.descripcionGBP, it.itemCode).find(
                  (c) => c !== it.itemCode.toUpperCase(),
                ) ?? null),
          // La de la ficha de FV, si se dejo tildada. Texto: se corta por las
          // dudas, una descripcion no necesita mas.
          description: it.descripcion?.trim().slice(0, 4000) || null,
        },
      });
    } catch {
      omitidos.push({
        itemCode: it.itemCode,
        motivo: "ya existe un artículo con ese código",
      });
      continue;
    }

    // El precio, el stock y si se muestra son datos del LOCAL, no del
    // articulo: van a su fila.
    await guardarComercial(
      [it.itemCode],
      { price: contado, salePrice: null, stock, active: activo },
      { crearSiFalta: true },
    );

    // La foto de FV, si se eligio una. Si no baja, el articulo queda igual,
    // con la foto generica del rubro, y se cuenta para avisar.
    if (it.fotoFV) {
      if (await guardarFotoDeFV(it.itemCode, it.fotoFV, it.fotosExtraFV ?? [], it.origenFotos ?? null)) fotos++;
      else fotosFallidas++;
    }

    creados++;
  }

  await sincronizarSucursalPrincipal();
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  return { ok: true, creados, fotos, fotosFallidas, omitidos };
}

/** "Pegar link" de una fila de Crear por Excel: lee la pagina que pego Damian
 *  y devuelve nombre, fotos y descripcion para mostrar. No guarda nada: se
 *  guarda al apretar Crear, como lo que trae "Buscar en la web". */
async function leerLinkParaAlta__(itemCode: string, link: string): Promise<RespuestaFV> {
  const session = await getAdminSession();
  if (!session) return { itemCode, encontrado: false, motivo: "Sesión vencida. Entrá de nuevo." };
  const d = await leerLink(link);
  if (!d.encontrado || (!d.nombre && !d.soloFoto))
    return { itemCode, encontrado: false, motivo: d.motivo, fabricante: "El link" };
  let sitio = "el link";
  try {
    sitio = new URL(d.ficha ?? link).hostname.replace(/^www\./, "");
  } catch {
    /* queda "el link" */
  }
  return {
    itemCode,
    encontrado: true,
    fabricante: sitio,
    nombreFV: d.nombre || undefined,
    ...(d.soloFoto ? { soloFoto: true } : {}),
    foto: d.foto ?? null,
    fotos: d.fotos,
    ficha: d.ficha ?? link,
    descripcion: d.descripcion ?? null,
  };
}

// ---- Registro de actividad (src/lib/actividad.ts): cada accion, si sale
// bien, queda anotada con el usuario que la hizo. Damian, 19/11/2026:
// "quiero que cada modificacion ... quede asentado con el usuario que toco".
export async function previsualizarAlta(...a: Parameters<typeof previsualizarAlta__>): ReturnType<typeof previsualizarAlta__> {
  return conRegistro("previsualizarAlta", a, () => previsualizarAlta__(...a));
}
export async function agregarMarcaDesdeAlta(...a: Parameters<typeof agregarMarcaDesdeAlta__>): ReturnType<typeof agregarMarcaDesdeAlta__> {
  return conRegistro("agregarMarcaDesdeAlta", a, () => agregarMarcaDesdeAlta__(...a));
}
export async function traerDeFV(...a: Parameters<typeof traerDeFV__>): ReturnType<typeof traerDeFV__> {
  return conRegistro("traerDeFV", a, () => traerDeFV__(...a));
}
export async function crearArticulos(...a: Parameters<typeof crearArticulos__>): ReturnType<typeof crearArticulos__> {
  return conRegistro("crearArticulos", a, () => crearArticulos__(...a));
}
export async function leerLinkParaAlta(...a: Parameters<typeof leerLinkParaAlta__>): ReturnType<typeof leerLinkParaAlta__> {
  return conRegistro("leerLinkParaAlta", a, () => leerLinkParaAlta__(...a));
}
