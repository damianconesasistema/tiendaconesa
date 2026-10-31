// Arma un Excel con como quedaria cada publicacion si se importara una lista
// del sistema.
//
//   npx tsx scripts/listado-precios.mts <lista.xlsx> <salida.xlsx> [desc] [url]
//
// No toca la base ni la tienda: lee el Excel, lee lo que hoy esta publicado
// (de la tienda en vivo, por HTTP) y escribe un archivo nuevo para mirar la
// cuenta antes de aplicar nada.
//
// LA CADENA (la regla del negocio)
//   Lista 2 de GBP  =  precio de 1 pago (debito o credito en un pago)
//            -12%   ->  contado (solo por transferencia)
//   Las cuotas las calcula MercadoPago sobre el contado.
//
// A la Lista 2 de GBP no se le descuenta nada: por eso el descuento va en 0
// salvo que se pida otra cosa. Queda como argumento para una lista de otro
// proveedor que si lo necesite.
//
// Los combos no existen en el sistema: su precio de 1 pago es la suma del de
// sus piezas, que ya vienen con el descuento hecho.

import { readFileSync, writeFileSync } from "node:fs";
import * as XLSX from "xlsx";
import { leerExportDelSistema } from "../src/lib/excel-sistema";
import { piezasDelCombo } from "../src/lib/combos";
import { precioVitrina, precioCuotas } from "../src/lib/precios";

const [entrada, salida, descArg, urlArg] = process.argv.slice(2);
if (!entrada || !salida) {
  console.error("uso: listado-precios.mts <lista.xlsx> <salida.xlsx> [desc] [url]");
  process.exit(1);
}
const BASE = urlArg ?? "https://traslasierra.conesa.com.ar";
const DESCUENTO = descArg === undefined ? 0 : Number(descArg);
if (!Number.isFinite(DESCUENTO) || DESCUENTO < 0 || DESCUENTO > 90) {
  console.error("El descuento tiene que ser un numero entre 0 y 90.");
  process.exit(1);
}

// Los mismos numeros que usa la tienda. Si algun dia cambian en el panel,
// cambian aca tambien: estan sacados de la configuracion, no inventados.
// 13,63636% de recargo = 12% de descuento exacto (100/0,88 - 100). No son
// el mismo numero porque se miden sobre bases distintas. Ver precios.ts.
const RECARGO_1PAGO = 13.63636;
const PLANES = [
  { cuotas: 3, recargoPct: 18.33 },
  { cuotas: 6, recargoPct: 25.71 },
  { cuotas: 9, recargoPct: 36.05 },
  { cuotas: 12, recargoPct: 46.16 },
  { cuotas: 18, recargoPct: 65.47 },
];

type Publicado = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
};

/** Lo que hoy esta publicado, leido de la tienda en vivo.
 *
 *  Sale de los datos que Next deja incrustados en el HTML del catalogo. Es
 *  fragil si cambia el formato, pero es la unica forma de mirar la tienda de
 *  produccion sin credenciales de la base. */
