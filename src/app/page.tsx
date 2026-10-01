import Link from "next/link";
import Image from "next/image";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TikTokFeed } from "@/components/TikTokFeed";
import { BackToTop } from "@/components/BackToTop";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
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
} from "lucide-react";
import { ConesaLogo } from "@/components/ConesaLogo";
import { business, whatsappLink } from "@/lib/business";

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

export default function Home() {
  return (
    <main className="relative flex-1">
      {/* HERO */}
      <HeroCarousel />

      {/* STATS */}
      <section className="border-b border-[var(--border)] bg-white px-6 py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-6 sm:gap-16">
          <Stat value="14k+" label="En Instagram" />
          <Stat value="20+" label="Marcas" />
          <Stat value="7" label="Días a la semana" sub="atención por WhatsApp" />
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
          </div>
          <div className="grid grid-cols-2 items-center gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {business.brands.map((brand) => (
              <div
                key={brand.name}
                className="group relative flex h-20 items-center justify-center rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-[var(--border)] transition-all hover:-translate-y-0.5 hover:shadow-md"
                title={brand.name}
              >
                <Image
                  src={brand.logo}
                  alt={brand.name}
                  width={160}
                  height={60}
                  className={`max-h-12 w-auto object-contain opacity-80 transition-opacity group-hover:opacity-100 ${
                    "invert" in brand && brand.invert ? "brightness-0" : ""
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="border-b border-[var(--border)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
                Nuestro rubro
              </span>
              <h2 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl">
                Todo para tu baño,
                <br />
                tu hogar y tu obra.
              </h2>
            </div>
            <p className="max-w-sm text-base text-[var(--muted)]">
              Desde una canilla hasta la obra completa. Marcas confiables y
              asesoramiento personalizado.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {business.categories.map((cat, i) => {
              const Icon = categoryIcons[i] ?? Wrench;
              return (
                <div
                  key={cat.name}
                  className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-7 transition-all hover:-translate-y-1 hover:border-[var(--brand-red)] hover:shadow-xl"
                >
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white text-[var(--brand-red)] shadow-sm transition-colors group-hover:bg-[var(--brand-red)] group-hover:text-white">
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-display text-2xl font-bold uppercase tracking-tight">
                    {cat.name}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {cat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TIKTOK */}
      <TikTokFeed />

      {/* LOCAL + CONTACTO */}
      <section id="local" className="border-b border-[var(--border)] px-6 py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Visitanos
            </span>
            <h2 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl">
              En el corazón de
              <br />
              <span className="text-[var(--brand-red)]">Traslasierra.</span>
            </h2>
            <p className="mt-6 max-w-md text-base text-[var(--muted)]">
              Tenemos salón de ventas en Villa Cura Brochero. Vení a ver los
              productos en persona o consultanos por WhatsApp y te asesoramos.
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
              <p className="mt-5 text-base text-[var(--muted)]">
                Catálogo online, carrito, pagos con tarjeta y entrega en toda la
                región de Traslasierra. Muy pronto en{" "}
                <span className="font-semibold text-foreground">conesa.com.ar</span>
                .
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
      <footer className="px-6 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <ConesaLogo className="h-12 w-auto" />
          </div>
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} {business.name}. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <Link
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribinos por WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/30 transition-transform hover:scale-110 sm:bottom-8 sm:right-8"
      >
        <WhatsAppIcon className="h-7 w-7" />
      </Link>

      {/* BACK TO TOP */}
      <BackToTop />
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
