"use client";

import { useEffect } from "react";

// Le avisa a Google Analytics que se concreto una venta, con el detalle de
// lo que se llevo. Sin esto Analytics cuenta visitas pero no sabe que se
// vendio ni por cuanto.
//
// Se dispara UNA sola vez por pedido: si la persona recarga la pantalla de
// "pago aprobado" o vuelve con el boton atras, la venta se contaria dos
// veces y el reporte de facturacion quedaria inflado. Lo anotamos en
// localStorage, que sobrevive al refresh y a cerrar la pestaña.

type Item = { itemId: string; title: string; price: number; qty: number };

declare global {
  interface Window {
    // gtag lo inyecta Analytics; puede no existir si no hay ID configurado
    gtag?: (...args: unknown[]) => void;
  }
}

export function GaCompra({
  orderNumber,
  total,
  items,
}: {
  orderNumber: number;
  total: number;
  items: Item[];
}) {
  useEffect(() => {
    const clave = `conesa:ga-compra:${orderNumber}`;
    try {
      if (localStorage.getItem(clave)) return;
    } catch {
      // Sin localStorage preferimos no mandar nada antes que contar de mas
      return;
    }

    if (typeof window.gtag !== "function") return;

    window.gtag("event", "purchase", {
      transaction_id: String(orderNumber),
      value: total,
      currency: "ARS",
      items: items.map((i, idx) => ({
        item_id: i.itemId,
        item_name: i.title,
        price: i.price,
        quantity: i.qty,
        index: idx,
      })),
    });

    try {
      localStorage.setItem(clave, "1");
    } catch {}
  }, [orderNumber, total, items]);

  return null;
}
