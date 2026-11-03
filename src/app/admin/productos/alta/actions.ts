"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { getMarcas } from "@/lib/marcas-server";
import { detectarMarca, slugMarca } from "@/lib/marcas";
import { guardarComercial, sucursalDeEdicion } from "@/lib/precios-sucursal";
import { sincronizarSucursalPrincipal } from "@/lib/espejo-sucursal";
import { leerExportDelSistema } from "@/lib/excel-sistema";
import { getRecargosMp } from "@/lib/settings";
import { descuentoDelRecargo } from "@/lib/precios";
import { rubroSugerido, tituloSugerido } from "@/lib/alta-articulos";
import { business } from "@/lib/business";

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
  marcas?: { id: string; name: string }[];
  rubros?: { slug: string; name: string }[];
  sucursal?: string;
};

/** Por debajo de esto el articulo se marca en rojo. No frena nada: avisa. */
const MARGEN_FLOJO = 10;

function rubrosDeLaTienda(): { slug: string; name: string }[] {
  const base: { slug: string; name: string }[] = business.categories.map(
    (c) => ({ slug: c.slug, name: c.name }),
  );
  // Estos dos no estan en el menu de la tienda pero si son rubros validos de
  // un articulo, asi que tienen que poder elegirse.
  return base.concat([
    { slug: "calefones", name: "Termotanques y Calefones" },
    { slug: "piletas", name: "Piletas y bachas" },
    { slug: "otros", name: "Otros" },
  ]);
}

/** Lee el Excel y arma la ficha de cada articulo que todavia no esta. */
export async function previsualizarAlta(
  formData: FormData,
): Promise<PreviewAltaResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión vencida. Entrá de nuevo." };

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

    const nombreMarca = marca
      ? (marcas.find((m) => m.id === marca)?.name ?? null)
      : null;
    const t = tituloSugerido(f.descripcion, nombreMarca);
    // El rubro se busca sobre el titulo YA desabreviado, no sobre lo que vino
    // del sistema: "TERMOT ELECTRICO 80 LTS" no tiene ninguna palabra que se
    // reconozca, y "TERMOTANQUE ELÉCTRICO 80 LTS" si.
    const r = rubroSugerido(t.titulo, f.subcategoria, f.categoria);

    const unPago = Math.round(f.precio);
    const contado = Math.round(unPago / (1 + recargo / 100));
    const margenPct =
      f.costo && f.costo > 0
        ? Math.round(((contado - f.costo) / f.costo) * 1000) / 10
        : null;

    nuevos.push({
      itemCode: f.itemCode,
      descripcionGBP: f.descripcion,
      titulo: t.titulo,
      marca,
      marcaGBP: f.marca,
      categoria: r.slug,
      motivoCategoria: r.motivo,
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
    marcas: marcas.map((m) => ({ id: m.id, name: m.name })),
    rubros: rubrosDeLaTienda(),
    sucursal: suc?.nombre,
  };
}

/** Un articulo tal como quedo despues de que lo revisaron en pantalla. */
export type AltaElegida = {
  itemCode: string;
  titulo: string;
  marca: string | null;
  categoria: string;
  /** El precio de 1 pago. De aca sale el de contado, que es el que se guarda. */
  unPago: number;
  stock: number;
  /** La descripcion cruda de GBP. Va al ayuda memoria. */
  descripcionGBP: string;
};

export type AltaResult = {
  ok: boolean;
  error?: string;
  creados?: number;
  omitidos?: { itemCode: string; motivo: string }[];
};

export async function crearArticulos(
  items: AltaElegida[],
  opciones: { publicar: boolean },
): Promise<AltaResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "Sesión vencida. Entrá de nuevo." };
  if (items.length === 0)
    return { ok: false, error: "No elegiste ningún artículo." };

  const recargo = (await getRecargosMp()).unPago;
  const suc = await sucursalDeEdicion();
  const rubros = new Set(rubrosDeLaTienda().map((r) => r.slug));
  const marcas = await getMarcas();

  let creados = 0;
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
          title: titulo,
          category: categoria,
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

    creados++;
  }

  await sincronizarSucursalPrincipal();
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  return { ok: true, creados, omitidos };
}
