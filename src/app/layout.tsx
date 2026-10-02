import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/Header";
import { CartProvider } from "@/components/CartProvider";
import { CartFab } from "@/components/CartFab";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { business } from "@/lib/business";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const montserrat = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const SITE_URL = "https://conesa.com.ar";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Sanitarios Conesa Traslasierra · Tienda online de sanitarios, grifería y materiales en Villa Cura Brochero",
    template: "%s · Sanitarios Conesa Traslasierra",
  },
  description:
    "Comprá online sanitarios, grifería, bañeras, salamandras, calefones y materiales de construcción. Más de 790 productos de las mejores marcas (FV, Piazza, Hydros, Johnson). Envío a todo el Valle de Traslasierra o retiro en Villa Cura Brochero.",
  keywords: [
    "sanitarios conesa",
    "sanitarios villa cura brochero",
    "sanitarios traslasierra",
    "sanitarios cordoba",
    "corralón traslasierra",
    "materiales de construcción cura brochero",
    "grifería fv",
    "grifería piazza",
    "grifería hydros",
    "salamandras ñuke",
    "bañeras acrílicas",
    "calefones",
    "inodoros ferrum",
    "johnson acero",
    "mina clavero",
    "nono",
    "villa dolores",
    "san javier yacanto",
    "comprar sanitarios online argentina",
  ],
  authors: [{ name: business.name, url: SITE_URL }],
  creator: business.name,
  publisher: business.name,
  category: "shopping",
  classification: "Comercio minorista de sanitarios y materiales de construcción",
  applicationName: business.name,
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "es-AR": SITE_URL,
    },
  },
  openGraph: {
    title:
      "Sanitarios Conesa Traslasierra · Tienda online en Villa Cura Brochero",
    description:
      "Más de 790 productos de sanitarios, grifería, salamandras y materiales. Las mejores marcas con envío a todo Traslasierra o retiro en el local.",
    url: SITE_URL,
    siteName: business.name,
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sanitarios Conesa Traslasierra · Tienda online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanitarios Conesa Traslasierra · Tienda online",
    description:
      "Sanitarios, grifería y materiales en Villa Cura Brochero. Envíos a todo el Valle de Traslasierra.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    // Agregar aca cuando el usuario conecte Google Search Console:
    // google: "codigo-de-verificacion-GSC",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// JSON-LD global: LocalBusiness + Store + sameAs sociales
const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["Store", "LocalBusiness"],
  "@id": `${SITE_URL}/#store`,
  name: business.name,
  alternateName: business.shortName,
  description:
    "Tienda de sanitarios, grifería y materiales de construcción en Villa Cura Brochero, Traslasierra, Córdoba.",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  image: `${SITE_URL}/opengraph-image.png`,
  telephone: business.phone.international.replace(/\s/g, ""),
  email: business.email,
  priceRange: "$$",
  currenciesAccepted: "ARS",
  paymentAccepted: "Cash, Credit Card, Debit Card, Bank Transfer",
  address: {
    "@type": "PostalAddress",
    streetAddress: business.address.street,
    addressLocality: business.address.city,
    addressRegion: business.address.province,
    postalCode: business.address.postalCode,
    addressCountry: "AR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: -31.8431,
    longitude: -65.0206,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:30",
      closes: "17:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],
  areaServed: [
    { "@type": "City", name: "Villa Cura Brochero" },
    { "@type": "City", name: "Mina Clavero" },
    { "@type": "City", name: "Nono" },
    { "@type": "City", name: "Villa Dolores" },
    { "@type": "City", name: "San Javier" },
    { "@type": "AdministrativeArea", name: "Valle de Traslasierra, Córdoba" },
  ],
  sameAs: [
    business.social.instagram.url,
    business.social.facebook.url,
    business.social.tiktok.url,
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script
          id="ld-store"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CartProvider>
          <Header />
          {children}
          <FloatingWhatsApp />
          <CartFab />
        </CartProvider>
      </body>
    </html>
  );
}
