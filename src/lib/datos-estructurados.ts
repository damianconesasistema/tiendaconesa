import { prisma } from "@/lib/db";
import { business } from "@/lib/business";

// La ficha que leen Google y las redes (schema.org).
//
// Antes describia UN local, con una direccion, un horario y un punto en el
// mapa, escritos en el codigo. Con dos sucursales eso esta mal modelado: para
// Google el negocio es una marca con dos locales adentro, cada uno con su
// domicilio, sus horarios y su zona. Mal armado, alguien de Capital busca
// "sanitarios" y le aparece un pueblo de Cordoba a 800 km.
//
// Se arma desde la base, no escrito aca, por lo mismo de siempre: si una
// direccion se corrige en el panel tiene que cambiar en todos lados.
//
// En el subdominio de una sucursal se publica solo esa: la tienda de
// Balvanera no tiene por que decir que atiende en Villa Cura Brochero.

const SITIO = "https://conesa.com.ar";

function local(s: {
  slug: string;
  subdominio: string | null;
  name: string;
  address: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  lat: number | null;
  lng: number | null;
  instagram: string | null;
}) {
  const url = s.subdominio ? `https://${s.subdominio}.conesa.com.ar` : SITIO;

  return {
    "@type": ["Store", "LocalBusiness"],
    "@id": `${SITIO}/#${s.slug}`,
    name: `${business.name} ${s.name}`,
    parentOrganization: { "@id": `${SITIO}/#marca` },
    url,
    ...(s.phone ? { telephone: s.phone.replace(/[^\d+]/g, "") } : {}),
    ...(s.email ? { email: s.email } : {}),
    priceRange: "$$",
    currenciesAccepted: "ARS",
    paymentAccepted: "Cash, Credit Card, Debit Card, Bank Transfer",
    ...(s.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: s.address,
            addressLocality: s.city ?? undefined,
            addressRegion: s.province ?? undefined,
            postalCode: s.postalCode ?? undefined,
            addressCountry: "AR",
          },
        }
      : {}),
    // Solo si se saben de verdad. Un punto inventado manda al cliente a otra
    // cuadra, y eso es peor que no tener punto.
    ...(s.lat != null && s.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: s.lat, longitude: s.lng } }
      : {}),
    ...(s.instagram ? { sameAs: [s.instagram] } : {}),
  };
}

export async function datosEstructurados(subdominio: string | null) {
  let sucursales: Awaited<ReturnType<typeof prisma.branch.findMany>> = [];
  try {
    sucursales = await prisma.branch.findMany({
      where: { active: true },
      orderBy: { orden: "asc" },
    });
  } catch {
    // Sin base no se publica ficha. Es preferible a publicar una incompleta:
    // Google se queda con lo que ve y despues cuesta corregirlo.
    return null;
  }

  const propia = subdominio
    ? sucursales.find((s) => s.subdominio === subdominio)
    : undefined;
  const aPublicar = propia ? [propia] : sucursales;
  if (aPublicar.length === 0) return null;

  const marca = {
    "@type": "Organization",
    "@id": `${SITIO}/#marca`,
    name: business.name,
    url: SITIO,
    logo: `${SITIO}/icon.png`,
    foundingDate: String(business.desde),
    description:
      `Venta de sanitarios, griferia y materiales para la construccion desde ` +
      `${business.desde}. Dos locales: Villa Cura Brochero (Cordoba) y ` +
      `Balvanera (Ciudad Autonoma de Buenos Aires).`,
    sameAs: [
      business.social.instagram.url,
      business.social.facebook.url,
      business.social.tiktok.url,
    ],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [marca, ...aPublicar.map(local)],
  };
}

