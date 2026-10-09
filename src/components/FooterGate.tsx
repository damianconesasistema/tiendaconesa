"use client";

import { usePathname } from "next/navigation";

// El pie va en todas las pantallas de la tienda, pero no en el panel: ahi
// ocupa lugar y los links legales no le sirven a nadie.
//
// El layout es un componente de servidor y no puede leer la ruta, asi que
// el que decide es este envoltorio. El pie llega como children ya armado en
// el servidor, asi que no se va al bundle del navegador por pasar por aca.

export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <>{children}</>;
}