async function loPublicado(): Promise<Publicado[]> {
  const res = await fetch(`${BASE}/tienda?porPagina=500`);
  if (!res.ok) throw new Error(`La tienda respondio ${res.status}`);
  const plano = (await res.text()).replace(/\\"/g, '"');
  const re =
    /"itemId":"([^"]+)","title":"([^"]*)","price":(\d+),"salePrice":(null|\d+)/g;
  const vistos = new Map<string, Publicado>();
  for (const m of plano.matchAll(re)) {
    if (vistos.has(m[1])) continue;
    vistos.set(m[1], {
      itemId: m[1],
      title: m[2],
      price: Number(m[3]),
      salePrice: m[4] === "null" ? null : Number(m[4]),
    });
  }
  return [...vistos.values()];
}

const unPagoDe = (lista2: number) =>
  Math.round(lista2 * (1 - DESCUENTO / 100));
const contadoDe = (unPago: number) =>
  Math.round(unPago / (1 + RECARGO_1PAGO / 100));

/** Las columnas de cuotas, iguales para todas las hojas. */
function cuotasDe(contado: number) {
  const o: Record<string, number | string> = {};
  for (const pl of PLANES) {
    const tot = precioCuotas(contado, pl.recargoPct);
    o[`${pl.cuotas} cuotas de`] = Math.round(tot / pl.cuotas);
  }
  return o;
}

const wb = XLSX.read(readFileSync(entrada), { type: "buffer" });
const lista = leerExportDelSistema(wb);
if (!lista) {
  console.error("No reconoci el archivo como export del sistema.");
  process.exit(1);
}

const publicados = await loPublicado();
const porCodigo = new Map(publicados.map((p) => [p.itemId, p]));

// Codigo del sistema -> su precio de 1 pago. Es lo que alimenta los combos.
const unPago = new Map<string, number>();
for (const f of lista.filas) {
  if (f.precio > 0) unPago.set(f.itemCode, unPagoDe(Math.round(f.precio)));
}

// --- HOJA 1: los combos, que es lo unico que cambia ---------------------

type FilaCombo = Record<string, string | number>;
const filasCombo: FilaCombo[] = [];

for (const p of publicados) {
  const piezas = piezasDelCombo(p.itemId);
  if (!piezas) continue;
  const faltan = piezas.filter((c) => !unPago.has(c));
  if (faltan.length === piezas.length) continue; // no tiene que ver con esta lista

  const contadoHoy = p.salePrice ?? p.price;
  const unPagoHoy = precioVitrina(contadoHoy, RECARGO_1PAGO);

  if (faltan.length) {
    filasCombo.push({
      Código: p.itemId,
      Publicación: p.title,
      Piezas: piezas.join(" + "),
      "1 pago HOY": unPagoHoy,
      "1 pago NUEVO": "no se toca",
      "Qué pasa": `falta ${faltan.join(", ")} en la lista`,
    });
    continue;
  }

  const sumaLista2 = piezas.reduce(
    (a, c) => a + Math.round(lista.filas.find((f) => f.itemCode === c)!.precio),
    0,
  );
  const unPagoNuevo = piezas.reduce((a, c) => a + unPago.get(c)!, 0);
  const contadoNuevo = contadoDe(unPagoNuevo);

  filasCombo.push({
    Código: p.itemId,
    Publicación: p.title,
    Piezas: piezas.join(" + "),
    "Suma Lista 2": sumaLista2,
    "1 pago HOY": unPagoHoy,
    "1 pago NUEVO": unPagoNuevo,
    "Dif $": unPagoNuevo - unPagoHoy,
    "Dif %": Math.round(((unPagoNuevo - unPagoHoy) / unPagoHoy) * 100),
    "Contado HOY": contadoHoy,
    "Contado NUEVO": contadoNuevo,
    "Tachado HOY": p.price,
    "Tachado NUEVO": contadoNuevo,
    ...cuotasDe(contadoNuevo),
    "Qué pasa":
      p.price > contadoHoy
        ? "hoy muestra un ahorro; con la cuenta nueva el combo sale igual que las piezas sueltas, asi que no queda tachado"
        : "sin tachado",
  });
}

// --- HOJA 2: articulo por articulo --------------------------------------

/** En que combos entra este codigo. */
const combosDe = (codigo: string) =>
  publicados
    .filter((p) => (piezasDelCombo(p.itemId) ?? []).includes(codigo))
    .map((p) => p.itemId);

const filasArt = lista.filas.map((f) => {
  const codigo = f.itemCode;
  const lista2 = Math.round(f.precio);
  const enCombos = combosDe(codigo);
  // Puede estar publicado con el codigo pelado o con el prefijo viejo de marca.
  const publicado =
    porCodigo.get(codigo) ??
    publicados.find((p) => new RegExp(`^[A-Za-z]+-${codigo}$`).test(p.itemId));

  if (lista2 <= 0) {
    return {
      Código: codigo,
      Descripción: f.descripcion,
      "Lista 2": 0,
      "1 pago": "—",
      Contado: "—",
      "¿Publicado suelto?": publicado ? publicado.itemId : "no",
      "Entra en el combo": enCombos.join(" · "),
      "Qué pasa": "viene en CERO en el Excel: se rechaza, no se publica",
    };
  }

  const uno = unPagoDe(lista2);
  const contado = contadoDe(uno);
  const contadoHoy = publicado ? (publicado.salePrice ?? publicado.price) : null;
  const movio = contadoHoy !== null && contadoHoy !== contado;
  return {
    Código: codigo,
    Descripción: f.descripcion,
    "Lista 2": lista2,
    "1 pago": uno,
    Contado: contado,
    "Contado HOY": contadoHoy ?? "—",
    "Dif %":
      contadoHoy !== null && contadoHoy > 0
        ? Math.round(((contado - contadoHoy) / contadoHoy) * 100)
        : "—",
    ...cuotasDe(contado),
    "¿Publicado suelto?": publicado ? publicado.itemId : "no",
    "Entra en el combo": enCombos.join(" · "),
    "Qué pasa": !publicado
      ? enCombos.length
        ? "no esta publicado solo; su precio alimenta el combo"
        : "no esta publicado ni entra en ningun combo"
      : movio
        ? "CAMBIA de precio"
        : "mismo precio que hoy: no se mueve",
  };
});

// --- HOJA 3: la cuenta, explicada ---------------------------------------

const ejemplo = lista.filas.find((f) => f.precio > 0)!;
const ej2 = Math.round(ejemplo.precio);
const ejUno = unPagoDe(ej2);
const ejContado = contadoDe(ejUno);

const explicacion = [
  { Paso: "Archivo", Qué: entrada.split(/[\\/]/).pop(), Valor: "" },
  { Paso: "Artículos", Qué: "filas que trae el Excel", Valor: lista.filas.length },
  { Paso: "Columna", Qué: "de donde sale el precio", Valor: lista.regla },
  { Paso: "", Qué: "", Valor: "" },
  { Paso: "1", Qué: "Lista 2, tal cual sale de GBP", Valor: ej2 },
  {
    Paso: "2",
    Qué: DESCUENTO
      ? `menos ${DESCUENTO}% = precio de 1 pago (débito o crédito en un pago)`
      : "Lista 2 YA es el precio de 1 pago (débito o crédito en un pago): no se le descuenta nada",
    Valor: ejUno,
  },
  { Paso: "3", Qué: "menos 12% = contado (solo por transferencia)", Valor: ejContado },
  { Paso: "", Qué: "", Valor: "" },
  ...PLANES.map((pl) => ({
    Paso: "4",
    Qué: `${pl.cuotas} cuotas: recargo ${pl.recargoPct}% de MercadoPago sobre el contado`,
    Valor: precioCuotas(ejContado, pl.recargoPct),
  })),
  { Paso: "", Qué: "", Valor: "" },
  { Paso: "Ejemplo", Qué: `${ejemplo.itemCode} · ${ejemplo.descripcion}`, Valor: "" },
  { Paso: "", Qué: "", Valor: "" },
  { Paso: "Combos", Qué: "su precio de 1 pago es la suma del de sus piezas", Valor: "" },
  { Paso: "", Qué: "sin descuento extra: cada pieza ya trae el suyo", Valor: "" },
  { Paso: "", Qué: "", Valor: "" },
  { Paso: "Ojo", Qué: "la tienda guarda el CONTADO; los demás precios los arma sola", Valor: "" },
  { Paso: "", Qué: `para volver del contado al de 1 pago el recargo es ${RECARGO_1PAGO}%,`, Valor: "" },
  { Paso: "", Qué: "no 12%: sacar 12% y sumar 12% no vuelve al mismo número", Valor: "" },
];

// --- Armado del archivo -------------------------------------------------

const libro = XLSX.utils.book_new();

const hoja = (datos: object[], anchos: number[]) => {
  const ws = XLSX.utils.json_to_sheet(datos);
  ws["!cols"] = anchos.map((w) => ({ wch: w }));
  // Los pesos con separador de miles, que es como se leen.
  const rango = XLSX.utils.decode_range(ws["!ref"]!);
  for (let r = 1; r <= rango.e.r; r++)
    for (let c = 0; c <= rango.e.c; c++) {
      const cel = ws[XLSX.utils.encode_cell({ r, c })];
      if (cel && cel.t === "n" && Math.abs(cel.v) >= 1000) cel.z = "#,##0";
    }
  return ws;
};

XLSX.utils.book_append_sheet(
  libro,
  hoja(explicacion, [10, 62, 16]),
  "Cómo se calcula",
);
XLSX.utils.book_append_sheet(
  libro,
  hoja(filasCombo, [32, 52, 26, 13, 13, 13, 11, 8, 13, 14, 13, 14, 12, 12, 12, 12, 12, 70]),
  "Combos",
);
XLSX.utils.book_append_sheet(
  libro,
  hoja(filasArt, [10, 44, 12, 12, 12, 13, 8, 12, 12, 12, 12, 12, 20, 34, 46]),
  "Artículo por artículo",
);

writeFileSync(salida, XLSX.write(libro, { type: "buffer", bookType: "xlsx" }));

console.log(`${lista.regla}`);
console.log(`${lista.filas.length} articulos · ${filasCombo.length} combos tocados`);
console.log(`escrito: ${salida}`);
