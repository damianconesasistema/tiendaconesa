// Asociar los artículos con los proveedores de la lista (V.0.11.288): las
// reglas, sin base.
//
// Damián, 26/11/2026: "¿los artículos ven la lista de proveedores que armé?"
// y, con lo que encontramos (2.742 de 6.852 cruzan por nombre), "sí, armala".
//
// El proveedor de cada artículo es un texto que viene de GBP (cat_desc). En
// 4.110 artículos no es un proveedor de la lista: o es un rubro de GBP
// ("09.SANITARIOS", "20.ZISCONTINUADOS") o el nombre está escrito distinto
// ("COOPERATIVA FENIX LTDA" y en la lista "COOP.FENIX LTDA."). No se cambia
// artículo por artículo (el próximo import de GBP lo pisaría): se guardan las
// asociaciones y se aplican siempre al leer los artículos.
//   - porNombre: el nombre de GBP -> el proveedor de la lista.
//   - porMarca: para los que traen un rubro de GBP en vez de proveedor, la
//     marca -> el proveedor de la lista (TST -> "TST SA").
//
// Sin ningún import a propósito: lo usan la ruta, el servidor de prueba y
// las pruebas con node solo.

export type Asociaciones = { porNombre: Record<string, string>; porMarca: Record<string, string> };
export const MAX_ASOCIACIONES = 3000;

/** La clave de un nombre: sin acentos, mayúsculas, solo letras y números. */
export function claveAsoc(s: unknown): string {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** "09.SANITARIOS", "20.ZISCONTINUADOS", vacío: un rubro de GBP, no un proveedor. */
export const esRubroGbp = (cat: unknown): boolean => {
  const s = String(cat ?? "").trim();
  return !s || /^\d{1,3}\s*\./.test(s);
};

/** El proveedor de un artículo con las asociaciones puestas. */
export function proveedorAsociado(a: { cat?: unknown; prov?: unknown }, asoc: Asociaciones): string {
  const c = String(a.cat ?? "").trim();
  if (!esRubroGbp(c)) return asoc.porNombre[claveAsoc(c)] || c;
  return asoc.porMarca[claveAsoc(a.prov)] || c;
}

/** Los artículos con su proveedor de la lista. El de GBP queda en catGbp
 *  (para la ventana de asociar y para volver atrás). */
export function aplicarAsociaciones<T extends { cat?: unknown; prov?: unknown }>(articulos: readonly T[], asoc: Asociaciones): T[] {
  if (!Object.keys(asoc.porNombre).length && !Object.keys(asoc.porMarca).length) return articulos.slice();
  return articulos.map((a) => {
    const nuevo = proveedorAsociado(a, asoc);
    return nuevo === String(a.cat ?? "").trim() ? a : { ...a, cat: nuevo, catGbp: a.cat };
  });
}

const texto = (x: unknown, max: number): string =>
  typeof x === "string" ? x.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max) : "";

/** Lo que llega de la página, limpio. String = el error. Lo vacío se saca. */
export function limpiarAsociaciones(x: unknown): Asociaciones | string {
  if (!x || typeof x !== "object") return "No entendí las asociaciones.";
  const o = x as Record<string, unknown>;
  const r: Asociaciones = { porNombre: {}, porMarca: {} };
  for (const k of ["porNombre", "porMarca"] as const) {
    const m = o[k];
    if (m == null) continue;
    if (typeof m !== "object" || Array.isArray(m)) return "No entendí las asociaciones.";
    const ent = Object.entries(m as Record<string, unknown>);
    if (ent.length > MAX_ASOCIACIONES) return `Son demasiadas (más de ${MAX_ASOCIACIONES}).`;
    for (const [nombre, prov] of ent) {
      const kk = claveAsoc(nombre), v = texto(prov, 120);
      if (!kk || !v) continue;
      r[k][kk] = v;
    }
  }
  return r;
}

export const VACIAS: Asociaciones = { porNombre: {}, porMarca: {} };
