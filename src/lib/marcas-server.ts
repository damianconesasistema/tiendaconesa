// Marcas: las del codigo (src/lib/marcas.ts) mas las que carga el admin.
//
// Las del panel viven en la tabla Setting como un JSON, no en su propia tabla:
// son un punado de {id, name, logo}, no tienen relaciones y Product.brand ya
// guarda el slug suelto. Una tabla nueva seria una migracion y un join por
// cada consulta para nada.

import { getSetting, setSetting } from "@/lib/settings";
import {
  MARCAS_BASE,
  slugMarca,
  detectarMarca,
  marcaPorId,
  conLogo,
  type Marca,
} from "@/lib/marcas";
import { origenDeLaWeb } from "@/lib/web-de-marca";

export const SETTING_MARCAS_EXTRA = "marcas_extra";
/** La pagina web de cada marca, cargada desde el panel: {id: "https://..."}.
 *  Pisa la del codigo. Vacia ("") quiere decir "sin pagina". */
export const SETTING_MARCAS_WEB = "marcas_web";

async function leerWebs(): Promise<Record<string, string>> {
  const raw = await getSetting(SETTING_MARCAS_WEB);
  if (!raw || !raw.trim()) return {};
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const salida: Record<string, string> = {};
    for (const [id, web] of Object.entries(data)) if (typeof web === "string") salida[id] = web;
    return salida;
  } catch {
    return {};
  }
}

async function leerExtras(): Promise<Marca[]> {
  const raw = await getSetting(SETTING_MARCAS_EXTRA);
  if (!raw || !raw.trim()) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    // Filtramos a mano: el JSON lo escribimos nosotros, pero si quedo algo
    // raro de una version vieja no queremos romper toda la tienda por eso.
    return data
      .filter(
        (m) =>
          m &&
          typeof m.id === "string" &&
          m.id.trim() !== "" &&
          typeof m.name === "string" &&
          m.name.trim() !== "",
      )
      .map((m) => ({
        id: m.id,
        name: m.name,
        ...(typeof m.logo === "string" && m.logo ? { logo: m.logo } : {}),
        ...(Array.isArray(m.alias) ? { alias: m.alias.filter((a: unknown) => typeof a === "string") } : {}),
      }));
  } catch {
    return [];
  }
}

/** Todas las marcas: las del codigo primero, despues las que agrego el admin. */
export async function getMarcas(): Promise<Marca[]> {
  const [extras, webs] = await Promise.all([leerExtras(), leerWebs()]);
  const base = MARCAS_BASE.map((m) => ({ ...m }));
  const ids = new Set(base.map((m) => m.id));
  // Si alguien cargo una que ya existe en el codigo, gana la del codigo:
  // esa trae logo y alias.
  return base.concat(extras.filter((m) => !ids.has(m.id))).map((m) => {
    if (!(m.id in webs)) return m;
    const web = webs[m.id];
    const { web: _codigo, ...resto } = m;
    void _codigo;
    return web ? { ...resto, web } : resto;
  });
}

/** Las marcas con pagina web cargada: id -> {nombre, web}. */
export async function marcasConWeb(): Promise<Map<string, { name: string; web: string }>> {
  const salida = new Map<string, { name: string; web: string }>();
  for (const m of await getMarcas()) if (m.web) salida.set(m.id, { name: m.name, web: m.web });
  return salida;
}

/** Cambia la pagina web de una marca (cualquiera, tambien las del codigo).
 *  Vacia la deja sin pagina. Se guarda solo el sitio: "https://ferrum.com". */
export async function guardarWebDeMarca(
  id: string,
  web: string,
): Promise<{ ok?: true; error?: string; web?: string }> {
  if (!(await getMarcas()).some((m) => m.id === id)) return { error: "Esa marca no existe" };
  const texto = String(web ?? "").trim();
  let guardar = "";
  if (texto) {
    const origen = origenDeLaWeb(texto);
    if (!origen) return { error: "Esa dirección no sirve. Poné la página de la marca, por ejemplo ferrum.com" };
    guardar = origen.origin;
  }
  const webs = await leerWebs();
  webs[id] = guardar;
  await setSetting(SETTING_MARCAS_WEB, JSON.stringify(webs));
  return { ok: true, web: guardar };
}

export async function getMarcasConLogo(): Promise<Marca[]> {
  return conLogo(await getMarcas());
}

/** Las que puede borrar el admin (las del codigo no se tocan desde el panel). */
export async function getMarcasExtra(): Promise<Marca[]> {
  return leerExtras();
}

export async function detectarMarcaDB(titulo: string): Promise<string | null> {
  return detectarMarca(titulo, await getMarcas());
}

export async function marcaValidaDB(id: string): Promise<boolean> {
  return marcaPorId(id, await getMarcas()) !== null;
}

export async function agregarMarca(
  nombre: string,
  logo?: string,
): Promise<{ ok?: true; error?: string; id?: string }> {
  const name = nombre.trim();
  if (!name) return { error: "Escribí el nombre de la marca" };
  if (name.length > 40) return { error: "El nombre es muy largo" };
  const id = slugMarca(name);
  if (!id) return { error: "Ese nombre no deja armar un identificador" };

  const todas = await getMarcas();
  if (todas.some((m) => m.id === id))
    return { error: `"${name}" ya está en la lista` };

  const url = (logo ?? "").trim();
  if (url && !/^https?:\/\//i.test(url) && !url.startsWith("/"))
    return { error: "El logo tiene que ser un link http(s) o una ruta del sitio" };

  const extras = await leerExtras();
  extras.push({ id, name, ...(url ? { logo: url } : {}) });
  await setSetting(SETTING_MARCAS_EXTRA, JSON.stringify(extras));
  return { ok: true, id };
}

export async function quitarMarca(id: string): Promise<{ ok?: true; error?: string }> {
  const extras = await leerExtras();
  if (!extras.some((m) => m.id === id))
    return { error: "Esa marca viene en el código, no se puede borrar desde acá" };
  await setSetting(
    SETTING_MARCAS_EXTRA,
    JSON.stringify(extras.filter((m) => m.id !== id)),
  );
  return { ok: true };
}
