"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Package, ArrowRight, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/order";

type Product = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  category: string;
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

export function FeaturedProducts({ featured }: { featured: Product[] }) {
  return (
    <section className="border-b border-[var(--border)] px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-red)]">
              Tienda online
            </span>
            <h2 className="mt-3 font-display text-4xl font-black uppercase leading-tight sm:text-5xl">
              Productos destacados
            </h2>
            <p className="mt-2 text-balance text-base text-[var(--muted)]">
              Más de 790 productos. Entrá a la tienda.
            </p>
          </div>
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-black)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02]"
          >
            Ver tienda completa
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((p) => (
            <FeaturedCard key={p.itemId} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ p }: { p: Product }) {
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const { add } = useCart();
  const photoPath = `/categories/${p.category}.jpg`;
  const effectivePrice = p.salePrice ?? p.price;

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
      className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] shadow-sm"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[var(--surface)]">
        {!imgError ? (
          <Image
            src={photoPath}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-tight text-foreground group-hover:text-[var(--brand-red)] sm:text-sm">
          {p.title}
        </h3>
        <div className="mt-3">
          <span className="font-display text-lg font-black text-foreground sm:text-xl">
            {formatPrice(effectivePrice)}
          </span>
        </div>
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
      </div>
    </Link>
  );
}
