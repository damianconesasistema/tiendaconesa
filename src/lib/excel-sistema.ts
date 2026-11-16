import * as XLSX from "xlsx";

// Leer el Excel TAL CUAL sale del sistema de Conesa.
//
// Hasta ahora habia que adaptarlo a mano a las columnas del importador. Los
// archivos del sistema vienen siempre con la misma forma, asi que el sitio lo
// puede hacer solo. Mirando los 20 archivos que hay guardados, todos empiezan
// igual (`item_code`, `item_desc`) y cambian en la columna del precio:
//
//   la grilla completa: Stk, Costo, Lista 1, Lista 2, cat_desc, brand_desc...
//   Stk + CONTADO                 (Flowater, Dogo, TST)
//   solo CONTADO                  (Bosca, Piazza, Tromen)
//   PRECIO CONTADO                (Edgardo)
//   Stk + Lista 2                 (Gulliart)
//   Stk + el precio SIN NOMBRE    (Rotar)
//
// Y los numeros vienen de dos formas: pelados (69546.0832) o a la argentina
// con la moneda pegada ("141.421,02 ARS").
//
// La regla del precio NO se adivina, se lee del archivo:
//
//   hay Lista 2 y contado  -> precio = Lista 2, oferta = contado (el tachado)
//   solo Lista 2           -> precio = Lista 2, sin oferta
//   solo contado           -> precio = contado, sin oferta
//
// Lo ultimo es importante: NO se deriva una base dividiendo el contado por
// 0,88 para fabricar un tachado. Una vez tome el contado de Piazza como oferta
// y le invente una base 12% mas alta copiando la regla de otro proveedor;
// Damian lo corrigio y, de no hacerlo, se habrian publicado nueve combos
// inflados. Si en el archivo no hay una lista mas cara, no hay tachado.

export type FilaDelSistema = {
  /** El codigo del sistema, pelado: "3674". */
  itemCode: string;
  descripcion: string;
  /** null = el archivo no trae precio: es un listado de solo stock (ver
   *  `traePrecio`). Sirve para actualizar stock, no para dar de alta. */
  precio: number | null;
  oferta: number | null;
  /** null = el archivo no trae stock y hay que dejar el que esta cargado. */
  stock: number | null;
  marca: string | null;
  categoria: string | null;
  /** La subcategoria del sistema ("FERRUM VANITORIS/MUEBLES"). Es la que de
   *  verdad dice que es el articulo: la categoria de la grilla suele traer
   *  el proveedor ("FERRUM SA CERAMICA Y METALURGICA"). */
  subcategoria: string | null;
  /** Lo que costo. Es para mirarlo contra el precio antes de publicar; la
   *  tienda no lo guarda. */
  costo: number | null;
  fila: number;
  /** El nombre de la pestaña de donde salio ("DUCHAS 109"). Cuando el Excel
   *  se arma a mano por linea, la pestaña dice que es el articulo: de ahi
   *  sale el subrubro. */
  hoja: string;
};

export type LecturaDelSistema = {
  filas: FilaDelSistema[];
  /** Explicado en castellano, para mostrarlo antes de aplicar nada. */
  regla: string;
  columnaPrecio: string;
  columnaOferta: string | null;
  traeStock: boolean;
  /** Si trae alguna columna de precio. Un listado de stock por deposito
   *  ("Dep BS AS") no trae: sirve solo para actualizar stock. */
  traePrecio: boolean;
  /** Como se llamaba la columna de la que salio el stock ("Dep BS AS"). */
  columnaStock: string | null;
  avisos: string[];
};

/** De que local es cada deposito de GBP, por como lo nombra el sistema. Sirve
 *  para elegir la columna cuando el listado trae varios depositos, y para no
 *  cargarle a un local el stock de otro. */
const DEPOSITOS: Readonly<Record<string, RegExp>> = {
  bsas: /\bbs\.? ?as\b|buenos aires|capital|balvanera|caba/,
  traslasierra: /trasla|brochero|cordoba|\bcba\b|mina clavero/,
};

