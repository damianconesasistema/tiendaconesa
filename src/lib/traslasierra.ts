// Localidades que atiende la sucursal de Traslasierra.
//
// Sirven para dos cosas: el desplegable del checkout y, desde la etapa 2,
// para decidir que sucursal atiende a cada cliente.
//
// Se eligio localidad y no codigo postal a proposito. Damian sabe
// exactamente a que pueblos reparte; los codigos postales habria que
// adivinarlos uno por uno, y ademas varios pueblos del valle comparten el
// mismo codigo, asi que tampoco alcanzarian para distinguirlos.
//
// El `cost` es ORIENTATIVO y hoy NO se cobra: el checkout manda el envio en
// cero y el costo se acuerda por WhatsApp. Queda como referencia para esa
// charla. Los pueblos sin numero son los que todavia no tienen referencia.

export type LocalidadInfo = {
  name: string;
  /** Referencia para coordinar, en pesos. No se cobra automaticamente. */
  cost?: number;
  /** Para agrupar el desplegable: el noroeste esta bastante mas lejos. */
  zona: "valle" | "noroeste";
};

export const localidadesTraslasierra: readonly LocalidadInfo[] = [
  // --- Valle de Traslasierra ---
  { name: "Villa Cura Brochero", cost: 2000, zona: "valle" },
  { name: "Mina Clavero", cost: 2500, zona: "valle" },
  { name: "Panaholma", cost: 3000, zona: "valle" },
  { name: "Nono", cost: 3500, zona: "valle" },
  { name: "Las Rabonas", cost: 3500, zona: "valle" },
  { name: "Los Hornillos", cost: 4500, zona: "valle" },
  { name: "Las Calles", cost: 4500, zona: "valle" },
  { name: "La Población", cost: 5000, zona: "valle" },
  { name: "Los Molles", cost: 5000, zona: "valle" },
  { name: "Villa de Las Rosas", cost: 5500, zona: "valle" },
  { name: "Villa Dolores", cost: 5500, zona: "valle" },
  { name: "Las Tapias", cost: 6000, zona: "valle" },
  { name: "La Paz", cost: 6000, zona: "valle" },
  { name: "Luyaba", cost: 6500, zona: "valle" },
  { name: "San Javier", cost: 6500, zona: "valle" },
  { name: "Yacanto", cost: 6500, zona: "valle" },
  { name: "San Pedro", cost: 7000, zona: "valle" },
  // Sumadas del mapa que paso Damian (26/10/2026). Sin costo de referencia
  // todavia: se acuerda por WhatsApp, como el resto.
  { name: "Ambul", zona: "valle" },
  { name: "Arroyo de los Patos", zona: "valle" },
  { name: "El Cóndor", zona: "valle" },
  { name: "El Huayco", zona: "valle" },
  { name: "La Pampilla", zona: "valle" },
  { name: "Las Chacras", zona: "valle" },
  { name: "Loma Bola", zona: "valle" },
  { name: "Paraje Niña Paula", zona: "valle" },
  { name: "Piedra Pintada", zona: "valle" },
  { name: "San José", zona: "valle" },
  { name: "San Lorenzo", zona: "valle" },
  { name: "Travesía", zona: "valle" },

  // --- Area Noroeste ---
  // Mas lejos y cruzando. El flete pesa bastante mas, asi que conviene
  // acordarlo antes de cerrar la venta.
  { name: "Cabeza de Novillo", zona: "noroeste" },
  { name: "Chancaní", zona: "noroeste" },
  { name: "Characato", zona: "noroeste" },
  { name: "Ciénaga del Coro", zona: "noroeste" },
  { name: "Cruz del Eje", zona: "noroeste" },
  { name: "La Candelaria", zona: "noroeste" },
  { name: "La Higuera", zona: "noroeste" },
  { name: "La Puerta", zona: "noroeste" },
  { name: "Las Palmas", zona: "noroeste" },
  { name: "Pocho", zona: "noroeste" },
  { name: "Salsacate", zona: "noroeste" },
  { name: "San Carlos Minas", zona: "noroeste" },
  { name: "San Marcos Sierras", zona: "noroeste" },
  { name: "Tala Cañada", zona: "noroeste" },
  { name: "Taninga", zona: "noroeste" },
  { name: "Villa de Soto", zona: "noroeste" },
] as const;

export type Localidad = (typeof localidadesTraslasierra)[number]["name"];

/** Costo orientativo para coordinar. 0 si todavia no hay referencia. */
export function shippingCostForLocality(name: string): number {
  const l = localidadesTraslasierra.find((x) => x.name === name);
  return l?.cost ?? 0;
}

/** Agrupadas por zona, para armar el desplegable con separadores. */
export function localidadesPorZona() {
  return {
    valle: localidadesTraslasierra.filter((l) => l.zona === "valle"),
    noroeste: localidadesTraslasierra.filter((l) => l.zona === "noroeste"),
  };
}
