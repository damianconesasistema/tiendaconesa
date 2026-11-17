"use client";

import { useState } from "react";
import { nombreRubro, SIN_EXTRAS, type RubrosExtra } from "@/lib/rubros";
import { agregarRubroAMano, agregarSubrubroAMano } from "@/app/admin/productos/rubros-actions";

/** Los rubros y subrubros agregados a mano, y las preguntas para sumar uno
 *  nuevo desde un desplegable ("+ Agregar rubro nuevo..."). Ver
 *  src/lib/rubros.ts.
 *
 *  `antes` recibe el slug nuevo ANTES de que cambie la lista: asi quien
 *  llama puede dejarlo elegido apenas aparece la opcion. */
export function useRubrosAMano(inicial: RubrosExtra = SIN_EXTRAS) {
  const [extra, setExtra] = useState<RubrosExtra>(inicial);

  async function pedirRubro(antes?: (slug: string) => void): Promise<string | null> {
    const nombre = window.prompt("Nombre del rubro nuevo:");
    if (!nombre || !nombre.trim()) return null;
    const r = await agregarRubroAMano(nombre);
    if (!r.ok) {
      window.alert(r.error);
      return null;
    }
    antes?.(r.item.slug);
    setExtra(r.extra);
    return r.item.slug;
  }

  async function pedirSubrubro(rubro: string, antes?: (slug: string) => void): Promise<string | null> {
    const nombre = window.prompt(`Nombre del subrubro nuevo de "${nombreRubro(rubro, extra)}":`);
    if (!nombre || !nombre.trim()) return null;
    const r = await agregarSubrubroAMano(rubro, nombre);
    if (!r.ok) {
      window.alert(r.error);
      return null;
    }
    antes?.(r.item.slug);
    setExtra(r.extra);
    return r.item.slug;
  }

  return { extra, pedirRubro, pedirSubrubro };
}
