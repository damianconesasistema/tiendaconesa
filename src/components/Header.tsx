import Link from "next/link";
import { MapPin } from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { CartButton } from "@/components/CartButton";
import { business } from "@/lib/business";
import { contactosParaMostrar } from "@/lib/sucursal";
import { WhatsAppLink } from "@/components/WhatsAppLink";

// El telefono y el WhatsApp salen de las sucursales, no del codigo. Estaban
// fijos con los de Traslasierra, asi que un cliente de Buenos Aires le
// escribia a Cordoba.
//
// En la tienda de una sucursal va uno solo, el suyo. En conesa.com.ar van
// los dos, cada uno con el nombre del local adelante: esa pagina habla de
// los dos negocios y un numero solo, sin decir de cual es, manda al que
// entra desde Capital a marcar a Cordoba.
export async function Header() {
  const contactos = await contactosParaMostrar();
  const varios = contactos.length > 1;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/40 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:h-24 sm:px-6">
        <Link
          href="/"
          aria-label={business.name}
          className="flex items-center"
        >
          <ConesaLogo
            variant="horizontal"
            className="h-10 w-auto mix-blend-multiply sm:h-14"
            priority
          />
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/tienda"
            className="animate-titilate inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-red)] px-3 py-2 font-display text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/40 transition-all hover:scale-[1.03] hover:bg-[var(--brand-red-hover)] sm:px-5 sm:py-2.5 sm:text-sm"
          >
            ¡COMPRA AHORA!
          </Link>

          {varios ? (
            <>
              {/* Pantalla grande: cada local con su numero y su WhatsApp al
                  lado. El nombre va arriba del numero porque sin el los dos
                  telefonos son dos numeros cualquiera. */}
              <div className="hidden items-center gap-2 lg:flex">
                {contactos.map((c) => (
                  <div
                    key={c.slug}
                    className="flex items-center gap-2 rounded-full border border-[var(--border)] py-1 pl-3 pr-1"
                  >
                    <a
                      href={`tel:${c.telefonoLimpio}`}
                      className="flex flex-col leading-tight transition-colors hover:text-[var(--brand-red)]"
                    >
                      <span className="font-display text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                        {c.nombre}
                      </span>
                      <span className="font-display text-sm font-bold">
                        {c.telefono}
                      </span>
                    </a>
                    <WhatsAppLink
                      href={c.linkWhatsapp}
                      origen="header"
                      aria-label={`WhatsApp de ${c.nombre}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white transition-transform hover:scale-105"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                    </WhatsAppLink>
                  </div>
                ))}
              </div>

              {/* Pantalla mediana: no entran los numeros, pero si los dos
                  WhatsApp con el nombre del local. */}
              <div className="hidden items-center gap-2 md:flex lg:hidden">
                {contactos.map((c) => (
                  <WhatsAppLink
                    key={c.slug}
                    href={c.linkWhatsapp}
                    origen="header"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 font-display text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-[#1DA851]"
                  >
                    <WhatsAppIcon className="h-4 w-4" />
                    <span>{c.nombre}</span>
                  </WhatsAppLink>
                ))}
              </div>

              <CartButton />
            </>
          ) : (
            <>
              <a
                href={`tel:${contactos[0].telefonoLimpio}`}
                className="hidden items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-foreground transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] lg:inline-flex"
              >
                <MapPin className="h-4 w-4" />
                {contactos[0].telefono}
              </a>
              <CartButton />
              <WhatsAppLink
                href={contactos[0].linkWhatsapp}
                origen="header"
                className="hidden items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-display text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:scale-[1.02] hover:bg-[#1DA851] sm:inline-flex sm:px-5"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>WhatsApp</span>
              </WhatsAppLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
