import Link from "next/link";
import Image from "next/image";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TikTokFeed } from "@/components/TikTokFeed";
import { TikTokCollage } from "@/components/TikTokCollage";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { CuotasBanner } from "@/components/CuotasBanner";
import { prisma } from "@/lib/db";
import { getMarcasConLogo } from "@/lib/marcas-server";
import { legales } from "@/lib/legales";
import { DataFiscal } from "@/components/DataFiscal";

// En runtime hay DB (Railway). En build no la tenemos → forzar dynamic
export const dynamic = "force-dynamic";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  ShowerHead,
  Droplets,
  Bath,
  Flame,
  Hammer,
  Wrench,
  ArrowRight,
  Undo2,
} from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { business, whatsappLink } from "@/lib/business";

function SocialIcon({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised,white)] text-[var(--muted)] transition-all hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.6 6.3c-1.7-.3-3-1.6-3.3-3.3h-3v12.4c0 1.5-1.2 2.6-2.6 2.6s-2.7-1.2-2.7-2.6c0-1.5 1.2-2.7 2.7-2.7.3 0 .5 0 .8.1V9.7c-.3 0-.5-.1-.8-.1-3.1 0-5.6 2.5-5.6 5.6s2.5 5.6 5.6 5.6 5.6-2.5 5.6-5.6V9.3c1.2.9 2.7 1.4 4.3 1.4V7.7c-.3 0-.7 0-1-.1z"/>
    </svg>
  );
}

const categoryIcons = [
  ShowerHead,
  Droplets,
  Bath,
  Flame,
  Hammer,
  Wrench,
] as const;

