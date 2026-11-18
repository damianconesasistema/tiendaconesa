// Las novedades del panel: lo que paso desde la ultima vez, para leerlas de un
// vistazo en la leyenda que corre arriba del panel.
//
// Damian, 17/11/2026: "podes hacer que el chequeo de las cuotas lo haga
// automaticamente todos los dias e informe en el panel como una leyenda de
// noticias, asi tambien los productos que se pausaron o quedaron bajo en
// stock etc.".
//
// Viven en la tabla Setting como una lista JSON (son pocas y no tienen
// relaciones). Las arma el chequeo diario (src/lib/chequeo-diario.ts) y, en
// el momento, lo que tiene una causa que conviene contar (por ejemplo, los
// combos que pauso una carga de stock).

import { getSetting, setSetting } from "@/lib/settings";

const S_NOVEDADES = "novedades";
const MAXIMO = 150;
const DIAS_QUE_SE_GUARDAN = 60;

export type TipoNovedad =
  | "cuotas"
  | "costos"
  | "pausados"
  | "activados"
  | "sin-stock"
  | "poco-stock"
  | "nuevos"
  | "combos"
  | "pausados-sin-stock";

export type Novedad = {
  id: string;
  /** ISO. */
  fecha: string;
  tipo: TipoNovedad;
  /** Lo que se lee en la leyenda. */
  texto: string;
  /** A donde lleva al tocarla. */
  link?: string;
  /** El local al que se refiere, si es de uno. */
  sucursal?: string;
  /** "aviso": algo para hacer (se ve resaltado). */
  nivel?: "info" | "aviso";
  /** Los productos que nombra, para no contarlos dos veces. */
  items?: string[];
  /** Las que cuentan un ESTADO (como estan las cuotas hoy) llevan una clave:
   *  la nueva reemplaza a la anterior de la misma clave, para que no se
   *  junten siete iguales en la semana. */
  clave?: string;
};

export async function leerNovedades(): Promise<Novedad[]> {
  const raw = await getSetting(S_NOVEDADES);
  try {
    const l = JSON.parse(raw || "[]");
    return Array.isArray(l)
      ? l.filter((n): n is Novedad => !!n && typeof n.texto === "string" && typeof n.fecha === "string")
      : [];
  } catch {
    return [];
  }
}

/** Suma novedades (las mas nuevas primero) y tira las viejas. */
export async function agregarNovedades(nuevas: Omit<Novedad, "id" | "fecha">[]): Promise<void> {
  if (nuevas.length === 0) return;
  const ahora = new Date();
  const corte = ahora.getTime() - DIAS_QUE_SE_GUARDAN * 86_400_000;
  const listas: Novedad[] = nuevas.map((n, i) => ({
    ...n,
    id: `${ahora.getTime().toString(36)}-${i}`,
    fecha: ahora.toISOString(),
  }));
  const claves = new Set(listas.map((n) => n.clave).filter(Boolean));
  const viejas = (await leerNovedades()).filter(
    (n) => new Date(n.fecha).getTime() >= corte && !(n.clave && claves.has(n.clave)),
  );
  await setSetting(S_NOVEDADES, JSON.stringify([...listas, ...viejas].slice(0, MAXIMO)));
}

/** Las de los ultimos dias, las mas nuevas primero. */
export async function novedadesRecientes(dias = 7): Promise<Novedad[]> {
  const corte = Date.now() - dias * 86_400_000;
  return (await leerNovedades()).filter((n) => new Date(n.fecha).getTime() >= corte);
}

/** "A, B, C y 4 más": para nombrar productos sin hacer un renglon eterno. */
export function nombrar(titulos: string[], hasta = 3): string {
  const corto = (t: string) => (t.length > 40 ? `${t.slice(0, 38)}…` : t);
  const primeros = titulos.slice(0, hasta).map(corto);
  const resto = titulos.length - primeros.length;
  return resto > 0 ? `${primeros.join(", ")} y ${resto} más` : primeros.join(", ");
}
