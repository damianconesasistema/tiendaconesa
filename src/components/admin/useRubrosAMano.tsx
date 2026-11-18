"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { nombreRubro, SIN_EXTRAS, type RubrosExtra } from "@/lib/rubros";
import { agregarRubroAMano, agregarSubrubroAMano } from "@/app/admin/productos/rubros-actions";

/** Los rubros y subrubros agregados a mano, y la ventanita para sumar uno
 *  nuevo desde un desplegable ("+ Agregar rubro nuevo..."). Ver
 *  src/lib/rubros.ts.
 *
 *  La ventanita es de la pagina y no la del navegador (window.prompt): Damian,
 *  18/11/2026, en Crear por Excel, "aca no me deja crear subrubro". Chrome
 *  puede bloquear esas ventanas (por ejemplo si alguna vez se tildo "no
 *  permitir mas dialogos"), y ahi la opcion no hacia nada. Quien usa el hook
 *  tiene que dibujar `dialogo` en algun lado.
 *
 *  `antes` recibe el slug nuevo ANTES de que cambie la lista: asi quien
 *  llama puede dejarlo elegido apenas aparece la opcion. */
export function useRubrosAMano(inicial?: RubrosExtra) {
  // Lo que contesto el servidor al agregar uno (trae la lista entera). Hasta
  // entonces, lo que vino con la pagina: en Crear por Excel eso llega recien
  // al subir el archivo, y antes quedaba vacio para siempre.
  const [delServidor, setDelServidor] = useState<RubrosExtra | null>(null);
  const extra = delServidor ?? inicial ?? SIN_EXTRAS;

  const [pedido, setPedido] = useState<{
    titulo: string;
    crear: (nombre: string) => Promise<{ slug?: string; error?: string }>;
    fin: (slug: string | null) => void;
  } | null>(null);

  const abrir = (titulo: string, crear: (nombre: string) => Promise<{ slug?: string; error?: string }>) =>
    new Promise<string | null>((fin) => setPedido({ titulo, crear, fin }));

  function pedirRubro(antes?: (slug: string) => void): Promise<string | null> {
    return abrir("Rubro nuevo", async (nombre) => {
      const r = await agregarRubroAMano(nombre);
      if (!r.ok) return { error: r.error };
      antes?.(r.item.slug);
      setDelServidor(r.extra);
      return { slug: r.item.slug };
    });
  }

  function pedirSubrubro(rubro: string, antes?: (slug: string) => void): Promise<string | null> {
    return abrir(`Subrubro nuevo de "${nombreRubro(rubro, extra)}"`, async (nombre) => {
      const r = await agregarSubrubroAMano(rubro, nombre);
      if (!r.ok) return { error: r.error };
      antes?.(r.item.slug);
      setDelServidor(r.extra);
      return { slug: r.item.slug };
    });
  }

  const dialogo = pedido ? (
    <NombreNuevo
      titulo={pedido.titulo}
      crear={pedido.crear}
      cerrar={(slug) => {
        pedido.fin(slug);
        setPedido(null);
      }}
    />
  ) : null;

  return { extra, pedirRubro, pedirSubrubro, dialogo };
}

/** La ventanita: un nombre, Agregar o Cancelar. Va afuera del formulario de
 *  la pagina (portal): adentro, el Enter mandaria el formulario entero. */
function NombreNuevo({
  titulo,
  crear,
  cerrar,
}: {
  titulo: string;
  crear: (nombre: string) => Promise<{ slug?: string; error?: string }>;
  cerrar: (slug: string | null) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function agregar() {
    if (!nombre.trim() || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const r = await crear(nombre.trim());
      if (r.error) setError(r.error);
      else cerrar(r.slug ?? null);
    } catch {
      setError("No se pudo guardar. Probá de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) cerrar(null);
      }}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider">{titulo}</h2>
        <input
          autoFocus
          value={nombre}
          maxLength={40}
          placeholder="Nombre"
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void agregar();
            } else if (e.key === "Escape") cerrar(null);
          }}
          className="mt-3 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none focus:border-[var(--brand-red)]"
        />
        {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => cerrar(null)}
            className="h-9 rounded-full border border-[var(--border)] px-4 text-xs font-bold uppercase tracking-wider"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void agregar()}
            disabled={!nombre.trim() || guardando}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--brand-red)] px-4 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Agregar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
