import Link from "next/link";
import { Undo2 } from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { DataFiscal } from "@/components/DataFiscal";
import { SocialIcon, InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/SocialIcons";
import { business, whatsappLink } from "@/lib/business";
import { getLegales, titularesDeLasSucursales, sucursalesParaElPie } from "@/lib/legales";
import { SucursalEnPie } from "@/components/SucursalEnPie";
import { subdominioActual } from "@/lib/sucursal";

// Pie del sitio. Vive aparte y se monta en el layout porque los links
// legales (arrepentimiento, terminos) y el QR de Data Fiscal tienen que
// estar en todas las pantallas, no solo en el inicio.

export async function Footer() {
  const legales = await getLegales();
  // En conesa.com.ar no hay una sola razon social: son dos contribuyentes y
  // los dos venden. En el subdominio de cada tienda va la suya sola.
  const sub = await subdominioActual();
  const titulares = sub ? [] : await titularesDeLasSucursales();
  // En la pagina general van los datos de las dos; en cada tienda, los suyos.
  const sucursales = await sucursalesParaElPie(sub);
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr]">
          {/* Marca + redes */}
          <div>
            <ConesaLogo
              variant="horizontal"
              className="h-10 w-auto mix-blend-multiply sm:h-12"
            />
            {/* Decia "en Villa Cura Brochero, al servicio del Valle de
                Traslasierra". En la pagina general eso deja a Capital
                afuera; los dos locales se nombran abajo, cada uno con lo
                suyo. */}
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Sanitarios, grifería y materiales para la construcción.
              {" "}
              {sucursales.length > 1
                ? "Dos locales: Traslasierra y Buenos Aires."
                : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <SocialIcon href={business.social.instagram.url} icon={InstagramIcon} label="Instagram" />
              <SocialIcon href={business.social.facebook.url} icon={FacebookIcon} label="Facebook" />
              <SocialIcon href={business.social.tiktok.url} icon={TikTokIcon} label="TikTok" />
              <SocialIcon href={whatsappLink()} icon={WhatsAppIcon} label="WhatsApp" external />
            </div>
          </div>

          {/* Tienda */}
          <div>
            <div className="font-display text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-red)]">
              Tienda
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li><Link href="/tienda" className="text-foreground hover:text-[var(--brand-red)]">Catálogo completo</Link></li>
              <li><Link href="/tienda?cat=sanitarios" className="text-[var(--muted)] hover:text-[var(--brand-red)]">Sanitarios</Link></li>
              <li><Link href="/tienda?cat=griferia" className="text-[var(--muted)] hover:text-[var(--brand-red)]">Grifería</Link></li>
              <li><Link href="/tienda?cat=banera" className="text-[var(--muted)] hover:text-[var(--brand-red)]">Bañeras</Link></li>
              <li><Link href="/tienda?cat=salamandras" className="text-[var(--muted)] hover:text-[var(--brand-red)]">Salamandras</Link></li>
              <li><Link href="/tienda/carrito" className="text-[var(--muted)] hover:text-[var(--brand-red)]">Mi carrito</Link></li>
            </ul>
          </div>

        </div>

        {/* Cada local con lo suyo: direccion, telefono, WhatsApp, mail,
            horarios y mapa. En conesa.com.ar van los dos, uno al lado del
            otro; en el subdominio de una tienda va solo el de ella. */}
        {sucursales.length > 0 && (
          <div className="mt-12 grid gap-10 border-t border-[var(--border)] pt-10 sm:grid-cols-2">
            {sucursales.map((s) => (
              <SucursalEnPie
                key={s.slug}
                sucursal={s}
                conTitulo={sucursales.length > 1}
              />
            ))}
          </div>
        )}

        {/* LEGALES: el boton de arrepentimiento tiene que estar visible en
            el inicio (Res. 424/2020) y el QR de Data Fiscal es obligatorio
            para quien vende por internet. */}
        <div className="mt-12 flex flex-col items-center gap-6 border-t border-[var(--border)] pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium sm:justify-start">
              <Link href="/arrepentimiento" className="inline-flex items-center gap-1.5 font-bold text-[var(--brand-red)] hover:underline">
                <Undo2 className="h-3.5 w-3.5" />
                Botón de arrepentimiento
              </Link>
              <Link href="/legales" className="text-[var(--muted)] hover:text-[var(--brand-red)]">
                Términos y condiciones
              </Link>
              <a
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--muted)] hover:text-[var(--brand-red)]"
              >
                Defensa del Consumidor
              </a>
            </div>
            {titulares.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                {titulares.map((t) => (
                  <p key={t.cuit ?? t.name}>
                    <span className="font-semibold">{t.name}:</span>{" "}
                    {t.razonSocial}
                    {t.razonSocial && t.cuit && " · "}
                    {t.cuit && <>CUIT {t.cuit}</>}
                  </p>
                ))}
              </div>
            ) : (
              (legales.razonSocial || legales.cuit) && (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  {legales.razonSocial}
                  {legales.razonSocial && legales.cuit && " · "}
                  {legales.cuit && <>CUIT {legales.cuit}</>}
                </p>
              )
            )}
          </div>
          <DataFiscal className="shrink-0" />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--muted)] sm:flex-row sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} {business.name}. Todos los derechos reservados.
          </p>
          <div className="flex items-center justify-center gap-4 sm:justify-end">
            <span>Hecho con ❤ en Traslasierra</span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1 text-[var(--muted)]/60 hover:text-[var(--brand-red)]"
              aria-label="Panel de administración"
            >
              🔒 Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
