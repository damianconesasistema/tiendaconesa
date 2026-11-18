"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { rutaProducto } from "@/lib/rutas-producto";
import { precioVitrina } from "@/lib/precios";
import { formatPrice } from "@/lib/order";

// "Lo mas visto": los productos que mas miran los clientes, con el contador de
// visitas de cada ficha. Damian, 18/11/2026: "se puede hacer un banner en la
// tienda donde destaque los productos que tienen mas visitas?". Va en la
// portada y arriba del catalogo cuando no hay ningun filtro puesto.
//
// Una fila que pasa sola, de a uno y despacio, con una flechita en cada punta
// ("hacele una flechita en cada punta y que vaya pasando solo de a 1 pero
// lento"), sin barra de desplazamiento ("ojo el scroll ese queda feo") y con
// los colores del sitio ("el fondo negro queda mal"). Se frena con el mouse
// encima o al tocarla, y no se mueve sola si la compu pide menos movimiento.

export type MasVisto = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string | null;
};

/** Cada cuanto pasa al siguiente. */
const CADA = 4000;

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
  const fila = useRef<HTMLDivElement>(null);
  const [quieto, setQuieto] = useState(false);

  /** Un lugar para un lado. Al llegar al final vuelve al principio. */
  function mover(lado: 1 | -1) {
    const f = fila.current;
    if (!f) return;
    const tarjeta = f.querySelector("a");
    const espacio = parseFloat(getComputedStyle(f).columnGap || "16") || 16;
    const paso = (tarjeta?.getBoundingClientRect().width ?? 176) + espacio;
    const fin = f.scrollWidth - f.clientWidth;
    const desde = f.scrollLeft;
    const destino =
      lado > 0
        ? desde >= fin - 4
          ? 0
          : Math.min(fin, desde + paso)
        : desde <= 4
          ? fin
          : Math.max(0, desde - paso);
    f.scrollTo({ left: destino, behavior: "smooth" });
    // Si el deslizamiento suave no arranco (un navegador viejo, el ahorro de
    // energia), se pasa igual, de golpe.
    setTimeout(() => {
      if (Math.abs(f.scrollLeft - desde) < 2) f.scrollLeft = destino;
    }, 700);
  }

  useEffect(() => {
    if (quieto || productos.length < 3) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => mover(1), CADA);
    return () => clearInterval(t);
  }, [quieto, productos.length]);

  // Con menos de tres no es un ranking, es una casualidad.
  if (productos.length < 3) return null;

  const flecha =
    "absolute top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-white text-foreground shadow-md transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]";

  return (
    <section
      className={
        compacto
          ? "mb-6 rounded-2xl border border-[var(--border)] bg-white p-4 sm:p-5"
          : "border-b border-[var(--border)] bg-[var(--surface)] px-6 py-10 sm:py-12"
      }
      onMouseEnter={() => setQuieto(true)}
      onMouseLeave={() => setQuieto(false)}
      onTouchStart={() => setQuieto(true)}
    >
      <div className={compacto ? "" : "mx-auto max-w-6xl"}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-red)]/10 px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--brand-red)]">
          <Flame className="h-3.5 w-3.5" />
          Lo más visto
        </span>
        <h2
          className={`mt-2 font-display font-black uppercase leading-tight ${
            compacto ? "text-lg sm:text-xl" : "text-2xl sm:text-3xl"
          }`}
        >
          Lo que más miran nuestros clientes
        </h2>

        <div className="relative mt-4 px-5">
          <button type="button" aria-label="Anterior" onClick={() => mover(-1)} className={`${flecha} left-0`}>
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div ref={fila} className="sin-barra flex snap-x snap-mandatory gap-3 overflow-x-auto py-1 sm:gap-4">
            {productos.map((p, i) => (
              <Link
                key={p.itemId}
                href={rutaProducto(p.itemId)}
                className="group flex w-40 shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white text-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--brand-red)] hover:shadow-md sm:w-44"
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
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-[var(--brand-red)] px-2 py-0.5 font-display text-[10px] font-black text-white">
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
          <button type="button" aria-label="Siguiente" onClick={() => mover(1)} className={`${flecha} right-0`}>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
