// Con que sale un pedido, para el mail "tu pedido esta en camino". Damian,
// 18/11/2026: "cuando hay un seguimiento del envio que esta en camino, le
// podemos avisar tambien por mail".
//
// El seguimiento no es automatico (para eso hace falta una cuenta con cada
// transporte): el numero lo carga quien despacha y el cliente lo sigue en la
// pagina del transporte. Si el transporte da un link directo, se pega y va
// ese; si no, va su pagina de seguimiento y el numero bien a la vista.

export type Transporte = {
  id: string;
  nombre: string;
  /** Pagina para seguir el envio. Con {n}, el numero va adentro. */
  seguimiento?: string;
};

export const TRANSPORTES: readonly Transporte[] = [
  // Damian, 18/11/2026: "seria los envios por ahora con la Agencia J&M". Va
  // primera y elegida de entrada. Sin pagina de seguimiento conocida: si la
  // agencia da un numero o un link, se cargan a mano.
  { id: "jym", nombre: "Agencia J&M" },
  { id: "flete", nombre: "Nuestro reparto" },
  { id: "andreani", nombre: "Andreani", seguimiento: "https://www.andreani.com/envio/{n}" },
  { id: "oca", nombre: "OCA", seguimiento: "https://www.oca.com.ar/Busquedas/Envios" },
  { id: "correo", nombre: "Correo Argentino", seguimiento: "https://www.correoargentino.com.ar/formularios/e-commerce" },
  { id: "viacargo", nombre: "Vía Cargo", seguimiento: "https://www.viacargo.com.ar/" },
  { id: "cruzdelsur", nombre: "Cruz del Sur", seguimiento: "https://www.cruzdelsur.com/" },
  { id: "otro", nombre: "Otro transporte" },
];

export function transporteDe(id: string | null | undefined): Transporte | null {
  return TRANSPORTES.find((t) => t.id === id) ?? null;
}

/** El link para seguir el envio: el que se pego, o la pagina del transporte. */
export function linkDeSeguimiento(id: string | null | undefined, numero: string | null | undefined, link?: string | null): string | null {
  const pegado = (link ?? "").trim();
  if (/^https?:\/\//i.test(pegado)) return pegado;
  const t = transporteDe(id);
  if (!t?.seguimiento) return null;
  const n = (numero ?? "").trim();
  if (t.seguimiento.includes("{n}")) return n ? t.seguimiento.replace("{n}", encodeURIComponent(n)) : null;
  return t.seguimiento;
}

// ---------------------------------------------------- los mails mandados

export type TipoAviso = "en_camino" | "listo_retirar" | "entregado";

export type Aviso = { tipo: TipoAviso; fecha: string; a: string; ok: boolean; error?: string };

export const NOMBRE_AVISO: Record<TipoAviso, string> = {
  en_camino: "Tu pedido está en camino",
  listo_retirar: "Tu pedido está listo para retirar",
  entregado: "Gracias por tu compra",
};

export function leerAvisos(json: string | null | undefined): Aviso[] {
  try {
    const l = JSON.parse(json || "[]");
    return Array.isArray(l) ? (l as Aviso[]).filter((a) => a && typeof a.tipo === "string") : [];
  } catch {
    return [];
  }
}
