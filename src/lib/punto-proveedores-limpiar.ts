// Revisa un proveedor de los que manda la pagina de Punto al importar el
// Excel de proveedores de GBP (ver src/lib/punto-proveedores.ts), y desde la
// V.0.99.82 tambien el alta y los cambios a mano (formulario de Proveedores).
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

// ------------------------------------------------------- ALTA Y CAMBIOS
// V.0.99.82. Damian, 22/11/2026: "dame la posibilidad de editar esos
// proveedores y tambien eliminar y cualquier cosa que quiera retocar", y
// "dar de alta un nuevo proveedor ... que yo ponga el CUIT y me levante todos
// los datos solo, que ponga un contacto de vendedor y algun numero de
// telefono de WhatsApp ... Tambien mail". Aca se revisa lo que manda el
// formulario; lo que toca la base esta en punto-proveedores.ts.

/** Los datos que vienen del Excel de GBP. Si se retocan a mano en Punto
 *  quedan en "editados" y el Excel ya no los pisa. */
export const CAMPOS_GBP = [
  "razonSocial",
  "cuit",
  "claseFiscal",
  "domicilio",
  "localidad",
  "provincia",
  "pais",
  "telefono",
  "condicionCompra",
  "moneda",
  "inactivo",
] as const;
export type CampoGbp = (typeof CAMPOS_GBP)[number];

/** Los que se cargan solo en Punto: el Excel nunca los toca. */
export const CAMPOS_PUNTO = ["contacto", "whatsapp", "email", "notas", "flete"] as const;

export type DatosProveedor = {
  razonSocial: string;
  cuit: string;
  claseFiscal: string;
  domicilio: string;
  localidad: string;
  provincia: string;
  pais: string;
  telefono: string;
  condicionCompra: string;
  moneda: "ARS" | "USD";
  inactivo: boolean;
  contacto: string;
  whatsapp: string;
  email: string;
  notas: string;
  flete: number | null;
};
export type CampoProveedor = keyof DatosProveedor;

/** El digito verificador del CUIT (modulo 11, el mismo de ARCA). Uno mal
 *  tipeado casi siempre falla aca: es la forma de avisar antes de guardar un
 *  CUIT que no existe. Copiado de src/lib/afip/padron.ts a proposito: este
 *  archivo no importa nada, para poder probarlo con node solo. */
export function cuitValido(d: string): boolean {
  if (!/^\d{11}$/.test(d)) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((a, p, i) => a + p * Number(d[i]), 0);
  const r = 11 - (suma % 11);
  const dv = r === 11 ? 0 : r;
  return dv !== 10 && dv === Number(d[10]);
}

/** Un CUIT de 11 numeros que no pasa el digito verificador: solo puede venir
 *  del Excel de GBP (lo que se carga a mano se revisa), que los tiene de
 *  relleno ("30-99999999-9") y repetidos. No dice quien es el proveedor:
 *  que otro tenga el mismo no es un repetido. */
export function cuitDeRelleno(d: string): boolean {
  return /^\d{11}$/.test(d) && !cuitValido(d);
}

/** 0 a 100, con dos decimales. Vacio o 0 = sin flete (null). "mal" = no es
 *  un porcentaje. */
export function limpiarFlete(v: unknown): number | null | "mal" {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 100) return "mal";
  const r = Math.round(n * 100) / 100;
  return r === 0 ? null : r;
}

const CUIT_MAL = "Ese CUIT no es válido: revisá los números.";

/** Cada campo del formulario, revisado. Devuelve el valor, o el motivo por
 *  el que no sirve (para que la pantalla lo diga). */