export default async function Home() {
  const [recargos, planes, marcasConLogo] = await Promise.all([
    getRecargosMp(),
    getPlanesCuotas(),
    getMarcasConLogo(),
  ]);
  const cuotasMax = planes.length ? planes[planes.length - 1].cuotas : 0;
  // Descuento REAL del contado respecto del precio de vitrina. Se calcula,
  // no se asume: con 11,11% de recargo el descuento es 10%, no 11,11%.
  const dctoContadoPct = Math.round(
    (1 - 1 / (1 + recargos.unPago / 100)) * 100,
  );
  // Ofertas: productos con salePrice < price
  const onSale = await prisma.product.findMany({
    where: {
      active: true,
      salePrice: { not: null },
      itemId: { not: "__RESET_PRICES_MARKER__" },
    },
    select: {
      itemId: true,
      title: true,
      price: true,
      salePrice: true,
      category: true,
      imageUrl: true,
      stock: true,
    },
    orderBy: [{ featured: "desc" }, { title: "asc" }],
    take: 8,
  });

  // Destacados: primero los que el admin marco featured, sino rellenar
  let featured = await prisma.product.findMany({
    where: {
      featured: true,
      active: true,
      salePrice: null, // excluir los que ya están en ofertas
      itemId: { not: "__RESET_PRICES_MARKER__" },
    },
    select: {
      itemId: true,
      title: true,
      price: true,
      salePrice: true,
      category: true,
      imageUrl: true,
      stock: true,
    },
    take: 8,
    orderBy: { title: "asc" },
  });

  if (featured.length < 8) {
    const extras = await prisma.product.findMany({
      where: {
        active: true,
        featured: false,
        salePrice: null,
        itemId: { not: "__RESET_PRICES_MARKER__" },
      },
      select: {
        itemId: true,
        title: true,
        price: true,
        salePrice: true,
        category: true,
        imageUrl: true,
        stock: true,
      },
      take: 8 - featured.length,
      orderBy: { title: "asc" },
    });
    featured = [...featured, ...extras];
  }

  return (
    <main className="relative flex-1">


      {/* HERO */}
      <HeroCarousel />

      {/* FINANCIACIÓN: apenas termina el hero, es el primer gancho */}
      <CuotasBanner cuotasMax={cuotasMax} dctoContadoPct={dctoContadoPct} />

      {/* STATS */}
      <section className="border-b border-[var(--border)] bg-white px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-6 sm:gap-16">
          <Stat value="14k+" label="En Instagram" />
          <Stat value="20+" label="Marcas" />
          <Stat value="24/7" label="Comprá cuando quieras" sub="la tienda online nunca cierra" />
        </div>
      </section>

      {/* MARCAS */}
      <section className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-center justify-center text-center">
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Marcas destacadas
            </span>
            <h2 className="mt-3 font-display text-2xl font-black uppercase leading-tight sm:text-3xl">
              Trabajamos con las mejores
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Tocá una marca para ver todos sus productos.
            </p>
          </div>
          {/* Caja de alto fijo y logo con el mismo techo para todas: los logos
              vienen con margenes y proporciones distintas, y si los dejamos
              crecer libre cada uno pesa distinto y la grilla se ve despareja. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {marcasConLogo.map((marca) => (
              <Link
                key={marca.id}
                href={`/tienda?marca=${marca.id}`}
                title={`Ver productos ${marca.name}`}
                className="group flex h-28 items-center justify-center rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-[var(--border)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-[var(--brand-red)]"
              >
                <Image
                  src={marca.logo!}
                  alt={marca.name}
                  unoptimized={!marca.logo!.startsWith("/")}
                  width={200}
                  height={80}
                  className={`w-auto max-w-full object-contain transition-all group-hover:scale-105 ${
                    marca.grande ? "max-h-20" : "max-h-16"
                  } ${
                    marca.invert ? "brightness-0" : ""
                  }`}
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTAS (solo si hay) */}
      {onSale.length > 0 && (
        <FeaturedProducts comisionUnPago={recargos.unPago}
          featured={onSale}
          variant="offers"
          eyebrow="Ofertas vigentes"
          title="En oferta ahora"
          cta="Ver todas las ofertas"
          ctaHref="/tienda?filter=on-sale"
        />
      )}

      {/* DESTACADOS */}
      <FeaturedProducts comisionUnPago={recargos.unPago} featured={featured} />

      {/* CATEGORIES */}
      <section className="border-b border-[var(--border)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
                Nuestro rubro
              </span>
              {/* text-balance reparte las lineas parejas; el salto forzado
                  queda solo en pantallas grandes porque en mobile sumaba un
                  corte extra y dejaba "BAÑO," sola en un renglon. */}
              <h2 className="mt-3 text-balance font-display text-3xl font-black uppercase leading-[1.05] sm:text-5xl sm:leading-tight">
                Todo para tu baño,{" "}
                <br className="hidden sm:block" />
                tu hogar y tu obra.
              </h2>
            </div>
            <p className="max-w-sm text-balance text-base text-[var(--muted)]">
              Desde una canilla hasta la obra completa.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {business.categories.map((cat, i) => {
              const Icon = categoryIcons[i] ?? Wrench;
              return (
                <Link
                  key={cat.name}
                  href={`/tienda?cat=${cat.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-all hover:-translate-y-1 hover:border-[var(--brand-red)] hover:shadow-xl"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[var(--brand-red)] shadow-sm transition-colors group-hover:bg-[var(--brand-red)] group-hover:text-white">
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-tight group-hover:text-[var(--brand-red)]">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {cat.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-red)] opacity-0 transition-opacity group-hover:opacity-100">
                    Ver productos →
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIKTOK COLLAGE */}
      <TikTokCollage />

      {/* TIKTOK EMBED (top 3) */}
      <TikTokFeed />

      {/* LOCAL + CONTACTO */}
      <section id="local" className="border-b border-[var(--border)] px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Visitanos
            </span>
            <h2 className="mt-3 font-display text-3xl font-black uppercase leading-tight sm:text-5xl">
              En el corazón
              <br />
              <span className="text-[var(--brand-red)]">de Traslasierra.</span>
            </h2>
            <p className="mt-6 max-w-md text-balance text-base text-[var(--muted)]">
              Salón de ventas en Villa Cura Brochero. Vení a verlo o escribinos.
            </p>

            <div className="mt-10 space-y-6">
              <InfoRow icon={MapPin} title="Dirección">
                {business.address.street}
                <br />
                {business.address.city}, {business.address.province}
              </InfoRow>
              <InfoRow icon={Clock} title="Horarios">
                {business.hours.weekdays}
                <br />
                {business.hours.saturday}
              </InfoRow>
              <InfoRow icon={Phone} title="Teléfono">
                <a
                  href={`tel:${business.phone.international.replace(/\s/g, "")}`}
                  className="hover:text-[var(--brand-red)]"
                >
                  {business.phone.display}
                </a>
              </InfoRow>
              <InfoRow icon={Mail} title="Email">
                <a
                  href={`mailto:${business.email}`}
                  className="hover:text-[var(--brand-red)]"
                >
                  {business.email}
                </a>
              </InfoRow>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <SocialPill
                href={business.social.instagram.url}
                icon={InstagramIcon}
                label="Instagram"
                detail={business.social.instagram.followers}
              />
              <SocialPill
                href={business.social.facebook.url}
                icon={FacebookIcon}
                label="Facebook"
              />
              <SocialPill
                href={business.social.tiktok.url}
                icon={TikTokIcon}
                label="TikTok"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10 lg:p-14">
            <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-[var(--brand-red)] opacity-10 blur-3xl" />
            <div className="relative">
              <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
                Tienda online
              </span>
              <h3 className="mt-3 font-display text-3xl font-black uppercase leading-tight sm:text-4xl">
                Estamos armando algo
                <br />
                <span className="text-[var(--brand-red)]">muy grande.</span>
              </h3>
              <p className="mt-5 text-balance text-base text-[var(--muted)]">
                Catálogo online, pagos y entrega en Traslasierra. Pronto en{" "}
                <span className="font-semibold text-foreground">conesa.com.ar</span>.
              </p>

              <div className="mt-10 space-y-3">
                <Feature text="Catálogo completo con fotos y precios actualizados" />
                <Feature text="Pagá con tarjeta, débito o transferencia" />
                <Feature text="Retiro en el local o envío en Traslasierra" />
                <Feature text="Atención personalizada por WhatsApp" />
              </div>

              <Link
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-wider text-[var(--brand-red)] hover:gap-3"
              >
                Hacé tu pedido ya por WhatsApp
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
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

    </main>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-black text-[var(--brand-red)] sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-[var(--muted)] sm:text-sm">
        {label}
      </div>
      {sub && (
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]/70">
          {sub}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--brand-red)]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <div className="font-display text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          {title}
        </div>
        <div className="mt-1 text-base leading-relaxed text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}

function SocialPill({
  href,
  icon: Icon,
  label,
  detail,
}: {
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
  label: string;
  detail?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-3 pr-5 transition-all hover:border-[var(--brand-red)]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--brand-red)] shadow-sm group-hover:bg-[var(--brand-red)] group-hover:text-white">
        <Icon className="h-4 w-4" />
      </span>
      <span className="font-display text-sm font-bold uppercase tracking-wider">
        {label}
      </span>
      {detail && (
        <span className="text-xs text-[var(--muted)]">{detail}</span>
      )}
    </a>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-red)]" />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
              {/* text-balance reparte las líneas parejas y el salto forzado
                  queda solo en pantallas grandes: en mobile sumaba un corte
                  extra y dejaba "BAÑO," sola en un renglón. */}
              <h2 className="mt-3 text-balance font-display text-3xl font-black uppercase leading-[1.05] sm:text-5xl sm:leading-tight">
                Todo para tu baño,
                <br className="hidden sm:block" />{" "}
                tu hogar y tu obra.
              </h2>