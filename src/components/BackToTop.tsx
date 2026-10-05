"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { useCart } from "@/lib/cart";

// BackToTop se posiciona SIEMPRE arriba del boton de WhatsApp para no
// superponerse. La separacion vertical se calcula segun si el CartFab
// esta visible (que a su vez empuja al boton de WhatsApp hacia arriba).
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const { count } = useCart();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // No se muestra en admin ni en checkout (WhatsApp tampoco se muestra ahi)
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname === "/tienda/checkout"
  ) {
    return null;
  }

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Cuando hay items en el carrito (y no estamos en el carrito), WhatsApp
  // sube para no chocar con el CartFab. BackToTop sube MAS para quedar
  // encima de WhatsApp.
  const liftForCart =
    count > 0 &&
    pathname !== "/tienda/carrito" &&
    pathname !== "/tienda/checkout";

  const positionCls = liftForCart
    ? "bottom-44 sm:bottom-48"
    : "bottom-24 sm:bottom-28";

  return (
    <button
      type="button"
      onClick={scrollTop}
      aria-label="Volver arriba"
      className={`fixed right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-black)] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[var(--brand-red)] sm:right-8 sm:h-12 sm:w-12 ${positionCls} ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
