import type { Metadata, Viewport } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://conesa.com.ar"),
  title: {
    default: "Sanitarios Conesa Traslasierra · Próximamente",
    template: "%s · Sanitarios Conesa Traslasierra",
  },
  description:
    "Tu tienda de sanitarios, grifería, salamandras y materiales de construcción en Villa Cura Brochero, Traslasierra. Pronto podrás comprar online.",
  keywords: [
    "sanitarios",
    "griferia",
    "piazza",
    "hydros",
    "salamandras",
    "villa cura brochero",
    "traslasierra",
    "cordoba",
    "corralon",
    "materiales construccion",
  ],
  authors: [{ name: "Sanitarios Conesa Traslasierra" }],
  openGraph: {
    title: "Sanitarios Conesa Traslasierra",
    description:
      "Sanitarios, grifería, salamandras y materiales de construcción en Villa Cura Brochero. Pronto online.",
    url: "https://conesa.com.ar",
    siteName: "Sanitarios Conesa Traslasierra",
    locale: "es_AR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-AR"
      className={`${inter.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
