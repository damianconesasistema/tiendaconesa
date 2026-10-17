// Etiquetas que se calculan a partir del título del producto.
//
// Los termotanques a gas sirven tanto con gas natural como con envasado, y
// eso es lo primero que pregunta el cliente. En vez de obligarlo a leer la
// descripción, se muestran las dos opciones como etiquetas en la ficha.
//
// Se derivan del título a propósito: así alcanza con escribirlo bien en el
// Excel del proveedor y no hace falta cargar nada aparte por producto.

export type Etiqueta = { texto: string; tono: "gas" | "info" };

export function etiquetasDe(titulo: string): Etiqueta[] {
  const t = titulo.toUpperCase();
  const etiquetas: Etiqueta[] = [];

  if (/GAS NATURAL O ENVASADO/.test(t)) {
    etiquetas.push({ texto: "Gas natural", tono: "gas" });
    etiquetas.push({ texto: "Gas envasado", tono: "gas" });
  } else if (/GAS NATURAL/.test(t)) {
    etiquetas.push({ texto: "Gas natural", tono: "gas" });
  } else if (/ENVASADO/.test(t)) {
    etiquetas.push({ texto: "Gas envasado", tono: "gas" });
  }

  if (/ALTA RECUPERACIÓN|ALTA RECUPERACION/.test(t))
    etiquetas.push({ texto: "Alta recuperación", tono: "info" });

  return etiquetas;
}

export const TONOS_ETIQUETA: Record<Etiqueta["tono"], string> = {
  gas: "border-sky-200 bg-sky-50 text-sky-700",
  info: "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
};

/** Opciones que el cliente elige al comprar.
 *
 *  Un termotanque "a gas natural o envasado" es el mismo aparato: cambia el
 *  inyector con el que hay que entregarlo. No son dos publicaciones, es una
 *  sola con una eleccion, y esa eleccion tiene que llegar al pedido para
 *  saber como prepararlo. */
export type Opcion = { label: string; valores: string[] };

export function opcionesDe(titulo: string): Opcion | null {
  if (/GAS NATURAL O ENVASADO/.test(titulo.toUpperCase()))
    return {
      label: "¿Con qué gas lo vas a usar?",
      valores: ["Gas natural", "Gas envasado"],
    };
  return null;
}

/** Valida contra la lista real lo que mando el navegador.
 *
 *  Devuelve el valor tal cual esta escrito en `opcionesDe`, nunca el texto
 *  del cliente: si no, cualquiera podria mandar lo que quisiera y terminaria
 *  impreso en la factura. */
export function opcionValida(
  titulo: string,
  elegida?: string | null,
): string | null {
  const o = opcionesDe(titulo);
  if (!o || !elegida) return null;
  const limpia = elegida.trim().toLowerCase();
  return o.valores.find((v) => v.toLowerCase() === limpia) ?? null;
}
