"use server";

import * as XLSX from "xlsx";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { detectarMarca, marcaPorId } from "@/lib/marcas";
import { getMarcas } from "@/lib/marcas-server";
import { sincronizarSucursalPrincipal } from "@/lib/espejo-sucursal";
import { guardarComercial, sucursalDeEdicion } from "@/lib/precios-sucursal";
import { leerExportDelSistema } from "@/lib/excel-sistema";

// Que se vino a cambiar. Lo elige el que importa, antes de subir el
// archivo, y de ahi en adelante manda: una lista de precios de una marca no
// tiene por que tocar el stock, y un recuento de stock no tiene por que
// tocar los precios. Antes se escribia todo siempre, asi que para corregir
// el precio de diez articulos habia que armar un archivo con el stock de
// esos diez tambien, o se iba a cero.
export type ModoImport = "precios" | "stock" | "ambos";

export type ParsedRow = {
  itemId: string;
  sku: string | null;
  title: string;
  category: string;
  brand: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  description: string | null;
  memo: string | null;
  imageUrl: string | null;
  /** Como lo llama el sistema de Conesa. Queda guardado en el articulo
   *  para que la proxima importacion enganche exacto. */
  codigoSistema: string | null;
  /** Lo que vale hoy en este local. Null si el producto es nuevo. Es para
   *  mostrar "antes -> ahora" antes de tocar nada: una columna leida mal
   *  se ve ahi y no despues, en la tienda. */
  __precioAnterior: number | null;
  /** Lo mismo con el stock de este local. */
  __stockAnterior: number | null;
  /** Si la fila trajo de verdad esas columnas. Una celda vacia no es un
   *  cero: es "de esto no se habla". Sin esta distincion, importar una
   *  lista de precios pondria todo el stock en cero. */
  __traePrecio: boolean;
  __traeStock: boolean;
  /** Si alcanza para darlo de alta (titulo y precio). Un codigo que no
   *  esta en la tienda y viene en una lista de precios no se puede crear:
   *  no hay titulo ni categoria. No es un error del archivo, es que ese
   *  articulo todavia no existe aca. */
  __puedeCrearse: boolean;
  // Metadata del parseo
  __rowNumber: number;
  __errors: string[];
  __exists: boolean; // ya está en DB
  __hasActive: boolean; // la fila traía explícito el campo "activo"
  __hasFeatured: boolean; // la fila traía explícito el campo "destacado"
  __traeMarca: boolean; // la fila traía explícito el campo "marca"
};

export type ParseResult = {
  ok: boolean;
  error?: string;
  rows?: ParsedRow[];
  /** Cuando el archivo es un export del sistema, que se entendio de el.
   *  Va a la pantalla para que se pueda revisar antes de aplicar: si la
   *  columna del precio se leyo mal, se ve ahi y no en la tienda. */
  delSistema?: { regla: string; avisos: string[] };
  stats?: {
    total: number;
    valid: number;
    withErrors: number;
    toCreate: number;
    toUpdate: number;
    withImage: number;
    /** Cuantos productos cambian de precio, para arriba y para abajo. */
    suben: number;
    bajan: number;
    /** Codigos del archivo que no estan en la tienda y que ademas no se
     *  pueden dar de alta con lo que trae el archivo. */
    sinDatosParaAlta: number;
    /** Cuantos cambian de stock. */
    stockCambia: number;
    /** Estan en la tienda pero este local no los lleva. Se ve ANTES de
     *  aplicar: es la explicacion de "importe y no cambio nada" cuando se
     *  importa en el panel de un local que todavia no tiene el catalogo. */
    enOtroLocal: number;
  };
  /** El local sobre el que se va a importar, para que se vea en pantalla
   *  antes de aplicar: el precio es de cada local y equivocarse de panel
   *  es cambiarle el precio al otro. */
  local?: string;
};

