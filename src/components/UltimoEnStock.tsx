import { Flame } from "lucide-react";

// "Ultimo en stock": cuando queda una sola unidad. Damian, 19/11/2026:
// "AGREGALE A LOS PRODUCTOS CUANDO QUEDA 1 EN STOCK, ULTIMO EN STOCK Y
// LLAMANDO LA ATENCION DEL COMPRADOR". Naranja, con una llamita y titilando,
// igual que el cartel de descuento: lo que tiene que saltar a la vista.
//
// "chico" va encima de la foto en las tarjetas; "grande", en la ficha.

export function UltimoEnStock({ tamano = "chico", className = "" }: { tamano?: "chico" | "grande"; className?: string }) {
  const medida =
    tamano === "grande" ? "gap-2 px-4 py-2 text-sm" : "gap-1 px-2.5 py-1 text-[10px] sm:text-[11px]";
  return (
    <span
      className={`inline-flex items-center rounded-full bg-orange-500 font-display font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/40 ${medida} ${className}`}
      style={{ animation: "titilate 1.8s cubic-bezier(0.4,0,0.2,1) infinite" }}
    >
      <Flame className={tamano === "grande" ? "h-4 w-4" : "h-3 w-3"} />
      ¡Último en stock!
    </span>
  );
}
