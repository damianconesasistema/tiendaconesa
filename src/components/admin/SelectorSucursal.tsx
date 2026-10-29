"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";

// Las solapas para cambiar de sucursal.
//
// Corre en el navegador porque necesita saber en que pantalla estas: al
// cambiar de local te deja en la MISMA pantalla y con los mismos filtros, solo
// cambiando la sucursal. Si te mandara al principio, revisar los precios de un
// producto en los dos locales seria volver a buscarlo cada vez.
export function SelectorSucursal({
  sucursales,
  actual,
}: {
  sucursales: { slug: string; nombre: string; tiendaActiva: boolean }[];
  actual: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (sucursales.length < 2) return null;

  const irA = (slug: string) => {
    const p = new URLSearchParams(params.toString());
    p.set("sucursal", slug);
    // La paginacion no se conserva: la otra sucursal puede tener menos
    // productos y caerias en una pagina vacia.
    p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex items-center gap-1 rounded-full bg-black/20 p-1">
      {sucursales.map((s) => {
        const elegida = s.slug === actual;
        return (
          <button
            key={s.slug}
            type="button"
            onClick={() => irA(s.slug)}
            aria-current={elegida ? "true" : undefined}
            className={`rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider transition-colors ${
              elegida
                ? "bg-white text-black"
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            {s.nombre}
            {!s.tiendaActiva && (
              <span
                title="La tienda de este local todavía no vende"
                className="ml-1.5 opacity-70"
              >
                ·cerrada
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