// Normaliza nombres de columnas: trim, lowercase, saca acentos
function norm(s: string): string {
  return s
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Mapeo de aliases de columna a campo canónico
const COL_ALIASES: Record<string, string> = {
  codigo: "itemId",
  code: "itemId",
  id: "itemId",
  itemid: "itemId",
  mla: "itemId",

  sku: "sku",
  codigo_interno: "sku",
  "codigo interno": "sku",

  memo: "memo",
  nota: "memo",
  observacion: "memo",
  observaciones: "memo",
  ayudamemoria: "memo",
  "ayuda memoria": "memo",

  titulo: "title",
  nombre: "title",
  producto: "title",
  name: "title",
  title: "title",

  precio: "price",
  "precio base": "price",
  precio_base: "price",
  price: "price",

  oferta: "salePrice",
  "precio oferta": "salePrice",
  precio_oferta: "salePrice",
  descuento: "salePrice",
  saleprice: "salePrice",

  stock: "stock",
  cantidad: "stock",
  disponible: "stock",

  marca: "brand",
  brand: "brand",
  codigo_sistema: "codigoSistema",
  "codigo del sistema": "codigoSistema",
  item_code: "codigoSistema",

  categoria: "category",
  cat: "category",
  category: "category",

  activo: "active",
  publicado: "active",
  active: "active",

  destacado: "featured",
  featured: "featured",

  descripcion: "description",
  description: "description",
  detalle: "description",

  imagen: "imageUrl",
  foto: "imageUrl",
  "imagen url": "imageUrl",
  imagen_url: "imageUrl",
  imageurl: "imageUrl",
};

const VALID_CATEGORIES = new Set([
  "sanitarios",
  "griferia",
  "banera",
  "accesorios",
  "salamandras",
  "calefones",
  "materiales",
  "piletas",
  "herramientas",
  "cocina",
  "otros",
]);

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  return (
    s === "si" ||
    s === "sí" ||
    s === "true" ||
    s === "1" ||
    s === "yes" ||
    s === "activo" ||
    s === "publicado"
  );
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (v === null || v === undefined || v === "") return null;
  // Soportar "15.000,50" / "15,000.50" / "15000"
  const s = String(v).trim().replace(/[^\d,.-]/g, "");
  if (!s) return null;
  // Si tiene coma Y punto, el último decimal es el final (es-AR)
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  let normalized = s;
  if (lastComma > lastDot) {
    normalized = s.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = s.replace(/,/g, "");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function normalizeCategory(v: unknown): string {
  const raw = norm(String(v || ""));
  if (VALID_CATEGORIES.has(raw)) return raw;
  // Mapeos comunes a nuestras categorias
  if (raw.includes("grif")) return "griferia";
  if (raw.includes("sanit") || raw.includes("inod")) return "sanitarios";
  if (raw.includes("ban") || raw.includes("tina")) return "banera";
  if (raw.includes("salam") || raw.includes("estufa")) return "salamandras";
  if (raw.includes("calef") || raw.includes("termo")) return "calefones";
  if (raw.includes("acc") || raw.includes("espejo")) return "accesorios";
  if (raw.includes("pil") || raw.includes("bacha")) return "piletas";
  if (
    raw.includes("herram") ||
    raw.includes("taladro") ||
    raw.includes("amolad")
  )
    return "herramientas";
  if (
    raw.includes("campana") ||
    raw.includes("extractor") ||
    raw.includes("anafe")
  )
    return "cocina";
  if (raw.includes("mat") || raw.includes("ceme") || raw.includes("hierro"))
    return "materiales";
  return "otros";
}

export async function previewExcel(
  formData: FormData,
  modo: ModoImport = "ambos",
): Promise<ParseResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { ok: false, error: "No se recibió el archivo" };

  if (file.size > 10 * 1024 * 1024)
    return { ok: false, error: "El archivo no puede superar 10 MB" };

  try {
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return { ok: false, error: "Excel sin hojas" };
    const sheet = wb.Sheets[sheetName];
    let raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: null,
      raw: true,
    });

    if (raw.length === 0)
      return { ok: false, error: "La hoja está vacía" };

    // Mapear nombres de columnas a canónicos
    const originalKeys = Object.keys(raw[0]);
    let keyMap: Record<string, string> = {};
    for (const k of originalKeys) {
      const canonical = COL_ALIASES[norm(k)];
      if (canonical) keyMap[k] = canonical;
    }

    const tocaPrecios = modo !== "stock";
    const tocaStock = modo !== "precios";

    // Pre-chequeo: que esten las columnas de lo que se vino a cambiar.
    // El titulo NO es obligatorio: hace falta solo para dar de alta algo que
    // no esta en la tienda, y eso se avisa fila por fila. Exigirlo rechazaba
    // el archivo entero, que es lo que impedia subir una lista de precios.
    const canonicals = new Set(Object.values(keyMap));
    const missing: string[] = [];
    if (!canonicals.has("itemId")) missing.push("código");
    if (tocaPrecios && !canonicals.has("price")) missing.push("precio");
    if (tocaStock && !canonicals.has("stock")) missing.push("stock");
    // Si no tiene las columnas del importador, puede ser el Excel tal cual
    // sale del sistema. Esos vienen con item_code / item_desc y la columna
    // del precio cambia de nombre segun el proveedor: eso se reconoce solo.
    let delSistema: { regla: string; avisos: string[] } | undefined;
    if (missing.length) {
      const lectura = leerExportDelSistema(wb);
      if (!lectura) {
        return {
          ok: false,
          error: `Faltan columnas obligatorias: ${missing.join(", ")}. Usá la plantilla, o subí el Excel tal cual sale del sistema.`,
        };
      }

      // Para no pisar lo que ya esta cargado. El archivo del sistema trae el
      // precio y el stock; el titulo, la categoria y la marca del sitio son
      // trabajo hecho a mano y NO se tocan si el producto ya existe.
      const yaCargados = await prisma.product.findMany({
        select: {
          itemId: true,
          sku: true,
          title: true,
          category: true,
          brand: true,
          stock: true,
          codigoSistema: true,
        },
      });
      const porCodigoSistema = new Map<string, (typeof yaCargados)[number]>();
      for (const p of yaCargados) {
        if (p.codigoSistema) porCodigoSistema.set(p.codigoSistema, p);
        if (p.sku) porCodigoSistema.set(p.sku.trim(), p);
        // Los codigos del sitio se armaron como MARCA-1234: el numero de
        // atras es el del sistema. Asi enganchan los que se cargaron antes
        // de que existiera la columna.
        const cola = p.itemId.split("-").pop();
        if (cola && !porCodigoSistema.has(cola)) porCodigoSistema.set(cola, p);
      }

      const marcasParaDetectar = await getMarcas();
      raw = lectura.filas.map((f) => {
        const ya = porCodigoSistema.get(f.itemCode);
        // La marca se guarda por su id ("bosca"), no por como la escribe el
        // sistema. Se deduce del titulo, que es de donde sale en el resto del
        // panel; la columna brand_desc del sistema solo se usa para armar el
        // codigo de un producto nuevo.
        const marcaDetectada = detectarMarca(f.descripcion, marcasParaDetectar);
        return {
          // El codigo del articulo nuevo es el del sistema, pelado. Antes se
          // le pegaba la marca adelante (HEINEKEN-8354) y eso obligaba a
          // traducir a mano cada vez que se comparaba el panel con el
          // sistema. Ver la migracion 25.
          codigo: ya?.itemId ?? f.itemCode,
          titulo: ya?.title ?? f.descripcion,
          categoria: ya?.category ?? "otros",
          marca: ya?.brand ?? marcaDetectada,
          precio: f.precio,
          oferta: f.oferta,
          stock: f.stock ?? ya?.stock ?? 0,
          codigo_sistema: f.itemCode,
        } as Record<string, unknown>;
      });

      keyMap = {
        codigo: "itemId",
        codigo_sistema: "codigoSistema",
        titulo: "title",
        categoria: "category",
        marca: "brand",
        precio: "price",
        oferta: "salePrice",
        stock: "stock",
      };
      delSistema = { regla: lectura.regla, avisos: lectura.avisos };

      // El sistema exporta el stock solo en algunos listados. Si se eligio
      // actualizarlo y no vino, mejor frenar aca: dejarlo pasar pondria en
      // cero el stock de todo lo que entre.
      if (tocaStock && !lectura.traeStock)
        return {
          ok: false,
          error:
            "Elegiste actualizar el stock, pero este archivo del sistema no trae columna de stock. Exportá el listado con stock, o importá solo los precios.",
        };
    }

    // Obtener itemIds existentes en DB en una query
    const normalized: ParsedRow[] = [];
    // Una sola lectura de la lista para todo el archivo.
    const marcasTodas = await getMarcas();
    for (let i = 0; i < raw.length; i++) {
      const row = raw[i];
      const parsed: Record<string, unknown> = {};
      for (const [orig, canonical] of Object.entries(keyMap)) {
        parsed[canonical] = row[orig];
      }
      const errors: string[] = [];
      const itemId = String(parsed.itemId ?? "").trim();
      if (!itemId) errors.push("itemId vacío");

      const title = String(parsed.title ?? "").trim();

      // Lo obligatorio depende de lo que se vino a hacer; se decide mas
      // abajo, cuando ya se sabe si el articulo esta en la tienda.
      const price = toNumber(parsed.price);
      const traePrecio = price !== null;
      if (tocaPrecios && price !== null && price <= 0)
        errors.push("precio en cero");

      const salePrice = toNumber(parsed.salePrice);
      if (salePrice !== null && price !== null && salePrice >= price)
        errors.push("oferta >= precio");

      const stockRaw = toNumber(parsed.stock);
      const traeStock = stockRaw !== null;
      const stock = stockRaw !== null ? Math.max(0, Math.floor(stockRaw)) : 0;

      const category = normalizeCategory(parsed.category);
      // La marca puede venir como slug (fv) o como nombre (FV). Si la columna
      // no esta, la sacamos del titulo igual que al dar de alta a mano.
      const marcaCruda = parsed.brand ? String(parsed.brand).trim() : "";
      const traeMarca = marcaCruda !== "";
      const brand = traeMarca
        ? marcaPorId(marcaCruda.toLowerCase(), marcasTodas)?.id ??
          detectarMarca(marcaCruda, marcasTodas) ??
          detectarMarca(title, marcasTodas)
        : detectarMarca(title, marcasTodas);
      const hasActive =
        parsed.active !== undefined &&
        parsed.active !== null &&
        String(parsed.active).trim() !== "";
      const hasFeatured =
        parsed.featured !== undefined &&
        parsed.featured !== null &&
        String(parsed.featured).trim() !== "";
      const active = hasActive ? toBool(parsed.active) : true;
      const featured = hasFeatured ? toBool(parsed.featured) : false;
      const description = parsed.description
        ? String(parsed.description).trim()
        : null;
      const imageUrl = parsed.imageUrl
        ? String(parsed.imageUrl).trim()
        : null;
      const sku = parsed.sku ? String(parsed.sku).trim() || null : null;
      const memo = parsed.memo ? String(parsed.memo).trim() || null : null;

      normalized.push({
        itemId,
        sku,
        title,
        category,
        brand,
        __traeMarca: traeMarca,
        price: price ?? 0,
        salePrice: salePrice === null ? null : Math.round(salePrice),
        stock,
        active,
        featured,
        description,
        memo,
        imageUrl,
        codigoSistema: parsed.codigoSistema != null ? String(parsed.codigoSistema).trim() || null : null,
        __precioAnterior: null,
        __stockAnterior: null,
        __traePrecio: traePrecio,
        __traeStock: traeStock,
        __puedeCrearse: title !== "" && price !== null && price > 0,
        __rowNumber: i + 2, // +2 porque Excel es 1-indexed y hay header
        __errors: errors,
        __exists: false,
        __hasActive: hasActive,
        __hasFeatured: hasFeatured,
      });
    }

    // Marcar cuáles ya existen
    const ids = normalized.map((r) => r.itemId).filter(Boolean);
    const existing = await prisma.product.findMany({
      where: { itemId: { in: ids } },
      select: { id: true, itemId: true },
    });
    const existe = new Set(existing.map((e) => e.itemId));

    // El "antes" es el precio que tiene hoy EN ESTE LOCAL, no el del articulo.
    // Si se mira el del articulo, importando para Buenos Aires se compararia
    // contra el precio de Traslasierra y la columna mentiria.
    const suc = await sucursalDeEdicion();
    const precioDeHoy = new Map<string, number>();
    const stockDeHoy = new Map<string, number>();
    if (suc) {
      const filas = await prisma.branchProduct.findMany({
        where: { branchId: suc.id, productId: { in: existing.map((e) => e.id) } },
        select: { price: true, stock: true, product: { select: { itemId: true } } },
      });
      for (const f of filas) {
        precioDeHoy.set(f.product.itemId, f.price);
        stockDeHoy.set(f.product.itemId, f.stock);
      }
    }
    for (const r of normalized) {
      r.__exists = existe.has(r.itemId);
      r.__precioAnterior = precioDeHoy.get(r.itemId) ?? null;
      r.__stockAnterior = stockDeHoy.get(r.itemId) ?? null;

      // Recien aca se sabe que le falta a cada fila. Un articulo que ya
      // esta en la tienda no necesita titulo ni precio si no se vino a
      // cambiarlos; uno que no esta, no se puede crear sin los dos.
      if (tocaPrecios && !r.__traePrecio) r.__errors.push("sin precio");
      if (tocaStock && !r.__traeStock) r.__errors.push("sin stock");
    }

    const valid = normalized.filter((r) => r.__errors.length === 0);
    return {
      ok: true,
      rows: normalized,
      delSistema,
      local: suc?.nombre,
      stats: {
        total: normalized.length,
        valid: valid.length,
        withErrors: normalized.length - valid.length,
        toCreate: valid.filter((r) => !r.__exists && r.__puedeCrearse).length,
        toUpdate: valid.filter((r) => r.__exists).length,
        withImage: valid.filter((r) => r.imageUrl).length,
        suben: valid.filter(
          (r) =>
            tocaPrecios &&
            r.__precioAnterior !== null &&
            r.price > r.__precioAnterior,
        ).length,
        bajan: valid.filter(
          (r) =>
            tocaPrecios &&
            r.__precioAnterior !== null &&
            r.price < r.__precioAnterior,
        ).length,
        sinDatosParaAlta: valid.filter(
          (r) => !r.__exists && !r.__puedeCrearse,
        ).length,
        stockCambia: valid.filter(
          (r) =>
            tocaStock &&
            r.__stockAnterior !== null &&
            r.stock !== r.__stockAnterior,
        ).length,
        // Existe el articulo pero no tiene fila en este local: no aparece
        // en el "antes" porque ese precio no existe todavia aca.
        enOtroLocal: valid.filter(
          (r) => r.__exists && r.__precioAnterior === null,
        ).length,
      },
    };
  } catch (e) {
    return { ok: false, error: `Error al leer Excel: ${(e as Error).message}` };
  }
}

