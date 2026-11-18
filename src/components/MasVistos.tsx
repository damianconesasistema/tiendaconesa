import Link from "next/link";
import Image from "next/image";
import { Flame } from "lucide-react";
import { rutaProducto } from "@/lib/rutas-producto";
import { precioVitrina } from "@/lib/precios";
import { formatPrice } from "@/lib/order";

// "Lo mas visto": los productos que mas miran los clientes, con el contador de
// visitas de cada ficha. Damian, 18/11/2026: "se puede hacer un banner en la
// tienda donde destaque los productos que tienen mas visitas?". Va en la
// portada y arriba del catalogo cuando no hay ningun filtro puesto.
//
// Sin "use client": lo usan la portada (servidor) y el catalogo (cliente).

export type MasVisto = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string | null;
};

export function MasVistos({
  productos,
  comisionUnPago = 10,
  compacto = false,
}: {
  /** Ya ordenados, el mas visto primero. */
  productos: MasVisto[];
  comisionUnPago?: number;
  /** Dentro del catalogo: una franja, no una seccion entera. */
  compacto?: boolean;
}) {
  // Con menos de tres no es un ranking, es una casualidad.
  if (productos.length < 3) return null;

  return (
    <section
      className={
        compacto
          ? "mb-6 rounded-2xl bg-[#111] p-4 text-white sm:p-5"
          : "border-b border-black/10 bg-[#111] px-6 py-10 text-white sm:py-12"
      }
    >
      <div className={compacto ? "" : "mx-auto max-w-6xl"}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.2em]">
          <Flame className="h-3.5 w-3.5 text-[var(--brand-red)]" />
          Lo más visto
        </span>
        <h2
          className={`mt-2 font-display font-black uppercase leading-tight ${
            compacto ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
          }`}
        >
          Lo que más miran nuestros clientes
        </h2>

        {/* Una fila que se desliza: en el celular entran dos y se ve que hay
            mas al costado. */}
        <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2 sm:gap-4">
          {productos.map((p, i) => (
            <Link
              key={p.itemId}
              href={rutaProducto(p.itemId)}
              className="group flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-xl bg-white text-foreground shadow-lg transition-transform hover:-translate-y-1 sm:w-44"
            >
              <div className="relative aspect-square bg-white">
                <Image
                  src={p.imageUrl || `/categories/${p.category}.jpg`}
                  alt={p.title}
                  fill
                  sizes="176px"
                  unoptimized={!!p.imageUrl && p.imageUrl.startsWith("/api/")}
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute left-1.5 top-1.5 rounded-full bg-[#111] px-2 py-0.5 font-display text-[10px] font-black text-white">
                  #{i + 1}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-2.5">
                <h3 className="line-clamp-2 text-[11px] font-semibold uppercase leading-snug">{p.title}</h3>
                <div className="mt-auto pt-1.5 font-display text-sm font-black text-green-700">
                  {formatPrice(precioVitrina(p.salePrice ?? p.price, comisionUnPago))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
