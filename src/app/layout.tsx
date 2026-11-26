import { TIENDA_URL } from "@/lib/dominio";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Header } from "@/components/Header";
import { Analytics } from "@/components/Analytics";
import { esDeLosNuestros } from "@/lib/miradas";
import { jsonLd } from "@/lib/seo";
import { CuotasStrip } from "@/components/CuotasStrip";
import { Footer } from "@/components/Footer";
import { FooterGate } from "@/components/FooterGate";
import { CartProvider } from "@/components/CartProvider";
import { CartFab } from "@/components/CartFab";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { BackToTop } from "@/components/BackToTop";
import { business } from "@/lib/business";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  subdominioActual,
  contactoActual,
  contactoDeLaVenta,
  tiendaSinHabilitar,
  hayTiendaAbierta,
} from "@/lib/sucursal";
import { datosEstructurados } from "@/lib/datos-estructurados";
import "./globals.css";

// Las letras van con el proyecto (src/app/fuentes, licencia SIL OFL 1.1 en los
// OFL-*.txt). Antes las bajaba next/font/google en cada compilacion y Google
// a veces le cortaba a GitHub ("queries have exactly one entry", Montserrat):
// la publicacion fallaba sola, unas diez veces. Damian, 26/11/2026: "eso ya
// paso como 10 veces porque pasa?" -> "Si, pasala". Son los mismos archivos
// que servia Google (woff2, juego "latin": con ñ y tildes; variables, todos
// los pesos), bajados de fonts.gstatic.com.
const inter = localFont({
  src: "./fuentes/inter-latin.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 900",
});

const montserrat = localFont({
  src: "./fuentes/montserrat-latin.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400 900",
});

// La direccion oficial: la que va en Google y en los links que se
// comparten. Ver src/lib/dominio.ts.
const SITE_URL = TIENDA_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      "Sanitarios Conesa · Sanitarios, grifería y materiales en Buenos Aires y Traslasierra",
    template: "%s · Sanitarios Conesa",
  },
  description:
    "Comprá online sanitarios, grifería, bañeras, salamandras, calefones y materiales de construcción. Las mejores marcas (FV, Piazza, Hydros, Johnson). Dos locales: Balvanera, Ciudad de Buenos Aires y Villa Cura Brochero, Córdoba. Tienda online con envío a AMBA, gratis desde $100.000, o retiro en la sucursal Buenos Aires.",
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
  // telephone en false: el iPhone tomaba el CUIT del pie (30-71132164-7)
  // como un telefono, lo subrayaba y al tocarlo llamaba. Los telefonos de
  // verdad del sitio ya son links tel: (cabecera, sucursales, pie), asi que
  // no se pierde nada (Damian, 16/11/2026: "se ve desordenado").
  formatDetection: {
    email: true,
    address: true,
    telephone: false,
  },
  // Sin `alternates.canonical` aca: lo heredaban TODAS las paginas, y cada
  // producto le decia a Google "soy la portada". Cada pagina pone la suya
  // (src/lib/seo.ts).
  openGraph: {
    title:
      "Sanitarios Conesa · Tienda online de sanitarios y materiales",
    description:
      "Ofertas en sanitarios, grifería, salamandras y materiales. Dos locales: Buenos Aires y Traslasierra. Envío a AMBA o retiro en la sucursal Buenos Aires.",
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
  //
  // El PANEL de esa sucursal es la excepcion: ahi se cargan justamente los
  // productos y los precios que faltan para poder abrirla. Si tambien lo
  // mandaramos a la pagina general, la tienda cerrada no se podria preparar
  // nunca. La ruta la deja el middleware en una cabecera, porque un layout
  // no tiene otra forma de saber que le pidieron.
  const ruta = (await headers()).get("x-ruta") ?? "";
  if (!ruta.startsWith("/admin") && (await tiendaSinHabilitar()))
    redirect(TIENDA_URL);

  // Con NINGUNA tienda abierta no se puede comprar en ningun lado. Las
  // pantallas de la tienda mandan a la portada, que en ese caso ofrece
  // WhatsApp. Sin esto quedaba el catalogo vacio en pie y, peor, un checkout
  // que podia armar un pedido a nombre de la sucursal que no vende.
  //
  // Va a una ruta relativa y solo para /tienda. Mandar el sitio entero a la
  // portada seria un bucle: la portada tambien pasa por este layout.
  //
  // Las tres pantallas de vuelta de MercadoPago quedan abiertas a proposito:
  // ahi cae alguien que YA pago, y mandarlo a la portada seria dejarlo sin
  // el aviso de que su compra entro.
  const vueltaDePago =
    ruta.startsWith("/tienda/checkout/exito") ||
    ruta.startsWith("/tienda/checkout/pendiente") ||
    ruta.startsWith("/tienda/checkout/error");
  if (ruta.startsWith("/tienda") && !vueltaDePago && !(await hayTiendaAbierta()))
    redirect("/");

  // null en conesa.com.ar: ahi se publican las dos sucursales.
  const ficha = await datosEstructurados(await subdominioActual());
  // Adentro de la tienda, el WhatsApp del local que VENDE: una consulta por
  // un producto tiene que entrarle a quien lo tiene y lo factura. Afuera, el
  // que se muestra en la pagina general.
  const enLaTienda = ruta.startsWith("/tienda");
  const contacto = enLaTienda
    ? await contactoDeLaVenta()
    : await contactoActual();

  // Analytics y el pixel solo para los clientes: ni en el panel ni cuando
  // mira la tienda alguien de Conesa. Damian, 19/11/2026: "en lo que es el
  // panel de productos no cuentes ahi porque somos nosotros"
  // (src/lib/miradas.ts).
  const medir =
    !ruta.startsWith("/admin") && !ruta.startsWith("/sistema") && !(await esDeLosNuestros());

  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {ficha && (
          // Va en el HTML que llega, no agregado despues por JavaScript: asi
          // Google la lee siempre, sin tener que ejecutar la pagina.
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLd(ficha) }}
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
        {medir && <Analytics />}
      </body>
    </html>
  );
}
