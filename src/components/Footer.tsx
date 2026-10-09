import Link from "next/link";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  ArrowRight,
  Undo2,
} from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { DataFiscal } from "@/components/DataFiscal";
import { SocialIcon, InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/SocialIcons";
import { business, whatsappLink } from "@/lib/business";
import { legales } from "@/lib/legales";

// Pie del sitio. Vive aparte y se monta en el layout porque los links
// legales (arrepentimiento, terminos) y el QR de Data Fiscal tienen que
// estar en todas las pantallas, no solo en el inicio.

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1fr_1.2fr]">
          {/* Marca + redes */}
          <div>
            <ConesaLogo
              variant="horizontal"
              className="h-10 w-auto mix-blend-multiply sm:h-12"
            />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Sanitarios, grifería y materiales en Villa Cura Brochero.
              Al servicio del Valle de Traslasierra.
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

          {/* Contacto */}
          <div>
            <div className="font-display text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-red)]">
              Contacto
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                <a
                  href={`tel:${business.phone.international.replace(/\s/g, "")}`}
                  className="text-foreground hover:text-[var(--brand-red)]"
                >
                  {business.phone.display}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground hover:text-[var(--brand-red)]"
                >
                  {business.whatsapp.display}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                <a
                  href={`mailto:${business.email}`}
                  className="break-all text-foreground hover:text-[var(--brand-red)]"
                >
                  {business.email}
                </a>
              </li>
              <li className="flex items-start gap-2 pt-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
                <div className="text-xs text-[var(--muted)]">
                  {business.hours.weekdays}
                  <br />
                  {business.hours.saturday}
                  <br />
                  {business.hours.sunday}
                </div>
              </li>
            </ul>
          </div>

          {/* Ubicación */}
          <div>
            <div className="font-display text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-red)]">
              Dónde estamos
            </div>
            <div className="mt-4 flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" />
              <div>
                <div className="font-semibold text-foreground">
                  {business.address.street}
                </div>
                <div className="text-xs text-[var(--muted)]">
                  {business.address.city}, {business.address.province}
                  <br />
                  CP {business.address.postalCode}
                </div>
              </div>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <iframe
                src="https://maps.google.com/maps?q=Av+Belgrano+758+Villa+Cura+Brochero+Cordoba&hl=es&z=15&output=embed"
                width="100%"
                height="180"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación de Sanitarios Conesa"
                className="block"
              />
            </div>
            <a
              href="https://maps.google.com/?q=Av+Belgrano+758+Villa+Cura+Brochero+Cordoba"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--brand-red)] hover:gap-2"
            >
              Cómo llegar <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>

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
            {(legales.razonSocial || legales.cuit) && (
              <p className="mt-3 text-xs text-[var(--muted)]">
                {legales.razonSocial}
                {legales.razonSocial && legales.cuit && " · "}
                {legales.cuit && <>CUIT {legales.cuit}</>}
              </p>
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