export type ImportResult = {
  ok: boolean;
  error?: string;
  stats?: {
    created: number;
    updated: number;
    imagesDownloaded: number;
    imagesFailed: number;
    rowsSkipped: number;
    /** Codigos del archivo que no estan en la tienda y que no se dieron de
     *  alta, porque no se pidio o porque el archivo no alcanzaba. */
    nuevosOmitidos: number;
    /** Articulos que existen pero que este local no lleva. No se les toco
     *  nada: sin precio propio de este local no hay de donde partir. */
    sinCargarEnLocal: number;
  };
  /** Los primeros codigos que quedaron afuera, para poder revisarlos sin
   *  tener que adivinar cuales fueron. */
  ejemplos?: { nuevos: string[]; sinCargar: string[] };
};

export async function importExcel(
  rows: ParsedRow[],
  options: { downloadImages: boolean; modo?: ModoImport; altas?: boolean },
): Promise<ImportResult> {
  const session = await getAdminSession();
  if (!session) return { ok: false, error: "No autorizado" };

  // Sobre que local se importa. Sale del dominio del panel: importar desde
  // buenosaires.conesa.com.ar carga los precios de Buenos Aires.
  const suc = await sucursalDeEdicion();

  const modo = options.modo ?? "ambos";
  const tocaPrecios = modo !== "stock";
  const tocaStock = modo !== "precios";
  // Dar de alta lo que no este: crea el articulo y lo agrega a este local.
  // Por defecto solo en la carga completa; en una lista de precios o de
  // stock, un codigo que no esta en la tienda casi siempre es un articulo
  // que no vendemos, no uno para publicar.
  const altas = options.altas ?? modo === "ambos";

  const valid = rows.filter((r) => r.__errors.length === 0);
  let created = 0;
  let updated = 0;
  let imagesDownloaded = 0;
  let imagesFailed = 0;
  let nuevosOmitidos = 0;
  let sinCargarEnLocal = 0;
  const ejemploNuevos: string[] = [];
  const ejemploSinCargar: string[] = [];

  for (const row of valid) {
    try {
      const esNuevo = !row.__exists;
      if (esNuevo && (!altas || !row.__puedeCrearse)) {
        nuevosOmitidos++;
        if (ejemploNuevos.length < 20) ejemploNuevos.push(row.itemId);
        continue;
      }

      let finalImageUrl: string | null = null;

      // Descargar imagen si hay URL y se pidio
      if (options.downloadImages && row.imageUrl) {
        try {
          const r = await fetch(row.imageUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });
          if (r.ok) {
            const ct = r.headers.get("content-type") || "";
            if (ct.startsWith("image/")) {
              const buf = Buffer.from(await r.arrayBuffer());
              if (buf.length > 0 && buf.length < 8 * 1024 * 1024) {
                const ext = ct.includes("png")
                  ? "png"
                  : ct.includes("webp")
                    ? "webp"
                    : "jpg";
                const dir = path.join(process.cwd(), "public", "products");
                await mkdir(dir, { recursive: true });
                const relPath = `/products/${row.itemId}.${ext}`;
                const absPath = path.join(dir, `${row.itemId}.${ext}`);
                await writeFile(absPath, buf);
                finalImageUrl = `${relPath}?v=${Date.now()}`;
                imagesDownloaded++;
              }
            }
          } else {
            imagesFailed++;
          }
        } catch {
          imagesFailed++;
        }
      }

      if (esNuevo) {
        await prisma.product.create({
          data: {
            itemId: row.itemId,
            codigoSistema: row.codigoSistema,
            sku: row.sku,
            title: row.title,
            category: row.category,
            brand: row.brand,
            price: Math.round(row.price),
            salePrice: row.salePrice,
            stock: row.stock,
            // Un articulo nuevo que se carga para OTRO local nace pausado: la
            // tienda que vende hoy lee el catalogo del articulo, asi que si
            // naciera activo se publicaria en la tienda equivocada, con el
            // precio del otro local. En su propio local se muestra igual,
            // porque eso lo dice su fila, no el articulo.
            active: suc?.esPrincipal === false ? false : row.active,
            featured: row.featured,
            description: row.description,
            memo: row.memo,
            ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
          },
        });
      } else {
        // Los textos del articulo (titulo, categoria, descripcion) son trabajo
        // hecho a mano y se tocan SOLO en la carga completa. En una lista de
        // precios o de stock no se mira nada de eso: se vino a cambiar un
        // numero, no a reescribir la ficha.
        //
        // Lo unico que se completa siempre es el codigo del sistema: es el
        // enganche para la proxima vez y no se ve en ningun lado.
        const updateData: Record<string, unknown> =
          modo === "ambos"
            ? {
                title: row.title,
                category: row.category,
                ...(row.codigoSistema ? { codigoSistema: row.codigoSistema } : {}),
                ...(row.description !== null ? { description: row.description } : {}),
                ...(row.__traeMarca && row.brand ? { brand: row.brand } : {}),
                ...(row.sku !== null ? { sku: row.sku } : {}),
                ...(row.memo !== null ? { memo: row.memo } : {}),
                ...(row.__hasFeatured ? { featured: row.featured } : {}),
                ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
              }
            : {
                ...(row.codigoSistema ? { codigoSistema: row.codigoSistema } : {}),
                ...(finalImageUrl ? { imageUrl: finalImageUrl } : {}),
              };
        if (Object.keys(updateData).length > 0)
          await prisma.product.update({
            where: { itemId: row.itemId },
            data: updateData,
          });
      }

      // El precio, la oferta, el stock y si se muestra son del LOCAL, no del
      // articulo: van a su fila. Se escribe solo lo que se vino a cambiar.
      const datos = {
        ...(tocaPrecios
          ? { price: Math.round(row.price), salePrice: row.salePrice }
          : {}),
        ...(tocaStock ? { stock: row.stock } : {}),
        ...(modo === "ambos" && row.__hasActive ? { active: row.active } : {}),
      };
      const guardado = await guardarComercial([row.itemId], datos, {
        crearSiFalta: altas,
      });
      if (guardado.sinFila.length > 0) {
        sinCargarEnLocal++;
        if (ejemploSinCargar.length < 20) ejemploSinCargar.push(row.itemId);
        continue;
      }

      // El historial de precios es lo que despues contesta cuanto salia antes.
      // Se anota solo cuando se edita el local que vende, porque el historial
      // es del articulo y es ese precio el que guarda.
      if (tocaPrecios && suc?.esPrincipal && row.__exists) {
        const cambio =
          row.__precioAnterior === null ||
          Math.round(row.price) !== row.__precioAnterior;
        if (cambio) {
          try {
            const p = await prisma.product.findUnique({
              where: { itemId: row.itemId },
              select: { id: true },
            });
            if (p)
              await prisma.priceHistory.create({
                data: {
                  productId: p.id,
                  price: Math.round(row.price),
                  salePrice: row.salePrice,
                  source: "excel",
                  note: null,
                },
              });
          } catch {
            // Que falle el historial no puede voltear la actualizacion.
          }
        }
      }

      if (row.__exists) updated++;
      else created++;
    } catch {
      // skip row con error de DB
    }
  }

  // El panel lee los precios de la tabla de la sucursal, asi que despues
  // de tocar el articulo hay que dejar esa fila igual o el panel mostraria
  // el precio viejo. Ver src/lib/espejo-sucursal.ts.
  await sincronizarSucursalPrincipal();
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");

  return {
    ok: true,
    stats: {
      created,
      updated,
      imagesDownloaded,
      imagesFailed,
      rowsSkipped: rows.length - valid.length,
      nuevosOmitidos,
      sinCargarEnLocal,
    },
    ejemplos: { nuevos: ejemploNuevos, sinCargar: ejemploSinCargar },
  };
}
