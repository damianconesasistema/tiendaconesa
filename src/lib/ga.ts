"use client";

// Eventos de comercio electronico de la tienda.
//
// Este archivo es el unico punto de salida de analitica: manda cada evento
// a Google Analytics y, en el mismo lugar, al pixel de Meta (ver meta.ts).
// Los componentes llaman solo a estas funciones, asi agregar o sacar una
// herramienta se hace en un solo archivo.
//
// El embudo completo: ver un producto, agregarlo al carrito, arrancar el
// checkout y comprar. Con los cuatro Analytics puede decir DONDE se cae la
// gente, que es mas accionable que el total de ventas.
//
// Todo pasa por `evento()`, que no hace nada si no hay Analytics cargado:
// asi el sitio funciona igual sin NEXT_PUBLIC_GA_ID y una falla de la
// analitica nunca rompe una compra.

import {
  metaVerProducto,
  metaAgregarAlCarrito,
  metaArrancarCheckout,
  metaCompra,
  metaContacto,
} from "@/lib/meta";

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
  metaVerProducto(item);
}

/** Alguien toco un boton de WhatsApp para preguntar.
 *
 *  `origen` dice DE DONDE salio (el boton de arriba, el flotante, la ficha
 *  de un producto, el checkout...). Sin eso el numero total no sirve para
 *  decidir nada; con eso se ve que parte del sitio genera consultas y cual
 *  deja a la gente con dudas.
 *
 *  No se puede saber si despues escribieron de verdad: WhatsApp es otra
 *  app y no devuelve nada. Esto mide la intencion, no la conversacion. */
export function gaWhatsApp(origen: string, producto?: string) {
  evento("contacto_whatsapp", {
    origen,
    ...(producto ? { producto } : {}),
  });
  metaContacto(origen);
}

/** Alguien toco "Agregar". Se dispara desde el carrito, asi cubre todos
 *  los botones de la tienda sin tener que tocarlos uno por uno. */
export function gaAgregarAlCarrito(item: GaItem) {
  evento("add_to_cart", {
    value: (item.price ?? 0) * (item.qty ?? 1),
    items: [aItem(item, 0)],
  });
  metaAgregarAlCarrito(item);
}

/** Alguien entro al checkout con el carrito cargado. */
export function gaArrancarCheckout(items: GaItem[]) {
  if (items.length === 0) return;
  evento("begin_checkout", { value: suma(items), items: items.map(aItem) });
  metaArrancarCheckout(items);
}

/** Se concreto la venta. Ojo: mandarlo una sola vez por pedido. */
export function gaCompra(orderNumber: number, total: number, items: GaItem[]) {
  evento("purchase", {
    transaction_id: String(orderNumber),
    value: total,
    items: items.map(aItem),
  });
  metaCompra(orderNumber, total, items);
}
