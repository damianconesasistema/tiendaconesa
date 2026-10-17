"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { gaAgregarAlCarrito } from "@/lib/ga";

export type CartItem = {
  itemId: string;
  title: string;
  qty: number;
  price: number | null; // null = "a consultar"
  category: string;
  /** Variante elegida en la ficha, ej "Gas envasado". Ver opcionesDe(). */
  opcion?: string | null;
};

/** Clave de la linea del carrito.
 *
 *  Dos termotanques iguales, uno a gas natural y otro envasado, son dos
 *  lineas distintas: el itemId solo no alcanza para distinguirlas. */
export function lineaDe(item: { itemId: string; opcion?: string | null }) {
  return item.opcion ? `${item.itemId}::${item.opcion}` : item.itemId;
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (linea: string) => void;
  setQty: (linea: string, qty: number) => void;
  clear: () => void;
};

export const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "conesa.cart.v1";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe estar dentro de <CartProvider>");
  return ctx;
}

export function useCartState() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hidratar desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Persistir cada cambio
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "qty">, qty = 1) => {
    // Un solo lugar para avisarle a Analytics: todos los botones de
    // "Agregar" de la tienda terminan aca.
    gaAgregarAlCarrito({ ...item, qty });
    setItems((prev) => {
      const linea = lineaDe(item);
      const idx = prev.findIndex((p) => lineaDe(p) === linea);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + qty };
        return copy;
      }
      return [...prev, { ...item, qty }];
    });
  }, []);

  const remove = useCallback((linea: string) => {
    setItems((prev) => prev.filter((p) => lineaDe(p) !== linea));
  }, []);

  const setQty = useCallback((linea: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((p) => lineaDe(p) !== linea);
      return prev.map((p) => (lineaDe(p) === linea ? { ...p, qty } : p));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return { items, count, add, remove, setQty, clear };
}
