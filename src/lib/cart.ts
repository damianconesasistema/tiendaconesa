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

// ---------------------------------------------------------------------------
// Compra directa ("Comprar"): un solo producto, sin pasar por el carrito.
//
// Damian, 16/11/2026: "estaria bueno hacer carrito, pero si quiero comprar
// solo 1 producto". Como el "Comprar ahora" de Mercado Libre: se paga ESE
// producto y lo que haya en el carrito queda guardado, no se mezcla ni se
// borra. El producto viaja en sessionStorage (solo esta pestaña) y el
// checkout lo usa cuando la direccion trae ?directo=1. Sin esa marca, el
// checkout sigue usando el carrito como siempre.
// ---------------------------------------------------------------------------

const DIRECTA_KEY = "conesa.compra-directa.v1";
export const CHECKOUT_DIRECTO = "/tienda/checkout?directo=1";

/** Guarda el producto de la compra directa. Despues hay que ir a
 *  CHECKOUT_DIRECTO. */
export function prepararCompraDirecta(item: Omit<CartItem, "qty">, qty = 1) {
  gaAgregarAlCarrito({ ...item, qty });
  try {
    sessionStorage.setItem(DIRECTA_KEY, JSON.stringify([{ ...item, qty }]));
  } catch {}
}

/** Lo que usa el checkout. `activa` es true solo si la direccion dice
 *  ?directo=1 y hay un producto guardado; si no, el checkout usa el carrito.
 *  `listo` avisa que ya se leyo (en el primer render todavia no se sabe). */
export function useCompraDirecta() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [activa, setActiva] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    try {
      const pide =
        new URLSearchParams(window.location.search).get("directo") === "1";
      const raw = pide ? sessionStorage.getItem(DIRECTA_KEY) : null;
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        setItems(parsed);
        setActiva(true);
      }
    } catch {}
    setListo(true);
  }, []);

  /** Al terminar la compra: se borra la compra directa, no el carrito. */
  const terminar = useCallback(() => {
    try {
      sessionStorage.removeItem(DIRECTA_KEY);
    } catch {}
    setItems([]);
  }, []);

  return { activa, items, listo, terminar };
}
