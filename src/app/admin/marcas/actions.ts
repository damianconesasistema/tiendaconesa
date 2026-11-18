"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import { agregarMarca, getMarcas, guardarWebDeMarca, quitarMarca } from "@/lib/marcas-server";
import { guardarLogoSubido, quitarLogo, traerLogoDeLaWeb } from "@/lib/logo-de-marca";

type Resultado = { ok?: true; error?: string };

export async function crearMarca(formData: FormData): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const r = await agregarMarca(
    String(formData.get("nombre") || ""),
    String(formData.get("logo") || ""),
  );
  if (r.error) return { error: r.error };

  // La pagina web, si la pusieron al agregarla.
  const web = String(formData.get("web") || "").trim();
  if (web && r.id) {
    const w = await guardarWebDeMarca(r.id, web);
    if (w.error) return { error: `Se agregó la marca, pero la página web no: ${w.error}` };
    // Sin logo, se trae solo de esa pagina.
    if (!String(formData.get("logo") || "").trim() && w.web) await traerLogoDeLaWeb(r.id, w.web);
  }

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { ok: true };
}

/** La pagina web de una marca: de ahi se traen foto y descripcion de sus
 *  articulos por el codigo (src/lib/web-de-marca.ts). Vale para todas las
 *  marcas, tambien las que vienen en el codigo. Vacia la deja sin pagina. */
export async function cambiarWebDeMarca(
  id: string,
  web: string,
): Promise<{ ok?: true; error?: string; web?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const r = await guardarWebDeMarca(id, web);
  if (r.error) return { error: r.error };
  // Si la marca no tiene logo, se trae solo de la pagina recien cargada.
  const marca = (await getMarcas()).find((m) => m.id === id);
  if (r.web && marca && !marca.logo) await traerLogoDeLaWeb(id, r.web);
  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos/fotos-fv");
  revalidatePath("/");
  return { ok: true, web: r.web };
}

function refrescarLogos() {
  revalidatePath("/admin/marcas");
  revalidatePath("/");
  revalidatePath("/tienda");
}

/** "Traer logo": lo busca en la pagina de la marca. Damian, 17/11/2026: "a
 *  estas marcas le podes agregar el logo de la misma pagina
 *  automaticamente". Ver src/lib/logo-de-marca.ts. */
export async function traerLogo(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const marca = (await getMarcas()).find((m) => m.id === id);
  if (!marca) return { error: "No está esa marca." };
  if (!marca.web) return { error: "Primero cargale la página web." };
  const r = await traerLogoDeLaWeb(id, marca.web);
  if (!r.ok) return { error: r.motivo };
  refrescarLogos();
  return { ok: true };
}

/** Todas las marcas con pagina y sin logo, de una. */
export async function traerLogosQueFaltan(): Promise<{ traidos: number; fallaron: string[] } | { error: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  const faltan = (await getMarcas()).filter((m) => m.web && !m.logo);
  let traidos = 0;
  const fallaron: string[] = [];
  for (const m of faltan) {
    const r = await traerLogoDeLaWeb(m.id, m.web as string);
    if (r.ok) traidos++;
    else fallaron.push(`${m.name}: ${r.motivo}`);
  }
  refrescarLogos();
  return { traidos, fallaron };
}

/** "subir logo": la imagen que elige Damian en la compu, para cualquier
 *  marca (tenga o no pagina web, y aunque ya tenga logo). */
export async function subirLogo(id: string, formData: FormData): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  if (!(await getMarcas()).some((m) => m.id === id)) return { error: "No está esa marca." };
  const f = formData.get("logo");
  if (!(f instanceof File) || f.size === 0) return { error: "No llegó la imagen." };
  if (f.size > 8 * 1024 * 1024) return { error: "La imagen pesa más de 8 MB." };
  if (!/^image\//.test(f.type) && !/\.(png|jpe?g|webp|svg|gif|avif)$/i.test(f.name))
    return { error: "Tiene que ser una imagen (PNG, JPG, WebP o SVG)." };
  const r = await guardarLogoSubido(id, Buffer.from(await f.arrayBuffer()));
  if (!r.ok) return { error: r.motivo };
  refrescarLogos();
  return { ok: true };
}

/** Saca el logo traido de la web o subido (si era otra imagen). */
export async function sacarLogo(id: string): Promise<{ ok?: true; error?: string }> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };
  await quitarLogo(id);
  refrescarLogos();
  return { ok: true };
}

// Borrar una marca no toca los productos: si alguno la tenia, queda con un
// slug que ya no resuelve a ningun nombre. Por eso la pantalla muestra cuantos
// productos la usan antes de dejar borrar.
export async function borrarMarca(id: string): Promise<Resultado> {
  const session = await getAdminSession();
  if (!session) return { error: "No autorizado" };

  const enUso = await prisma.product.count({ where: { brand: id } });
  if (enUso > 0)
    return {
      error: `No se puede: ${enUso} ${enUso === 1 ? "producto la usa" : "productos la usan"}. Cambiales la marca primero.`,
    };

  const r = await quitarMarca(id);
  if (r.error) return { error: r.error };

  revalidatePath("/admin/marcas");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  revalidatePath("/");
  return { ok: true };
}
