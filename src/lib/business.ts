export const business = {
  name: "Sanitarios Conesa Traslasierra",
  shortName: "Sanitarios Conesa",
  tagline: "Sanitarios · Grifería · Materiales para la construcción",
  address: {
    street: "Av. Belgrano 758",
    city: "Villa Cura Brochero",
    province: "Córdoba",
    country: "Argentina",
    postalCode: "X5891",
  },
  phone: {
    display: "03544 40-0979",
    international: "+54 3544 40-0979",
  },
  whatsapp: {
    display: "+54 9 3544 43-0522",
    number: "5493544430522",
  },
  email: "sanitariosconesatraslasierra@gmail.com",
  hours: {
    weekdays: "Lunes a Viernes · 8:30 a 17:00",
    saturday: "Sábados · 9:00 a 14:00",
    sunday: "Domingos cerrado",
  },
  social: {
    instagram: {
      handle: "@sanitariosconesatraslasierra",
      url: "https://www.instagram.com/sanitariosconesatraslasierra/",
      followers: "14,1k",
    },
    facebook: {
      url: "https://www.facebook.com/sanitariosconesatraslasierra/",
    },
    tiktok: {
      handle: "@sanitarios.conesa",
      url: "https://www.tiktok.com/@sanitarios.conesa",
    },
  },
  // slug: cat= filter que se usa en /tienda?cat=<slug> para linkear al catalogo
  categories: [
    { name: "Sanitarios", slug: "sanitarios", description: "Inodoros, bidets, lavatorios, mingitorios" },
    { name: "Grifería", slug: "griferia", description: "Piazza, Hydros y más marcas" },
    { name: "Equipamiento de baño", slug: "banera", description: "Vanitorys, espejos, accesorios" },
    { name: "Salamandras", slug: "salamandras", description: "Calefactores a leña para tu hogar" },
    { name: "Materiales de obra", slug: "materiales", description: "Caños, uniones, accesorios de instalación" },
    { name: "Accesorios", slug: "accesorios", description: "Grifos, flexibles, repuestos" },
  ],
  // Las marcas viven en src/lib/marcas.ts: ahi van el logo, los alias para
  // detectarlas en los titulos y el slug que se guarda en Product.brand.
  brand: {
    red: "#E63020",
    black: "#111111",
    white: "#FFFFFF",
  },
} as const;

export function whatsappLink(message?: string) {
  const base = `https://api.whatsapp.com/send?phone=${business.whatsapp.number}`;
  if (!message) return `${base}&text=${encodeURIComponent("Hola! Vi su web y quería consultar por...")}`;
  return `${base}&text=${encodeURIComponent(message)}`;
}
