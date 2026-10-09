import Link from "next/link";
import Image from "next/image";
import { HeroCarousel } from "@/components/HeroCarousel";
import { TikTokCollage } from "@/components/TikTokCollage";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { getRecargosMp, getPlanesCuotas } from "@/lib/settings";
import { CuotasBanner } from "@/components/CuotasBanner";
import { prisma } from "@/lib/db";
import { getMarcasConLogo } from "@/lib/marcas-server";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/SocialIcons";
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

  // Destacados: los que el admin marco como tales y, si no alcanzan,
  // se completa con el resto del catalogo.
  //
  // Antes esto pedia salePrice: null para no repetir lo que ya sale en
  // "En oferta ahora". Funcionaba cuando solo algunos productos tenian
  // oferta; hoy los tienen casi todos, asi que la seccion quedaba vacia.
  // Ahora se excluyen los itemId que YA se mostraron arriba, que es lo
  // que se queria evitar de verdad.
  const yaMostrados = onSale.map((p) => p.itemId);
  const CAMPOS = {
    itemId: true,
    title: true,
    price: true,
    salePrice: true,
    category: true,
    imageUrl: true,
    stock: true,
  } as const;

  let featured = await prisma.product.findMany({
    where: {
      featured: true,
      active: true,
      itemId: { not: "__RESET_PRICES_MARKER__", notIn: yaMostrados },
    },
    select: CAMPOS,
    take: 8,
    orderBy: { title: "asc" },
  });

  if (featured.length < 8) {
    const extras = await prisma.product.findMany({
      where: {
        active: true,
        featured: false,
        itemId: {
          not: "__RESET_PRICES_MARKER__",
          notIn: [...yaMostrados, ...featured.map((f) => f.itemId)],
        },
      },
      select: CAMPOS,
      take: 8 - featured.length,
      // Con stock primero: no tiene sentido destacar algo que no se puede
      // comprar.
      orderBy: [{ stock: "desc" }, { title: "asc" }],
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

      {/* DESTACADOS (solo si hay) */}
      {featured.length > 0 && (
        <FeaturedProducts comisionUnPago={recargos.unPago} featured={featured} />
      )}

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