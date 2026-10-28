import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import Script from "next/script";
import { Header } from "@/components/Header";
import { Analytics } from "@/components/Analytics";
import { CuotasStrip } from "@/components/CuotasStrip";
import { Footer } from "@/components/Footer";
import { FooterGate } from "@/components/FooterGate";
import { CartProvider } from "@/components/CartProvider";
import { CartFab } from "@/components/CartFab";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { BackToTop } from "@/components/BackToTop";
import { business } from "@/lib/business";
import { redirect } from "next/navigation";
import { subdominioActual, contactoActual, tiendaSinHabilitar } from "@/lib/sucursal";
import { datosEstructurados } from "@/lib/datos-estructurados";
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
      "Sanitarios Conesa · Sanitarios, grifería y materiales en Buenos Aires y Traslasierra",
    template: "%s · Sanitarios Conesa",
  },
  description:
    "Comprá online sanitarios, grifería, bañeras, salamandras, calefones y materiales de construcción. Las mejores marcas (FV, Piazza, Hydros, Johnson). Dos locales: Balvanera, Ciudad de Buenos Aires y Villa Cura Brochero, Córdoba. Retiro en el local o envío a coordinar.",
  keywords: [
    "sanitarios conesa",
    "sanitarios villa cura brochero",
    "sanitarios traslasierra",
    "sanitarios cordoba",
    "corralón traslasierra",
    "materiales de construcción cura brochero",
    "sanitarios balvanera",
    "sanitarios capital federal",
    "sanitarios caba",
    "sanitarios buenos aires",
    "sanitarios gran buenos aires",
    "corralón balvanera",
    "materiales de construcción caba",
    "grifería capital federal",
    "sanitarios once",
    "sanitarios almagro",
    "sanitarios congreso",
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
      "Sanitarios Conesa · Tienda online de sanitarios y materiales",
    description:
      "Ofertas en sanitarios, grifería, salamandras y materiales. Dos locales: Buenos Aires y Traslasierra. Retiro en el local o envío a coordinar.",
    url: SITE_URL,
    siteName: business.name,
    locale: "es_AR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Sanitarios Conesa · Tienda online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sanitarios Conesa · Tienda online",
    description:
      "Sanitarios, grifería y materiales. Locales en Villa Cura Brochero y Balvanera.",
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
// La ficha para Google ya no se escribe aca: se arma desde la base, con la
// marca y las dos sucursales, en src/lib/datos-estructurados.ts. La version
// que estaba aca describia un solo local, con la direccion y el horario de
// Traslasierra escritos a mano.

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Una tienda que todavia no esta habilitada no atiende: el que llega a
  // su subdominio va a la pagina general. El local igual se publica ahi,
  // con su direccion, su telefono y su WhatsApp.
  //
  // Va aca y no en cada pagina para que no quede ningun camino abierto:
  // el carrito, el checkout y el pago cuelgan de este mismo layout.
  if (await tiendaSinHabilitar()) redirect("https://conesa.com.ar");

  // null en conesa.com.ar: ahi se publican las dos sucursales.
  const ficha = await datosEstructurados(await subdominioActual());
  const contacto = await contactoActual();

  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {ficha && (
          <Script
            id="ld-store"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(ficha) }}
          />
        )}
        <CartProvider>
          <CuotasStrip />
          <Header />
          {children}
          <FooterGate>
            <Footer />
          </FooterGate>
          <FloatingWhatsApp href={contacto.linkWhatsapp()} />
          <BackToTop />
          <CartFab />
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
