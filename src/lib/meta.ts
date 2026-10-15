"use client";

// Eventos del pixel de Meta (Facebook / Instagram).
//
// Es el espejo de `ga.ts`: los mismos cuatro momentos del embudo, pero con
// los nombres que entiende Meta (ViewContent, AddToCart, InitiateCheckout,
// Purchase). Con esto las campañas pueden optimizar por gente que compra
// en vez de por gente que entra, y se puede hacer remarketing a quien vio
// un producto y no lo compró.
//
// No se llama desde los componentes: lo invoca `ga.ts`, que es el único
// punto de salida de analítica de la tienda. Así hay un solo lugar donde
// agregar o sacar herramientas.
//
// Todo pasa por `evento()`, que no hace nada si el pixel no está cargado:
// sin NEXT_PUBLIC_FB_PIXEL_ID la tienda funciona igual, y una falla de la
// analítica nunca puede romper una compra.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export type MetaItem = {
  itemId: string;
  title: string;
  price: number | null;
  category?: string;
  qty?: number;
};

function contents(items: MetaItem[]) {
  return items.map((i) => ({
    id: i.itemId,
    quantity: i.qty ?? 1,
    // "a consultar" no tiene precio: mandar null ensucia el reporte
    ...(typeof i.price === "number" ? { item_price: i.price } : {}),
  }));
}

function suma(items: MetaItem[]) {
  return items.reduce((s, i) => s + (i.price ?? 0) * (i.qty ?? 1), 0);
}

function evento(nombre: string, params: Record<string, unknown>) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", nombre, { currency: "ARS", ...params });
  } catch {
    /* la analítica nunca puede romper la tienda */
  }
}

/** Se cargó una pantalla. El script base ya manda la primera; esta es para
 *  las navegaciones internas, que no recargan la página. */
export function metaPageView() {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq("track", "PageView");
  } catch {
    /* idem */
  }
}

/** Alguien abrió la ficha de un producto. */
export function metaVerProducto(item: MetaItem) {
  evento("ViewContent", {
    content_type: "product",
    content_ids: [item.itemId],
    content_name: item.title,
    ...(item.category ? { content_category: item.category } : {}),
    value: item.price ?? 0,
  });
}

/** Alguien tocó "Agregar". */
export function metaAgregarAlCarrito(item: MetaItem) {
  evento("AddToCart", {
    content_type: "product",
    content_ids: [item.itemId],
    content_name: item.title,
    contents: contents([item]),
    value: (item.price ?? 0) * (item.qty ?? 1),
  });
}

/** Alguien entró al checkout con el carrito cargado. */
export function metaArrancarCheckout(items: MetaItem[]) {
  if (items.length === 0) return;
  evento("InitiateCheckout", {
    content_type: "product",
    content_ids: items.map((i) => i.itemId),
    contents: contents(items),
    num_items: items.reduce((s, i) => s + (i.qty ?? 1), 0),
    value: suma(items),
  });
}

/** Se concretó la venta. Ojo: mandarlo una sola vez por pedido.
 *
 *  Va con `eventID` (cuarto argumento de fbq, no dentro de los parámetros):
 *  si algún día mandamos la compra también desde el servidor con la API de
 *  conversiones, Meta usa ese id para no contar el pedido dos veces. */
export function metaCompra(orderNumber: number, total: number, items: MetaItem[]) {
  try {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    window.fbq(
      "track",
      "Purchase",
      {
        currency: "ARS",
        content_type: "product",
        content_ids: items.map((i) => i.itemId),
        contents: contents(items),
        num_items: items.reduce((s, i) => s + (i.qty ?? 1), 0),
        value: total,
      },
      { eventID: `orden-${orderNumber}` },
    );
  } catch {
    /* la analítica nunca puede romper la tienda */
  }
}
