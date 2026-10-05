"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Shield,
  Truck,
} from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice, cartTotal } from "@/lib/order";

export function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const { total, hasUnpriced } = cartTotal(items);

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--surface)] px-4 py-20">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
            <ShoppingBag
              className="h-10 w-10 text-[var(--muted)]"
              strokeWidth={1.4}
            />
          </div>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight">
            Tu carrito está vacío
          </h1>
          <p className="mt-3 text-balance text-[var(--muted)]">
            Agregá productos desde la tienda y aparecerán acá.
          </p>
          <Link
            href="/tienda"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-3 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02]"
          >
            Ir a la tienda
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--surface)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Seguir comprando
        </Link>

        <h1 className="mt-6 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Tu carrito
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {items.length} {items.length === 1 ? "producto" : "productos"} ·{" "}
          {items.reduce((s, i) => s + i.qty, 0)} unidades
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* ITEMS */}
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)] sm:p-6">
            <div className="divide-y divide-[var(--border)]">
              {items.map((it) => (
                <div
                  key={it.itemId}
                  className="flex gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/tienda/${it.itemId}`}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[var(--surface)] sm:h-24 sm:w-24"
                  >
                    <Image
                      src={`/categories/${it.category}.jpg`}
                      alt={it.title}
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/tienda/${it.itemId}`}
                      className="text-sm font-semibold leading-snug hover:text-[var(--brand-red)] sm:text-base"
                    >
                      {it.title}
                    </Link>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {formatPrice(it.price)} c/u
                    </div>
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-2">
                      <div className="inline-flex items-center rounded-full border border-[var(--border)]">
                        <button
                          onClick={() => setQty(it.itemId, it.qty - 1)}
                          className="flex h-8 w-8 items-center justify-center text-foreground hover:text-[var(--brand-red)]"
                          aria-label="Restar"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] text-center font-display text-sm font-bold">
                          {it.qty}
                        </span>
                        <button
                          onClick={() => setQty(it.itemId, it.qty + 1)}
                          className="flex h-8 w-8 items-center justify-center text-foreground hover:text-[var(--brand-red)]"
                          aria-label="Sumar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-display text-base font-black sm:text-lg">
                          {it.price === null
                            ? "A consultar"
                            : formatPrice(it.price * it.qty)}
                        </div>
                        <button
                          onClick={() => remove(it.itemId)}
                          className="text-[var(--muted)] hover:text-[var(--brand-red)]"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end border-t border-[var(--border)] pt-4">
              <button
                onClick={clear}
                className="text-xs font-medium text-[var(--muted)] hover:text-[var(--brand-red)]"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* RESUMEN */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-[var(--border)]">
              <h2 className="font-display text-lg font-black uppercase tracking-tight">
                Resumen
              </h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Subtotal</span>
                  <span className="font-semibold">
                    {hasUnpriced ? "a consultar" : formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Envío</span>
                  <span className="font-semibold">A calcular</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between border-t border-[var(--border)] pt-4">
                <span className="font-display text-sm font-bold uppercase">
                  Total
                </span>
                <span className="font-display text-2xl font-black">
                  {hasUnpriced ? "A consultar" : formatPrice(total)}
                </span>
              </div>

              <Link
                href="/tienda/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[var(--brand-red)] px-6 py-4 font-display text-sm font-bold uppercase tracking-wider text-white transition-transform hover:scale-[1.02]"
              >
                Finalizar compra
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tienda"
                className="mt-3 flex w-full items-center justify-center text-sm font-medium text-[var(--muted)] hover:text-foreground"
              >
                Seguir comprando
              </Link>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[var(--border)]">
              <Perk icon={Shield} text="Compra protegida — pagás al confirmar" />
              <Perk icon={Truck} text="Envíos a todo el Valle de Traslasierra" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Perk({
  icon: Icon,
  text,
}: {
  icon: typeof Shield;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-xs text-foreground">
      <Icon className="h-4 w-4 text-[var(--brand-red)]" />
      {text}
    </div>
  );
}
