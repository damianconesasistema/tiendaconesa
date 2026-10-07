"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Package, ArrowRight, ShoppingCart, Check, Tag } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/order";
import { precioVitrina, descuentoContadoPct } from "@/lib/precios";

type Product = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  category: string;
  imageUrl: string | null;
  stock: number;
};

const CAT_LABELS: Record<string, string> = {
  sanitarios: "Sanitarios",
  griferia: "Grifería",
  banera: "Bañeras",
  accesorios: "Accesorios",
  salamandras: "Salamandras",
  calefones: "Calefones",
  materiales: "Materiales",
  piletas: "Piletas",
  otros: "Otros",
};

type Variant = "default" | "offers";

export function FeaturedProducts({
  featured,
  variant = "default",
  eyebrow,
  title,
  cta,
  ctaHref,
  comisionUnPago = 10,
}: {
  featured: Product[];
  variant?: Variant;
  eyebrow?: string;
  title?: string;
  cta?: string;
  ctaHref?: string;
  // Comisión de 1 pago: define el precio de vitrina.
  comisionUnPago?: number;
}) {
  const isOffers = variant === "offers";
  return (
    <section
      className={`border-b border-[var(--border)] px-6 py-24 ${
        isOffers ? "bg-gradient-to-br from-[var(--brand-red)]/5 via-transparent to-amber-50/40" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span
              className={`inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-[0.35em] ${
                isOffers ? "text-[var(--brand-red)]" : "text-[var(--brand-red)]"
              }`}
            >
              {isOffers && <Tag className="h-3.5 w-3.5" />}
              {eyebrow || "Tienda online"}
            </span>
            <h2 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl">
              {title || "Productos destacados"}
            </h2>
            <p className="mt-2 text-balance text-base text-[var(--muted)]">
              {isOffers
                ? "Aprovechá los descuentos activos."
                : "Las mejores marcas. Entrá a la tienda."}
            </p>
          </div>
          <Link
            href={ctaHref || "/tienda"}
            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02] ${
              isOffers ? "bg-[var(--brand-red)]" : "bg-[var(--brand-black)]"
            }`}
          >
            {cta || "Ver tienda completa"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((p) => (
            <FeaturedCard key={p.itemId} p={p} comisionUnPago={comisionUnPago} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ p, comisionUnPago }: { p: Product; comisionUnPago: number }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const photoPath = p.imageUrl || `/categories/${p.category}.jpg`;
  // La base guarda el contado; la vitrina muestra el de 1 pago.
  const contado = p.salePrice ?? p.price;
  const effectivePrice = precioVitrina(contado, comisionUnPago);
  const listaVitrina = precioVitrina(p.price, comisionUnPago);
  const dctoPct = descuentoContadoPct(effectivePrice, contado);
  const hasSale = p.salePrice !== null && p.salePrice < p.price;
  const discount = hasSale
    ? Math.round(((p.price - p.salePrice!) / p.price) * 100)
    : 0;
  const outOfStock = p.stock <= 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    add({
      itemId: p.itemId,
      title: p.title,
      price: effectivePrice,
      category: p.category,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link
      href={`/tienda/${p.itemId}`}
      className={`card-lift group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm ${
        hasSale
          ? "border-emerald-500/60 shadow-emerald-500/10 ring-1 ring-emerald-400/40"
          : "border-[var(--border)]"
      }`}
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white">
        {!imgError ? (
          <Image
            src={photoPath}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            onError={() => setImgError(true)}
            unoptimized={photoPath.startsWith("/api/")}
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <Package
            className="h-14 w-14 text-[var(--border)]"
            strokeWidth={1.2}
          />
        )}
        <span className="absolute right-3 top-3 z-10 inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {CAT_LABELS[p.category] || p.category}
        </span>
        {hasSale && !outOfStock && (
          <span
            className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-500/40"
            style={{ animation: "titilate 1.8s cubic-bezier(0.4,0,0.2,1) infinite" }}
          >
            <Tag className="h-3 w-3" />-{discount}%
          </span>
        )}
        {outOfStock && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-gray-800 px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-wider text-white shadow-lg">
            Sin stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-xs font-semibold leading-snug text-foreground group-hover:text-[var(--brand-red)] sm:text-sm">
          {p.title}
        </h3>
        {/* mt-auto empuja precio+boton al fondo. Asi se alinean entre cards */}
        <div className="mt-auto">
          <div className="mt-3 flex flex-col">
            {hasSale && (
              <div className="text-xs text-[var(--muted)] line-through">
                {formatPrice(listaVitrina)}
              </div>
            )}
            <span
              className={`font-display font-black ${
                hasSale
                  ? "text-emerald-600 text-xl sm:text-2xl animate-price-flash"
                  : "text-foreground text-lg sm:text-xl"
              }`}
            >
              {formatPrice(effectivePrice)}
            </span>
            {hasSale && (
              <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                Ahorrás {formatPrice(listaVitrina - effectivePrice)}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-wider text-[var(--muted)]">
              Débito o 1 pago
            </span>
            {/* Contado destacado en celeste */}
            {dctoPct > 0 && (
              <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-sky-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
                {dctoPct}% OFF efectivo
              </span>
            )}
            {dctoPct > 0 && (
              <span className="font-display text-sm font-black text-sky-700">
                {formatPrice(contado)}
              </span>
            )}
          </div>
          {outOfStock ? (
            <span className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
              Sin stock
            </span>
          ) : (
            <button
              onClick={handleAdd}
              className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 font-display text-[10px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
                added
                  ? "bg-green-500 text-white"
                  : "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]"
              }`}
            >
              {added ? (
                <>
                  <Check className="h-3 w-3" />
                  Agregado
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3 w-3" />
                  Agregar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
