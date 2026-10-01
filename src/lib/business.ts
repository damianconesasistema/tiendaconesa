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
    { name: "Lekons", logo: "/brand/marcas/lekons.png" },
    { name: "Masecor", logo: "/brand/marcas/masecor.webp" },
    { name: "Precons", logo: "/brand/marcas/precons.png", invert: true },
    { name: "ROT-AR", logo: "/brand/marcas/rot-ar.png" },
    { name: "Acindar", logo: "/brand/marcas/acindar.webp" },
    { name: "Tromen", logo: "/brand/marcas/tromen.png" },
    { name: "Fusiogas", logo: "/brand/marcas/fusiogas.jpg" },
    { name: "Awaduct", logo: "/brand/marcas/awaduct.jpg" },
    { name: "Saladillo", logo: "/brand/marcas/saladillo.png" },
    { name: "Grupo DEMA", logo: "/brand/marcas/dema.jpg" },
    { name: "Redeco", logo: "/brand/marcas/redeco.avif" },
    { name: "Heineken", logo: "/brand/marcas/heineken.jpg", scale: 1.6 },
  ],
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
