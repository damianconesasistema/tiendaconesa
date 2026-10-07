"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
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
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
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
  imageUrl: string | null;
  imageIds?: string[];
  shippingType?: string | null;
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
  const [activeImg, setActiveImg] = useState(0);
  const [zoom, setZoom] = useState(false);

  const effectivePrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discount = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  // Galeria: si hay imagenes cargadas usamos sus ids; sino la generica.
  const gallery =
    product.imageIds && product.imageIds.length > 0
      ? product.imageIds.map((id) => `/api/productos/img/${id}`)
      : [product.imageUrl || `/categories/${product.category}.jpg`];
  const mainImg = gallery[Math.min(activeImg, gallery.length - 1)];

  const prevImg = useCallback(
    () => setActiveImg((i) => (i - 1 + gallery.length) % gallery.length),
    [gallery.length],
  );
  const nextImg = useCallback(
    () => setActiveImg((i) => (i + 1) % gallery.length),
    [gallery.length],
  );

  // Teclado en el zoom: Esc cierra, flechas pasan fotos.
  useEffect(() => {
    if (!zoom) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowLeft") prevImg();
      else if (e.key === "ArrowRight") nextImg();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [zoom, prevImg, nextImg]);

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
          {/* FOTO + GALERIA */}
          <div>
            <div
              onClick={() => setZoom(true)}
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-xl bg-white"
            >
              <Image
                key={mainImg}
                src={mainImg}
                alt={product.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-3"
                unoptimized={mainImg.startsWith("/api/")}
                priority
              />
              <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                <ZoomIn className="h-3.5 w-3.5" />
                Ampliar
              </span>
              <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-black/80 px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                {CAT_LABELS[product.category] || product.category}
              </span>
              {hasDiscount && (
                <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-[var(--brand-red)] px-3 py-1.5 font-display text-xs font-black uppercase tracking-wider text-white shadow-lg">
                  -{discount}%
                </span>
              )}
            </div>

            {gallery.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((src, i) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      i === activeImg
                        ? "border-[var(--brand-red)]"
                        : "border-[var(--border)] hover:border-[var(--brand-red)]/50"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={`${product.title} foto ${i + 1}`}
                      fill
                      sizes="80px"
                      unoptimized={src.startsWith("/api/")}
                      className="bg-white object-contain p-0.5"
                    />
                  </button>
                ))}
              </div>
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
                <div className="flex items-center gap-2">
                  <div className="text-sm text-[var(--muted)] line-through">
                    {formatPrice(product.price)}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[var(--brand-red)] px-2 py-0.5 font-display text-[11px] font-black uppercase tracking-wider text-white animate-price-flash">
                    -{discount}%
                  </span>
                </div>
              )}
              <div
                className={`font-display text-4xl font-black sm:text-5xl ${
                  hasDiscount
                    ? "text-emerald-600 animate-price-flash"
                    : "text-foreground"
                }`}
              >
                {formatPrice(effectivePrice)}
              </div>
              {hasDiscount && (
                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-display text-xs font-black uppercase tracking-wider text-emerald-800">
                  Ahorrás {formatPrice(product.price - product.salePrice!)}
                </div>
              )}
              <div className="mt-2 text-sm text-[var(--muted)]">
                Precio efectivo o transferencia
              </div>
              <div className="mt-0.5 text-xs text-[var(--muted)]">
                Consultanos por pago en cuotas.
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

            {/* Beneficios / Entrega (según el tipo de envío del producto) */}
            <div className="mt-8 grid gap-3 border-t border-[var(--border)] pt-6">
              {(product.shippingType === "ambos" ||
                product.shippingType === "retiro" ||
                !product.shippingType) && (
                <Benefit
                  icon={Store}
                  title="Retiro en tienda"
                  desc="Villa Cura Brochero · sin costo"
                />
              )}
              {product.shippingType === "gratis" && (
                <Benefit
                  icon={Truck}
                  title="Envío gratis"
                  desc="A todo el Valle de Traslasierra"
                />
              )}
              {(product.shippingType === "ambos" ||
                product.shippingType === "envio" ||
                !product.shippingType) && (
                <Benefit
                  icon={Truck}
                  title="Envío a Traslasierra"
                  desc="Mina Clavero, Nono, Villa Dolores y más"
                />
              )}
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

      {/* LIGHTBOX / ZOOM */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm sm:p-10"
        >
          {/* Cerrar */}
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Contador */}
          {gallery.length > 1 && (
            <div className="absolute left-1/2 top-5 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white">
              {activeImg + 1} / {gallery.length}
            </div>
          )}

          {/* Flecha anterior */}
          {gallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevImg();
              }}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:left-6"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          )}

          {/* Imagen (no cierra al tocarla) */}
          <div
            className="relative h-full max-h-[82vh] w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              key={mainImg}
              src={mainImg}
              alt={product.title}
              fill
              sizes="90vw"
              className="object-contain"
              unoptimized={mainImg.startsWith("/api/")}
            />
          </div>

          {/* Flecha siguiente */}
          {gallery.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextImg();
              }}
              aria-label="Foto siguiente"
              className="absolute right-3 top-1/2 z-10 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30 sm:right-6"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          )}

          {/* Miniaturas abajo */}
          {gallery.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 flex max-w-[92vw] -translate-x-1/2 gap-2 overflow-x-auto px-2"
              onClick={(e) => e.stopPropagation()}
            >
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-md border-2 bg-white ${
                    i === activeImg ? "border-white" : "border-white/30"
                  }`}
                  aria-label={`Foto ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="48px"
                    unoptimized={src.startsWith("/api/")}
                    className="object-contain"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
      <div className="relative aspect-square bg-white">
        <Image
          src={p.imageUrl || `/categories/${p.category}.jpg`}
          alt={p.title}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          unoptimized={!!p.imageUrl && p.imageUrl.startsWith("/api/")}
          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-3">
        <h3 className="text-xs font-semibold leading-snug">{p.title}</h3>
        <div className="mt-2 font-display text-base font-black text-foreground">
          {formatPrice(price)}
        </div>
      </div>
    </Link>
  );
}
