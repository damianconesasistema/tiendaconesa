"use client";

import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { WhatsAppLink } from "@/components/WhatsAppLink";
import { useScrollDirection } from "@/lib/use-scroll-direction";

// Boton flotante de WhatsApp global. Se sube cuando aparece el CartFab
// para no superponerse.
// El link llega del layout, que es de servidor y puede averiguar de que
// sucursal es la visita. Este componente corre en el navegador y no tiene
// forma de saberlo: antes usaba el numero fijo de Traslasierra para las dos
// tiendas.
export function FloatingWhatsApp({ href }: { href: string }) {
  const pathname = usePathname();
  const { count } = useCart();
  // En mobile el botón tapa el texto: se esconde mientras se baja leyendo
  const visible = useScrollDirection();

  // No mostrar en admin ni en checkout
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname === "/tienda/checkout"
  ) {
    return null;
  }

  const liftForCart =
    count > 0 &&
    pathname !== "/tienda/carrito" &&
    pathname !== "/tienda/checkout";

  return (
    <WhatsAppLink
      href={href}
      origen="flotante"
      aria-label="Escribinos por WhatsApp"
      className={`fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-500/30 transition-all hover:scale-110 sm:right-8 ${
        liftForCart ? "bottom-24 sm:bottom-28" : "bottom-5 sm:bottom-8"
      } ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-24 opacity-0"
      }`}
    >
      <WhatsAppIcon className="h-7 w-7" />
    </WhatsAppLink>
  );
}
