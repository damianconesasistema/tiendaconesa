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
    whatsappNumber: "543544400979",
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
      url: "https://www.tiktok.com/@sanitariosconesatraslasierra",
    },
  },
  categories: [
    { name: "Sanitarios", description: "Inodoros, bidets, lavatorios, mingitorios" },
    { name: "Grifería", description: "Piazza, Hydros y más marcas" },
    { name: "Equipamiento de baño", description: "Vanitorys, espejos, accesorios" },
    { name: "Salamandras", description: "Calefactores a leña para tu hogar" },
    { name: "Materiales de obra", description: "Caños, uniones, accesorios de instalación" },
    { name: "Accesorios", description: "Grifos, flexibles, repuestos" },
  ],
  brands: [
    { name: "Ferrum", logo: "/brand/marcas/ferrum.png" },
    { name: "FV", logo: "/brand/marcas/fv.png", invert: true },
    { name: "Piazza", logo: "/brand/marcas/piazza.png" },
    { name: "Hydros", logo: "/brand/marcas/hydros.png" },
    { name: "Flowater", logo: "/brand/marcas/flowater.png" },
    { name: "TST", logo: "/brand/marcas/tst.png", invert: true },
    { name: "Pringles", logo: "/brand/marcas/pringles.jpg" },
    { name: "Bosca", logo: "/brand/marcas/bosca.png" },
    { name: "Gulliart", logo: "/brand/marcas/gulliart.png", invert: true },
    { name: "Masecor", logo: "/brand/marcas/masecor.webp" },
    { name: "Precons", logo: "/brand/marcas/precons.png" },
    { name: "ROT-AR" },
  ],
  brand: {
    red: "#E63020",
    black: "#111111",
    white: "#FFFFFF",
  },
} as const;

export function whatsappLink(message?: string) {
  const base = `https://api.whatsapp.com/send?phone=${business.phone.whatsappNumber}`;
  if (!message) return `${base}&text=${encodeURIComponent("Hola! Vi su web y quería consultar por...")}`;
  return `${base}&text=${encodeURIComponent(message)}`;
}
