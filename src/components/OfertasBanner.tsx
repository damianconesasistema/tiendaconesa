import Link from "next/link";
import Image from "next/image";
import { Tag, ArrowRight } from "lucide-react";
import { precioVitrina } from "@/lib/precios";
import { formatPrice } from "@/lib/order";

// Banner de ofertas para la home.
//
// La seccion "En oferta ahora" ya existia, pero arrancaba recien a los
// 3.500px de scroll: el que entraba no se enteraba de que habia ofertas.
// Esto va apenas abajo del hero y manda directo al catalogo ya filtrado.
//
// Todo sale de los productos de verdad: el "hasta X% OFF" se calcula, no
// se escribe a mano, asi que el cartel nunca promete un descuento que no
// existe ni se queda viejo cuando cambian los precios.

type Oferta = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string | null;
};

export function OfertasBanner({
  ofertas,
  total,
  comisionUnPago = 10,
}: {
  /** Las de mayor descuento, ya ordenadas. */
  ofertas: Oferta[];
  /** Cuantas hay en total, que suelen ser mas que las que entran acá. */
  total: number;
  comisionUnPago?: number;
}) {
  const conDescuento = ofertas
    .map((p) => ({
      ...p,
      pct: p.salePrice
        ? Math.round(((p.price - p.salePrice) / p.price) * 100)
        : 0,
    }))
    .filter((p) => p.pct > 0);

  if (conDescuento.length === 0) return null;

  const maxPct = Math.max(...conDescuento.map((p) => p.pct));
  const destacadas = conDescuento.slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-[var(--brand-red)] px-6 py-10 text-white sm:py-12">
      {/* Mismos adornos que el banner de cuotas, para que se note que son
          de la misma casa. */}
      <div
        aria-hidden
        className="animate-banner-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div
        aria-hidden
        className="animate-banner-drift pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10"
      />
      <div
        aria-hidden
        className="animate-banner-drift-slow pointer-events-none absolute -bottom-32 left-1/5 h-64 w-64 rounded-full bg-black/10"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        {/* Titulo y el descuento mas alto */}
        <div className="animate-banner-in shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm">
            <Tag className="h-3.5 w-3.5" />
            Ofertas
          </span>
          <div className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
            Hasta
            <br />
            <span className="animate-banner-beat inline-block text-6xl sm:text-7xl">
              {maxPct}% OFF
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-white/90">
            {total} {total === 1 ? "producto" : "productos"} con descuento, con
            stock y para llevar hoy.
          </p>

          <Link
            href="/tienda?filter=on-sale"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-[var(--brand-red)] transition-transform hover:scale-[1.03]"
          >
            Ver todas las ofertas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Las de mayor descuento. En el celular entran dos: cuatro
            miniaturas en 390px quedan del tamaño de una estampilla. */}
        <div className="animate-banner-in-2 grid w-full grid-cols-2 gap-3 sm:gap-4 lg:w-auto lg:grid-cols-4">
          {destacadas.map((p, i) => (
            <Link
              key={p.itemId}
              href={`/tienda/${p.itemId}`}
              className={`group flex flex-col overflow-hidden rounded-xl bg-white text-foreground shadow-lg transition-transform hover:-translate-y-1 ${
                i >= 2 ? "hidden sm:flex" : ""
              } lg:w-40`}
            >
              <div className="relative aspect-square bg-white">
                <Image
                  src={p.imageUrl || `/categories/${p.category}.jpg`}
                  alt={p.title}
                  fill
                  sizes="160px"
                  unoptimized={!!p.imageUrl && p.imageUrl.startsWith("/api/")}
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--brand-red)] px-2 py-0.5 font-display text-[10px] font-black text-white">
                  -{p.pct}%
                </span>
              </div>
              <div className="flex flex-1 flex-col p-2.5">
                <h3 className="line-clamp-2 text-[11px] font-semibold uppercase leading-snug">
                  {p.title}
                </h3>
                <div className="mt-auto pt-1.5 font-display text-sm font-black text-green-700">
                  {formatPrice(
                    precioVitrina(p.salePrice ?? p.price, comisionUnPago),
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
