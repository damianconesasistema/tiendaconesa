import { getSetting, setSetting } from "@/lib/settings";
import { TIENDA_URL } from "@/lib/dominio";

// MercadoLibre, para buscar fotos y ficha de un articulo en su CATALOGO.
//
// Damian, 17/11/2026: "si no busca en la web de la marca, que busque en
// mercadolibre? pero tiene que ser exacto la buscada ahi porque puede traer
// cualquier cosa". Con la cuenta de MercadoLibre de Sanitarios Conesa (no la
// de IKORA, que es otro negocio).
//
// Desde 2025 MercadoLibre no deja buscar sin una cuenta conectada (contesta
// 403). La conexion la hace Damian desde el panel (Productos -> Fotos de la
// web -> Conectar MercadoLibre): carga el numero y la clave de SU aplicacion
// y le da permiso entrando a MercadoLibre con su usuario. Ni la clave ni el
// permiso pasan nunca por el navegador de vuelta: viven en la tabla Setting.
//
// Se busca en el CATALOGO de MercadoLibre (las fichas de producto, con las
// fotos de la marca), no en las publicaciones de otros vendedores: esas
// traen sus logos y marcas de agua. Y un resultado vale solo si es EXACTO:
// la marca coincide y el codigo es el "Modelo" o el "Numero de pieza" de la
// ficha (o esta como palabra entera en su nombre). Si no, no se trae nada.

const API = "https://api.mercadolibre.com";
const AUTH = "https://auth.mercadolibre.com.ar/authorization";
const ESPERA_MAX = 15_000;

const S_APP = "ml_app_id";
const S_SECRETO = "ml_app_secret";
const S_TOKEN = "ml_token";

/** La direccion a la que MercadoLibre vuelve despues de dar el permiso. Tiene
 *  que estar cargada IGUAL en la aplicacion de MercadoLibre. */
export const ML_REDIRECCION = `${TIENDA_URL}/api/admin/mercadolibre/callback`;

type Token = {
  access: string;
  refresh: string;
  /** Hasta cuando vale el access (ms). */
  vence: number;
  usuario?: number;
  nickname?: string;
};

async function leerToken(): Promise<Token | null> {
  const raw = await getSetting(S_TOKEN);
  if (!raw) return null;
  try {
    const t = JSON.parse(raw) as Token;
    return t?.access && t?.refresh ? t : null;
  } catch {
    return null;
  }
}

async function credenciales(): Promise<{ appId: string; secreto: string } | null> {
  const [appId, secreto] = await Promise.all([getSetting(S_APP), getSetting(S_SECRETO)]);
  return appId?.trim() && secreto?.trim() ? { appId: appId.trim(), secreto: secreto.trim() } : null;
}

/** Como esta la conexion, para la pantalla. La clave nunca sale de aca. */
export async function estadoML(): Promise<{
  appId: string | null;
  tieneClave: boolean;
  conectado: boolean;
  nickname: string | null;
}> {
  const [appId, secreto, token] = await Promise.all([
    getSetting(S_APP),
    getSetting(S_SECRETO),
    leerToken(),
  ]);
  return {
    appId: appId?.trim() || null,
    tieneClave: !!secreto?.trim(),
    conectado: !!token,
    nickname: token?.nickname ?? null,
  };
}

export async function mlConectado(): Promise<boolean> {
  return !!(await leerToken()) && !!(await credenciales());
}

/** Guarda el numero de la aplicacion y su clave. La clave vacia deja la que
 *  estaba (la pantalla no la muestra, asi que no se puede "repetir"). */
export async function guardarAppML(appId: string, secreto: string): Promise<{ ok?: true; error?: string }> {
  const id = String(appId ?? "").trim();
  if (!/^\d{4,25}$/.test(id)) return { error: "El número de la aplicación (App ID) son solo números." };
  await setSetting(S_APP, id);
  const clave = String(secreto ?? "").trim();
  if (clave) {
    if (clave.length < 10 || /\s/.test(clave)) return { error: "Esa clave secreta no parece completa." };
    await setSetting(S_SECRETO, clave);
  }
  return { ok: true };
}

export async function desconectarML(): Promise<void> {
  await setSetting(S_TOKEN, "");
}

/** A donde mandar a Damian para que de el permiso. */
export async function urlDeAutorizacion(estado: string): Promise<string | null> {
  const c = await credenciales();
  if (!c) return null;
  const u = new URL(AUTH);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", c.appId);
  u.searchParams.set("redirect_uri", ML_REDIRECCION);
  u.searchParams.set("state", estado);
  return u.toString();
}

