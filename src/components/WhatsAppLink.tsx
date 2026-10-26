"use client";

import { gaWhatsApp } from "@/lib/ga";

// Link a WhatsApp que avisa a Analytics antes de irse.
//
// Los botones de WhatsApp estan repartidos por todo el sitio (el de arriba,
// el flotante, la ficha de cada producto, el checkout...). Si cada uno
// llamara a la analitica por su cuenta, el dia que se agregue uno nuevo se
// va a olvidar. Pasando todos por aca, medir es gratis: se usa este
// componente en vez de un <a> y listo.
//
// `origen` es lo unico que hay que pensar al usarlo: es la etiqueta que
// despues se ve en el reporte.

export function WhatsAppLink({
  href,
  origen,
  producto,
  className,
  children,
  ...resto
}: {
  href: string;
  /** De donde salio el click: "header", "flotante", "ficha", etc. */
  origen: string;
  /** Si fue desde un producto, cual. */
  producto?: string;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className">) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // onClick y no onAuxClick: alcanza con el click normal. Si el evento
      // falla, el link anda igual (ver el try/catch de ga.ts).
      onClick={() => gaWhatsApp(origen, producto)}
      className={className}
      {...resto}
    >
      {children}
    </a>
  );
}
