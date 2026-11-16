import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

// El "Recibo de entrega de producto" de MercadoPago, completado con los datos
// del pedido, para imprimir cuando el cliente RETIRA en el local.
//
// Es la prueba que pide MercadoPago si el titular de la tarjeta desconoce el
// pago (contracargo): "MercadoPago presentara este documento". Damian lo pidio
// el 16/11/2026: "este formulario tendria que salir para imprimir cuando la
// gente quiere retirar del local".
//
// Se escribe ENCIMA del PDF original de MercadoPago
// (public/formularios/recibo-entrega-mercadopago.pdf), no se dibuja uno
// parecido: tiene que ser su formulario. Va en mayusculas porque el
// formulario pide "letra mayuscula de imprenta". La firma queda en blanco:
// la pone el que retira, delante del vendedor, que corrobora el DNI.

export type DatosRecibo = {
  nombre: string;
  dni: string | null;
  telefono: string;
  /** "RETIRA EN EL LOCAL: ..." */
  direccion: string;
  articulos: { qty: number; title: string }[];
  numeroOperacion: string;
  apodoComprador: string;
  apodoVendedor: string;
  lugar: string;
  fecha: Date;
};

// Donde va cada dato, en puntos desde abajo a la izquierda (hoja carta,
// 612 x 792). Medido sobre el formulario: el texto arranca a la derecha de
// cada titulo, sobre su misma linea.
const POS = {
  nombre: { x: 162, y: 557, ancho: 370 },
  dni: { x: 186, y: 516, ancho: 135 },
  telefono: { x: 375, y: 516, ancho: 158 },
  direccion: { x: 268, y: 474, ancho: 264 },
  articulo: { x: 120, y: 396, ancho: 176 },
  operacion: { x: 399, y: 389, ancho: 134 },
  apodoComprador: { x: 160, y: 270, ancho: 370 },
  apodoVendedor: { x: 154, y: 241, ancho: 376 },
  lugarFecha: { x: 141, y: 214, ancho: 389 },
} as const;

const TINTA = rgb(0.07, 0.07, 0.25);

/** Achica la letra hasta que entre en el ancho, y si ni asi entra, corta. */
function escribir(
  page: ReturnType<PDFDocument["getPages"]>[number],
  font: PDFFont,
  texto: string,
  p: { x: number; y: number; ancho: number },
  tam = 11,
  minimo = 7,
) {
  let t = texto.toUpperCase().replace(/\s+/g, " ").trim();
  if (!t) return;
  let s = tam;
  while (s > minimo && font.widthOfTextAtSize(t, s) > p.ancho) s -= 0.5;
  while (t.length > 1 && font.widthOfTextAtSize(t, s) > p.ancho) t = t.slice(0, -2) + "…";
  page.drawText(t, { x: p.x, y: p.y, size: s, font, color: TINTA });
}

/** Parte un texto en renglones que entren en el ancho. */
function renglones(font: PDFFont, texto: string, ancho: number, tam: number): string[] {
  const salida: string[] = [];
  let linea = "";
  for (const palabra of texto.toUpperCase().split(/\s+/).filter(Boolean)) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (font.widthOfTextAtSize(prueba, tam) <= ancho) linea = prueba;
    else {
      if (linea) salida.push(linea);
      linea = palabra;
    }
  }
  if (linea) salida.push(linea);
  return salida;
}

export async function llenarReciboMP(plantilla: Uint8Array, d: DatosRecibo): Promise<Buffer> {
  const doc = await PDFDocument.load(plantilla);
  const page = doc.getPages()[0];
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  escribir(page, font, d.nombre, POS.nombre);
  escribir(page, font, d.dni ?? "", POS.dni);
  escribir(page, font, d.telefono, POS.telefono);
  escribir(page, font, d.direccion, POS.direccion, 9, 6.5);

  // El articulo va en dos renglones como mucho: es una caja chica y un
  // tercero pisa la linea de abajo. Si no entra todo, termina en "…": el
  // numero de pedido, que va en "Numero de operacion", lo completa.
  const unidades = d.articulos.reduce((s, a) => s + a.qty, 0);
  const lista = d.articulos.map((a) => `${a.qty > 1 ? `${a.qty}× ` : ""}${a.title}`).join(" · ");
  const texto = d.articulos.length > 1 ? `${unidades} unidades: ${lista}` : lista;
  const tam = 7.5;
  const lineas = renglones(font, texto, POS.articulo.ancho, tam);
  const muestra = lineas.slice(0, 2);
  if (lineas.length > 2) {
    let ult = muestra[1];
    while (ult.length > 1 && font.widthOfTextAtSize(`${ult}…`, tam) > POS.articulo.ancho)
      ult = ult.slice(0, -1);
    muestra[1] = `${ult.trimEnd()}…`;
  }
  muestra.forEach((l, i) =>
    page.drawText(l, {
      x: POS.articulo.x,
      y: POS.articulo.y - i * (tam + 2),
      size: tam,
      font,
      color: TINTA,
    }),
  );

  escribir(page, font, d.numeroOperacion, POS.operacion, 10, 7);
  escribir(page, font, d.apodoComprador, POS.apodoComprador, 10);
  escribir(page, font, d.apodoVendedor, POS.apodoVendedor, 10);
  escribir(
    page,
    font,
    `${d.lugar}, ${d.fecha.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`,
    POS.lugarFecha,
    10,
  );

  return Buffer.from(await doc.save());
}
