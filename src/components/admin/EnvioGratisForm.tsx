"use client";

import { useActionState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { guardarEnvio } from "@/app/admin/configuracion/actions";
import { formatPrice } from "@/lib/order";
import { ZONAS, DONDE_ENVIAMOS, type PreciosEnvio } from "@/lib/zona-envio";

type State = { ok?: true; error?: string } | null;

/** Lo que cobra el envio cada zona, y desde cuanto es gratis. El tope se
 *  cuenta sobre el precio de lista, lo que el cliente ve en el carrito. */
export function EnvioGratisForm({
  desde,
  precios,
}: {
  desde: number | null;
  precios: PreciosEnvio;
}) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    guardarEnvio as (prev: State, fd: FormData) => Promise<State>,
    null,
  );
  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        {ZONAS.map((z) => (
          <div key={z}>
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              {z === "CABA" ? "Capital (CABA)" : z} ($)
            </label>
            <input
              name={`precio:${z}`}
              type="number"
              min={0}
              step="100"
              defaultValue={precios[z]}
              className="input"
            />
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        Lo que se le cobra al cliente por el envío, junto con la compra. La
        zona sale del código postal: Capital es del 1000 al 1440, y las zonas
        1, 2 y 3 son las listas del mapa de Flex. Fuera del mapa no se envía.
      </p>

      <div className="sm:w-1/2">
        <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
          Envío gratis desde ($)
        </label>
        <input
          name="desde"
          type="number"
          min={0}
          step="1000"
          defaultValue={desde ?? ""}
          placeholder="Vacío = sin envío gratis"
          className="input"
        />
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        {desde
          ? `Hoy: desde ${formatPrice(desde)} el envío es gratis a todo el mapa (${DONDE_ENVIAMOS}). `
          : "Hoy no hay envío gratis: siempre se cobra el de la zona. "}
        Se cuenta sobre el precio de lista, el que el cliente ve en el
        carrito.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[var(--brand-red)] px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
        {state && "ok" in state && state.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-green-700">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        {state && "error" in state && state.error && (
          <span className="inline-flex items-center gap-1 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" /> {state.error}
          </span>
        )}
      </div>
    </form>
  );
}
