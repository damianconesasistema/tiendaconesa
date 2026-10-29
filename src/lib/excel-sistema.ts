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
  precio: number;
  oferta: number | null;
  /** null = el archivo no trae stock y hay que dejar el que esta cargado. */
  stock: number | null;
  marca: string | null;
  categoria: string | null;
  fila: number;
};

export type LecturaDelSistema = {
  filas: FilaDelSistema[];
  /** Explicado en castellano, para mostrarlo antes de aplicar nada. */
  regla: string;
  columnaPrecio: string;
  columnaOferta: string | null;
  traeStock: boolean;
  avisos: string[];
};

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
  lista2: number | null;
  contado: number | null;
  /** Como se llamaba la columna del contado en el archivo. */
  nombreContado: string | null;
  marca: number | null;
  categoria: number | null;
};

function mapearHoja(filas: unknown[][]): Mapa | null {
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

    const stock = buscar("stk", "stock");
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

    if (lista2 === null && contado === null) continue;

    return {
      cabecera: i,
      code,
      desc,
      stock,
      lista2,
      contado,
      nombreContado,
      marca: buscar("brand_desc", "marca"),
      categoria: buscar("cat_desc", "categoria", "rubro"),
    };
  }
  return null;
}

/** Lee el libro entero. Devuelve null si no parece un export del sistema. */
export function leerExportDelSistema(
  wb: XLSX.WorkBook,
): LecturaDelSistema | null {
  const hojas: Hoja[] = wb.SheetNames.map((nombre) => ({
    nombre,
    filas: XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[nombre], {
      header: 1,
      blankrows: false,
      raw: true,
    }),
  }));

  const leidas = hojas
    .map((h) => ({ hoja: h, mapa: mapearHoja(h.filas) }))
    .filter((x): x is { hoja: Hoja; mapa: Mapa } => x.mapa !== null);

  if (leidas.length === 0) return null;

  const avisos: string[] = [];

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
      fila: number;
    }
  >();

  let huboLista2 = false;
  let huboContado = false;
  let nombreContado: string | null = null;
  let traeStock = false;

  for (const { hoja, mapa } of leidas) {
    if (mapa.lista2 !== null) huboLista2 = true;
    if (mapa.contado !== null) {
      huboContado = true;
      nombreContado = nombreContado ?? mapa.nombreContado;
    }
    if (mapa.stock !== null) traeStock = true;

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
        fila: anterior?.fila ?? i + 1,
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
    if (precio === null) continue;

    filas.push({
      itemCode,
      descripcion: d.descripcion,
      precio: Math.round(precio),
      oferta: oferta !== null ? Math.round(oferta) : null,
      stock: d.stock !== null ? Math.max(0, Math.floor(d.stock)) : null,
      marca: d.marca,
      categoria: d.categoria,
      fila: d.fila,
    });
  }

  if (filas.length === 0) return null;

  const conOferta = filas.filter((f) => f.oferta !== null).length;
  const columnaPrecio = huboLista2 ? "Lista 2" : (nombreContado ?? "CONTADO");
  const columnaOferta = conOferta > 0 ? (nombreContado ?? "CONTADO") : null;

  let regla: string;
  if (columnaOferta) {
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
    avisos,
  };
}
