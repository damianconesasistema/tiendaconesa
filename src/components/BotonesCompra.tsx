"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Check, Zap } from "lucide-react";
import { useCart, prepararCompraDirecta, CHECKOUT_DIRECTO } from "@/lib/cart";
import { opcionesDe } from "@/lib/etiquetas";

// Los dos botones de las tarjetas de producto (home y tienda): "Comprar" y
// "Agregar". Damian, 16/11/2026: "poner agregar o comprar, porque tambien
// estaria bueno hacer carrito, pero si quiero comprar solo 1 producto".
//
// - Comprar: paga ESE producto solo y va directo a finalizar la compra. El
//   carrito no se toca (src/lib/cart.ts, prepararCompraDirecta).
// - Agregar: lo suma al carrito para seguir comprando.
//
// Los mismos dos que tiene la ficha del producto, con los mismos colores.
// Si el producto pide elegir algo (el tipo de gas), ninguno de los dos
// actua: el click sigue al link de la tarjeta y se elige en la ficha.

type Item = { itemId: string; title: string; price: number; category: string };

export function BotonesCompra({
  item,
  tamano = "normal",
}: {
  item: Item;
  /** "chico": tarjetas de la home, que en el celular van de a dos. */
  tamano?: "chico" | "normal";
}) {
  const router = useRouter();
  const { add } = useCart();
  const [agregado, setAgregado] = useState(false);
  const pideElegir = !!opcionesDe(item.title);

  const comprar = (e: React.MouseEvent) => {
    if (pideElegir) return;
    e.preventDefault();
    e.stopPropagation();
    prepararCompraDirecta(item);
    router.push(CHECKOUT_DIRECTO);
  };

  const agregar = (e: React.MouseEvent) => {
    if (pideElegir) return;
    e.preventDefault();
    e.stopPropagation();
    add(item);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1500);
  };

  const chico = tamano === "chico";
  const base = `flex w-full items-center justify-center gap-1.5 rounded-full font-display font-bold uppercase tracking-wider transition-colors ${
    chico ? "px-3 py-2 text-[10px] sm:text-xs" : "px-4 py-2.5 text-xs"
  }`;
  const icono = chico ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <div className={`grid gap-1.5 ${chico ? "mt-3" : "mt-4"}`}>
      <button
        type="button"
        onClick={comprar}
        className={`${base} bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]`}
      >
        <Zap className={icono} />
        Comprar
      </button>
      <button
        type="button"
        onClick={agregar}
        className={`${base} border ${
          agregado
            ? "border-green-500 bg-green-500 text-white"
            : "border-[var(--brand-red)] bg-white text-[var(--brand-red)] hover:bg-[var(--brand-red)] hover:text-white"
        }`}
      >
        {agregado ? (
          <>
            <Check className={icono} />
            Agregado
          </>
        ) : (
          <>
            <ShoppingCart className={icono} />
            {chico ? "Agregar" : "Agregar al carrito"}
          </>
        )}
      </button>
    </div>
  );
}
