// Tipos de envío de un producto. Ahora es multi-selección: un producto
// puede ofrecer varias formas de entrega a la vez.
// Se guarda en Product.shippingType como lista separada por comas.

export const SHIPPING_TYPES = [
  {
    id: "retiro",
    label: "Retiro en tienda",
    desc: "Villa Cura Brochero · sin costo",
  },
  {
    id: "envio",
    label: "Envío a Traslasierra",
    desc: "Mina Clavero, Nono, Villa Dolores y más",
  },
  {
    id: "gratis",
    label: "Envío gratis",
    desc: "A todo el Valle de Traslasierra",
  },
] as const;

const VALID = ["retiro", "envio", "gratis"];

// Convierte el valor guardado a una lista de ids.
// "ambos" (legacy) => retiro + envio. Vacío => retiro + envio (default).
export function parseShipping(s: string | null | undefined): string[] {
  if (!s || s === "ambos") return ["retiro", "envio"];
  const arr = s
    .split(",")
    .map((x) => x.trim())
    .filter((x) => VALID.includes(x));
  return arr.length ? arr : ["retiro", "envio"];
}

// Convierte una lista de ids al string que guardamos.
export function formatShipping(ids: string[]): string {
  const clean = ids.filter((x) => VALID.includes(x));
  return (clean.length ? clean : ["retiro", "envio"]).join(",");
}
