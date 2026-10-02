// Localidades a las que hacemos envio en el Valle de Traslasierra.
// Agregar o quitar segun crezca el radio.
export const localidadesTraslasierra = [
  "Villa Cura Brochero",
  "Mina Clavero",
  "Nono",
  "Las Rabonas",
  "Villa Dolores",
  "San Javier",
  "Yacanto",
  "Los Hornillos",
  "Las Calles",
  "La Población",
  "Panaholma",
  "La Paz",
  "Luyaba",
  "Villa de Las Rosas",
  "San Pedro",
  "Los Molles",
  "Las Tapias",
] as const;

export type Localidad = (typeof localidadesTraslasierra)[number];
