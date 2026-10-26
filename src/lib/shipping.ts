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
    desc: "Costo a coordinar por WhatsApp",
  },
] as const;

// "gratis" ya no es una opcion: ningun envio va sin cargo, se coordina
// siempre. Los productos que lo tengan guardado de antes se leen como
// "envio", asi no hay que migrar nada ni queda uno prometiendo algo que
// no cumplimos.
const VALID = ["retiro", "envio"];

// Convierte el valor guardado a una lista de ids.
// "ambos" (legacy) => retiro + envio. Vacío => retiro + envio (default).
export function parseShipping(s: string | null | undefined): string[] {
  if (!s || s === "ambos") return ["retiro", "envio"];
  const arr = [
    ...new Set(
      s
        .split(",")
        .map((x) => x.trim())
        .map((x) => (x === "gratis" ? "envio" : x))
        .filter((x) => VALID.includes(x)),
    ),
  ];
  return arr.length ? arr : ["retiro", "envio"];
}

// Convierte una lista de ids al string que guardamos.
export function formatShipping(ids: string[]): string {
  const clean = [
    ...new Set(ids.map((x) => (x === "gratis" ? "envio" : x))),
  ].filter((x) => VALID.includes(x));
  return (clean.length ? clean : ["retiro", "envio"]).join(",");
}