async function pedirToken(campos: Record<string, string>): Promise<Token | { error: string }> {
  try {
    const r = await fetch(`${API}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams(campos).toString(),
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    const d = await r.json();
    if (!r.ok || !d?.access_token || !d?.refresh_token)
      return { error: d?.message || d?.error || `MercadoLibre contestó ${r.status}` };
    return {
      access: d.access_token,
      refresh: d.refresh_token,
      vence: Date.now() + (Number(d.expires_in) || 21600) * 1000,
      usuario: d.user_id,
    };
  } catch (e) {
    return { error: `no se pudo hablar con MercadoLibre: ${(e as Error).message}` };
  }
}

/** Despues de que Damian dio el permiso: cambia el codigo por el token. */
export async function canjearCodigo(codigo: string): Promise<{ ok?: true; error?: string; nickname?: string }> {
  const c = await credenciales();
  if (!c) return { error: "Falta cargar el número y la clave de la aplicación." };
  const t = await pedirToken({
    grant_type: "authorization_code",
    client_id: c.appId,
    client_secret: c.secreto,
    code: codigo,
    redirect_uri: ML_REDIRECCION,
  });
  if ("error" in t) return { error: t.error };
  try {
    const r = await fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${t.access}` },
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    const u = await r.json();
    if (u?.nickname) t.nickname = String(u.nickname);
  } catch {
    /* el nombre es para mostrar nomas */
  }
  await setSetting(S_TOKEN, JSON.stringify(t));
  return { ok: true, nickname: t.nickname };
}

// El permiso dura 6 horas y se renueva con el refresh, que MercadoLibre da
// UNA sola vez: usado, ya no sirve. Si dos busquedas renovaran a la vez, la
// segunda quemaria la conexion. Por eso hay una sola renovacion en curso.
let renovando: Promise<string | null> | null = null;

async function tokenVigente(): Promise<string | null> {
  const t = await leerToken();
  if (!t) return null;
  if (t.vence - Date.now() > 5 * 60 * 1000) return t.access;
  if (!renovando)
    renovando = (async () => {
      try {
        const c = await credenciales();
        if (!c) return null;
        const nuevo = await pedirToken({
          grant_type: "refresh_token",
          client_id: c.appId,
          client_secret: c.secreto,
          refresh_token: t.refresh,
        });
        if ("error" in nuevo) return null;
        await setSetting(S_TOKEN, JSON.stringify({ ...nuevo, nickname: t.nickname }));
        return nuevo.access;
      } finally {
        setTimeout(() => (renovando = null), 0);
      }
    })();
  return renovando;
}

async function api<T>(ruta: string): Promise<T | null> {
  const token = await tokenVigente();
  if (!token) return null;
  try {
    const r = await fetch(`${API}${ruta}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(ESPERA_MAX),
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

// --------------------------------------------------------------- busqueda

type Atributo = { id?: string; name?: string; value_name?: string | null };
type ProductoML = {
  id?: string;
  name?: string;
  attributes?: Atributo[];
  pictures?: { url?: string; secure_url?: string }[];
  short_description?: { content?: string };
};

export type DatosDeML = {
  encontrado: boolean;
  motivo?: string;
  nombre?: string;
  foto?: string | null;
  fotos?: string[];
  descripcion?: string | null;
  ficha?: string;
  codigo?: string;
};

const normal = (x: string | null | undefined) =>
  String(x ?? "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

/** El codigo esta como palabra entera ("445" en "Bacha Mi Pileta 445", no en
 *  "4450"). */
const tieneCodigo = (texto: string | null | undefined, codigo: string) =>
  ` ${normal(texto)} `.includes(` ${normal(codigo)} `) ||
  normal(texto).replace(/ /g, "") === normal(codigo).replace(/ /g, "");

/** Los atributos que dicen el modelo o el codigo del fabricante. */
const ATRIBUTOS_DE_CODIGO = new Set(["MODEL", "ALPHANUMERIC_MODEL", "PART_NUMBER", "MANUFACTURER_PART_NUMBER", "LINE_MODEL"]);

export function esExacto(p: ProductoML, marca: string, codigo: string): boolean {
  const atr = p.attributes ?? [];
  const marcaML = atr.find((a) => a.id === "BRAND")?.value_name;
  const marcaOk = marcaML ? normal(marcaML) === normal(marca) : tieneCodigo(p.name, marca);
  if (!marcaOk) return false;
  const porAtributo = atr.some(
    (a) =>
      (ATRIBUTOS_DE_CODIGO.has(a.id ?? "") || /modelo|n[uú]mero de pieza|c[oó]digo/i.test(a.name ?? "")) &&
      normal(a.value_name).replace(/ /g, "") === normal(codigo).replace(/ /g, ""),
  );
  return porAtributo || tieneCodigo(p.name, codigo);
}

/** Atributos que no le dicen nada al cliente. */
const SIN_INTERES = /^(GTIN|SELLER_SKU|EAN|UPC|ITEM_CONDITION|IS_|HAS_|PACKAGE_|SHIPMENT_|GIFTABLE|ADULT_CONTENT|EXCLUSIVE_CHANNEL)/;

function armarDescripcion(p: ProductoML): string | null {
  const texto = String(p.short_description?.content ?? "").trim();
  const filas = (p.attributes ?? [])
    .filter((a) => a.name && a.value_name && !SIN_INTERES.test(a.id ?? ""))
    .slice(0, 20)
    .map((a) => `• ${a.name}: ${a.value_name}`);
  const partes = [texto, filas.length ? `Características:\n${filas.join("\n")}` : ""].filter(Boolean);
  return partes.length ? partes.join("\n\n").slice(0, 4000) : null;
}

/** Las fotos de MercadoLibre salen de sus servidores (mlstatic.com). */
export function fotoDeMercadoLibre(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && (u.hostname === "mlstatic.com" || u.hostname.endsWith(".mlstatic.com"));
  } catch {
    return false;
  }
}

const memoria = new Map<string, { cuando: number; datos: DatosDeML }>();

/** Busca el articulo en el catalogo de MercadoLibre. Solo devuelve algo si es
 *  exactamente esa marca y ese codigo. */
export async function buscarEnMercadoLibre(a: { marca: string; codigos: string[] }): Promise<DatosDeML> {
  if (!(await mlConectado()))
    return { encontrado: false, motivo: "MercadoLibre no está conectado" };
  const marca = a.marca.trim();
  const codigos = a.codigos.filter((c) => c.trim().length >= 3).slice(0, 2);
  if (!marca || codigos.length === 0) return { encontrado: false, motivo: "sin marca o sin código para buscar" };

  const clave = `${normal(marca)}|${codigos.join("|")}`;
  const g = memoria.get(clave);
  if (g && Date.now() - g.cuando < 60 * 60 * 1000) return g.datos;

  for (const codigo of codigos) {
    const q = encodeURIComponent(`${marca} ${codigo}`);
    const r = await api<{ results?: ProductoML[] }>(
      `/products/search?status=active&site_id=MLA&q=${q}&limit=10`,
    );
    for (const res of (r?.results ?? []).slice(0, 6)) {
      if (!res.id) continue;
      // La ficha completa: atributos, fotos y descripcion.
      const p = (await api<ProductoML>(`/products/${encodeURIComponent(res.id)}`)) ?? res;
      if (!esExacto(p, marca, codigo)) continue;
      const fotos = [
        ...new Set(
          (p.pictures ?? [])
            .map((f) => f.secure_url || f.url || "")
            .map((f) => f.replace(/^http:\/\//, "https://"))
            .filter(fotoDeMercadoLibre),
        ),
      ].slice(0, 6);
      const datos: DatosDeML = {
        encontrado: true,
        nombre: p.name,
        foto: fotos[0] ?? null,
        fotos,
        descripcion: armarDescripcion(p),
        ficha: `https://www.mercadolibre.com.ar/p/${p.id}`,
        codigo,
      };
      memoria.set(clave, { cuando: Date.now(), datos });
      return datos;
    }
  }
  const datos: DatosDeML = {
    encontrado: false,
    motivo: `en MercadoLibre no hay una ficha exacta de ${marca} ${codigos.join(" / ")}`,
  };
  memoria.set(clave, { cuando: Date.now(), datos });
  return datos;
}

