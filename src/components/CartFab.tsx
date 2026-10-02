"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice, cartTotal } from "@/lib/order";

// Barra flotante inferior con los items del carrito. Visible en todas las
// paginas excepto donde ya se ve el carrito completo (/tienda/carrito,
// /tienda/checkout).
export function CartFab() {
  const pathname = usePathname();
  const { items, count } = useCart();

  if (count === 0) return null;
  if (!pathname) return null;
  if (
    pathname === "/tienda/carrito" ||
    pathname === "/tienda/checkout" ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const { total, hasUnpriced } = cartTotal(items);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3 sm:px-6 sm:pb-5"
      role="region"
      aria-label="Resumen del carrito"
    >
      <Link
        href="/tienda/carrito"
        className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-[var(--brand-black,#111)] px-4 py-3 text-white shadow-2xl shadow-black/40 ring-1 ring-black/5 transition-transform hover:scale-[1.02] sm:gap-4 sm:px-5"
        style={{ animation: "cart-fab-in 0.35s cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)]">
          <ShoppingCart className="h-5 w-5" />
          <span
            className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 font-display text-[10px] font-black text-[var(--brand-black,#111)] shadow"
            aria-label={`${count} items`}
          >
            {count > 99 ? "99+" : count}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="font-display text-[11px] font-bold uppercase tracking-wider text-white/60">
            Tu carrito
          </span>
          <span className="font-display text-base font-black">
            {hasUnpriced ? "A consultar" : formatPrice(total)}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-red)] px-4 py-2 font-display text-[11px] font-black uppercase tracking-wider text-white">
          Ver <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
      <style>{`
        @keyframes cart-fab-in {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
