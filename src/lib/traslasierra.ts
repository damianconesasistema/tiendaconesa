// Localidades del Valle de Traslasierra donde hacemos envío + costo estimado.
// El admin confirma el costo final al coordinar por WhatsApp (puede variar
// por volumen/peso del pedido).

export type LocalidadInfo = {
  name: string;
  cost: number; // costo estimado en pesos
};

export const localidadesTraslasierra: readonly LocalidadInfo[] = [
  { name: "Villa Cura Brochero", cost: 2000 },
  { name: "Mina Clavero", cost: 2500 },
  { name: "Nono", cost: 3500 },
  { name: "Las Rabonas", cost: 3500 },
  { name: "Los Hornillos", cost: 4500 },
  { name: "Las Calles", cost: 4500 },
  { name: "La Población", cost: 5000 },
  { name: "Panaholma", cost: 3000 },
  { name: "La Paz", cost: 6000 },
  { name: "Luyaba", cost: 6500 },
  { name: "Villa de Las Rosas", cost: 5500 },
  { name: "San Javier", cost: 6500 },
  { name: "Yacanto", cost: 6500 },
  { name: "San Pedro", cost: 7000 },
  { name: "Los Molles", cost: 5000 },
  { name: "Las Tapias", cost: 6000 },
  { name: "Villa Dolores", cost: 5500 },
] as const;

export type Localidad = (typeof localidadesTraslasierra)[number]["name"];

export function shippingCostForLocality(name: string): number {
  const l = localidadesTraslasierra.find((x) => x.name === name);
  return l?.cost ?? 0;
}
