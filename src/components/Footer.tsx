import Link from "next/link";
import { Undo2 } from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { DataFiscal } from "@/components/DataFiscal";
import { SocialIcon, InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/SocialIcons";
import { business } from "@/lib/business";
import { getLegales, titularesDeLasSucursales, sucursalesParaElPie } from "@/lib/legales";
import { SucursalEnPie } from "@/components/SucursalEnPie";
import { subdominioActual, contactoActual } from "@/lib/sucursal";

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
  const contacto = await contactoActual();
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] px-6 pb-32 pt-16 sm:pb-16">
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
              {/* Los nombres salen de la lista, asi respetan el orden
                  que esta puesto en el panel en vez de uno fijo aca. */}
              {sucursales.length > 1
                ? `${sucursales.length} locales: ${sucursales
                    .map((s) => s.name)
                    .join(" y ")}.`
                : ""}
            </p>
            <div className="mt-4 flex gap-2">
              <SocialIcon href={business.social.instagram.url} icon={InstagramIcon} label="Instagram" />
              <SocialIcon href={business.social.facebook.url} icon={FacebookIcon} label="Facebook" />
              <SocialIcon href={business.social.tiktok.url} icon={TikTokIcon} label="TikTok" />
              <SocialIcon href={contacto.linkWhatsapp()} icon={WhatsAppIcon} label="WhatsApp" external />
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
            para quien vende por internet.
            En el celular iba todo en renglones corridos y quedaba
            desordenado: dos links en una linea y el tercero abajo, y el CUIT
            cortado a la mitad ("30-" / "71132164-7"). Ahora los links van
            uno abajo del otro y cada titular en su bloque: sucursal, razon
            social y CUIT, sin cortar el numero (Damian, 16/11/2026). */}
        <div className="mt-12 flex flex-col items-center gap-8 border-t border-[var(--border)] pt-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full text-center sm:w-auto sm:text-left">
            <div className="flex flex-col items-center gap-3 text-sm font-medium sm:flex-row sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:text-xs">
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
              <div className="mt-6 grid gap-4 text-xs text-[var(--muted)] sm:grid-cols-2 sm:gap-8">
                {titulares.map((t) => (
                  <div key={t.cuit ?? t.name} className="space-y-0.5">
                    <p className="font-display text-[11px] font-bold uppercase tracking-wider text-foreground">
                      {t.name}
                    </p>
                    {t.razonSocial && <p>{t.razonSocial}</p>}
                    {t.cuit && <p className="whitespace-nowrap">CUIT {t.cuit}</p>}
                  </div>
                ))}
              </div>
            ) : (
              (legales.razonSocial || legales.cuit) && (
                <div className="mt-6 space-y-0.5 text-xs text-[var(--muted)]">
                  {legales.razonSocial && <p>{legales.razonSocial}</p>}
                  {legales.cuit && <p className="whitespace-nowrap">CUIT {legales.cuit}</p>}
                </div>
              )
            )}
          </div>
          <DataFiscal className="shrink-0" />
        </div>

        {/* sm:pr-20: en la compu los botones flotantes (WhatsApp y volver
            arriba) van en columna sobre el borde derecho y tapaban "Admin".
            En el celular el renglon va centrado y lo resuelve el pb-32. */}
        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-center text-xs text-[var(--muted)] sm:flex-row sm:justify-between sm:pr-20 sm:text-left">
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