function campo(k: CampoProveedor, v: unknown): { valor: DatosProveedor[CampoProveedor] } | { error: string } {
  switch (k) {
    case "razonSocial": {
      const s = texto(v, 160);
      return s ? { valor: s } : { error: "Falta la razón social." };
    }
    case "cuit": {
      // Con guiones, puntos o espacios se acepta; cualquier otra cosa que no
      // sea un numero, no. Vacio = sin CUIT. Puede no tener 11: un proveedor
      // que es una persona se carga a veces con el DNI (el padron de ARCA
      // tambien lo busca asi). El de 11 si tiene que pasar el digito
      // verificador: uno mal tipeado casi siempre falla ahi. Mas de 11 no es
      // ni un CUIT ni un DNI.
      const s = (typeof v === "number" && Number.isFinite(v) ? String(v) : typeof v === "string" ? v : "").replace(
        /[\s./-]/g,
        "",
      );
      if (!s) return { valor: "" };
      if (!/^\d{1,11}$/.test(s) || (s.length === 11 && !cuitValido(s))) return { error: CUIT_MAL };
      return { valor: s };
    }
    case "moneda": {
      const s = texto(v, 10).toUpperCase();
      if (!s) return { valor: "ARS" };
      return s === "ARS" || s === "USD" ? { valor: s } : { error: "La moneda es ARS o USD." };
    }
    case "inactivo":
      return typeof v === "boolean" ? { valor: v } : { error: "Inactivo es sí o no." };
    case "whatsapp": {
      // El numero como lo escriben ("+54 9 351 555-1234"): se guardan los
      // numeros y el + del principio. La pagina arma el link de WhatsApp.
      let s = (typeof v === "number" && Number.isFinite(v) ? String(v) : typeof v === "string" ? v : "").replace(
        /[\s().-]/g,
        "",
      );
      if (s === "+") s = "";
      if (!/^\+?\d*$/.test(s) || s.length > 20)
        return { error: "El WhatsApp va con números solamente (y un + adelante si querés), hasta 20." };
      return { valor: s };
    }
    case "email": {
      // Solo letras, numeros y . _ + - (y el @): la pagina arma con esto un
      // link "mailto:". Con ? & = % o comillas, un mail como
      // "a@b.com?bcc=otro@x.com" pasaba y cada pedido que se le mandaba al
      // proveedor salia con copia oculta a un extraño.
      const s = texto(v, 200).toLowerCase();
      if (!s) return { valor: "" };
      if (s.length > 120) return { error: "El mail es demasiado largo." };
      if (!/^[a-z0-9._+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s))
        return { error: "Ese mail no tiene forma de mail: revisalo." };
      return { valor: s };
    }
    case "notas":
      return { valor: texto(v, 500) };
    case "contacto":
      return { valor: texto(v, 80) };
    case "flete": {
      const f = limpiarFlete(v);
      return f === "mal" ? { error: "El flete es un porcentaje de 0 a 100." } : { valor: f };
    }
    case "domicilio":
      return { valor: texto(v, 160) };
    default:
      // claseFiscal, localidad, provincia, pais, telefono, condicionCompra:
      // los mismos topes que al importar el Excel.
      return { valor: texto(v, 80) };
  }
}

const TODOS_LOS_CAMPOS: readonly CampoProveedor[] = [
  "razonSocial",
  "cuit",
  "claseFiscal",
  "domicilio",
  "localidad",
  "provincia",
  "pais",
  "telefono",
  "condicionCompra",
  "moneda",
  "inactivo",
  "contacto",
  "whatsapp",
  "email",
  "notas",
  "flete",
];

/** El alta de un proveedor a mano (POST {proveedor}). La razon social es lo
 *  unico obligatorio. "inactivo" no se toma: uno nuevo esta activo. */
export function limpiarAltaProveedor(x: unknown): { datos: DatosProveedor } | { error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return { error: "No llegó el proveedor." };
  const o = x as Record<string, unknown>;
  const datos: DatosProveedor = {
    razonSocial: "",
    cuit: "",
    claseFiscal: "",
    domicilio: "",
    localidad: "",
    provincia: "",
    pais: "",
    telefono: "",
    condicionCompra: "",
    moneda: "ARS",
    inactivo: false,
    contacto: "",
    whatsapp: "",
    email: "",
    notas: "",
    flete: null,
  };
  for (const k of TODOS_LOS_CAMPOS) {
    if (k === "inactivo") continue;
    // La razon social se revisa siempre, aunque no venga: es obligatoria.
    if (o[k] === undefined && k !== "razonSocial") continue;
    const r = campo(k, o[k]);
    if ("error" in r) return r;
    (datos as Record<CampoProveedor, unknown>)[k] = r.valor;
  }
  return { datos };
}

/** Los cambios de un proveedor (PUT {id, cambios}): solo lo que vino. Lo
 *  que no se conoce se ignora. */
export function limpiarCambiosProveedor(x: unknown): { cambios: Partial<DatosProveedor> } | { error: string } {
  if (!x || typeof x !== "object" || Array.isArray(x)) return { error: "No llegaron los cambios." };
  const o = x as Record<string, unknown>;
  const cambios: Partial<DatosProveedor> = {};
  for (const k of TODOS_LOS_CAMPOS) {
    if (o[k] === undefined) continue;
    const r = campo(k, o[k]);
    if ("error" in r) return r;
    (cambios as Record<CampoProveedor, unknown>)[k] = r.valor;
  }
  if (!Object.keys(cambios).length) return { error: "No llegó nada para cambiar." };
  return { cambios };
}