// ------------------------------------------------- un link de MercadoLibre

type ItemML = {
  id?: string;
  title?: string;
  pictures?: { url?: string; secure_url?: string }[];
  attributes?: Atributo[];
  catalog_product_id?: string | null;
};

/** El numero de un link de MercadoLibre: "/p/MLA21097034" es una ficha de
 *  catalogo; "MLA-1234567890" o "/MLA1234567890" es una publicacion. */
export function idDeLinkML(link: string): { tipo: "producto" | "item"; id: string } | null {
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  if (!/(^|\.)mercadoli(b|v)re\.com(\.ar)?$/i.test(u.hostname)) return null;
  const p = u.pathname.match(/\/p\/(MLA\d+)/i);
  if (p) return { tipo: "producto", id: p[1].toUpperCase() };
  const i = (u.pathname + u.search).match(/MLA-?(\d{6,})/i);
  if (i) return { tipo: "item", id: `MLA${i[1]}` };
  return null;
}

/** Lee un link de MercadoLibre por su numero, con la cuenta conectada (la
 *  pagina misma no se deja leer desde un servidor). null si no se puede. */
export async function leerLinkDeMercadoLibre(link: string): Promise<DatosDeML | null> {
  const id = idDeLinkML(link);
  if (!id || !(await mlConectado())) return null;

  const fotosDe = (lista?: { url?: string; secure_url?: string }[]) =>
    [
      ...new Set(
        (lista ?? [])
          .map((f) => (f.secure_url || f.url || "").replace(/^http:\/\//, "https://"))
          .filter(fotoDeMercadoLibre),
      ),
    ].slice(0, 6);

  if (id.tipo === "producto") {
    const p = await api<ProductoML>(`/products/${id.id}`);
    if (!p?.name) return null;
    const fotos = fotosDe(p.pictures);
    return {
      encontrado: true,
      nombre: p.name,
      foto: fotos[0] ?? null,
      fotos,
      descripcion: armarDescripcion(p),
      ficha: link,
    };
  }

  const it = await api<ItemML>(`/items/${id.id}`);
  if (!it?.title) return null;
  const desc = await api<{ plain_text?: string }>(`/items/${id.id}/description`);
  const fotos = fotosDe(it.pictures);
  return {
    encontrado: true,
    nombre: it.title,
    foto: fotos[0] ?? null,
    fotos,
    descripcion: armarDescripcion({
      short_description: { content: String(desc?.plain_text ?? "").trim() },
      attributes: it.attributes,
    }),
    ficha: link,
  };
}
