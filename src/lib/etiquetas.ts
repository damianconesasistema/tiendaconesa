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
