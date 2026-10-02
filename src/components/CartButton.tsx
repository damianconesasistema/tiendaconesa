"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart";

export function CartButton() {
  const { count } = useCart();
  return (
    <Link
      href="/tienda/carrito"
      aria-label={`Carrito (${count} ${count === 1 ? "item" : "items"})`}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)] transition-colors hover:border-[var(--brand-red)] hover:text-[var(--brand-red)] sm:h-11 sm:w-11"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--brand-red)] px-1 font-display text-[10px] font-black text-white shadow">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
