"use client";

import { CartContext, useCartState } from "@/lib/cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const state = useCartState();
  return <CartContext.Provider value={state}>{children}</CartContext.Provider>;
}
