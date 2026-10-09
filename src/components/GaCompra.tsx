"use client";

import { useEffect } from "react";
import { gaCompra, type GaItem } from "@/lib/ga";

// Le avisa a Google Analytics que se concreto una venta, con el detalle de
// lo que se llevo.
//
// Se dispara UNA sola vez por pedido: si la persona recarga la pantalla de
// "pago aprobado" o vuelve con el boton atras, la venta se contaria dos
// veces y el reporte de facturacion quedaria inflado. Lo anotamos en
// localStorage, que sobrevive al refresh y a cerrar la pestaña.

export function GaCompra({
  orderNumber,
  total,
  items,
}: {
  orderNumber: number;
  total: number;
  items: GaItem[];
}) {
  useEffect(() => {
    const clave = `conesa:ga-compra:${orderNumber}`;
    try {
      if (localStorage.getItem(clave)) return;
    } catch {
      // Sin localStorage preferimos no mandar nada antes que contar de mas
      return;
    }

    gaCompra(orderNumber, total, items);

    try {
      localStorage.setItem(clave, "1");
    } catch {}
  }, [orderNumber, total, items]);

  return null;
}
