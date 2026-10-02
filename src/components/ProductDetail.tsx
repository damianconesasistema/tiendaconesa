"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Zap,
  Truck,
  Store,
  Shield,
  MessageCircle,
  Check,
  Minus,
  Plus,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/order";
import { whatsappLink } from "@/lib/business";
import { useRouter } from "next/navigation";

type Product = {
  itemId: string;
  title: string;
  price: number;
  salePrice: number | null;
  stock: number;
  condition: string | null;
  status: string | null;
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

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const effectivePrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discount = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const img = `/categories/${product.category}.jpg`;

  const handleAdd = () => {
    add(
      {
        itemId: product.itemId,
        title: product.title,
        price: effectivePrice,
        category: product.category,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    add(
      {
        itemId: product.itemId,
        title: product.title,
        price: effectivePrice,
        category: product.category,
      },
      qty,
    );
    router.push("/tienda/checkout");
  };

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al catálogo
        </Link>

        <div className="mt-6 grid gap-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)] sm:p-8 lg:grid-cols-[1.1fr_1fr]">
          {/* FOTO */}
          <div className="relative aspect-square overflow-hidden rounded-xl bg-[var(--surface)]">
            <Image
              src={img}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-black/80 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {CAT_LABELS[product.category] || product.category}
            </span>
            {hasDiscount && (
              <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-[var(--brand-red)] px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg">
                -{discount}%
              </span>
            )}
          </div>

          {/* INFO */}
          <div className="flex flex-col">
            <span className="text-xs text-[var(--muted)]">
              {product.condition || "Nuevo"} · ID {product.itemId}
            </span>
            <h1 className="mt-2 font-display text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
              {product.title}
            </h1>

            <div className="mt-6">
              {hasDiscount && (
                <div className="text-sm text-[var(--muted)] line-through">
                  {formatPrice(product.price)}
                </div>
              )}
              <div className="font-display text-4xl font-black text-foreground sm:text-5xl">
                {formatPrice(effectivePrice)}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                3 cuotas sin interés desde{" "}
                <strong className="text-foreground">
                  {formatPrice(Math.round(effectivePrice / 3))}
                </strong>
              </div>
            </div>

            {/* Stock */}
            <div className="mt-6 flex items-center gap-2 text-sm">
              {product.stock > 0 ? (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium text-green-700">
                    Stock disponible
                  </span>
                </>
              ) : (
                <>
                  <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  <span className="font-medium text-amber-700">
                    A pedido · consultá entrega
                  </span>
                </>
              )}
            </div>

            {/* Cantidad */}
            <div className="mt-6 flex items-center gap-4">
              <span className="text-sm font-medium text-foreground">
                Cantidad:
              </span>
              <div className="inline-flex items-center rounded-full border border-[var(--border)] bg-white">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-foreground hover:text-[var(--brand-red)]"
                  aria-label="Restar"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-[2.5rem] text-center font-display font-bold">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-10 w-10 items-center justify-center text-foreground hover:text-[var(--brand-red)]"
                  aria-label="Sumar"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-4 font-display text-base font-bold uppercase tracking-wider text-white transition-all hover:bg-[var(--brand-red-hover)] hover:scale-[1.02]"
              >
                <Zap className="h-5 w-5" />
                Comprar ahora
              </button>
              <button
                onClick={handleAdd}
                className={`inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-4 font-display text-base font-bold uppercase tracking-wider transition-all hover:scale-[1.02] ${
                  added
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-[var(--brand-red)] bg-white text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white"
                }`}
              >
                {added ? (
                  <>
                    <Check className="h-5 w-5" />
                    Agregado
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Agregar al carrito
                  </>
                )}
              </button>
            </div>

            {/* WhatsApp alternativo */}
            <Link
              href={whatsappLink(
                `Hola! Quería consultar por: ${product.title} (ID ${product.itemId})`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[#25D366]"
            >
              <MessageCircle className="h-4 w-4" />
              O consultá por WhatsApp
            </Link>

            {/* Beneficios */}
            <div className="mt-8 grid gap-3 border-t border-[var(--border)] pt-6">
              <Benefit
                icon={Store}
                title="Retiro en tienda"
                desc="Villa Cura Brochero · sin costo"
              />
              <Benefit
                icon={Truck}
                title="Envío a Traslasierra"
                desc="Mina Clavero, Nono, Villa Dolores y más"
              />
              <Benefit
                icon={Shield}
                title="Compra segura"
                desc="Pagás solo cuando confirmás"
              />
            </div>
          </div>
        </div>

        {/* RELACIONADOS */}
        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight sm:text-3xl">
              También te puede interesar
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <RelatedCard key={p.itemId} p={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Benefit({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Truck;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--brand-red)]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </div>
      <div>
        <div className="font-display text-sm font-bold">{title}</div>
        <div className="text-xs text-[var(--muted)]">{desc}</div>
      </div>
    </div>
  );
}

function RelatedCard({ p }: { p: Product }) {
  const price = p.salePrice ?? p.price;
  return (
    <Link
      href={`/tienda/${p.itemId}`}
      className="group block overflow-hidden rounded-xl bg-white ring-1 ring-[var(--border)] transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square bg-[var(--surface)]">
        <Image
          src={`/categories/${p.category}.jpg`}
          alt={p.title}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-xs font-semibold leading-tight">
          {p.title}
        </h3>
        <div className="mt-2 font-display text-base font-black text-foreground">
          {formatPrice(price)}
        </div>
      </div>
    </Link>
  );
}
