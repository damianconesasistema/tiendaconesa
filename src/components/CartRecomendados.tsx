"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ShoppingCart, Check, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/order";

// "Completá tu compra": le ofrece lo que combina con lo que ya tiene.
// Las reglas viven en el server (src/lib/recomendaciones.ts); acá solo
// pedimos y mostramos.

type Rec = {
  itemId: string;
  title: string;
  category: string;
  imageUrl: string | null;
  precio: number;
  motivo: string;
};

export function CartRecomendados() {
  const { items, add } = useCart();
  const [recs, setRecs] = useState<Rec[]>([]);
  const [agregado, setAgregado] = useState<string | null>(null);

  // Las claves del carrito, para no volver a pedir si solo cambio una cantidad
  const claves = items.map((i) => i.itemId).sort().join(",");

  useEffect(() => {
    if (!claves) {
      setRecs([]);
      return;
    }
    let vivo = true;
    fetch("/api/recomendados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: claves.split(",") }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (vivo) setRecs(Array.isArray(d?.recomendados) ? d.recomendados : []);
      })
      .catch(() => {
        /* sin recomendaciones: el carrito anda igual */
      });
    return () => {
      vivo = false;
    };
  }, [claves]);

  if (recs.length === 0) return null;

  return (
    <section className="mx-auto mt-10 max-w-5xl">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[var(--brand-red)]" />
        <h2 className="font-display text-xl font-black uppercase tracking-tight sm:text-2xl">
          Completá tu compra
        </h2>
      </div>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Esto combina con lo que ya tenés en el carrito.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {recs.map((r) => (
          <div
            key={r.itemId}
            className="flex flex-col overflow-hidden rounded-xl bg-white ring-1 ring-[var(--border)] transition-shadow hover:shadow-md"
          >
            <Link href={`/tienda/${r.itemId}`} className="group">
              <div className="relative aspect-square bg-white">
                <Image
                  src={r.imageUrl || `/categories/${r.category}.jpg`}
                  alt={r.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  unoptimized={!!r.imageUrl && r.imageUrl.startsWith("/api/")}
                  className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
            <div className="flex flex-1 flex-col p-3">
              <span className="w-fit rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-700">
                {r.motivo}
              </span>
              <Link href={`/tienda/${r.itemId}`}>
                <h3 className="mt-2 uppercase text-xs font-semibold leading-snug hover:text-[var(--brand-red)]">
                  {r.title}
                </h3>
              </Link>
              {/* mt-auto deja precio y boton al piso: las cards quedan parejas */}
              <div className="mt-auto">
                <div className="mt-2 font-display text-base font-black">
                  {formatPrice(r.precio)}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    add({
                      itemId: r.itemId,
                      title: r.title,
                      price: r.precio,
                      category: r.category,
                    });
                    setAgregado(r.itemId);
                    setTimeout(() => setAgregado(null), 1500);
                  }}
                  className={`mt-2 flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider transition-colors ${
                    agregado === r.itemId
                      ? "bg-green-500 text-white"
                      : "bg-[var(--brand-red)] text-white hover:bg-[var(--brand-red-hover)]"
                  }`}
                >
                  {agregado === r.itemId ? (
                    <>
                      <Check className="h-3 w-3" />
                      Agregado
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-3 w-3" />
                      Agregar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