/** Si el nombre de una columna de deposito es de otro local que el pedido. */
export function depositoDeOtroLocal(columna: string, slug: string | null | undefined): string | null {
  if (!slug) return null;
  const n = norm(columna);
  for (const [otro, re] of Object.entries(DEPOSITOS))
    if (otro !== slug && re.test(n) && !(DEPOSITOS[slug]?.test(n) ?? false)) return otro;
  return null;
}

const norm = (s: unknown) =>
  String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

/** Los numeros del sistema: 69546.0832 o "141.421,02 ARS". */
export function numeroDelSistema(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const limpio = String(v)
    .replace(/ars|\$/gi, "")
    .trim()
    // Miles con punto y decimales con coma: "141.421,02"
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  if (limpio === "") return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

type Hoja = { nombre: string; filas: unknown[][] };

/** Donde esta la cabecera y que columna es cada cosa. */
type Mapa = {
  cabecera: number;
  code: number;
  desc: number;
  stock: number | null;
  /** Como se llama en el archivo la columna del stock ("Stk", "Dep BS AS"). */
  nombreStock: string | null;
  /** Habia varias columnas de deposito y ninguna era la de este local: no se
   *  eligio ninguna, para no cargar el stock de otro. */
  depositosSinElegir: string[];
  lista2: number | null;
  contado: number | null;
  /** Como se llamaba la columna del contado en el archivo. */
  nombreContado: string | null;
  marca: number | null;
  categoria: number | null;
  subcategoria: number | null;
  costo: number | null;
};

function mapearHoja(filas: unknown[][], deposito?: string | null): Mapa | null {
  for (let i = 0; i < Math.min(filas.length, 10); i++) {
    const celdas = (filas[i] ?? []).map(norm);
    const code = celdas.indexOf("item_code");
    if (code < 0) continue;
    const desc = celdas.indexOf("item_desc");
    if (desc < 0) continue;

    const buscar = (...nombres: string[]) => {
      for (const n of nombres) {
        const i2 = celdas.indexOf(n);
        if (i2 >= 0) return i2;
      }
      return null;
    };

    // El stock: "Stk" en la grilla completa, o una columna por deposito
    // ("Dep BS AS", "Dep Traslasierra") en el listado de existencias. Con
    // un solo deposito se usa ese; con varios, el del local del panel, y si
    // ninguno es de este local no se elige ninguno: cargar el stock de otro
    // deposito haria vender lo que aca no hay.
    let stock = buscar("stk", "stock");
    const depositosSinElegir: string[] = [];
    if (stock === null) {
      const deps = celdas
        .map((c, idx) => ({ c, idx }))
        .filter((x) => /^dep(osito)?[\s.]/.test(x.c));
      if (deps.length === 1) stock = deps[0].idx;
      else if (deps.length > 1) {
        const re = deposito ? DEPOSITOS[deposito] : undefined;
        const propio = re ? deps.filter((x) => re.test(x.c)) : [];
        if (propio.length === 1) stock = propio[0].idx;
        else depositosSinElegir.push(...deps.map((x) => String(filas[i][x.idx]).trim()));
      }
    }
    const nombreStock = stock !== null ? String(filas[i][stock]).trim() : null;
    const lista2 = buscar("lista 2", "lista2");
    let contado = buscar("contado", "precio contado", "efectivo");
    let nombreContado =
      contado !== null ? String(filas[i][contado]).trim() : null;

    // Rotar: la columna del precio no tiene nombre. Es la primera columna sin
    // titulo que trae numeros en la fila siguiente.
    if (contado === null && lista2 === null) {
      const siguiente = filas[i + 1] ?? [];
      for (let c = 0; c < Math.max(celdas.length, siguiente.length); c++) {
        const tieneTitulo = celdas[c] !== undefined && celdas[c] !== "";
        if (tieneTitulo) continue;
        if (numeroDelSistema(siguiente[c]) !== null) {
          contado = c;
          nombreContado = "(columna sin nombre)";
          break;
        }
      }
    }

    // Sin precio sirve igual si trae stock: es el listado de existencias, para
    // actualizar el stock. Sin precio ni stock no hay nada que leer.
    if (lista2 === null && contado === null && stock === null) continue;

    return {
      cabecera: i,
      code,
      desc,
      stock,
      nombreStock,
      depositosSinElegir,
      lista2,
      contado,
      nombreContado,
      marca: buscar("brand_desc", "marca"),
      categoria: buscar("cat_desc", "categoria", "rubro"),
      subcategoria: buscar("subcat_desc", "subcategoria", "subrubro"),
      costo: buscar("costo", "cost"),
    };
  }
  return null;
}

/** Si una hoja SIN fila de titulos tiene la misma forma que el molde.
 *
 *  Pasa cuando se arma un archivo a mano copiando del sistema: la primera
 *  pestaña conserva los titulos (item_code, item_desc, Stk, Lista 2) y en las
 *  demas se pegan solo los productos. Asi venia el de FV, con cinco pestañas
 *  por linea: se leian 13 productos de 121 y las otras cuatro hojas se
 *  descartaban sin avisar.
 *
 *  Se mira que las primeras filas encajen: codigo, una descripcion con
 *  letras, un precio mayor a cero y, si hay stock, un numero o nada. Es a
 *  proposito estricto: si no encaja, la hoja NO se lee y se avisa. Leer una
 *  hoja con las columnas corridas pondria el stock como precio. */
function pareceDeLaMisma(filas: unknown[][], molde: Mapa): boolean {
  const columnaPrecio = molde.lista2 ?? molde.contado;
  // Un listado de solo stock se compara por la columna del stock.
  if ((columnaPrecio === null && molde.stock === null) || filas.length === 0)
    return false;
  for (const f of filas.slice(0, 5)) {
    const code = String(f[molde.code] ?? "").trim();
    if (!code || norm(code) === "item_code") return false;
    if (!/[a-z]/i.test(String(f[molde.desc] ?? ""))) return false;
    if (columnaPrecio !== null) {
      const precio = numeroDelSistema(f[columnaPrecio]);
      if (precio === null || precio <= 0) return false;
    } else if (numeroDelSistema(f[molde.stock as number]) === null) {
      return false;
    }
    if (molde.stock !== null) {
      const s = f[molde.stock];
      const vacio = s === null || s === undefined || String(s).trim() === "";
      if (!vacio && numeroDelSistema(s) === null) return false;
    }
  }
  return true;
}

/** "DUCHAS", "BIDET" y "LAVATORIO" */
function enumerar(nombres: string[]): string {
  const q = nombres.map((n) => `"${n}"`);
  return q.length <= 1 ? (q[0] ?? "") : `${q.slice(0, -1).join(", ")} y ${q[q.length - 1]}`;
}

/** Lee el libro entero. Devuelve null si no parece un export del sistema.
 *
 *  `deposito` es el slug del local del panel ("bsas"): cuando el listado trae
 *  el stock de varios depositos, se toma el de ese local. */
export function leerExportDelSistema(
  wb: XLSX.WorkBook,
  opciones?: { deposito?: string | null },
): LecturaDelSistema | null {
  const hojas: Hoja[] = wb.SheetNames.map((nombre) => ({
    nombre,
    filas: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nombre], {
      header: 1,
      blankrows: false,
      raw: true,
    }),
  }));

  const mapeadas = hojas.map((h) => ({
    hoja: h,
    mapa: mapearHoja(h.filas, opciones?.deposito) as Mapa | null,
  }));

  // Hace falta al menos una hoja con titulos: es lo que dice que esto es un
  // export del sistema y que columna es cada cosa.
  const molde = mapeadas.find((x) => x.mapa !== null);
  if (!molde || !molde.mapa) return null;

  const avisos: string[] = [];
  const sinElegir = [...new Set(mapeadas.flatMap((x) => x.mapa?.depositosSinElegir ?? []))];
  if (sinElegir.length > 0)
    avisos.push(
      `El archivo trae el stock de varios depósitos (${enumerar(sinElegir)}) y ninguno es claramente el de este local: no tomé el stock. Exportá solo el depósito de este local.`,
    );

  // Las hojas sin titulos se leen con las columnas del molde, si encajan.
  // cabecera -1: los productos arrancan en la primera fila.
  const prestadas: string[] = [];
  const salteadas: string[] = [];
  for (const x of mapeadas) {
    if (x.mapa !== null || x.hoja.filas.length === 0) continue;
    const nombre = x.hoja.nombre.trim();
    if (pareceDeLaMisma(x.hoja.filas, molde.mapa)) {
      x.mapa = { ...molde.mapa, cabecera: -1 };
      prestadas.push(nombre);
    } else {
      salteadas.push(nombre);
    }
  }
  const nombreMolde = molde.hoja.nombre.trim();
  if (prestadas.length > 0)
    avisos.push(
      prestadas.length === 1
        ? `La hoja ${enumerar(prestadas)} no tiene la fila de títulos: la leí con las mismas columnas que "${nombreMolde}".`
        : `Las hojas ${enumerar(prestadas)} no tienen la fila de títulos: las leí con las mismas columnas que "${nombreMolde}".`,
    );
  if (salteadas.length > 0)
    avisos.push(
      salteadas.length === 1
        ? `La hoja ${enumerar(salteadas)} NO se leyó: no tiene la fila de títulos y sus columnas no coinciden con las de "${nombreMolde}". Si tiene productos, copiale arriba la fila de títulos.`
        : `Las hojas ${enumerar(salteadas)} NO se leyeron: no tienen la fila de títulos y sus columnas no coinciden con las de "${nombreMolde}". Si tienen productos, copiales arriba la fila de títulos.`,
    );

  const leidas = mapeadas.filter(
    (x): x is { hoja: Hoja; mapa: Mapa } => x.mapa !== null,
  );

  // Algunos archivos traen la lista en una hoja y el contado en otra (asi
  // viene el de los termotanques). Se juntan por codigo.
  const porCodigo = new Map<
    string,
    {
      descripcion: string;
      lista2: number | null;
      contado: number | null;
      stock: number | null;
      marca: string | null;
      categoria: string | null;
      subcategoria: string | null;
      costo: number | null;
      fila: number;
      hoja: string;
    }
  >();

  let huboLista2 = false;
  let huboContado = false;
  let nombreContado: string | null = null;
  let traeStock = false;
  let columnaStock: string | null = null;

  for (const { hoja, mapa } of leidas) {
    if (mapa.lista2 !== null) huboLista2 = true;
    if (mapa.contado !== null) {
      huboContado = true;
      nombreContado = nombreContado ?? mapa.nombreContado;
    }
    if (mapa.stock !== null) {
      traeStock = true;
      columnaStock = columnaStock ?? mapa.nombreStock;
    }

    for (let i = mapa.cabecera + 1; i < hoja.filas.length; i++) {
      const f = hoja.filas[i] ?? [];
      const code = String(f[mapa.code] ?? "").trim();
      if (!code) continue;
      // La cabecera se repite en el medio de algunos archivos (en el de TST,
      // antes de los anafes). Si no se saltea, se pierden los productos que
      // vienen despues.
      if (norm(code) === "item_code") continue;

      const anterior = porCodigo.get(code);
      const lista2 =
        mapa.lista2 !== null ? numeroDelSistema(f[mapa.lista2]) : null;
      const contado =
        mapa.contado !== null ? numeroDelSistema(f[mapa.contado]) : null;
      const stock =
        mapa.stock !== null ? numeroDelSistema(f[mapa.stock]) : null;

      porCodigo.set(code, {
        descripcion:
          String(f[mapa.desc] ?? "").trim() || anterior?.descripcion || "",
        lista2: lista2 ?? anterior?.lista2 ?? null,
        contado: contado ?? anterior?.contado ?? null,
        stock: stock ?? anterior?.stock ?? null,
        marca:
          (mapa.marca !== null ? String(f[mapa.marca] ?? "").trim() : "") ||
          anterior?.marca ||
          null,
        categoria:
          (mapa.categoria !== null
            ? String(f[mapa.categoria] ?? "").trim()
            : "") ||
          anterior?.categoria ||
          null,
        subcategoria:
          (mapa.subcategoria !== null
            ? String(f[mapa.subcategoria] ?? "").trim()
            : "") ||
          anterior?.subcategoria ||
          null,
        costo:
          (mapa.costo !== null ? numeroDelSistema(f[mapa.costo]) : null) ??
          anterior?.costo ??
          null,
        fila: anterior?.fila ?? i + 1,
        hoja: anterior?.hoja ?? hoja.nombre,
      });
    }
  }

  const filas: FilaDelSistema[] = [];
  /** Cuantos productos tenian los dos precios como para poder comparar. */
  let conAmbos = 0;
  for (const [itemCode, d] of porCodigo) {
    if (d.lista2 !== null && d.contado !== null) conAmbos++;
    // El precio y el tachado, segun lo que trajo el archivo.
    let precio: number | null;
    let oferta: number | null = null;
    if (d.lista2 !== null && d.contado !== null && d.contado < d.lista2) {
      precio = d.lista2;
      oferta = d.contado;
    } else {
      precio = d.lista2 ?? d.contado;
    }
    // Sin precio queda solo si trae stock: el listado de existencias.
    if (precio === null && d.stock === null) continue;

    filas.push({
      itemCode,
      descripcion: d.descripcion,
      precio: precio !== null ? Math.round(precio) : null,
      oferta: oferta !== null ? Math.round(oferta) : null,
      stock: d.stock !== null ? Math.max(0, Math.floor(d.stock)) : null,
      marca: d.marca,
      categoria: d.categoria,
      subcategoria: d.subcategoria,
      costo: d.costo !== null ? Math.round(d.costo) : null,
      fila: d.fila,
      hoja: d.hoja,
    });
  }

  if (filas.length === 0) return null;

  const traePrecio = huboLista2 || huboContado;
  const conOferta = filas.filter((f) => f.oferta !== null).length;
  const columnaPrecio = !traePrecio
    ? ""
    : huboLista2
      ? "Lista 2"
      : (nombreContado ?? "CONTADO");
  const columnaOferta = conOferta > 0 ? (nombreContado ?? "CONTADO") : null;

  let regla: string;
  if (!traePrecio) {
    regla = `El archivo trae solo stock (columna "${columnaStock ?? "stock"}") y no trae precio: sirve para actualizar el stock, no los precios.`;
  } else if (columnaOferta) {
    regla = `Tomé "${columnaPrecio}" como precio de lista y "${columnaOferta}" como precio en efectivo, así que los productos quedan con el precio tachado.`;
  } else if (huboLista2) {
    regla = `Tomé "${columnaPrecio}" como precio. El archivo no trae una columna de contado, así que van sin precio tachado.`;
  } else {
    regla = `Tomé "${columnaPrecio}" como precio. El archivo no trae una lista más cara, así que van SIN precio tachado: no se inventa un descuento que no está en el archivo.`;
  }

  if (!traeStock)
    avisos.push(
      "El archivo no trae stock: a cada producto se le deja el que ya tiene cargado.",
    );
  else if (columnaStock && /^dep(osito)?[\s.]/.test(norm(columnaStock)))
    avisos.push(`El stock sale de la columna "${columnaStock}".`);
  // Avisar del tachado solo cuando de verdad se pudo comparar. En el archivo
  // de Pringles, por ejemplo, la segunda hoja tiene una columna EFECTIVO pero
  // con otros codigos y a medio llenar: no hay con que comparar, y decir que
  // "el contado no era menor" seria contar algo que no paso.
  if (huboLista2 && huboContado && conAmbos === 0)
    avisos.push(
      "El archivo tiene una columna de contado, pero sus códigos no coinciden con los de la lista: los productos van sin precio tachado.",
    );
  else if (conAmbos > conOferta)
    avisos.push(
      `${conAmbos - conOferta} de ${conAmbos} productos quedan sin tachado porque el contado no era menor que la lista.`,
    );

  return {
    filas,
    regla,
    columnaPrecio,
    columnaOferta,
    traeStock,
    traePrecio,
    columnaStock,
    avisos,
  };
}
