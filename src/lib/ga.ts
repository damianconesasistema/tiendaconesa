"use client";

// Eventos de comercio electronico para Google Analytics.
//
// El embudo completo: ver un producto, agregarlo al carrito, arrancar el
// checkout y comprar. Con los cuatro Analytics puede decir DONDE se cae la
// gente, que es mas accionable que el total de ventas.
//
// Todo pasa por `evento()`, que no hace nada si no hay Analytics cargado:
// asi el sitio funciona igual sin NEXT_PUBLIC_GA_ID y una falla de la
// analitica nunca rompe una compra.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type GaItem = {
  itemId: string;
  title: string;
  price: number | null;
  category?: string;
  qty?: number;
};

function aItem(i: GaItem, index: number) {
  return {
    item_id: i.itemId,
    item_name: i.title,
    ...(i.category ? { item_category: i.category } : {}),
    // "a consultar" no tiene precio: mandar null ensucia el reporte
    ...(typeof i.price === "number" ? { price: i.price } : {}),
    quantity: i.qty ?? 1,
    index,
  };
}

function evento(nombre: string, params: Record<string, unknown>) {
  try {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    window.gtag("event", nombre, { currency: "ARS", ...params });
  } catch {
    /* la analitica nunca puede romper la tienda */
  }
}

function suma(items: GaItem[]) {
  return items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
}

/** Alguien abrio la ficha de un producto. */
export function gaVerProducto(item: GaItem) {
  evento("view_item", { value: item.price ?? 0, items: [aItem(item, 0)] });
}

/** Alguien toco "Agregar". Se dispara desde el carrito, asi cubre todos
 *  los botones de la tienda sin tener que tocarlos uno por uno. */
export function gaAgregarAlCarrito(item: GaItem) {
  evento("add_to_cart", {
    value: (item.price ?? 0) * (item.qty ?? 1),
    items: [aItem(item, 0)],
  });
}

/** Alguien entro al checkout con el carrito cargado. */
export function gaArrancarCheckout(items: GaItem[]) {
  if (items.length === 0) return;
  evento("begin_checkout", { value: suma(items), items: items.map(aItem) });
}

/** Se concreto la venta. Ojo: mandarlo una sola vez por pedido. */
export function gaCompra(orderNumber: number, total: number, items: GaItem[]) {
  evento("purchase", {
    transaction_id: String(orderNumber),
    value: total,
    items: items.map(aItem),
  });
}
