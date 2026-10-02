"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Package, ArrowRight } from "lucide-react";
import productsData from "@/data/products.json";
import { whatsappLink } from "@/lib/business";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

type Product = {
  itemId: string;
  title: string;
  price: number;
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

// Mix de categorias para que el destacado luzca variado
function pickFeatured(all: Product[], n = 8): Product[] {
  const buckets = new Map<string, Product[]>();
  for (const p of all) {
    const arr = buckets.get(p.category) || [];
    arr.push(p);
    buckets.set(p.category, arr);
  }
  const prefOrder = [
    "sanitarios",
    "griferia",
    "salamandras",
    "banera",
    "calefones",
    "accesorios",
    "piletas",
    "materiales",
  ];
  const picked: Product[] = [];
  for (const cat of prefOrder) {
    const arr = buckets.get(cat);
    if (arr && arr.length) picked.push(arr[0]);
    if (picked.length >= n) break;
  }
  // Si quedan huecos, rellenar con otros
  for (const p of all) {
    if (picked.length >= n) break;
    if (!picked.find((x) => x.itemId === p.itemId)) picked.push(p);
  }
  return picked.slice(0, n);
}

const featured = pickFeatured(productsData as Product[], 8);

export function FeaturedProducts() {
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
            <p className="mt-2 max-w-sm text-base text-[var(--muted)]">
              Más de 790 productos disponibles. Entrá a la tienda a verlos todos.
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
  const msg = `Hola! Quería consultar por: ${p.title} (ID ${p.itemId})`;
  const photoPath = `/products/${p.itemId}.jpg`;

  return (
    <div className="card-lift group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[var(--surface)]">
        {!imgError ? (
          <Image
            src={photoPath}
            alt={p.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            onError={() => setImgError(true)}
            className="object-contain p-4"
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
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-tight text-foreground sm:text-sm">
          {p.title}
        </h3>
        <div className="mt-3">
          <span className="font-display text-lg font-black text-[var(--brand-red)] sm:text-xl">
            $999.999
          </span>
        </div>
        <Link
          href={whatsappLink(msg)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#25D366] px-3 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#1DA851] sm:text-xs"
        >
          <WhatsAppIcon className="h-3 w-3" />
          Consultar
        </Link>
      </div>
    </div>
  );
}
