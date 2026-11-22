// Revisa un proveedor de los que manda la pagina de Punto al importar el
// Excel de proveedores de GBP (ver src/lib/punto-proveedores.ts).
//
// Va en un archivo aparte, sin ningun import, para poder probarlo con node
// solo (sin base y sin Next): punto-proveedores.ts trae la base y no se puede
// cargar fuera de la aplicacion. Desde alla se vuelve a exportar: el resto
// del codigo lo importa de punto-proveedores.ts.
//
// La pagina ya lee el Excel y manda cada renglon con estos nombres, pero lo
// que llega del navegador se revisa igual: puede venir cualquier cosa.

export type ProveedorNuevo = {
  /** La columna "ID" de GBP. Es lo que identifica al proveedor: el CUIT no
   *  sirve, hay de relleno ("30-99999999-9") y repetidos. */
  gbpId: number;
  /** Solo los 11 numeros. Vacio si no tenia 11. */
  cuit: string;
  razonSocial: string;
  claseFiscal: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  pais: string;
  telefono: string;
  condicionCompra: string;
  moneda: "ARS" | "USD";
  inactivo: boolean;
};

/** El mayor que entra en una columna INTEGER de Postgres: uno mas grande
 *  haria fallar todo el guardado. */
const MAX_INT = 2_147_483_647;

/** Texto que vuelve a la pagina adentro de innerHTML: sin < ni >, asi no se
 *  puede leer como etiqueta (como en punto-documentos.ts). Tambien sin
 *  caracteres de control: Postgres no acepta el 0x00 en un TEXT y tiraria
 *  abajo el lote entero. Los espacios repetidos quedan en uno ("Pesos  (ARS)"
 *  viene asi de GBP). GBP pone "*" o "-" solos cuando no hay dato: eso es
 *  vacio. Del Excel un numero puede llegar como numero (un telefono, un CUIT
 *  sin guiones): se toma como texto. */
const texto = (v: unknown, max: number): string => {
  const s =
    typeof v === "string" ? v : typeof v === "number" && Number.isFinite(v) ? String(v) : "";
  const limpio = s
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (limpio === "*" || limpio === "-") return "";
  // Por punto de codigo, no por mitades: un emoji cortado al medio hace
  // fallar el lote entero en Postgres.
  return Array.from(limpio).slice(0, max).join("").toWellFormed().trim();
};

/** Entero positivo, como numero o como texto ("123"). Cualquier otra cosa
 *  (vacio, "12a", 1.5, 0) no es un ID. */
const idDeGbp = (v: unknown): number | null => {
  let n = NaN;
  if (typeof v === "number") n = v;
  else if (typeof v === "string" && /^\d{1,10}$/.test(v.trim())) n = Number(v.trim());
  return Number.isInteger(n) && n > 0 && n <= MAX_INT ? n : null;
};

/** Sin tildes y en minuscula, para comparar ("Dólar" con "dolar"). */
const llano = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Solo pasa lo que tiene forma de proveedor: ID de GBP y razon social. Lo
 *  demas se descarta. */
export function limpiarProveedor(x: unknown): ProveedorNuevo | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const gbpId = idDeGbp(o.gbpId);
  const razonSocial = texto(o.razonSocial, 160);
  if (gbpId === null || !razonSocial) return null;

  // GBP lo trae a veces con guiones y a veces sin. Uno que no tiene 11
  // numeros no es un CUIT: queda vacio antes que guardar uno roto.
  const digitos = texto(o.cuit, 80).replace(/\D/g, "");
  // "Pesos  (ARS)", "Dólar Usa (USD)": se guarda solo la moneda.
  const moneda = /dolar|usd/.test(llano(texto(o.moneda, 80))) ? "USD" : "ARS";
  const inac = o.inactivo;
  const inactivo =
    inac === true || inac === 1 || (typeof inac === "string" && ["1", "si", "sí"].includes(inac.trim().toLowerCase()));

  return {
    gbpId,
    cuit: digitos.length === 11 ? digitos : "",
    razonSocial,
    claseFiscal: texto(o.claseFiscal, 80),
    domicilio: texto(o.domicilio, 160),
    localidad: texto(o.localidad, 80),
    provincia: texto(o.provincia, 80),
    pais: texto(o.pais, 80),
    telefono: texto(o.telefono, 80),
    condicionCompra: texto(o.condicionCompra, 80),
    moneda,
    inactivo,
  };
}
